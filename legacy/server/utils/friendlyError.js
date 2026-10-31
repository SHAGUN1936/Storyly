/**
 * Map raw server errors (especially MongoDB connection failures) into clean,
 * user-safe messages — so the UI never leaks infrastructure details like
 * "getaddrinfo ENOTFOUND ac-gqfjdip-shard-00-00.obu6md0.mongodb.net".
 *
 * Returns { status, message } you can spread into `res.status(...).json({...})`.
 */
export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  const raw = String(err?.message || err || '');
  const name = String(err?.name || '');
  const code = err?.code;

  // Mongoose / driver connection issues
  if (
    name === 'MongoServerSelectionError' ||
    name === 'MongooseServerSelectionError' ||
    name === 'MongoNetworkError' ||
    /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH/i.test(raw) ||
    /getaddrinfo|querySrv|topology was destroyed|server selection/i.test(raw)
  ) {
    return {
      status: 503,
      message: "We can't reach our servers right now. Please check your internet connection and try again.",
    };
  }

  // Mongoose validation
  if (name === 'ValidationError') {
    return { status: 400, message: err.message || 'Validation failed' };
  }

  // Duplicate key
  if (code === 11000) {
    return { status: 400, message: 'Already exists' };
  }

  // JWT errors
  if (name === 'JsonWebTokenError' || name === 'TokenExpiredError') {
    return { status: 401, message: 'Session expired. Please sign in again.' };
  }

  return { status: 500, message: fallback };
}
