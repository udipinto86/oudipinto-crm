const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const Alert = require('../models/Alert');
const moment = require('moment');

// קבלת כל ההתראות
router.get('/', auth, async (req, res) => {
    try {
        let query = {};

        // בדיקה אם צריך רק התראות לא נקראו
        if (req.query.unread) {
            query.status = 'pending';
        }

        // בדיקת דחיפות
        if (req.query.priority) {
            query.priority = req.query.priority;
        }

        const alerts = await Alert.find(query)
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
            .populate('relatedTo.customer', 'name idNumber phone email')
            .populate('relatedTo.policy', 'policyNumber type company')
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
            createdBy: req.user.userId
        });

        await alert.save();
        
        // Return populated alert
        const populatedAlert = await Alert.findById(alert._id)
            .populate('relatedTo.customer', 'name idNumber')
            .populate('relatedTo.policy', 'policyNumber')
            .populate('createdBy', 'name');

        res.status(201).json(populatedAlert);
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
                handledBy: req.user.userId,
                handledAt: Date.now()
            },
            { new: true }
        )
        .populate('relatedTo.customer', 'name idNumber')
        .populate('relatedTo.policy', 'policyNumber');

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
        const alert = await Alert.findById(req.params.id);
        
        if (!alert) {
            return res.status(404).json({ message: 'התראה לא נמצאה' });
        }

        await alert.remove();
        res.json({ message: 'התראה נמחקה בהצלחה' });
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
                handledBy: req.user.userId,
                handledAt: Date.now()
            }
        );
        
        res.json({ message: 'כל ההתראות סומנו כנקראו' });
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

// יצירת התראות אוטומטיות
router.post('/generate-alerts', auth, async (req, res) => {
    try {
        // התראות על פוליסות שעומדות להסתיים
        const expiringPolicies = await Policy.find({
            endDate: {
                $gte: moment().startOf('day'),
                $lte: moment().add(30, 'days').endOf('day')
            },
            status: 'active'
        }).populate('customerId', 'name');

        for (const policy of expiringPolicies) {
            const daysUntilExpiry = moment(policy.endDate).diff(moment(), 'days');
            
            await Alert.create({
                type: 'policy_expiring',
                title: `פוליסה מסתיימת - ${policy.policyNumber}`,
                message: `הפוליסה של ${policy.customerId.name} מסתיימת בעוד ${daysUntilExpiry} ימים`,
                priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
                dueDate: moment().add(daysUntilExpiry - 7, 'days').toDate(),
                relatedTo: {
                    customer: policy.customerId._id,
                    policy: policy._id
                },
                createdBy: req.user.userId
            });
        }

        res.json({ message: 'התראות אוטומטיות נוצרו בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;