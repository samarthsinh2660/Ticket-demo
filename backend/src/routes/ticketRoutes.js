const express = require('express');
const ticketController = require('../controllers/ticketController');
const checklistController = require('../controllers/checklistController');
const starredTicketController = require('../controllers/starredTicketController');
const { protect, restrictTo } = require('../middlewares/auth');
const validateParams = require('../middlewares/validateParams');

const router = express.Router();

// Secure all ticket endpoints
router.use(protect);

router
  .route('/')
  .post(ticketController.create)
  .get(ticketController.getAll);

// Restrict recent activity logs to staff and administrators
router.get('/activity', restrictTo('ADMIN', 'EMPLOYEE'), ticketController.getRecentActivity);

router
  .route('/:id')
  .get(validateParams('id'), ticketController.getOne)
  .patch(validateParams('id'), ticketController.update)
  .delete(validateParams('id'), ticketController.delete);

// Checklist sub-routes
router
  .route('/:ticketId/checklist')
  .get(validateParams('ticketId'), checklistController.getChecklist)
  .post(validateParams('ticketId'), checklistController.createChecklistItem);

// Star/Unstar sub-routes
router
  .route('/:ticketId/star')
  .post(validateParams('ticketId'), starredTicketController.starTicket)
  .delete(validateParams('ticketId'), starredTicketController.unstarTicket);

module.exports = router;
