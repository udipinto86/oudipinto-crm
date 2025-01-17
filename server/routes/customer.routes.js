const express = require('express');
const router = express.Router();
const { auth, checkPermission } = require('../middleware/auth');
const Customer = require('../models/Customer');

// קבלת כל הלקוחות
router.get('/', auth, checkPermission('customers', 'view'), async (req, res) => {
    try {
        const customers = await Customer.find()
            .populate('createdBy', 'name')
            .sort('-createdAt');
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת לקוח לפי מזהה
router.get('/:id', auth, checkPermission('customers', 'view'), async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate('createdBy', 'name');
        
        if (!customer) {
            return res.status(404).json({ message: 'לקוח לא נמצא' });
        }
        
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// הוספת לקוח חדש
router.post('/', auth, checkPermission('customers', 'create'), async (req, res) => {
    try {
        // בדיקה אם מספר תעודת זהות כבר קיים
        const existingCustomer = await Customer.findOne({ idNumber: req.body.idNumber });
        if (existingCustomer) {
            return res.status(400).json({ message: 'מספר תעודת זהות כבר קיים במערכת' });
        }

        const customer = new Customer({
            ...req.body,
            createdBy: req.user.userId
        });

        await customer.save();
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// עדכון לקוח
router.put('/:id', auth, checkPermission('customers', 'edit'), async (req, res) => {
    try {
        // בדיקה אם מספר תעודת זהות כבר קיים (לא כולל הלקוח הנוכחי)
        const existingCustomer = await Customer.findOne({
            idNumber: req.body.idNumber,
            _id: { $ne: req.params.id }
        });
        
        if (existingCustomer) {
            return res.status(400).json({ message: 'מספר תעודת זהות כבר קיים במערכת' });
        }

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { 
                ...req.body,
                lastUpdatedBy: req.user.userId 
            },
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'לקוח לא נמצא' });
        }

        res.json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// מחיקת לקוח
router.delete('/:id', auth, checkPermission('customers', 'delete'), async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'לקוח לא נמצא' });
        }

        // בדיקה אם יש פוליסות פעילות ללקוח
        const activePolices = await Policy.find({
            customerId: req.params.id,
            status: 'active'
        });

        if (activePolices.length > 0) {
            return res.status(400).json({ 
                message: 'לא ניתן למחוק לקוח עם פוליסות פעילות' 
            });
        }

        await customer.remove();
        res.json({ message: 'לקוח נמחק בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// חיפוש לקוחות
router.get('/search/:term', auth, checkPermission('customers', 'view'), async (req, res) => {
    try {
        const searchTerm = req.params.term;
        const customers = await Customer.find({
            $or: [
                { name: new RegExp(searchTerm, 'i') },
                { idNumber: new RegExp(searchTerm, 'i') },
                { 'phone.mobile': new RegExp(searchTerm, 'i') },
                { email: new RegExp(searchTerm, 'i') }
            ]
        }).populate('createdBy', 'name');
        
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ייצוא לקוחות לאקסל
router.get('/export/excel', auth, checkPermission('customers', 'view'), async (req, res) => {
    try {
        const customers = await Customer.find()
            .populate('createdBy', 'name')
            .select('-__v');

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Customers');

        // הגדרת כותרות
        worksheet.columns = [
            { header: 'שם', key: 'name', width: 20 },
            { header: 'ת.ז.', key: 'idNumber', width: 15 },
            { header: 'טלפון', key: 'phone', width: 15 },
            { header: 'אימייל', key: 'email', width: 25 },
            { header: 'עיר', key: 'city', width: 15 },
            { header: 'תאריך הצטרפות', key: 'createdAt', width: 20 }
        ];

        // הוספת נתונים
        customers.forEach(customer => {
            worksheet.addRow({
                name: customer.name,
                idNumber: customer.idNumber,
                phone: customer.phone.mobile,
                email: customer.email,
                city: customer.address.city,
                createdAt: new Date(customer.createdAt).toLocaleDateString('he-IL')
            });
        });

        // שליחת הקובץ
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=customers.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;