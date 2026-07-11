const prisma = require('../database');

class BaseRepository {
  constructor(modelName) {
    this.model = prisma[modelName];
  }

  async findMany(args = {}) {
    return await this.model.findMany(args);
  }

  async findUnique(args) {
    return await this.model.findUnique(args);
  }

  async findFirst(args = {}) {
    return await this.model.findFirst(args);
  }

  async create(args) {
    return await this.model.create(args);
  }

  async update(args) {
    return await this.model.update(args);
  }

  async delete(args) {
    return await this.model.delete(args);
  }

  async count(args = {}) {
    return await this.model.count(args);
  }
}

module.exports = BaseRepository;
