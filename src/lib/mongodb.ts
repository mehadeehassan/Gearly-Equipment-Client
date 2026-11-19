import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is missing');
const globalMongo = globalThis as typeof globalThis & { gearlyMongo?: MongoClient };
export const mongoClient = globalMongo.gearlyMongo ?? new MongoClient(uri);
if (process.env.NODE_ENV !== 'production') globalMongo.gearlyMongo = mongoClient;
