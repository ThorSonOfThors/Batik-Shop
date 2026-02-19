// src/controllers/authController.ts
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.ts';
import type { CookieOptions } from 'express';
import { generateRandomToken, hashToken, signAccessToken } from '../utils/tokenUtils.ts';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];
    if (!user)
      return res.status(401).json({ message: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid username or password' });

    // create access token (JWT)
    const accessToken = signAccessToken({ id: user.id, role: user.role });

    // create refresh token
    const refreshTokenPlain = generateRandomToken();
    const refreshHash = hashToken(refreshTokenPlain);
    const refreshExpiresMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + refreshExpiresMs);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshHash, expiresAt]
    );

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction ? true : false,
      sameSite: 'strict',
      path: '/',
    };

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshTokenPlain, {
      ...cookieOptions,
      maxAge: refreshExpiresMs,
    });

    res.status(200).json({
      message: 'Login successful',
      user: { username: user.username, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Rotate: accept refresh cookie, validate in DB, issue new tokens and rotate (revoke old)
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshPlain = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshPlain)
      return res.status(401).json({ message: 'No refresh token' });

    const refreshHash = hashToken(refreshPlain);

    const q = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1
       AND revoked = false
       AND expires_at > NOW()`,
      [refreshHash]
    );

    const row = q.rows[0];
    if (!row)
      return res.status(401).json({ message: 'Invalid refresh token' });

    /**
     * ✅ FIX #1 — ATOMIC ROTATION (prevents race condition)
     */
    const revokeResult = await pool.query(
      `UPDATE refresh_tokens
       SET revoked = true
       WHERE id = $1 AND revoked = false
       RETURNING id`,
      [row.id]
    );

    if (revokeResult.rowCount === 0) {
      return res.status(401).json({ message: 'Token already used' });
    }

    const userId = row.user_id;

    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    const dbUser = userResult.rows[0];

    if (!dbUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = signAccessToken({
      id: userId,
      role: dbUser.role
    });

    // create new refresh token
    const newRefreshPlain = generateRandomToken();
    const newRefreshHash = hashToken(newRefreshPlain);
    const refreshExpiresMs = 7 * 24 * 60 * 60 * 1000;
    const newExpiresAt = new Date(Date.now() + refreshExpiresMs);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, newRefreshHash, newExpiresAt]
    );

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction ? true : false,
      sameSite: 'strict',
      path: '/',
    };

    res.cookie(ACCESS_TOKEN_COOKIE, newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, newRefreshPlain, {
      ...cookieOptions,
      maxAge: refreshExpiresMs,
    });

    const userRes = await pool.query(
      'SELECT username, role FROM users WHERE id = $1',
      [userId]
    );

    const user = userRes.rows[0];

    res.json({ message: 'Token refreshed', user });

  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const logout = async (req: Request, res: Response) => {
  try {
    const refreshPlain = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshPlain) {
      const refreshHash = hashToken(refreshPlain);
      await pool.query(
        'UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1',
        [refreshHash]
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction ? true : false,
      sameSite: 'strict',
      path: '/',
    };

    /**
     * ✅ FIX #2 — RELIABLE COOKIE DELETION
     */
    res.cookie(ACCESS_TOKEN_COOKIE, '', {
      ...cookieOptions,
      expires: new Date(0),
    });

    res.cookie(REFRESH_TOKEN_COOKIE, '', {
      ...cookieOptions,
      expires: new Date(0),
    });

    res.json({ message: 'Logged out' });

  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
