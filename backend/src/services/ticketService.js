const ticketRepository = require('../repositories/ticketRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/appError');
const { validateCreateTicket, validateUpdateTicket } = require('../validators/ticketValidator');
const prisma = require('../database');

class TicketService {
  /**
   * Creates a new ticket.
   */
  async createTicket(customerId, role, data) {
    validateCreateTicket(data);

    // Execute creation and activity log in a single transaction block for database atomicity
    const ticket = await prisma.$transaction(async (tx) => {
      // Create the ticket with a temporary unique value to satisfy the unique constraint
      const tempTicketNumber = `TEMP-${Date.now()}-${Math.random()}`;
      
      const newTicket = await tx.ticket.create({
        data: {
          ticketNumber: tempTicketNumber,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority || 'MEDIUM',
          status: 'TO_DO',
          customerId,
          dueDate: data.dueDate ? (() => {
            const d = new Date(data.dueDate);
            if (isNaN(d.getTime())) throw new AppError('Invalid dueDate value.', 400);
            return d;
          })() : null,

        },
      });

      // Update the ticket number using the actual autoincremented database primary key ID
      const ticketNumber = `TCK-${1000 + newTicket.id}`;
      
      const updatedTicket = await tx.ticket.update({
        where: { id: newTicket.id },
        data: { ticketNumber },
      });

      // Create the activity log
      await tx.activityLog.create({
        data: {
          ticketId: updatedTicket.id,
          userId: customerId,
          action: 'Ticket Created',
          details: `Ticket created under category: ${data.category}`,
        },
      });

      return updatedTicket;
    });

    return ticket;
  }

