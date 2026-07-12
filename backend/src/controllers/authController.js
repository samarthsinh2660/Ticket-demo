const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

class AuthController {
  /**
   * Handles user signup requests.
   */
  signup = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;
    const data = await authService.signup(name, email, password);

    // Set httpOnly cookies to prevent XSS-based token theft
    res.cookie('accessToken', data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 48 * 60 * 60 * 1000 });
    res.cookie('refreshToken', data.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });


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

    // Set httpOnly cookies to prevent XSS-based token theft
    res.cookie('accessToken', data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 48 * 60 * 60 * 1000 });
    res.cookie('refreshToken', data.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });


    res.status(200).json({
      status: 'success',
      data,
    });
  });

  /**
   * Handles token refresh requests.
   */
  refresh = catchAsync(async (req, res, next) => {
    let token = req.body.refreshToken;

    // Retrieve from cookie header if not in request body
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      token = cookies.refreshToken;
    }

    const data = await authService.refresh(token);

    // Refresh the access token cookie
    res.cookie('accessToken', data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 48 * 60 * 60 * 1000 });

    res.status(200).json({
      status: 'success',
      data,
    });
  });

  /**
   * Handles password change requests.
   */
  changePassword = catchAsync(async (req, res, next) => {
    // Email is always taken from the authenticated session — never from the request body
    const email = req.user.email;
    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(email, oldPassword, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    });
  });
}

module.exports = new AuthController();
