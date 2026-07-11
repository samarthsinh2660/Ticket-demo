const BaseRepository = require('./baseRepository');

class TicketRepository extends BaseRepository {
  constructor() {
    super('ticket');
  }
}

module.exports = new TicketRepository();
