const BaseRepository = require('./baseRepository');

class ActivityLogRepository extends BaseRepository {
  constructor() {
    super('activityLog');
  }
}

module.exports = new ActivityLogRepository();
