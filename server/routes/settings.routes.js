const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const Setting = require('../models/Setting');

// קבלת כל ההגדרות
router.get('/', auth, checkPermission('settings', 'view'), async (req, res) => {
    try {
        const settings = await Setting.findOne()
            .populate('lastModifiedBy', 'name');
        
        if (!settings) {
            // אם אין הגדרות, יצירת הגדרות ברירת מחדל
            const defaultSettings = new Setting({
                lastModifiedBy: req.user._id
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
                lastModifiedBy: req.user._id
            });
            await newSettings.save();
            return res.json(newSettings);
        }

        const updatedSettings = await Setting.findOneAndUpdate(
            {},
            {
                ...req.body,
                lastModifiedBy: req.user._id
            },
            { new: true, runValidators: true }
        );

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
        settings.lastModifiedBy = req.user._id;
        await settings.save();

        res.json(settings);
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
        settings.lastModifiedBy = req.user._id;
        await settings.save();

        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// קבלת היסטוריית שינויים
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