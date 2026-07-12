const BaseRepository = require('./baseRepository');

class ChecklistRepository extends BaseRepository {
  constructor() {
    super('checklistItem');
  }
}

module.exports = new ChecklistRepository();
