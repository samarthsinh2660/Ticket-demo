const starredTicketService = require('../services/starredTicketService');
const catchAsync = require('../utils/catchAsync');

class StarredTicketController {
  starTicket = catchAsync(async (req, res, next) => {
    const star = await starredTicketService.starTicket(req.user.id, req.user.role, req.params.ticketId);

    res.status(201).json({
      status: 'success',
      data: {
        star
      }
    });
  });

  unstarTicket = catchAsync(async (req, res, next) => {
    await starredTicketService.unstarTicket(req.user.id, req.user.role, req.params.ticketId);

    res.status(200).json({
      status: 'success',
      message: 'Ticket unstarred successfully.'
    });
  });

  getStarredTickets = catchAsync(async (req, res, next) => {
    const tickets = await starredTicketService.getStarredTickets(req.user.id, req.query);

    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: {
        tickets
      }
    });
  });
}

module.exports = new StarredTicketController();
