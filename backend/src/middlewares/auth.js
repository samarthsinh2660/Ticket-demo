const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-48h';

/**
 * Protects routes, ensuring a valid JWT Authorization bearer token.
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  // Extract bearer token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in first.', 401));
  }

  try {
    // Verify token validity
    const decoded = jwt.verify(token, ACCESS_SECRET);

    // Retrieve user belonging to the token from the database
    const user = await userRepository.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Attach user to req for controllers/middlewares
    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
});

/**
 * Restricts endpoint access to specific user roles.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
