const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const Alert = require('../models/Alert');

// קבלת כל ההתראות
router.get('/', auth, async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate('relatedTo.customer', 'name idNumber')
            .populate('relatedTo.policy', 'policyNumber')
            .populate('createdBy', 'name')
            .sort('-createdAt');
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת התראה לפי מזהה
router.get('/:id', auth, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('relatedTo.customer', 'name idNumber')
            .populate('relatedTo.policy', 'policyNumber')
            .populate('createdBy', 'name');

        if (!alert) {
            return res.status(404).json({ message: 'התראה לא נמצאה' });
        }

        res.json(alert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// יצירת התראה חדשה
router.post('/', auth, async (req, res) => {
    try {
        const alert = new Alert({
            ...req.body,
            createdBy: req.user._id
        });
        await alert.save();
        res.status(201).json(alert);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// עדכון סטטוס התראה
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                lastUpdatedBy: req.user._id 
            },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ message: 'התראה לא נמצאה' });
        }

        res.json(alert);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// מחיקת התראה
router.delete('/:id', auth, async (req, res) => {
    try {
        const alert = await Alert.findByIdAndDelete(req.params.id);
        
        if (!alert) {
            return res.status(404).json({ message: 'התראה לא נמצאה' });
        }

        res.json({ message: 'התראה נמחקה בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת התראות לפי לקוח
router.get('/customer/:customerId', auth, async (req, res) => {
    try {
        const alerts = await Alert.find({
            'relatedTo.customer': req.params.customerId
        })
        .populate('relatedTo.policy', 'policyNumber')
        .sort('-createdAt');
        
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// סימון כל ההתראות כנקראו
router.post('/mark-all-read', auth, async (req, res) => {
    try {
        await Alert.updateMany(
            { status: 'pending' },
            { 
                status: 'handled',
                lastUpdatedBy: req.user._id
            }
        );
        
        res.json({ message: 'כל ההתראות סומנו כנקראו' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;