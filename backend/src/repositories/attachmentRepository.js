const BaseRepository = require('./baseRepository');

class AttachmentRepository extends BaseRepository {
  constructor() {
    super('attachment');
  }
}

module.exports = new AttachmentRepository();
