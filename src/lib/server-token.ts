import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { auth } from './auth';
export async function getBackendToken() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const user = session.user as typeof session.user & { role?: string };
  if (!/^[a-fA-F0-9]{24}$/.test(user.id))
    throw new Error('User ID must be a MongoDB ObjectId so the API can identify the account.');
  return jwt.sign(
    {
      id: user.id,
      role: (user.role || 'customer').trim().toLowerCase(),
      name: user.name || '',
    },
    process.env.JWT_SECRET!,
    {
      algorithm: 'HS256',
      expiresIn: '10m',
      issuer: process.env.JWT_ISSUER || 'gearly-client',
      audience: process.env.JWT_AUDIENCE || 'gearly-api',
    },
  );
}
