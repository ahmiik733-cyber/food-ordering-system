// Global Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error('🔥 Server Error Captured:');
  console.error(err.stack || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Handle specific MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    let message = 'Database error occurred.';
    let status = 400;

    if (err.code === 'ER_DUP_ENTRY') {
      message = 'Duplicate entry detected. Resource already exists.';
      status = 409;
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      message = 'Foreign key constraint fails. Related record not found.';
    } else if (err.code === 'ER_ROW_IS_RECORDED') {
      message = 'Cannot delete or update. Record is referenced in other sections.';
    }

    return res.status(status).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: err.code
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;
