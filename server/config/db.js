import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/personalized-videos';

function normalizeMongoUri(raw) {
  if (raw == null || String(raw).trim() === '') return DEFAULT_URI;
  let u = String(raw).trim();
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1);
  }
  return u.trim();
}

/**
 * Connects to MongoDB (local or Atlas). Set MONGODB_URI in server/.env.
 */
export const connectDB = async () => {
  const uri = normalizeMongoUri(process.env.MONGODB_URI);
  if (uri === DEFAULT_URI) {
    console.warn(
      '[MongoDB] Using mongodb://127.0.0.1:27017 — set MONGODB_URI in server/.env (or server/.env.example with fallback) for Atlas / Docker.'
    );
  } else {
    const safe = uri.replace(/:[^:@/]+@/, ':****@');
    console.log('MongoDB: connecting to', safe.split('?')[0]);
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('MongoDB: connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB: connection error', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB: disconnected');
  });

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30_000,
    });
  } catch (err) {
    console.error('MongoDB: failed to connect', err.message);
    process.exit(1);
  }

  const shutdown = async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB: connection closed');
    } catch (_) {}
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};

export const isMongoConnected = () => mongoose.connection.readyState === 1;
