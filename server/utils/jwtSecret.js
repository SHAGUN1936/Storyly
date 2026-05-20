/**
 * JWT signing secret. Set JWT_SECRET in server/.env for all environments.
 * In development only, falls back so signup/login work without a .env file.
 */
export function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (s && String(s).trim()) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('[auth] JWT_SECRET not set — using insecure dev default. Add JWT_SECRET to server/.env');
  return 'dev-only-jwt-secret-change-in-production';
}
