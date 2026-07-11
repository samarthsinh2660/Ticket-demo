const userRepository = require('../repositories/userRepository');
const catchAsync = require('../utils/catchAsync');

class UserController {
  /**
   * Fetches list of users for assignments.
   */
  getAll = catchAsync(async (req, res, next) => {
    const users = await userRepository.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        users,
      },
    });
  });
}

module.exports = new UserController();
