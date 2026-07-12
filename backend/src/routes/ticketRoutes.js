const express = require('express');
const ticketController = require('../controllers/ticketController');
const checklistController = require('../controllers/checklistController');
const starredTicketController = require('../controllers/starredTicketController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Secure all ticket endpoints
router.use(protect);

router
  .route('/')
  .post(ticketController.create)
  .get(ticketController.getAll);

router.get('/activity', ticketController.getRecentActivity);

router
  .route('/:id')
  .get(ticketController.getOne)
  .patch(ticketController.update)
  .delete(ticketController.delete);

// Checklist sub-routes
router
  .route('/:ticketId/checklist')
  .get(checklistController.getChecklist)
  .post(checklistController.createChecklistItem);

// Star/Unstar sub-routes
router
  .route('/:ticketId/star')
  .post(starredTicketController.starTicket)
  .delete(starredTicketController.unstarTicket);

module.exports = router;
