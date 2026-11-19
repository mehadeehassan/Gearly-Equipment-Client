import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { ObjectId } from 'mongodb';
import { mongoClient } from './mongodb';
export const auth = betterAuth({
  appName: 'Gearly',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: { database: { generateId: () => new ObjectId().toHexString() } },
  database: mongodbAdapter(mongoClient.db(process.env.DB_NAME || 'equipment_rental')),
  emailAndPassword: { enabled: true, minPasswordLength: 6 },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'customer', input: false },
      image: { type: 'string', required: false },
    },
  },
});
