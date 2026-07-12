const checklistRepository = require('../repositories/checklistRepository');
const ticketRepository = require('../repositories/ticketRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const AppError = require('../utils/AppError');

class ChecklistService {
  /**
   * Fetches the checklist items for a specific ticket.
   */
  async getChecklist(ticketId) {
    const id = parseInt(ticketId, 10);
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

  /**
   * Adds a checklist item to a ticket (Admin/Employee only).
   */
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

    if (!title || !title.trim()) {
      throw new AppError('Title is required.', 400);
    }

    // Determine order
    const items = await checklistRepository.findMany({
      where: { ticketId: tId },
      orderBy: { order: 'desc' },
      take: 1
    });
    const nextOrder = items.length > 0 ? items[0].order + 1 : 0;

    const newItem = await checklistRepository.create({
      data: {
        ticketId: tId,
        title: title.trim(),
        completed: false,
        order: nextOrder
      }
    });

    // Save audit log
    await activityLogRepository.create({
      data: {
        ticketId: tId,
        userId,
        action: 'Checklist Updated',
        details: `Added checklist item: "${title.trim()}"`,
        previousValue: null,
        newValue: title.trim()
      }
    });

    return newItem;
  }

  /**
   * Updates a checklist item (Admin/Employee only).
   */
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

    const updatedItem = await checklistRepository.update({
      where: { id },
      data: updateData,
      include: {
        completedBy: { select: { id: true, name: true, role: true } }
      }
    });

    // Save audit log
    let details = `Updated checklist item "${updatedItem.title}"`;
    if (data.completed !== undefined && data.completed !== previousState.completed) {
      details = data.completed
        ? `Marked checklist item "${updatedItem.title}" as completed`
        : `Marked checklist item "${updatedItem.title}" as pending`;
    }

    await activityLogRepository.create({
      data: {
        ticketId: item.ticketId,
        userId,
        action: 'Checklist Updated',
        details,
        previousValue: previousState.completed ? 'Completed' : 'Pending',
        newValue: updatedItem.completed ? 'Completed' : 'Pending'
      }
    });

    return updatedItem;
  }

  /**
   * Deletes a checklist item (Admin/Employee only).
   */
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

    await checklistRepository.delete({
      where: { id }
    });

    // Save audit log
    await activityLogRepository.create({
      data: {
        ticketId: item.ticketId,
        userId,
        action: 'Checklist Updated',
        details: `Deleted checklist item: "${item.title}"`,
        previousValue: item.title,
        newValue: null
      }
    });

    return true;
  }
}

module.exports = new ChecklistService();
