const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    // פרטי התראה בסיסיים
    type: {
        type: String,
        required: [true, 'סוג התראה הוא שדה חובה'],
        enum: {
            values: [
                'policy_expiring',
                'policy_renewal',
                'customer_birthday',
                'payment_due',
                'commission_payment',
                'document_expiring',
                'task_reminder'
            ],
            message: 'סוג התראה {VALUE} אינו תקין'
        }
    },
    title: {
        type: String,
        required: [true, 'כותרת היא שדה חובה'],
        trim: true,
        minlength: [3, 'כותרת חייבת להכיל לפחות 3 תווים'],
        maxlength: [100, 'כותרת יכולה להכיל עד 100 תווים']
    },
    message: {
        type: String,
        required: [true, 'תוכן הוא שדה חובה'],
        trim: true,
        minlength: [10, 'תוכן חייב להכיל לפחות 10 תווים'],
        maxlength: [500, 'תוכן יכול להכיל עד 500 תווים']
    },

    // דחיפות ומועדים
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: {
        type: Date,
        required: [true, 'תאריך יעד הוא שדה חובה'],
        validate: {
            validator: function(v) {
                return v >= new Date();
            },
            message: 'תאריך יעד חייב להיות בעתיד'
        }
    },

    // קישור לישויות
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

    // סטטוס
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'handled', 'ignored'],
        default: 'pending'
    },
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    handledAt: Date,

    // הערות טיפול
    comments: [{
        content: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // הגדרות התראה
    notifications: {
        email: {
            sent: {
                type: Boolean,
                default: false
            },
            sentAt: Date
        },
        sms: {
            sent: {
                type: Boolean,
                default: false
            },
            sentAt: Date
        }
    },

    // פרטי מערכת
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// אינדקסים
alertSchema.index({ status: 1, dueDate: 1 });
alertSchema.index({ 'relatedTo.customer': 1, 'relatedTo.policy': 1 });
alertSchema.index({ type: 1, priority: 1 });

// וירטואלים
alertSchema.virtual('isOverdue').get(function() {
    return this.status === 'pending' && this.dueDate < new Date();
});

alertSchema.virtual('daysUntilDue').get(function() {
    return Math.ceil((this.dueDate - new Date()) / (1000 * 60 * 60 * 24));
});

// מתודות סטטיות
alertSchema.statics.findPending = function() {
    return this.find({ 
        status: 'pending',
        dueDate: { $gte: new Date() }
    }).sort('dueDate');
};

alertSchema.statics.findOverdue = function() {
    return this.find({
        status: 'pending',
        dueDate: { $lt: new Date() }
    }).sort('dueDate');
};

// מתודות של המסמך
alertSchema.methods.markAsHandled = async function(userId) {
    this.status = 'handled';
    this.handledBy = userId;
    this.handledAt = new Date();
    return this.save();
};

alertSchema.methods.addComment = async function(content, userId) {
    this.comments.push({
        content,
        createdBy: userId
    });
    return this.save();
};

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;