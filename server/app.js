const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { logger, requestLogger, activityLogger, errorLogger } = require('./middleware/logger');
const connectDB = require('./config/db.config');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(xss());

// Request Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
app.use(requestLogger);
app.use(activityLogger);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/policies', require('./routes/policy.routes'));
app.use('/api/alerts', require('./routes/alert.routes'));
app.use('/api/settings', require('./routes/setting.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Error Handling
app.use(errorLogger);
app.use((err, req, res, next) => {
    logger.error(err.stack);
    
    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
            ? 'שגיאת שרת פנימית'
            : err.message
    });
});

module.exports = app;