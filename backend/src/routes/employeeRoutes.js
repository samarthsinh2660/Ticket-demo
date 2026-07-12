const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect, restrictTo } = require('../middlewares/auth');
const validateParams = require('../middlewares/validateParams');

const router = express.Router();

// Ensure all routes are protected and restricted to ADMIN role
router.use(protect);
router.use(restrictTo('ADMIN'));

router
  .route('/')
  .get(employeeController.getAll)
  .post(employeeController.create);

router
  .route('/:id')
  .get(validateParams('id'), employeeController.getOne)
  .patch(validateParams('id'), employeeController.update)
  .delete(validateParams('id'), employeeController.delete);

module.exports = router;
