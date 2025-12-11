// routes/webhookRoutes.ts

import { Router } from "express";
import Stripe from "stripe";
import express from "express";

const router = Router();

// IMPORTANT: Stripe needs raw body for webhook signature verification
router.post(
  "/",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const signature = req.headers["stripe-signature"] as string;

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log("Webhook verified:", event.type);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Checkout session completed:", event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.sendStatus(200);
  }
);

export default router;
