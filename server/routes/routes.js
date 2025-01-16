const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Policy = require('../models/Policy');
const Alert = require('../models/Alert');
const Setting = require('../models/Setting');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// נתיבי אימות (Authentication)
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // חיפוש המשתמש לפי שם משתמש או אימייל
        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ]
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'חשבון זה אינו פעיל' });
        }

        // יצירת טוקן
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// נתיבי משתמשים (מוגנים)
router.get('/users', auth, checkPermission('settings', 'view'), async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort('-createdAt');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/users', auth, checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const newUser = new User({
            ...req.body,
            createdBy: req.user._id
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;