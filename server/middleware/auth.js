const jwt = require('jsonwebtoken');
const User = require('../models/User');

// מידלוור אימות
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user || !user.isActive) {
            throw new Error();
        }

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

            // מנהל מערכת מקבל את כל ההרשאות
            if (role === 'admin') {
                return next();
            }

            // הגדרת הרשאות לפי תפקיד
            const permissions = {
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

            // בדיקת הרשאה
            if (!permissions[role] || 
                !permissions[role][module] || 
                !permissions[role][module].includes(action)) {
                return res.status(403).json({ message: 'אין הרשאות מתאימות' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'שגיאה בבדיקת הרשאות' });
        }
    };
};

module.exports = { auth, checkPermission };