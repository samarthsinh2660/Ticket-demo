const employeeService = require('../services/employeeService');
const catchAsync = require('../utils/catchAsync');

class EmployeeController {
  /**
   * Fetch all employees with filters.
   */
  getAll = catchAsync(async (req, res, next) => {
    const data = await employeeService.getEmployees(req.query);
    res.status(200).json({
      status: 'success',
      data,
    });
  });

  /**
   * Fetch employee details by ID.
   */
  getOne = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const data = await employeeService.getEmployeeById(id);
    res.status(200).json({
      status: 'success',
      data,
    });
  });

  /**
   * Create a new employee.
   */
  create = catchAsync(async (req, res, next) => {
    const data = await employeeService.createEmployee(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        employee: data,
      },
    });
  });

  /**
   * Update employee details.
   */
  update = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const data = await employeeService.updateEmployee(id, req.body);
    res.status(200).json({
      status: 'success',
      data: {
        employee: data,
      },
    });
  });

  /**
   * Delete an employee.
   */
  delete = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    await employeeService.deleteEmployee(id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

module.exports = new EmployeeController();
