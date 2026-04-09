// api/register.js
// Vercel Serverless Function — Register a new user
// Uses Vercel KV (Redis) for storage, bcryptjs for password hashing

import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'luca-secret-change-this');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { firstName, lastName, username, email, phone, password } = req.body;

    // --- Validation ---
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be filled in.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const usernameClean = username.trim().toLowerCase();
    const emailClean    = email.trim().toLowerCase();

    // --- Check duplicates ---
    const existingByUsername = await kv.get(`user:username:${usernameClean}`);
    if (existingByUsername) {
      return res.status(409).json({ error: 'Username already taken. Please choose another.' });
    }

    const existingByEmail = await kv.get(`user:email:${emailClean}`);
    if (existingByEmail) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    // --- Hash password ---
    const passwordHash = await bcrypt.hash(password, 12);

    // --- Build user object ---
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = {
      id:           userId,
      firstName:    firstName.trim(),
      lastName:     lastName.trim(),
      username:     usernameClean,
      email:        emailClean,
      phone:        (phone || '').trim(),
      passwordHash,
      createdAt:    new Date().toISOString(),
    };

    // --- Store in KV ---
    await kv.set(`user:id:${userId}`,           JSON.stringify(user));
    await kv.set(`user:username:${usernameClean}`, userId);
    await kv.set(`user:email:${emailClean}`,       userId);

    // --- Issue JWT ---
    const token = await new SignJWT({ sub: userId, username: usernameClean })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id:        userId,
        firstName: user.firstName,
        lastName:  user.lastName,
        username:  user.username,
        email:     user.email,
      },
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}