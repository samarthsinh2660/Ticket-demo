const express = require('express');
const ticketController = require('../controllers/ticketController');
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

module.exports = router;
