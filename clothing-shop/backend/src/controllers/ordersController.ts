import type { Request, Response } from 'express';
import { pool } from '../config/db.ts';
import type { PoolClient } from 'pg';

import { stripe } from '../app.ts';
import Stripe from 'stripe'


/**
 * Helper function:
 * Creates an order inside a DB transaction and updates item statuses.
 * This is called ONLY AFTER:
 *  - all items exist
 *  - all items are available
 *  - total amount is validated
 */
async function createOrderInDb(
  client: PoolClient,
  payload: {
    items: { id: number }[];
    totalAmount: number;
    country_or_region: string;
    email?: string | null;
    stripe_session_id?: string | null;
  }
) {
  const now = new Date();

  // Insert a new order row
  const insertQuery = `
    INSERT INTO orders (
      items,
      total_amount,
      country_or_region,
      email,
      created_at,
      finalized_at,
      status,
      stripe_session_id
    )
    VALUES ($1, $2, $3, $4, $5, NULL, $6, $7)
    RETURNING *;
  `;

  const orderValues = [
    JSON.stringify(payload.items),   // JSONB of items
    payload.totalAmount,             // total order price
    payload.country_or_region,
    payload.email || null,
    now,
    'pending',                       // new orders start as pending
    payload.stripe_session_id || null,
  ];

  const orderRes = await client.query(insertQuery, orderValues);

  // Update each item → set status = 'pending'
  // Since qty is always 1, we only need distinct item IDs
  const ids = payload.items.map(i => i.id);
  const distinctIds = [...new Set(ids)];

  if (distinctIds.length > 0) {
    const params = distinctIds.map((_, idx) => `$${idx + 1}`).join(',');
    await client.query(
      `UPDATE items SET status = 'pending' WHERE id IN (${params})`,
      distinctIds
    );
  }

  return orderRes.rows[0];
}

/**
 * Stripe Webhook Handler
 * This route must receive RAW BODY (important for signature verification)
 */
export const stripeWebhook = async (req: Request, res: Response) => {

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).send("Missing Stripe signature or webhook secret");
  }

  
  let event: Stripe.Event;
  

  try {
    // Verify that Stripe really sent this request
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody, // must be raw body
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout sessions
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      /**
       * We expect the frontend to put:
       * session.metadata.order_payload = JSON.stringify([{ id: 12 }, { id: 44 }, ...])
       * Each item is unique → quantity always = 1
       */
      let itemsPayload: { id: number }[] = [];

      if (session.metadata?.order_payload) {
        itemsPayload = JSON.parse(session.metadata.order_payload);
      }

      if (!itemsPayload || itemsPayload.length === 0) {
        console.warn("No order payload in metadata");
        return res.status(400).send("Missing order payload");
      }

      // Extract item ids
      const itemIds = itemsPayload.map(i => i.id);

      /**
       * 1️⃣ Fetch database items and validate they exist
       *    SELECT id, price, status FROM items WHERE id IN (...)
       */
      const q = await pool.query(
        `SELECT id, price, status FROM items WHERE id = ANY($1::int[])`,
        [itemIds]
      );
      const dbItems = q.rows;

      // Create price + status map for quick access
      const priceMap = new Map<number, number>();
      const statusMap = new Map<number, string>();

      for (const dbItem of dbItems) {
        priceMap.set(dbItem.id, Number(dbItem.price));
        statusMap.set(dbItem.id, dbItem.status);
      }

      /**
       * 2️⃣ Validate: All items must exist AND must be available
       *    This is the FIXED workflow:
       *    ‣ We verify BEFORE updating item status
       */
      for (const item of itemsPayload) {
        if (!priceMap.has(item.id)) {
          console.warn("Item does not exist:", item.id);
          return res.status(400).send("Some items do not exist");
        }

        if (statusMap.get(item.id) !== "available") {
          console.warn("Item not available:", item.id);
          return res.status(400).send("Some items are not available");
        }
      }

      /**
       * 3️⃣ Compute total price on server
       *    Quantity = 1 always
       */
      const computedTotal = itemsPayload.reduce((sum, it) => {
        const price = priceMap.get(it.id)!;
        return sum + price;
      }, 0);

      // Stripe sends amount in cents → convert to main currency
      const sessionTotal = (session.amount_total ?? 0) / 100;

      // small float tolerance
      const tolerance = 0.005;

      // Verify totals match
      if (Math.abs(computedTotal - sessionTotal) > tolerance) {
        console.warn("Total mismatch:", { computedTotal, sessionTotal });
        return res.status(400).send("Total mismatch");
      }

      /**
       * 4️⃣ Everything validated → now create a DB order inside a transaction
       *    This is SAFE because all checks already passed.
       */
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const order = await createOrderInDb(client, {
          items: itemsPayload,                       // each item unique
          totalAmount: computedTotal,                // validated amount
          country_or_region:
            session.customer_details?.address?.country ?? "unknown",
          email: session.customer_details?.email ?? null,
          stripe_session_id: session.id,
        });

        await client.query("COMMIT");

        console.log("Order created:", order.id);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Failed to create order:", err);
        return res.status(500).send("DB error");
      } finally {
        client.release();
      }

      return res.json({ received: true });

    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(500).send("Server error");
    }
  }

  // For events we do not process
  res.json({ received: true });
};
