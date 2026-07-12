const starredTicketRepository = require('../repositories/starredTicketRepository');
const ticketRepository = require('../repositories/ticketRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const AppError = require('../utils/appError');

class StarredTicketService {
  /**
   * Stars a ticket privately for the user.
   */
  async starTicket(userId, ticketId) {
    const tId = parseInt(ticketId, 10);
    const ticket = await ticketRepository.findUnique({
      where: { id: tId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    // Check if already starred
    const existing = await starredTicketRepository.findUnique({
      where: {
        userId_ticketId: {
          userId,
          ticketId: tId
        }
      }
    });

    if (existing) {
      return existing; // Already starred, return success
    }

    const star = await starredTicketRepository.create({
      data: {
        userId,
        ticketId: tId
      }
    });

    // Write audit log
    await activityLogRepository.create({
      data: {
        ticketId: tId,
        userId,
        action: 'Star Added',
        details: 'User starred this ticket',
        previousValue: null,
        newValue: 'Starred'
      }
    });

    return star;
  }

  /**
   * Unstars a ticket privately for the user.
   */
  async unstarTicket(userId, ticketId) {
    const tId = parseInt(ticketId, 10);
    const ticket = await ticketRepository.findUnique({
      where: { id: tId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    // Check if starred
    const existing = await starredTicketRepository.findUnique({
      where: {
        userId_ticketId: {
          userId,
          ticketId: tId
        }
      }
    });

    if (!existing) {
      return true; // Already unstarred
    }

    await starredTicketRepository.delete({
      where: {
        userId_ticketId: {
          userId,
          ticketId: tId
        }
      }
    });

    // Write audit log
    await activityLogRepository.create({
      data: {
        ticketId: tId,
        userId,
        action: 'Star Removed',
        details: 'User unstarred this ticket',
        previousValue: 'Starred',
        newValue: null
      }
    });

    return true;
  }

  /**
   * Gets all starred tickets for a specific user, with filters.
   */
  async getStarredTickets(userId, query = {}) {
    const where = {
      starredBy: {
        some: { userId }
      }
    };

    // Direct attribute filters
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId === 'null' ? null : parseInt(query.assigneeId, 10);
    }

    // Search query: title, description, ticket number, customer name
    if (query.search) {
      const searchPattern = query.search;
      where.OR = [
        { title: { contains: searchPattern, mode: 'insensitive' } },
        { description: { contains: searchPattern, mode: 'insensitive' } },
        { ticketNumber: { contains: searchPattern, mode: 'insensitive' } },
        { customer: { name: { contains: searchPattern, mode: 'insensitive' } } },
      ];
    }

    return await ticketRepository.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        starredBy: { where: { userId } } // Include to easily toggle star icon in list UI
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new StarredTicketService();
