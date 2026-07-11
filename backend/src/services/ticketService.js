const ticketRepository = require('../repositories/ticketRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const AppError = require('../utils/appError');
const { validateCreateTicket, validateUpdateTicket } = require('../validators/ticketValidator');

class TicketService {
  /**
   * Creates a new ticket.
   */
  async createTicket(customerId, role, data) {
    validateCreateTicket(data);

    // Generate unique readable ticket number based on count
    const count = await ticketRepository.count();
    const ticketNumber = `TCK-${1000 + count + 1}`;

    const ticket = await ticketRepository.create({
      data: {
        ticketNumber,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority || 'MEDIUM',
        status: 'TO_DO',
        customerId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    // Save ticket creation log
    await activityLogRepository.create({
      data: {
        ticketId: ticket.id,
        userId: customerId,
        action: 'Ticket Created',
        details: `Ticket created under category: ${data.category}`,
      },
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
    }

    // Employee filters: Can only retrieve assigned tickets
    if (role === 'EMPLOYEE') {
      where.assigneeId = userId;
    }

    // Direct attribute filters
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId === 'null' ? null : parseInt(query.assigneeId, 10);
    }
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
    console.log('updateTicket method called:', { userId, role, id, data });
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
        logs.push({
          action: data.status === 'CLOSED' ? 'Closed' : 'Status Changed',
          details: `Status updated from ${ticket.status} to ${data.status}`,
        });
      }
      if (data.priority && data.priority !== ticket.priority) {
        updateData.priority = data.priority;
        logs.push({
          action: 'Priority Updated',
          details: `Priority updated from ${ticket.priority} to ${data.priority}`,
        });
      }
      if (data.assigneeId !== undefined && data.assigneeId !== ticket.assigneeId) {
        updateData.assigneeId = data.assigneeId ? parseInt(data.assigneeId, 10) : null;
        logs.push({
          action: 'Assigned',
          details: data.assigneeId ? `Assigned to user ID ${data.assigneeId}` : 'Unassigned',
        });
      }
      if (data.dueDate !== undefined) {
        const formattedDataDate = data.dueDate ? new Date(data.dueDate).toISOString().substring(0, 10) : null;
        const formattedTicketDate = ticket.dueDate ? new Date(ticket.dueDate).toISOString().substring(0, 10) : null;
        
        if (formattedDataDate !== formattedTicketDate) {
          updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
          logs.push({
            action: 'Due Date Updated',
            details: data.dueDate ? `Due date set to ${formattedDataDate}` : 'Due date removed',
          });
        }
      }
      if (data.category && data.category !== ticket.category) {
        updateData.category = data.category;
      }
      if (data.title && data.title !== ticket.title) updateData.title = data.title;
      if (data.description && data.description !== ticket.description) updateData.description = data.description;

      if (data.reply) {
        logs.push({
          action: 'Admin Reply',
          details: data.reply,
        });
      }
    } else if (role === 'EMPLOYEE') {
      // Employee update rights
      if (ticket.assigneeId !== userId) {
        throw new AppError('You are not authorized to update this ticket.', 403);
      }

      if (data.status && data.status !== ticket.status) {
        updateData.status = data.status;
        logs.push({
          action: data.status === 'CLOSED' ? 'Closed' : 'Status Changed',
          details: `Status updated by employee from ${ticket.status} to ${data.status}`,
        });
      }

      if (data.reply) {
        logs.push({
          action: 'Employee Reply',
          details: data.reply,
        });
      }
    } else {
      // Customer update rights
      if (data.status === 'CLOSED' && ticket.status !== 'CLOSED') {
        updateData.status = 'CLOSED';
        logs.push({
          action: 'Closed',
          details: 'Ticket closed by customer',
        });
      }
      
      // Prevent editing fields if ticket is already closed
      if (ticket.status !== 'CLOSED') {
        if (data.title && data.title !== ticket.title) updateData.title = data.title;
        if (data.description && data.description !== ticket.description) updateData.description = data.description;
        if (data.category && data.category !== ticket.category) updateData.category = data.category;
      }

      if (data.reply) {
        logs.push({
          action: 'Customer Reply',
          details: data.reply,
        });
      }
    }

    console.log('updateData computed:', updateData, 'logs:', logs);

    const updatedTicket = await ticketRepository.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Save all logs to db
    for (const log of logs) {
      await activityLogRepository.create({
        data: {
          ticketId: id,
          userId,
          action: log.action,
          details: log.details,
        },
      });
    }

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
   * Fetches latest global activity logs for admin dashboard.
   */
  async getRecentActivity() {
    return await activityLogRepository.findMany({
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
