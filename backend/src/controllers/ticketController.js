const ticketService = require('../services/ticketService');
const catchAsync = require('../utils/catchAsync');

class TicketController {
  create = catchAsync(async (req, res, next) => {
    const ticket = await ticketService.createTicket(req.user.id, req.user.role, req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        ticket,
      },
    });
  });

  getAll = catchAsync(async (req, res, next) => {
    const tickets = await ticketService.getTickets(req.user.id, req.user.role, req.query);
    
    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: {
        tickets,
      },
    });
  });

  getOne = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const ticket = await ticketService.getTicketById(req.user.id, req.user.role, id);
    
    res.status(200).json({
      status: 'success',
      data: {
        ticket,
      },
    });
  });

  update = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const ticket = await ticketService.updateTicket(req.user.id, req.user.role, id, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        ticket,
      },
    });
  });

  delete = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    await ticketService.deleteTicket(req.user.id, req.user.role, id);
    
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  getRecentActivity = catchAsync(async (req, res, next) => {
    const activity = await ticketService.getRecentActivity();
    res.status(200).json({
      status: 'success',
      data: {
        activity,
      },
    });
  });
}

module.exports = new TicketController();
