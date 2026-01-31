import type { Request, Response } from 'express'
import Stripe from 'stripe'
import { stripe } from '../app.ts'
import { pool } from '../config/db.ts'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const stripeWebhook = async (req: Request, res: Response) => {
  console.log('🔥 Stripe webhook endpoint HIT')

  let event: Stripe.Event

  try {
    const signature = req.headers['stripe-signature']
    if (!signature) {
      return res.status(400).send('Missing Stripe signature')
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      endpointSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // ✅ ACK STRIPE IMMEDIATELY (CRITICAL)
  res.status(200).json({ received: true })

  // Ignore irrelevant events
  if (event.type !== 'payment_intent.succeeded') {
    return
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const checkoutId = paymentIntent.metadata.checkout_id

  if (!checkoutId) {
    console.error('Missing checkout_id in metadata')
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1️⃣ Load payment snapshot (lock row)
    const paymentRes = await client.query(
      `
      SELECT *
      FROM payments
      WHERE checkout_id = $1
      FOR UPDATE
      `,
      [checkoutId]
    )

    if (paymentRes.rowCount === 0) {
      throw new Error('Payment record not found')
    }

    const payment = paymentRes.rows[0]

    // 🔁 Idempotency guard
    if (payment.status === 'succeeded') {
      await client.query('COMMIT')
      console.log('⚠️ Payment already processed, skipping')
      return
    }

    // 2️⃣ Create order (EXTENDED ONLY HERE)
    const orderRes = await client.query(
      `
      INSERT INTO orders (
          checkout_id,                     -- ✅ ADDED
          stripe_payment_intent_id,
          email,
          full_name,
          total_amount_cents,
          currency,
          address,
          country_code,
          status,
          created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      RETURNING id
      `,
      [
        checkoutId,                         // $1 (NEW)
        paymentIntent.id,                  // $2
        payment.customer_email,            // $3
        payment.customer_full_name,        // $4
        payment.amount,                    // $5
        'USD',                             // $6
        payment.address,                   // $7
        paymentIntent.metadata.country_code,// $8
        'pending',                         // $9
      ]
    )

    const orderId = orderRes.rows[0].id

    // 3️⃣ Insert order items + mark items pending
    for (const item of payment.cart_snapshot) {
      await client.query(
        `
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price_cents,
            status
        )
        VALUES ($1, $2, $3, $4, 'pending')
        `,
        [
          orderId,
          item.id,
          item.quantity ?? 1,
          Math.round(item.price * 100)
        ]
      )

      await client.query(
        `
        UPDATE items
        SET status = 'pending'
        WHERE id = $1
        `,
        [item.id]
      )
    }

    // 4️⃣ Update payment status
    await client.query(
      `
      UPDATE payments
      SET status = 'succeeded'
      WHERE checkout_id = $1
      `,
      [checkoutId]
    )

    await client.query('COMMIT')

    console.log('✅ Order successfully created:', orderId)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Webhook processing failed:', err)
  } finally {
    client.release()
  }
}
