const express = require('express');
const authRoutes = require('./authRoutes');
const ticketRoutes = require('./ticketRoutes');
const userRoutes = require('./userRoutes');
const employeeRoutes = require('./employeeRoutes');
const checklistRoutes = require('./checklistRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/checklist', checklistRoutes);

module.exports = router;
