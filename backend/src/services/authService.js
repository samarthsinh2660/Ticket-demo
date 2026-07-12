const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRES = '48h';
const REFRESH_TOKEN_EXPIRES = '7d';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-48h';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-7d';

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES }
    );
  }

  /**
   * Registers a new user. Defaults role to CUSTOMER.
   */
  async signup(name, email, password) {
    if (!name || !email || !password) {
      throw new AppError('Please provide name, email, and password.', 400);
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email is already registered.', 400);
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER', // Default to CUSTOMER as confirmed
      },
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticates user credentials.
   */
  async login(email, password, role) {
    if (!email || !password || !role) {
      throw new AppError('Please provide email, password, and role.', 400);
    }

    const user = await userRepository.findByEmail(email);

    if (!user || user.role !== role) {
      throw new AppError('Invalid email, password, or role.', 401);
    }

    // Compare hashed passwords
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new AppError('Invalid email, password, or role.', 401);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes the access token using a valid refresh token.
   */
  async refresh(token) {
    if (!token) {
      throw new AppError('Refresh token is required.', 400);
    }

    try {
      const decoded = jwt.verify(token, REFRESH_SECRET);
      
      const user = await userRepository.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new AppError('The user belonging to this token no longer exists.', 401);
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (err) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }
  }

  /**
   * Changes a user's password after verifying their old password.
   */
  async changePassword(email, oldPassword, newPassword) {
    if (!email || !oldPassword || !newPassword) {
      throw new AppError('Please provide email, old password, and new password.', 400);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('No user found with this email address.', 404);
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      throw new AppError('Incorrect old password.', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return true;
  }
}

module.exports = new AuthService();
