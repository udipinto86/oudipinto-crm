const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// הגדרת Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 דקות
    max: 100, // מקסימום 100 בקשות לחלון זמן
    message: {
        message: 'יותר מדי בקשות מכתובת IP זו. נסה שוב מאוחר יותר.'
    }
});

// הגדרת הגנות אבטחה בסיסיות
const basicSecurity = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

// מידלוור לבדיקת סוג תוכן
const contentTypeCheck = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (!req.is('application/json')) {
            return res.status(415).json({ 
                message: 'Content-Type חייב להיות application/json' 
            });
        }
    }
    next();
};

// מידלוור לבדיקת גודל בקשה
const payloadSizeCheck = (req, res, next) => {
    const contentLength = parseInt(req.get('content-length', 0));
    if (contentLength > 1024 * 1024) { // 1MB
        return res.status(413).json({ 
            message: 'גודל הבקשה חורג מהמותר' 
        });
    }
    next();
};

// מידלוור לבדיקת Origin
const originCheck = (req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'https://oudipinto-crm.com',
        'https://api.oudipinto-crm.com'
    ];

    const origin = req.get('origin');
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ 
            message: 'Origin לא מורשה' 
        });
    }
    next();
};

// מידלוור להגנה מפני SQL Injection
const sqlInjectionProtection = (req, res, next) => {
    const sqlPattern = /(\b(select|insert|update|delete|drop|union|exec|execute)\b)|(['"])/i;
    
    const checkValue = (value) => {
        if (typeof value === 'string' && sqlPattern.test(value)) {
            return true;
        }
        return false;
    };

    const checkObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                if (checkObject(obj[key])) return true;
            } else if (checkValue(obj[key])) {
                return true;
            }
        }
        return false;
    };

    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
        return res.status(403).json({ 
            message: 'זוהה ניסיון SQL Injection' 
        });
    }

    next();
};

// מידלוור לטיפול בטוקנים פגים
const tokenExpirationCheck = (error, req, res, next) => {
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            message: 'הטוקן פג תוקף, נא להתחבר מחדש' 
        });
    }
    next(error);
};

module.exports = {
    limiter,
    basicSecurity,
    contentTypeCheck,
    payloadSizeCheck,
    originCheck,
    sqlInjectionProtection,
    tokenExpirationCheck,
    mongoSanitize: mongoSanitize(),
    xssProtection: xss()
};