// api/login.js
// Vercel Serverless Function — Log in a user
// Uses Vercel KV (Redis) for storage, bcryptjs for password verification

import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'luca-secret-change-this');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const usernameClean = username.trim().toLowerCase();

    // --- Look up user ---
    const userId = await kv.get(`user:username:${usernameClean}`);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const userRaw = await kv.get(`user:id:${userId}`);
    if (!userRaw) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = typeof userRaw === 'string' ? JSON.parse(userRaw) : userRaw;

    // --- Verify password ---
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // --- Issue JWT ---
    const token = await new SignJWT({ sub: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return res.status(200).json({
      message: 'Logged in successfully!',
      token,
      user: {
        id:        user.id,
        firstName: user.firstName,
        lastName:  user.lastName,
        username:  user.username,
        email:     user.email,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}