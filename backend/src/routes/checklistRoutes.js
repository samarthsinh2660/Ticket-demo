const express = require('express');
const checklistController = require('../controllers/checklistController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Require authentication for all checklist modifications
router.use(protect);

router
  .route('/:id')
  .patch(checklistController.updateChecklistItem)
  .delete(checklistController.deleteChecklistItem);

module.exports = router;
