const path = require('path');
const fs = require('fs');
const prisma = require('../database');
const AppError = require('../utils/appError');
const attachmentRepository = require('../repositories/attachmentRepository');
const ticketRepository = require('../repositories/ticketRepository');

class AttachmentService {
  /**
   * Upload an attachment to a ticket
   */
  async uploadAttachment(userId, role, ticketId, file) {
    const tId = parseInt(ticketId, 10);
    if (!file) {
      throw new AppError('No file uploaded.', 400);
    }

    const ticket = await ticketRepository.findUnique({
      where: { id: tId },
    });

    if (!ticket) {
      // Cleanup uploaded file if ticket not found
      this._cleanupFile(file.path);
      throw new AppError('Ticket not found.', 404);
    }

    // Role-based access check
    if (role === 'CUSTOMER' && ticket.customerId !== userId) {
      this._cleanupFile(file.path);
      throw new AppError('You are not authorized to add attachments to this ticket.', 403);
    }
    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      this._cleanupFile(file.path);
      throw new AppError('You are not authorized to add attachments to this ticket.', 403);
    }

    // Wrap in transaction to prevent race conditions exceeding the max file count
    const attachment = await prisma.$transaction(async (tx) => {
      const count = await tx.attachment.count({
        where: { ticketId: tId },
      });

      if (count >= 5) {
        throw new AppError('Maximum of 5 attachments allowed per ticket.', 400);
      }

      const newAttachment = await tx.attachment.create({
        data: {
          ticketId: tId,
          originalFileName: file.originalname,
          storedFileName: file.filename,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedById: userId,
        },
        include: {
          uploadedBy: { select: { id: true, name: true, role: true } },
        },
      });

      // Write audit log atomically
      await tx.activityLog.create({
        data: {
          ticketId: tId,
          userId,
          action: 'Attachment Uploaded',
          details: `Uploaded file: "${file.originalname}"`,
        },
      });

      return newAttachment;
    }).catch((err) => {
      // Cleanup physical file if transaction fails
      this._cleanupFile(file.path);
      throw err;
    });

    return attachment;
  }

  /**
   * Retrieve all attachments for a ticket
   */
  async getAttachments(userId, role, ticketId) {
    const tId = parseInt(ticketId, 10);
    const ticket = await ticketRepository.findUnique({
      where: { id: tId },
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    // Access control check
    if (role === 'CUSTOMER' && ticket.customerId !== userId) {
      throw new AppError('You are not authorized to view attachments for this ticket.', 403);
    }
    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      throw new AppError('You are not authorized to view attachments for this ticket.', 403);
    }

    return await attachmentRepository.findMany({
      where: { ticketId: tId },
      include: {
        uploadedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get attachment details for download
   */
  async getAttachmentForDownload(userId, role, attachmentId) {
    const attId = parseInt(attachmentId, 10);
    const attachment = await attachmentRepository.findUnique({
      where: { id: attId },
      include: {
        ticket: true,
      },
    });

    if (!attachment) {
      throw new AppError('Attachment not found.', 404);
    }

    const ticket = attachment.ticket;

    // Access control check
    if (role === 'CUSTOMER' && ticket.customerId !== userId) {
      throw new AppError('You are not authorized to download this attachment.', 403);
    }
    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      throw new AppError('You are not authorized to download this attachment.', 403);
    }

    const filePath = path.join(__dirname, '../../uploads', attachment.storedFileName);
    if (!fs.existsSync(filePath)) {
      throw new AppError('Physical file not found on server.', 404);
    }

    return {
      filePath,
      originalFileName: attachment.originalFileName,
      mimeType: attachment.mimeType,
    };
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(userId, role, attachmentId) {
    const attId = parseInt(attachmentId, 10);
    const attachment = await attachmentRepository.findUnique({
      where: { id: attId },
      include: {
        ticket: true,
      },
    });

    if (!attachment) {
      throw new AppError('Attachment not found.', 404);
    }

    const ticket = attachment.ticket;

    // Access control checks
    if (role === 'CUSTOMER' && attachment.uploadedById !== userId) {
      throw new AppError('You can only delete attachments uploaded by yourself.', 403);
    }
    if (role === 'EMPLOYEE' && ticket.assigneeId !== userId) {
      throw new AppError('You can only delete attachments on tickets assigned to you.', 403);
    }

    // Atomic database deletion and audit logging
    await prisma.$transaction(async (tx) => {
      await tx.attachment.delete({
        where: { id: attId },
      });

      await tx.activityLog.create({
        data: {
          ticketId: attachment.ticketId,
          userId,
          action: 'Attachment Deleted',
          details: `Deleted file: "${attachment.originalFileName}"`,
        },
      });
    });

    // Delete physical file
    const filePath = path.join(__dirname, '../../uploads', attachment.storedFileName);
    this._cleanupFile(filePath);

    return true;
  }

  /**
   * Helper to safely remove physical file
   */
  _cleanupFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Failed to cleanup file:', filePath, err);
      }
    });
  }
}

module.exports = new AttachmentService();
