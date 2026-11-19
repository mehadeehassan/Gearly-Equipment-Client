'use client';
import { createAuthClient } from 'better-auth/react';
export const authClient = createAuthClient({
  // Better Auth requires an absolute URL. Set NEXT_PUBLIC_APP_URL to the
  // deployed app origin in production (for example, https://gearly.example).
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});
