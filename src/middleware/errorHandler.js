// Centralized error handler — every route funnels its errors here via next(err)
// or the asyncHandler wrapper below. This keeps error formatting consistent
// across the whole API instead of scattering try/catch everywhere.

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Log unexpected (non-operational) errors with full stack for debugging
  if (!isOperational) {
    console.error('[UNEXPECTED ERROR]', err);
  }

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && !isOperational
      ? { stack: err.stack }
      : {}),
  });
}

// Wraps async route handlers so any thrown error / rejected promise
// automatically reaches the error handler above, instead of crashing
// the process or needing a try/catch in every single route.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
