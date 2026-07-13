const express = require('express');
const attachmentController = require('../controllers/attachmentController');
const { protect } = require('../middlewares/auth');
const validateParams = require('../middlewares/validateParams');

const router = express.Router();

router.use(protect);

router
  .route('/:attachmentId')
  .delete(validateParams('attachmentId'), attachmentController.deleteAttachment);

router.get(
  '/:attachmentId/download',
  validateParams('attachmentId'),
  attachmentController.downloadAttachment
);

module.exports = router;
