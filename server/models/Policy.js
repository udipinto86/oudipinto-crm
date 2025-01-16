const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    policyNumber: {
        type: String,
        required: [true, 'מספר פוליסה הוא שדה חובה'],
        unique: true,
        trim: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'לקוח הוא שדה חובה']
    },
    type: {
        type: String,
        required: [true, 'סוג פוליסה הוא שדה חובה'],
        enum: [
            'car_mandatory',     // ביטוח חובה
            'car_comprehensive', // ביטוח מקיף
            'health',           // ביטוח בריאות
            'life',            // ביטוח חיים
            'pension',         // פנסיה
            'home',            // ביטוח דירה
            'business',        // ביטוח עסק
            'longterm_care'    // ביטוח סיעודי
        ]
    },
    department: {
        type: String,
        required: [true, 'מחלקה היא שדה חובה'],
        enum: ['elementary', 'pension', 'health'],
        default: 'elementary'
    },
    company: {
        type: String,
        required: [true, 'חברת ביטוח היא שדה חובה'],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'תאריך התחלה הוא שדה חובה']
    },
    endDate: {
        type: Date,
        required: [true, 'תאריך סיום הוא שדה חובה']
    },
    price: {
        amount: {
            type: Number,
            required: [true, 'סכום פרמיה הוא שדה חובה'],
            min: 0
        },
        currency: {
            type: String,
            enum: ['ILS', 'USD', 'EUR'],
            default: 'ILS'
        },
        paymentFrequency: {
            type: String,
            enum: ['monthly', 'quarterly', 'annual'],
            default: 'monthly'
        }
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'cancelled', 'expired'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;