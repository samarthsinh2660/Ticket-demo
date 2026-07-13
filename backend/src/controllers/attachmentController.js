const attachmentService = require('../services/attachmentService');
const catchAsync = require('../utils/catchAsync');

class AttachmentController {
  uploadAttachment = catchAsync(async (req, res, next) => {
    const attachment = await attachmentService.uploadAttachment(
      req.user.id,
      req.user.role,
      req.params.ticketId,
      req.file
    );

    res.status(201).json({
      status: 'success',
      data: {
        attachment,
      },
    });
  });

  getAttachments = catchAsync(async (req, res, next) => {
    const attachments = await attachmentService.getAttachments(
      req.user.id,
      req.user.role,
      req.params.ticketId
    );

    res.status(200).json({
      status: 'success',
      data: {
        attachments,
      },
    });
  });

  downloadAttachment = catchAsync(async (req, res, next) => {
    const { filePath, originalFileName } = await attachmentService.getAttachmentForDownload(
      req.user.id,
      req.user.role,
      req.params.attachmentId
    );

    res.download(filePath, originalFileName);
  });

  deleteAttachment = catchAsync(async (req, res, next) => {
    await attachmentService.deleteAttachment(
      req.user.id,
      req.user.role,
      req.params.attachmentId
    );

    res.status(200).json({
      status: 'success',
      data: null,
    });
  });
}

module.exports = new AttachmentController();
