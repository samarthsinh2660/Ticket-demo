const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRouter = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');

const app = express();
const PORT = process.env.PORT || 5000;

// Standard middleware
const allowedOrigins = [
  'https://ticket-demo-git-ticket-system-samarth-valas-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
}));
app.use(express.json());

// Main application API routing
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Ticket Management System Backend is running.' });
});

// Catch-all for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
