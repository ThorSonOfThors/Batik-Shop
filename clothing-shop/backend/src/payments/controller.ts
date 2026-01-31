import type { Request, Response } from 'express'
import crypto from 'crypto'
import { stripe } from '../app.ts'
import { pool } from '../config/db.ts'

export const createPaymentIntent = async (
  req: Request,
  res: Response
) => {
  const {
    email,
    fullName,
    address,
    cart,
    totalAmount, // frontend total IN CENTS
  } = req.body

  // 0️⃣ Basic payload validation
  if (
    !email ||
    !fullName ||
    !address ||
    !address.country ||
    !Array.isArray(cart) ||
    cart.length === 0
  ) {
    return res.status(400).json({ message: 'Invalid request payload' })
  }

  // ISO-3166-1 alpha-2 validation (Stripe requirement)
  if (!/^[A-Z]{2}$/.test(address.country)) {
    return res.status(400).json({
      message: 'Invalid country code (must be ISO-3166-1 alpha-2)',
    })
  }

  // Extract item IDs
  const itemIds = cart.map((item: any) => item.id)
  const taxRate = Number.parseFloat(process.env.TAX_RATE ?? '0')

  try {
    // 1️⃣ Fetch authoritative prices from DB
    const { rows: items } = await pool.query(
      `
      SELECT id, price
      FROM items
      WHERE id = ANY($1::int[])
        AND status = 'available'
      `,
      [itemIds]
    )

    if (items.length !== itemIds.length) {
      return res.status(400).json({
        message: 'One or more items are unavailable or invalid',
      })
    }

    // Map prices → cents
    const priceMap = new Map<number, number>()
    for (const item of items) {
      priceMap.set(item.id, Math.round(Number(item.price) * 100))
    }

    // 2️⃣ Calculate subtotal (cents)
    let subtotal = 0

    for (const cartItem of cart) {
      const quantity = cartItem.quantity ?? 1
      const unitPrice = priceMap.get(cartItem.id)

      if (!unitPrice || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid cart data' })
      }

      subtotal += unitPrice * quantity
    }

    // 3️⃣ Apply tax
    const taxAmount = Math.round(subtotal * taxRate)
    const backendTotal = subtotal + taxAmount

    if (backendTotal <= 0) {
      return res.status(400).json({ message: 'Invalid amount' })
    }

    // 4️⃣ Verify frontend total (already in cents)
    const frontendTotal = Math.round(Number(totalAmount))

    if (frontendTotal !== backendTotal) {
      return res.status(400).json({
        message: 'Total amount mismatch',
      })
    }

    // 5️⃣ Generate internal checkout ID
    const checkoutId = crypto.randomUUID()

    // 6️⃣ Persist payment snapshot FIRST (webhook-safe)
    await pool.query(
      `
      INSERT INTO payments (
        checkout_id,
        amount,
        currency,
        status,
        customer_email,
        customer_full_name,
        address,
        cart_snapshot
      )
      VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
      `,
      [
        checkoutId,
        backendTotal,
        'USD',
        email,
        fullName,
        JSON.stringify(address),
        JSON.stringify(cart),
      ]
    )

    // 7️⃣ Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: backendTotal,
      currency: 'usd',
      receipt_email: email,
      metadata: {
        checkout_id: checkoutId,      // ✅ already correct
        customer_email: email,
        country_code: address.country,
      },
    })

    // 8️⃣ Update snapshot with Stripe ID
    await pool.query(
      `
      UPDATE payments
      SET stripe_payment_intent_id = $1
      WHERE checkout_id = $2
      `,
      [paymentIntent.id, checkoutId]
    )

    // 9️⃣ Return client secret + checkoutId  ✅ FIX
    return res.json({
      clientSecret: paymentIntent.client_secret,
      checkoutId, // <-- FRONTEND MUST STORE THIS
    })
  } catch (err) {
    console.error('PaymentIntent error:', err)
    return res.status(500).json({ message: 'Payment initialization failed' })
  }
}
