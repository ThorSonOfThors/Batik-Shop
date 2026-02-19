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
import paymentsRouter from '../src/payments/routes.ts';
import { stripeWebhook } from './webhooks/stripeWebhook.ts';
import helmet from 'helmet';


// --------------------
// ENV
// --------------------
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173';

// --------------------
// Stripe
// --------------------
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// --------------------
// App
// --------------------
const app = express();

// IMPORTANT behind Vercel / Nginx / Cloudflare
app.set('trust proxy', 1);

// --------------------
// Security headers
// --------------------
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);


// --------------------
// CORS (production-safe)
// --------------------
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// --------------------
// Global rate limiter
// --------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// --------------------
// Stripe Webhook
// MUST be before express.json()
// --------------------
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// --------------------
// Paths
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads safely
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true,
  })
);

// --------------------
// Body parsers (AFTER webhook)
// --------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// --------------------
// Routes
// --------------------
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRouter);

// --------------------
// Health check (important for hosting)
// --------------------
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// --------------------
// Cleanup scheduler
// --------------------
setInterval(async () => {
  try {
    await cleanupExpiredTokens();
    console.log('✅ Token cleanup completed');
  } catch (err) {
    console.error('❌ Cleanup error:', err);
  }
}, 12 * 60 * 60 * 1000);

cleanupExpiredTokens();

// --------------------
// Global error handler
// --------------------
app.use((err: any, req: any, res: any, next: any) => {
  console.error('🔥 Server error:', err);

  res.status(err.status || 500).json({
    message: isProduction
      ? 'Internal server error'
      : err.message,
  });
});

export default app;
