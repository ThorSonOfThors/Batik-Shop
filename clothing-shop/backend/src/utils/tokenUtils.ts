// src/utils/tokenUtils.ts
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.ts';

export function generateRandomToken() {
  return crypto.randomBytes(64).toString('hex'); // large random string
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(payload: object) {
  const secret = process.env.JWT_SECRET!;
  // short-lived access token
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string) {
  const secret = process.env.JWT_SECRET!;
  return jwt.verify(token, secret);
}

export async function cleanupExpiredTokens() {
  try {
    const result = await pool.query(`
      DELETE FROM refresh_tokens 
      WHERE expires_at < NOW() OR revoked = true
    `);
    console.log(`🧹 Cleaned up ${result.rowCount} expired/old refresh tokens`);
  } catch (err) {
    console.error('Error cleaning up tokens:', err);
  }
}
