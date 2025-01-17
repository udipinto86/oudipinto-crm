const winston = require('winston');
const Activity = require('../models/Activity');

// הגדרת פורמט הלוג
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // לוג לקובץ
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// בסביבת פיתוח - הוספת לוג לקונסול
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// מידלוור לוג בקשות
const requestLogger = async (req, res, next) => {
    const start = Date.now();

    // רישום הבקשה
    logger.info({
        type: 'request',
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    // האזנה לסיום הבקשה
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            type: 'response',
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
};

// מידלוור לוג פעילות
const activityLogger = async (req, res, next) => {
    const originalSend = res.send;
    res.send = async function(data) {
        res.send = originalSend;

        try {
            // רישום פעילות רק עבור פעולות שינוי
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                const activity = new Activity({
                    user: req.user?._id,
                    action: req.method,
                    module: req.baseUrl.split('/').pop(),
                    details: {
                        url: req.originalUrl,
                        body: req.body,
                        params: req.params,
                        statusCode: res.statusCode
                    },
                    ipAddress: req.ip
                });
                
                await activity.save();
            }
        } catch (error) {
            logger.error('Error logging activity:', error);
        }

        return res.send(data);
    };

    next();
};

// טיפול בשגיאות
const errorLogger = (err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        user: req.user?._id
    });

    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' 
            ? 'שגיאת שרת פנימית' 
            : err.message
    });
};

module.exports = { 
    logger,
    requestLogger,
    activityLogger,
    errorLogger
};