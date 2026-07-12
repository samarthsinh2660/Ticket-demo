const AppError = require('../utils/appError');

/**
 * Validates that specified request parameters are valid integer strings.
 * Responds with a 400 Bad Request if validation fails.
 */
const validateIntParams = (...paramNames) => {
  return (req, res, next) => {
    for (const name of paramNames) {
      if (req.params[name] !== undefined && req.params[name] !== null) {
        const val = parseInt(req.params[name], 10);
        if (isNaN(val) || val <= 0) {

          return next(
            new AppError(
              `Invalid request parameter: '${name}' must be a valid integer. Received: '${req.params[name]}'.`,
              400
            )
          );
        }
      }
    }
    next();
  };
};

module.exports = validateIntParams;
