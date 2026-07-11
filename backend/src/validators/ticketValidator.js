const AppError = require('../utils/appError');
const { TICKET_STATUS, TICKET_PRIORITY, TICKET_CATEGORY } = require('../constants');

/**
 * Validates request data when creating a ticket.
 */
const validateCreateTicket = (data) => {
  const { title, description, category } = data;
  
  if (!title || !description || !category) {
    throw new AppError('Title, description, and category are required.', 400);
  }
  
  if (!Object.values(TICKET_CATEGORY).includes(category)) {
    throw new AppError(`Invalid ticket category. Permitted: ${Object.values(TICKET_CATEGORY).join(', ')}`, 400);
  }
};

/**
 * Validates request data when updating a ticket.
 */
const validateUpdateTicket = (data) => {
  const { status, priority, category } = data;

  if (status && !Object.values(TICKET_STATUS).includes(status)) {
    throw new AppError(`Invalid status value. Permitted: ${Object.values(TICKET_STATUS).join(', ')}`, 400);
  }

  if (priority && !Object.values(TICKET_PRIORITY).includes(priority)) {
    throw new AppError(`Invalid priority value. Permitted: ${Object.values(TICKET_PRIORITY).join(', ')}`, 400);
  }

  if (category && !Object.values(TICKET_CATEGORY).includes(category)) {
    throw new AppError(`Invalid category value. Permitted: ${Object.values(TICKET_CATEGORY).join(', ')}`, 400);
  }
};

module.exports = {
  validateCreateTicket,
  validateUpdateTicket,
};
