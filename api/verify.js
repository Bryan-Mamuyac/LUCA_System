// api/verify.js
// Vercel Serverless Function — Verify a JWT and return user info

import { kv } from '@vercel/kv';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'luca-secret-change-this');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub;

    const userRaw = await kv.get(`user:id:${userId}`);
    if (!userRaw) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const user = typeof userRaw === 'string' ? JSON.parse(userRaw) : userRaw;

    return res.status(200).json({
      user: {
        id:        user.id,
        firstName: user.firstName,
        lastName:  user.lastName,
        username:  user.username,
        email:     user.email,
      },
    });

  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}