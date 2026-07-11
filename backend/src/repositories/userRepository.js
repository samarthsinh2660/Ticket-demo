const BaseRepository = require('./baseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('user');
  }

  async findByEmail(email) {
    return await this.findUnique({
      where: { email },
    });
  }
}

module.exports = new UserRepository();
