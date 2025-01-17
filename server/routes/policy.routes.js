const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const Policy = require('../models/Policy');
const excel = require('excel4node');

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
        // בדיקה אם מספר פוליסה כבר קיים
        const existingPolicy = await Policy.findOne({ policyNumber: req.body.policyNumber });
        if (existingPolicy) {
            return res.status(400).json({ message: 'מספר פוליסה כבר קיים במערכת' });
        }

        const policy = new Policy({
            ...req.body,
            createdBy: req.user.userId
        });

        await policy.save();
        
        // עדכון האובייקט המלא עם פרטי הלקוח
        const populatedPolicy = await Policy.findById(policy._id)
            .populate('customerId', 'name idNumber phone email')
            .populate('createdBy', 'name');

        res.status(201).json(populatedPolicy);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// עדכון פוליסה
router.put('/:id', auth, checkPermission('policies', 'edit'), async (req, res) => {
    try {
        // בדיקה אם מספר פוליסה כבר קיים (לא כולל הפוליסה הנוכחית)
        const existingPolicy = await Policy.findOne({
            policyNumber: req.body.policyNumber,
            _id: { $ne: req.params.id }
        });
        
        if (existingPolicy) {
            return res.status(400).json({ message: 'מספר פוליסה כבר קיים במערכת' });
        }

        const policy = await Policy.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                lastUpdatedBy: req.user.userId
            },
            { new: true, runValidators: true }
        )
        .populate('customerId', 'name idNumber phone email')
        .populate('createdBy', 'name');

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
        const policy = await Policy.findById(req.params.id);
        
        if (!policy) {
            return res.status(404).json({ message: 'פוליסה לא נמצאה' });
        }

        if (policy.status === 'active') {
            return res.status(400).json({ message: 'לא ניתן למחוק פוליסה פעילה' });
        }

        await policy.remove();
        res.json({ message: 'פוליסה נמחקה בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת פוליסות שעומדות להסתיים
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

// קבלת פוליסות לפי לקוח
router.get('/customer/:customerId', auth, checkPermission('policies', 'view'), async (req, res) => {
    try {
        const policies = await Policy.find({ customerId: req.params.customerId })
            .populate('createdBy', 'name')
            .sort('-startDate');
        res.json(policies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ייצוא לאקסל
router.get('/export/excel', auth, checkPermission('policies', 'view'), async (req, res) => {
    try {
        const policies = await Policy.find()
            .populate('customerId', 'name idNumber')
            .populate('createdBy', 'name');

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Policies');

        // הגדרת כותרות
        worksheet.columns = [
            { header: 'מספר פוליסה', key: 'policyNumber', width: 15 },
            { header: 'שם לקוח', key: 'customerName', width: 20 },
            { header: 'ת.ז. לקוח', key: 'customerId', width: 15 },
            { header: 'סוג פוליסה', key: 'type', width: 15 },
            { header: 'חברת ביטוח', key: 'company', width: 20 },
            { header: 'תאריך התחלה', key: 'startDate', width: 15 },
            { header: 'תאריך סיום', key: 'endDate', width: 15 },
            { header: 'סכום', key: 'amount', width: 15 },
            { header: 'סטטוס', key: 'status', width: 10 }
        ];

        // הוספת נתונים
        policies.forEach(policy => {
            worksheet.addRow({
                policyNumber: policy.policyNumber,
                customerName: policy.customerId?.name,
                customerId: policy.customerId?.idNumber,
                type: policy.type,
                company: policy.company,
                startDate: new Date(policy.startDate).toLocaleDateString('he-IL'),
                endDate: new Date(policy.endDate).toLocaleDateString('he-IL'),
                amount: `${policy.price.amount} ${policy.price.currency}`,
                status: policy.status
            });
        });

        // שליחת הקובץ
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=policies.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;