  /**
   * Fetches tickets based on role and filters.
   */
  async getTickets(userId, role, query = {}) {
    const where = {};

    // Customer filters: Can only retrieve own tickets
    if (role === 'CUSTOMER') {
      where.customerId = userId;
      // Customers cannot filter by assigneeId — that leaks internal employee data
    } else if (role === 'EMPLOYEE') {

      // Employee filters: Can ONLY retrieve tickets assigned to themselves
      where.assigneeId = userId;
    } else if (query.assigneeId) {
      // Admins or other roles can query by assigneeId
      where.assigneeId = query.assigneeId === 'null' ? null : parseInt(query.assigneeId, 10);
    }

    // Validate enum query filters to avoid raw Prisma validation errors
    const { TICKET_STATUS, TICKET_PRIORITY, TICKET_CATEGORY } = require('../constants');
    if (query.status && !Object.values(TICKET_STATUS).includes(query.status)) {
      throw new AppError(`Invalid status filter. Permitted: ${Object.values(TICKET_STATUS).join(', ')}`, 400);
    }
    if (query.priority && !Object.values(TICKET_PRIORITY).includes(query.priority)) {
      throw new AppError(`Invalid priority filter. Permitted: ${Object.values(TICKET_PRIORITY).join(', ')}`, 400);
    }
    if (query.category && !Object.values(TICKET_CATEGORY).includes(query.category)) {
      throw new AppError(`Invalid category filter. Permitted: ${Object.values(TICKET_CATEGORY).join(', ')}`, 400);
    }

    // Direct attribute filters
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;

    if (query.customerId && role === 'ADMIN') {
      where.customerId = parseInt(query.customerId, 10);
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
        starredBy: { where: { userId } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetches a single ticket and its activity logs.
   */
  async getTicketById(userId, role, id) {
    const ticket = await ticketRepository.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        starredBy: { where: { userId } },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    // Customer security check
    if (role === 'CUSTOMER' && ticket.customerId !== userId) {
      throw new AppError('You are not authorized to view this ticket.', 403);
    }

    // Employee security check
    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      throw new AppError('You are not authorized to view this ticket.', 403);
    }

    return ticket;
  }

  /**
   * Updates an existing ticket and logs details.
   */
  async updateTicket(userId, role, id, data) {
    validateUpdateTicket(data);


    const ticket = await ticketRepository.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    // Customer authorization
    if (role === 'CUSTOMER' && ticket.customerId !== userId) {
      throw new AppError('You are not authorized to update this ticket.', 403);
    }

    const updateData = {};
    const logs = [];

    if (role === 'ADMIN') {
      // Admin update rights
      if (data.status && data.status !== ticket.status) {
        updateData.status = data.status;
        const isClosed = data.status === 'CLOSED';
        const isReopened = ticket.status === 'CLOSED' && data.status !== 'CLOSED';
        logs.push({
          action: isClosed ? 'Ticket Closed' : isReopened ? 'Ticket Reopened' : 'Status Changed',
          details: `Status updated from ${ticket.status} to ${data.status}`,
          previousValue: ticket.status,
          newValue: data.status,
        });
      }
      if (data.priority && data.priority !== ticket.priority) {
        updateData.priority = data.priority;
        logs.push({
          action: 'Priority Changed',
          details: `Priority updated from ${ticket.priority} to ${data.priority}`,
          previousValue: ticket.priority,
          newValue: data.priority,
        });
      }
      if (data.assigneeId !== undefined && data.assigneeId !== ticket.assigneeId) {
        const newAssigneeId = data.assigneeId ? parseInt(data.assigneeId, 10) : null;
        if (newAssigneeId !== null) {
          const assigneeUser = await userRepository.findUnique({ where: { id: newAssigneeId } });
          if (!assigneeUser) {
            throw new AppError('Assignee user not found.', 400);
          }
          if (assigneeUser.role === 'CUSTOMER') {
            throw new AppError('Cannot assign tickets to a customer account.', 400);
          }
        }
        updateData.assigneeId = newAssigneeId;
        logs.push({
          action: 'Ticket Assigned',
          details: data.assigneeId ? `Assigned to user ID ${data.assigneeId}` : 'Unassigned',
          previousValue: ticket.assigneeId ? String(ticket.assigneeId) : 'Unassigned',
          newValue: data.assigneeId ? String(data.assigneeId) : 'Unassigned',
        });
      }
      if (data.dueDate !== undefined) {
        const formattedDataDate = data.dueDate ? new Date(data.dueDate).toISOString().substring(0, 10) : null;
        const formattedTicketDate = ticket.dueDate ? new Date(ticket.dueDate).toISOString().substring(0, 10) : null;
        
        if (formattedDataDate !== formattedTicketDate) {
          const parsedDue = data.dueDate ? new Date(data.dueDate) : null;
          if (data.dueDate && isNaN(parsedDue.getTime())) {
            throw new AppError('Invalid dueDate value.', 400);
          }
          updateData.dueDate = parsedDue;

          logs.push({
            action: 'Due Date Changed',
            details: data.dueDate ? `Due date set to ${formattedDataDate}` : 'Due date removed',
            previousValue: formattedTicketDate || 'None',
            newValue: formattedDataDate || 'None',
          });
        }
      }
      if (data.category && data.category !== ticket.category) {
        updateData.category = data.category;
        logs.push({
          action: 'Category Changed',
          details: `Category changed from ${ticket.category} to ${data.category}`,
          previousValue: ticket.category,
          newValue: data.category,
        });
      }
      if (data.title && data.title !== ticket.title) {
        updateData.title = data.title;
        logs.push({
          action: 'Ticket Updated',
          details: `Title updated to "${data.title}"`,
          previousValue: ticket.title,
          newValue: data.title,
        });
      }
      if (data.description && data.description !== ticket.description) {
        updateData.description = data.description;
        logs.push({
          action: 'Ticket Updated',
          details: `Description updated`,
          previousValue: ticket.description,
          newValue: data.description,
        });
      }

      if (data.reply) {
        logs.push({
          action: 'Comment Added',
          details: data.reply,
          previousValue: null,
          newValue: data.reply,
        });
      }
    } else if (role === 'EMPLOYEE') {
      // Employee update rights
      if (ticket.assigneeId !== userId) {
        throw new AppError('You are not authorized to update this ticket.', 403);
      }

      if (data.status && data.status !== ticket.status) {
        updateData.status = data.status;
        const isClosed = data.status === 'CLOSED';
        const isReopened = ticket.status === 'CLOSED' && data.status !== 'CLOSED';
        logs.push({
          action: isClosed ? 'Ticket Closed' : isReopened ? 'Ticket Reopened' : 'Status Changed',
          details: `Status updated by employee from ${ticket.status} to ${data.status}`,
          previousValue: ticket.status,
          newValue: data.status,
        });
      }

      if (data.reply) {
        logs.push({
          action: 'Comment Added',
          details: data.reply,
          previousValue: null,
          newValue: data.reply,
        });
      }
    } else {
      // Customer update rights
      if (data.status === 'CLOSED' && ticket.status !== 'CLOSED') {
        updateData.status = 'CLOSED';
        logs.push({
          action: 'Ticket Closed',
          details: 'Ticket closed by customer',
          previousValue: ticket.status,
          newValue: 'CLOSED',
        });
      }
      
      // Prevent editing fields if ticket is already closed
      if (ticket.status !== 'CLOSED') {
        if (data.title && data.title !== ticket.title) {
          updateData.title = data.title;
          logs.push({
            action: 'Ticket Updated',
            details: `Title updated to "${data.title}"`,
            previousValue: ticket.title,
            newValue: data.title,
          });
        }
        if (data.description && data.description !== ticket.description) {
          updateData.description = data.description;
          logs.push({
            action: 'Ticket Updated',
            details: `Description updated`,
            previousValue: ticket.description,
            newValue: data.description,
          });
        }
        if (data.category && data.category !== ticket.category) {
          updateData.category = data.category;
          logs.push({
            action: 'Category Changed',
            details: `Category changed from ${ticket.category} to ${data.category}`,
            previousValue: ticket.category,
            newValue: data.category,
          });
        }
      }

      if (data.reply) {
        logs.push({
          action: 'Comment Added',
          details: data.reply,
          previousValue: null,
          newValue: data.reply,
        });
      }
    }

    // Perform database update and activity log creation in a single transaction block for database atomicity
    const updatedTicket = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          starredBy: { where: { userId } },
        },
      });

      // Insert all activity logs atomically using createMany for performance
      if (logs.length > 0) {
        await tx.activityLog.createMany({
          data: logs.map((log) => ({
            ticketId: id,
            userId,
            action: log.action,
            details: log.details,
            previousValue: log.previousValue !== undefined && log.previousValue !== null ? String(log.previousValue) : null,
            newValue: log.newValue !== undefined && log.newValue !== null ? String(log.newValue) : null,
          })),
        });
      }

      return updated;
    });

    return updatedTicket;
  }

  /**
   * Deletes a ticket.
   */
  async deleteTicket(userId, role, id) {
    if (role !== 'ADMIN') {
      throw new AppError('Only administrators are allowed to delete tickets.', 403);
    }

    const ticket = await ticketRepository.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    await ticketRepository.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Fetches latest global activity logs for dashboards (filtered by role).
   */
  async getRecentActivity(userId, role) {
    const where = {};
    if (role === 'CUSTOMER') {
      where.ticket = { customerId: userId };
    } else if (role === 'EMPLOYEE') {
      where.ticket = { assigneeId: userId };
    }

    return await activityLogRepository.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
        ticket: { select: { id: true, ticketNumber: true, title: true } },
      },
    });
  }
}

module.exports = new TicketService();
