const BaseRepository = require('./baseRepository');

class StarredTicketRepository extends BaseRepository {
  constructor() {
    super('starredTicket');
  }
}

module.exports = new StarredTicketRepository();
