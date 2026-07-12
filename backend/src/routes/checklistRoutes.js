const express = require('express');
const checklistController = require('../controllers/checklistController');
const { protect } = require('../middlewares/auth');
const validateParams = require('../middlewares/validateParams');

const router = express.Router();

// Require authentication for all checklist modifications
router.use(protect);

router
  .route('/:id')
  .patch(validateParams('id'), checklistController.updateChecklistItem)
  .delete(validateParams('id'), checklistController.deleteChecklistItem);

module.exports = router;
