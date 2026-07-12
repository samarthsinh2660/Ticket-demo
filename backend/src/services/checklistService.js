const checklistRepository = require('../repositories/checklistRepository');
const ticketRepository = require('../repositories/ticketRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const AppError = require('../utils/appError');
const prisma = require('../database');



class ChecklistService {
  async getChecklist(userId, role, ticketId) {
    const id = parseInt(ticketId, 10);
    const ticket = await ticketRepository.findUnique({
      where: { id }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    if (role === 'CUSTOMER' && ticket.customerId !== userId) {
      throw new AppError('You are not authorized to view the checklist for this ticket.', 403);
    }

    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      throw new AppError('You are not authorized to view the checklist for this ticket.', 403);
    }

    return await checklistRepository.findMany({
      where: { ticketId: id },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        completedBy: { select: { id: true, name: true, role: true } }
      }
    });
  }

  async addChecklistItem(userId, role, ticketId, title) {
    if (role !== 'ADMIN' && role !== 'EMPLOYEE') {
      throw new AppError('Only administrators and support staff can add checklist items.', 403);
    }

    const tId = parseInt(ticketId, 10);
    const ticket = await ticketRepository.findUnique({
      where: { id: tId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      throw new AppError('You are not authorized to modify the checklist for this ticket.', 403);
    }

    if (!title || !title.trim()) {
      throw new AppError('Title is required.', 400);
    }

    // Perform checklist create and audit log in a single atomic transaction
    return await prisma.$transaction(async (tx) => {
      // Determine order inside the transaction to avoid race conditions
      const items = await tx.checklistItem.findMany({
        where: { ticketId: tId },
        orderBy: { order: 'desc' },
        take: 1,
      });
      const nextOrder = items.length > 0 ? items[0].order + 1 : 0;

      const newItem = await tx.checklistItem.create({
        data: {
          ticketId: tId,
          title: title.trim(),
          completed: false,
          order: nextOrder,
        },
      });

      await tx.activityLog.create({
        data: {
          ticketId: tId,
          userId,
          action: 'Checklist Updated',
          details: `Added checklist item: "${title.trim()}"`,
          previousValue: null,
          newValue: title.trim(),
        },
      });

      return newItem;
    });
  }

  async updateChecklistItem(userId, role, itemId, data) {
    if (role !== 'ADMIN' && role !== 'EMPLOYEE') {
      throw new AppError('Only administrators and support staff can update checklist items.', 403);
    }

    const id = parseInt(itemId, 10);
    const item = await checklistRepository.findUnique({
      where: { id }
    });

    if (!item) {
      throw new AppError('Checklist item not found.', 404);
    }

    const ticket = await ticketRepository.findUnique({
      where: { id: item.ticketId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      throw new AppError('You are not authorized to modify the checklist for this ticket.', 403);
    }

    const updateData = {};
    const previousState = { ...item };

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }

    if (data.order !== undefined) {
      updateData.order = parseInt(data.order, 10);
    }

    if (data.completed !== undefined && data.completed !== item.completed) {
      updateData.completed = data.completed;
      if (data.completed) {
        updateData.completedById = userId;
        updateData.completedAt = new Date();
      } else {
        updateData.completedById = null;
        updateData.completedAt = null;
      }
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      const result = await tx.checklistItem.update({
        where: { id },
        data: updateData,
        include: {
          completedBy: { select: { id: true, name: true, role: true } },
        },
      });

      // Save audit log
      let details = `Updated checklist item "${result.title}"`;
      if (data.completed !== undefined && data.completed !== previousState.completed) {
        details = data.completed
          ? `Marked checklist item "${result.title}" as completed`
          : `Marked checklist item "${result.title}" as pending`;
      }

      await tx.activityLog.create({
        data: {
          ticketId: item.ticketId,
          userId,
          action: 'Checklist Updated',
          details,
          previousValue: previousState.completed ? 'Completed' : 'Pending',
          newValue: result.completed ? 'Completed' : 'Pending',
        },
      });

      return result;
    });

    return updatedItem;
  }

  async deleteChecklistItem(userId, role, itemId) {
    if (role !== 'ADMIN' && role !== 'EMPLOYEE') {
      throw new AppError('Only administrators and support staff can delete checklist items.', 403);
    }

    const id = parseInt(itemId, 10);
    const item = await checklistRepository.findUnique({
      where: { id }
    });

    if (!item) {
      throw new AppError('Checklist item not found.', 404);
    }

    const ticket = await ticketRepository.findUnique({
      where: { id: item.ticketId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      throw new AppError('You are not authorized to modify the checklist for this ticket.', 403);
    }

    // Delete item and write audit log atomically
    await prisma.$transaction(async (tx) => {
      await tx.checklistItem.delete({ where: { id } });

      await tx.activityLog.create({
        data: {
          ticketId: item.ticketId,
          userId,
          action: 'Checklist Updated',
          details: `Deleted checklist item: "${item.title}"`,
          previousValue: item.title,
          newValue: null,
        },
      });
    });

    return true;
  }
}

module.exports = new ChecklistService();
