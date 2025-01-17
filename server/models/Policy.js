const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    // פרטי פוליסה בסיסיים
    policyNumber: {
        type: String,
        required: [true, 'מספר פוליסה הוא שדה חובה'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[A-Za-z0-9-]{5,20}$/.test(v);
            },
            message: 'מספר פוליסה לא תקין'
        }
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'לקוח הוא שדה חובה']
    },
    type: {
        type: String,
        required: [true, 'סוג פוליסה הוא שדה חובה'],
        enum: {
            values: [
                'car_mandatory',
                'car_comprehensive',
                'health',
                'life',
                'pension',
                'home',
                'business',
                'longterm_care'
            ],
            message: 'סוג פוליסה {VALUE} אינו תקין'
        }
    },

    // פרטי חברת ביטוח
    company: {
        type: String,
        required: [true, 'חברת ביטוח היא שדה חובה'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'מחלקה היא שדה חובה'],
        enum: ['elementary', 'pension', 'health'],
        default: 'elementary'
    },
    agentNumber: String,

    // תאריכים
    startDate: {
        type: Date,
        required: [true, 'תאריך התחלה הוא שדה חובה']
    },
    endDate: {
        type: Date,
        required: [true, 'תאריך סיום הוא שדה חובה'],
        validate: {
            validator: function(v) {
                return v > this.startDate;
            },
            message: 'תאריך סיום חייב להיות אחרי תאריך התחלה'
        }
    },
    renewalDate: Date,

    // פרטי תשלום
    price: {
        amount: {
            type: Number,
            required: [true, 'סכום פרמיה הוא שדה חובה'],
            min: [0, 'סכום פרמיה חייב להיות חיובי']
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
        },
        paymentMethod: {
            type: String,
            enum: ['credit_card', 'bank_transfer', 'check', 'cash'],
            default: 'credit_card'
        }
    },
    
    // פרטי עמלה
    commission: {
        percentage: {
            type: Number,
            min: 0,
            max: 100
        },
        amount: Number,
        paymentDate: Date
    },

    // סטטוס
    status: {
        type: String,
        enum: ['active', 'pending', 'cancelled', 'expired'],
        default: 'active'
    },
    cancellationReason: {
        type: String,
        trim: true
    },

    // מסמכים מקושרים
    documents: [{
        type: {
            type: String,
            enum: ['policy', 'invoice', 'id', 'other']
        },
        name: String,
        path: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],

    // הערות
    notes: [{
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

    // תזכורות
    reminders: [{
        type: {
            type: String,
            enum: ['renewal', 'payment', 'document', 'other']
        },
        date: Date,
        message: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    // פרטי מערכת
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// אינדקסים
policySchema.index({ policyNumber: 1, customerId: 1 });
policySchema.index({ endDate: 1, status: 1 });
policySchema.index({ 'commission.paymentDate': 1 });

// וירטואלים
policySchema.virtual('isExpired').get(function() {
    return this.endDate < new Date();
});

policySchema.virtual('daysUntilExpiry').get(function() {
    return Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
});

// מידלווארים
policySchema.pre('save', async function(next) {
    if (this.isModified('endDate') && this.endDate < new Date()) {
        this.status = 'expired';
    }
    next();
});

// מתודות סטטיות
policySchema.statics.findExpiring = function(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    return this.find({
        status: 'active',
        endDate: {
            $gte: new Date(),
            $lte: date
        }
    });
};

// מתודות של המסמך
policySchema.methods.calculateMonthlyPayment = function() {
    const { amount, paymentFrequency } = this.price;
    
    switch (paymentFrequency) {
        case 'monthly':
            return amount;
        case 'quarterly':
            return amount / 3;
        case 'annual':
            return amount / 12;
        default:
            return amount;
    }
};

policySchema.methods.addNote = async function(content, userId) {
    this.notes.push({
        content,
        createdBy: userId
    });
    return this.save();
};

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;