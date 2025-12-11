// middleware/authenticate.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_COOKIE = 'accessToken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.[ACCESS_TOKEN_COOKIE] ||
      (req.headers.authorization?.split(' ')[1] ?? null);

    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;

    next();
  } catch (err) {
    console.error('Auth failed:', err);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

