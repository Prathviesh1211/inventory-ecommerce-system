export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  let statusCode = error.statusCode || 500;
  let message = error.message || 'An unexpected server error occurred.';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map((item) => item.message).join(' ');
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with this unique value already exists.';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'The supplied identifier is invalid.';
  }

  res.status(statusCode).json({
    message,
  });
}
