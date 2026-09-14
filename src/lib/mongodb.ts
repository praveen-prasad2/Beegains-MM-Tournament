import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'mini-militia-season2';

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable. Set it in .env.local.');
}

// Reuse the client (and its connection pool) across hot-reloads in dev and
// across requests in the running server, instead of reconnecting each call.
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  global._mongoClientPromise = new MongoClient(uri).connect();
}
const clientPromise = global._mongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
