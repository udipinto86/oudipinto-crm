require('dotenv').config();
const app = require('./app');
const { logger } = require('./middleware/logger');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
    logger.error('UNHANDLED REJECTION! Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

const port = process.env.PORT || 5008;
const server = app.listen(port, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});