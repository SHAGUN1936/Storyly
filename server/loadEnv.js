import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '.env');
const envExample = path.join(__dirname, '.env.example');

dotenv.config({ path: envFile });
if (!process.env.MONGODB_URI?.trim()) {
  dotenv.config({ path: envExample });
  if (process.env.MONGODB_URI?.trim()) {
    console.warn('[env] MONGODB_URI was not set in .env — using value from .env.example.');
  }
}
