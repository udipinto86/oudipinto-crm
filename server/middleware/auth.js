const jwt = require('jsonwebtoken');
const User = require('../models/User');

// מידלוור אימות
const auth = async (req, res, next) => {
    try {
        // קבלת הטוקן מהכותרת
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('לא נמצא טוקן');
        }

        // אימות הטוקן
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // מציאת המשתמש
        const user = await User.findOne({ 
            _id: decoded.userId,
            isActive: true 
        });

        if (!user) {
            throw new Error('משתמש לא נמצא או לא פעיל');
        }

        // הוספת המשתמש והטוקן לאובייקט הבקשה
        req.token = token;
        req.user = user;
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'נא להתחבר מחדש' });
    }
};

// בדיקת הרשאות
const checkPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const { role } = req.user;

            // הגדרת הרשאות לפי תפקיד
            const permissions = {
                admin: {
                    customers: ['view', 'create', 'edit', 'delete'],
                    policies: ['view', 'create', 'edit', 'delete'],
                    alerts: ['view', 'create', 'edit', 'delete'],
                    settings: ['view', 'edit']
                },
                manager: {
                    customers: ['view', 'create', 'edit'],
                    policies: ['view', 'create', 'edit'],
                    alerts: ['view', 'create', 'edit'],
                    settings: ['view']
                },
                agent: {
                    customers: ['view', 'create'],
                    policies: ['view', 'create'],
                    alerts: ['view', 'create'],
                    settings: ['view']
                }
            };

            // מנהל מערכת מקבל את כל ההרשאות
            if (role === 'admin') {
                return next();
            }

            // בדיקת הרשאה
            if (!permissions[role] || 
                !permissions[role][module] || 
                !permissions[role][module].includes(action)) {
                return res.status(403).json({ 
                    message: 'אין הרשאות מתאימות לביצוע פעולה זו' 
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'שגיאה בבדיקת הרשאות' });
        }
    };
};

// יצירת לוג פעילות
const activityLog = async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = async function(data) {
        res.send = originalSend;
        
        try {
            // יצירת לוג רק לפעולות שינוי
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                const activity = new Activity({
                    user: req.user._id,
                    action: req.method,
                    module: req.baseUrl.split('/').pop(),
                    details: `${req.method} ${req.originalUrl}`,
                    ipAddress: req.ip
                });
                
                await activity.save();
            }
        } catch (error) {
            console.error('Error creating activity log:', error);
        }
        
        return res.send(data);
    };
    
    next();
};

module.exports = { auth, checkPermission, activityLog };