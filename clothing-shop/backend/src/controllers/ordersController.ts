import type { Request, Response } from 'express'
import { pool } from '../config/db.ts'

export const getAdminOrders = async (req: Request, res: Response) => {
  const { status, country, limit = 50, offset = 0 } = req.query

  try {
    const result = await pool.query(
      `
      SELECT
        o.id,
        o.email,
        o.full_name,
        o.total_amount_cents,
        o.currency,
        o.country_code,
        o.status,
        o.created_at,
        o.finalized_at,
        o.address,

        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price_cents', oi.price_cents,
              'status', oi.status,
              'images', i.image
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items

      FROM orders o
      LEFT JOIN order_items oi 
        ON oi.order_id = o.id
      LEFT JOIN items i 
        ON i.id = oi.product_id

      WHERE
        ($1::text IS NULL OR o.status = $1)
        AND ($2::text IS NULL OR o.country_code = $2)

      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [
        status ?? null,
        country ?? null,
        Number(limit),
        Number(offset),
      ]
    )

    return res.json(result.rows)
  } catch (err) {
    console.error('❌ Failed to load admin orders:', err)
    return res.status(500).json({ error: 'Failed to load orders' })
  }
}

export const editOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params
 
  const {
    email,
    full_name,
    total_amount_cents,
    currency,
    address,
    country_code,
    status,
    items // array of order_items
  } = req.body

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1️⃣ Load order (lock row)
    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    )

    if (orderRes.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const prevStatus = orderRes.rows[0].status

    // 2️⃣ Update order
    await client.query(
      `
      UPDATE orders
      SET
        email = COALESCE($2, email),
        full_name = COALESCE($3, full_name),
        total_amount_cents = COALESCE($4, total_amount_cents),
        currency = COALESCE($5, currency),
        address = COALESCE($6, address),
        country_code = COALESCE($7, country_code),
        status = COALESCE($8, status),
        finalized_at =
          CASE
            WHEN $8 = 'delivered' THEN NOW()
            ELSE finalized_at
          END
      WHERE id = $1
      `,
      [
        orderId,
        email,
        full_name,
        total_amount_cents,
        currency,
        address,
        country_code,
        status
      ]
    )

    // 3️⃣ If status changed → cascade to items
    if (status && status !== prevStatus) {
      await client.query(
        `
        UPDATE order_items
        SET status = $1
        WHERE order_id = $2
        `,
        [status, orderId]
      )
    }

    // ✅ NEW LOGIC: if canceled → make products available again
    if (status === 'cancelled') {
      await client.query(
        `
        UPDATE items
        SET status = 'available'
        WHERE id IN (
          SELECT product_id
          FROM order_items
          WHERE order_id = $1
        )
        `,
        [orderId]
      )
    }

    // 4️⃣ Update individual items (if provided)
    if (Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `
          UPDATE order_items
          SET
            quantity = COALESCE($1, quantity),
            price_cents = COALESCE($2, price_cents),
            status = COALESCE($3, status)
          WHERE id = $4 AND order_id = $5
          `,
          [
            item.quantity,
            item.price_cents,
            item.status,
            item.id,
            orderId
          ]
        )
      }
    }

    await client.query('COMMIT')

    return res.json({
      success: true,
      message: 'Order updated successfully'
    })

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Failed to update order:', err)
    return res.status(500).json({ error: 'Failed to update order' })
  } finally {
    client.release()
  }
}






export const deleteOrder = async (req: Request, res: Response) => {
  const { id } = req.params

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1️⃣ Check order exists (lock)
    const orderRes = await client.query(
      `SELECT id FROM orders WHERE id = $1 FOR UPDATE`,
      [id]
    )

    if (orderRes.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // 2️⃣ Delete order items
    await client.query(
      `DELETE FROM order_items WHERE order_id = $1`,
      [id]
    )

    // 3️⃣ Delete order
    await client.query(
      `DELETE FROM orders WHERE id = $1`,
      [id]
    )

    await client.query('COMMIT')

    return res.json({
      success: true,
      message: 'Order and related items deleted successfully'
    })

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Failed to delete order:', err)
    return res.status(500).json({ error: 'Failed to delete order' })
  } finally {
    client.release()
  }
}

//get id from checkout_id so that i can notify customer about their order id

export const getOrderByCheckoutId = async (
  req: Request,
  res: Response
) => {
  const { checkoutId } = req.params

  if (!checkoutId) {
    return res.status(400).json({
      message: 'checkoutId is required'
    })
  }

  try {
    const result = await pool.query(
      `
      SELECT id
      FROM orders
      WHERE checkout_id = $1
      `,
      [checkoutId]
    )

    if (!result.rows.length) {
      return res.status(404).json({
        message: 'Order not found yet'
      })
    }

    return res.json({
      orderId: result.rows[0].id
    })
  } catch (err) {
    console.error('Fetch order error:', err)
    return res.status(500).json({
      message: 'Failed to fetch order'
    })
  }
}



