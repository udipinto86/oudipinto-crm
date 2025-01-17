const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// התחברות
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // חיפוש משתמש לפי שם משתמש או אימייל
        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
        }

        // בדיקת סיסמה
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
        }

        // בדיקה שהמשתמש פעיל
        if (!user.isActive) {
            return res.status(403).json({ message: 'חשבון זה אינו פעיל' });
        }

        // יצירת טוקן
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // שליחת תגובה
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

// בדיקת תוקף טוקן
router.get('/validate', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// שחזור סיסמה
router.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;
        
        // חיפוש משתמש
        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        // יצירת טוקן זמני
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // שמירת הטוקן במשתמש
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // שעה מעכשיו
        await user.save();

        // שליחת מייל עם קישור לאיפוס
        // TODO: implement email sending
        
        res.json({ message: 'הוראות לאיפוס סיסמה נשלחו למייל' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// איפוס סיסמה
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;

        // בדיקת תוקף הטוקן
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            _id: decoded.userId,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'טוקן לא תקין או פג תוקף' });
        }

        // הצפנת הסיסמה החדשה
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'הסיסמה שונתה בהצלחה' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;