import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanupExpiredTokens } from './utils/tokenUtils.ts';
import webhookRouter from "./routes/webhookRoutes.ts";


// ✅ NEW: Import Stripe only once
import Stripe from "stripe";

// Load .env
dotenv.config();

const app = express();

// ✅ Initialize Stripe once (correct API version auto inferred)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧩 Middlewares
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ⚠️ IMPORTANT: JSON middleware must NOT run before webhook route.
// So we apply JSON later.
app.use("/webhook", webhookRouter);

// After webhook: enable JSON normally for all other routes
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '2mb' }));


// All normal routes
app.use('/api/auth', authRoutes);

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
