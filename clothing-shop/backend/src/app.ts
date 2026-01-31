import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanupExpiredTokens } from './utils/tokenUtils.ts';
import Stripe from 'stripe';
import rateLimit from 'express-rate-limit';
import paymentsRouter from '../src/payments/routes.ts'
import { stripeWebhook } from './webhooks/stripeWebhook.ts';


// Load .env
dotenv.config();

//Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const app = express();

// 🧩 Middlewares
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);




// 🔒 Rate limiter for Stripe webhook (prevents brute force)
const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 webhook requests per windowMs
  message: 'Too many webhook requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
)



//IMPORTANT: Stripe webhook is posted befofe express.json() in order to avoid inconsistency and security issues.
//authRoutes.ts must not post stripe webhook as it is used after express.json() buffer.
//app.post("/webhooks/stripe",webhookLimiter,express.raw({ type: "application/json" }),stripeWebhook);
//app.post('/api/payments/create-payment-intent', createPaymentIntent)







const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// After webhook: enable JSON normally for all other routes
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());


// All normal routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRouter);

// 🧹 Token cleanup scheduler
setInterval(() => {
  cleanupExpiredTokens()
    .then(() => console.log('✅ Cleanup completed'))
    .catch((err) => console.error('❌ Cleanup error:', err));
}, 12 * 60 * 60 * 1000); // every 12h

// Run once at startup
cleanupExpiredTokens()
  .then(() => console.log('✅ Initial cleanup completed'))
  .catch((err) => console.error('❌ Initial cleanup error:', err));

export default app;
