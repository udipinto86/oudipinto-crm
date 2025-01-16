const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const Policy = require('../models/Policy');

// קבלת כל הפוליסות
router.get('/', auth, checkPermission('policies', 'view'), async (req, res) => {
    try {
        const policies = await Policy.find()
            .populate('customerId', 'name idNumber phone email')
            .populate('createdBy', 'name')
            .sort('-startDate');
        res.json(policies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת פוליסה לפי מזהה
router.get('/:id', auth, checkPermission('policies', 'view'), async (req, res) => {
    try {
        const policy = await Policy.findById(req.params.id)
            .populate('customerId', 'name idNumber phone email')
            .populate('createdBy', 'name');
        
        if (!policy) {
            return res.status(404).json({ message: 'פוליסה לא נמצאה' });
        }
        
        res.json(policy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// הוספת פוליסה חדשה
router.post('/', auth, checkPermission('policies', 'create'), async (req, res) => {
    try {
        const policy = new Policy({
            ...req.body,
            createdBy: req.user._id
        });
        await policy.save();
        res.status(201).json(policy);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// עדכון פוליסה
router.put('/:id', auth, checkPermission('policies', 'edit'), async (req, res) => {
    try {
        const policy = await Policy.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                lastUpdatedBy: req.user._id
            },
            { new: true, runValidators: true }
        );

        if (!policy) {
            return res.status(404).json({ message: 'פוליסה לא נמצאה' });
        }

        res.json(policy);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// מחיקת פוליסה
router.delete('/:id', auth, checkPermission('policies', 'delete'), async (req, res) => {
    try {
        const policy = await Policy.findByIdAndDelete(req.params.id);
        
        if (!policy) {
            return res.status(404).json({ message: 'פוליסה לא נמצאה' });
        }

        res.json({ message: 'פוליסה נמחקה בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת פוליסות לפי לקוח
router.get('/customer/:customerId', auth, checkPermission('policies', 'view'), async (req, res) => {
    try {
        const policies = await Policy.find({ customerId: req.params.customerId })
            .populate('customerId', 'name idNumber phone email')
            .populate('createdBy', 'name')
            .sort('-startDate');
        res.json(policies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// פוליסות שעומדות להסתיים
router.get('/expiring/:days', auth, checkPermission('policies', 'view'), async (req, res) => {
    try {
        const days = parseInt(req.params.days);
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        const policies = await Policy.find({
            endDate: {
                $gte: today,
                $lte: futureDate
            },
            status: 'active'
        })
        .populate('customerId', 'name idNumber phone email')
        .sort('endDate');

        res.json(policies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;