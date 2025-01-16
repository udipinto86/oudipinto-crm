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
        const customer = new Customer({
            ...req.body,
            createdBy: req.user._id
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
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { 
                ...req.body,
                lastUpdatedBy: req.user._id 
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
        const customer = await Customer.findByIdAndDelete(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ message: 'לקוח לא נמצא' });
        }

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

module.exports = router;