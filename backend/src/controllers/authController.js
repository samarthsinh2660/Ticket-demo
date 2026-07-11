const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

class AuthController {
  /**
   * Handles user signup requests.
   */
  signup = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;
    const data = await authService.signup(name, email, password);

    res.status(201).json({
      status: 'success',
      data,
    });
  });

  /**
   * Handles user login requests.
   */
  login = catchAsync(async (req, res, next) => {
    const { email, password, role } = req.body;
    const data = await authService.login(email, password, role);

    res.status(200).json({
      status: 'success',
      data,
    });
  });

  /**
   * Handles token refresh requests.
   */
  refresh = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;
    const data = await authService.refresh(refreshToken);

    res.status(200).json({
      status: 'success',
      data,
    });
  });
}

module.exports = new AuthController();
