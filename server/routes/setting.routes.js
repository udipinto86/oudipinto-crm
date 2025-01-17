const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const Setting = require('../models/Setting');

// קבלת הגדרות המערכת
router.get('/', auth, checkPermission('settings', 'view'), async (req, res) => {
    try {
        const settings = await Setting.findOne()
            .populate('lastModifiedBy', 'name');
        
        if (!settings) {
            // אם אין הגדרות, יצירת הגדרות ברירת מחדל
            const defaultSettings = new Setting({
                company: {
                    name: 'אודי פינטו - סוכנות לביטוח',
                    contact: {
                        email: 'pintoudi@gmail.com'
                    }
                },
                lastModifiedBy: req.user.userId
            });
            await defaultSettings.save();
            return res.json(defaultSettings);
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// עדכון הגדרות
router.put('/', auth, checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const settings = await Setting.findOne();
        
        if (!settings) {
            const newSettings = new Setting({
                ...req.body,
                lastModifiedBy: req.user.userId
            });
            await newSettings.save();
            return res.json(newSettings);
        }

        Object.assign(settings, req.body);
        settings.lastModifiedBy = req.user.userId;
        await settings.save();

        const updatedSettings = await Setting.findOne()
            .populate('lastModifiedBy', 'name');

        res.json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// עדכון הגדרות התראות
router.patch('/notifications', auth, checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const settings = await Setting.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'הגדרות לא נמצאו' });
        }

        settings.notifications = {
            ...settings.notifications,
            ...req.body
        };
        settings.lastModifiedBy = req.user.userId;
        await settings.save();

        const updatedSettings = await Setting.findOne()
            .populate('lastModifiedBy', 'name');

        res.json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// עדכון הגדרות גיבוי
router.patch('/backup', auth, checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const settings = await Setting.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'הגדרות לא נמצאו' });
        }

        settings.backup = {
            ...settings.backup,
            ...req.body
        };
        settings.lastModifiedBy = req.user.userId;
        await settings.save();

        const updatedSettings = await Setting.findOne()
            .populate('lastModifiedBy', 'name');

        res.json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ייצוא הגדרות
router.get('/export', auth, checkPermission('settings', 'view'), async (req, res) => {
    try {
        const settings = await Setting.findOne()
            .populate('lastModifiedBy', 'name')
            .select('-_id -__v');

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// בדיקת היסטוריית שינויים
router.get('/history', auth, checkPermission('settings', 'view'), async (req, res) => {
    try {
        const settings = await Setting.findOne()
            .populate('lastModifiedBy', 'name')
            .select('updatedAt lastModifiedBy');
        
        res.json({
            lastModified: settings ? settings.updatedAt : null,
            modifiedBy: settings ? settings.lastModifiedBy : null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;