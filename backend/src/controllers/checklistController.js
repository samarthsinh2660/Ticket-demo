const checklistService = require('../services/checklistService');
const catchAsync = require('../utils/catchAsync');

class ChecklistController {
  getChecklist = catchAsync(async (req, res, next) => {
    const items = await checklistService.getChecklist(
      req.user.id,
      req.user.role,
      req.params.ticketId
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        items
      }
    });
  });

  createChecklistItem = catchAsync(async (req, res, next) => {
    const item = await checklistService.addChecklistItem(
      req.user.id,
      req.user.role,
      req.params.ticketId,
      req.body.title
    );

    res.status(201).json({
      status: 'success',
      data: {
        item
      }
    });
  });

  updateChecklistItem = catchAsync(async (req, res, next) => {
    const item = await checklistService.updateChecklistItem(
      req.user.id,
      req.user.role,
      req.params.id,
      req.body
    );

    res.status(200).json({
      status: 'success',
      data: {
        item
      }
    });
  });

  deleteChecklistItem = catchAsync(async (req, res, next) => {
    await checklistService.deleteChecklistItem(
      req.user.id,
      req.user.role,
      req.params.id
    );

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
}

module.exports = new ChecklistController();
