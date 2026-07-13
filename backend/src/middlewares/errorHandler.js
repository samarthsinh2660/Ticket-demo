const errorHandler = (err, req, res, next) => {
  if (err.name === 'MulterError') {
    err.statusCode = 400;
    err.status = 'fail';
    if (err.code === 'LIMIT_FILE_SIZE') {
      err.message = 'File size exceeds limit. Maximum allowed size is 10 MB.';
    }
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';


  const response = {
    status: err.status,
    message: err.message,
  };

  // In development environments, include the stack trace for debugging
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

module.exports = errorHandler;
