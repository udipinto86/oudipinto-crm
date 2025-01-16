const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'סוג התראה הוא שדה חובה'],
        enum: [
            'policy_expiring',      // פוליסה מסתיימת
            'policy_renewal',       // חידוש פוליסה
            'customer_birthday',    // יום הולדת לקוח
            'payment_due',          // תשלום צפוי
            'commission_payment',   // תשלום עמלה
            'document_expiring',    // מסמך מסתיים
            'task_reminder'         // תזכורת משימה
        ]
    },
    title: {
        type: String,
        required: [true, 'כותרת היא שדה חובה'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'תוכן ההתראה הוא שדה חובה'],
        trim: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'handled', 'ignored'],
        default: 'pending'
    },
    dueDate: {
        type: Date,
        required: true
    },
    relatedTo: {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        policy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Policy'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;