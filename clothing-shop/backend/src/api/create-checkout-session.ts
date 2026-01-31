import type { Request, Response } from 'express';
import { stripe } from '../app.ts';
import { pool } from '../config/db.ts';  // For fetching real prices

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    // ✅ Correct destructuring - NO metadata
    const {
      items,
      customer_email,
      customer_name,
      customer_address
    } = req.body;

    console.log('Received items:', items);
    console.log('Customer email:', customer_email);

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // ✅ 1. Fetch actual prices from database
    const itemIds = items.map(i => i.id);
    const dbQuery = await pool.query(
      `SELECT id, price, name FROM items WHERE id = ANY($1::int[])`,
      [itemIds]
    );
    
    const dbItems = dbQuery.rows;
    const itemMap = new Map();
    
    dbItems.forEach(item => {
      itemMap.set(item.id, {
        price: Number(item.price),
        name: item.name || `Item ${item.id}`
      });
    });

    // ✅ 2. Verify all items exist
    for (const item of items) {
      if (!itemMap.has(item.id)) {
        return res.status(400).json({ 
          error: `Item ${item.id} not found in database` 
        });
      }
    }

    // ✅ 3. Create line items with REAL prices
    const lineItems = items.map((item: { id: number }) => {
      const dbItem = itemMap.get(item.id);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: dbItem.name,
          },
          // Convert dollars to cents for Stripe
          unit_amount: Math.round(dbItem.price * 100),
        },
        quantity: 1,
      };
    });

    // ✅ 4. Calculate total
    const totalAmount = items.reduce((sum, item) => {
      return sum + itemMap.get(item.id).price;
    }, 0);

    console.log(`Creating checkout: ${items.length} items, total: $${totalAmount}`);

    // ✅ 5. Create checkout session with backend-generated metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment?canceled=true`,
      customer_email: customer_email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP'],
      },
      // ✅ Metadata created HERE, not from frontend
      metadata: {
        order_payload: JSON.stringify(items),  // Your items array
        customer_name: customer_name || '',
        customer_email: customer_email || '',
        country_or_region: customer_address?.country || 'unknown'
      }
    });

    // ✅ 6. Return session ID
    res.json({ 
      sessionId: session.id,
      total: totalAmount  // Optional, for frontend display
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};