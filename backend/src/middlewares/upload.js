const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AppError = require('../utils/appError');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf', '.txt', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return cb(new AppError('Only jpg, jpeg, png, pdf, txt, doc, and docx files are allowed.', 400), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  }
});

module.exports = upload;
