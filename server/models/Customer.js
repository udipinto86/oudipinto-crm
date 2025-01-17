const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    // פרטים אישיים
    name: {
        type: String,
        required: [true, 'שם לקוח הוא שדה חובה'],
        trim: true,
        minlength: [2, 'שם חייב להכיל לפחות 2 תווים'],
        maxlength: [50, 'שם יכול להכיל עד 50 תווים']
    },
    idNumber: {
        type: String,
        required: [true, 'מספר זהות הוא שדה חובה'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{9}$/.test(v);
            },
            message: 'מספר זהות חייב להכיל 9 ספרות'
        }
    },
    birthDate: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },

    // פרטי קשר
    phone: {
        mobile: {
            type: String,
            required: [true, 'מספר טלפון נייד הוא שדה חובה'],
            validate: {
                validator: function(v) {
                    return /^05\d{8}$/.test(v);
                },
                message: 'מספר טלפון נייד לא תקין'
            }
        },
        home: String,
        work: String
    },
    email: {
        type: String,
        required: [true, 'אימייל הוא שדה חובה'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            'נא להזין כתובת אימייל תקינה'
        ]
    },

    // כתובת
    address: {
        street: String,
        city: {
            type: String,
            required: [true, 'עיר היא שדה חובה']
        },
        zipCode: String,
        country: {
            type: String,
            default: 'ישראל'
        }
    },

    // פרטים נוספים
    occupation: String,
    familyStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed']
    },
    notes: {
        type: String,
        maxlength: [1000, 'הערות יכולות להכיל עד 1000 תווים']
    },

    // תגיות לסיווג הלקוח
    tags: [{
        type: String,
        trim: true
    }],

    // סטטוס לקוח
    status: {
        type: String,
        enum: ['active', 'inactive', 'lead', 'lost'],
        default: 'active'
    },

    // מקור הגעה
    source: {
        type: String,
        enum: ['referral', 'website', 'social', 'advertising', 'other']
    },

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
customerSchema.index({ name: 'text', idNumber: 1, 'phone.mobile': 1, email: 1 });

// וירטואלים
customerSchema.virtual('policies', {
    ref: 'Policy',
    localField: '_id',
    foreignField: 'customerId'
});

// מידלווארים
customerSchema.pre('save', async function(next) {
    // טיפול בתבנית טלפון
    if (this.phone.mobile) {
        this.phone.mobile = this.phone.mobile.replace(/\D/g, '');
    }
    
    next();
});

// מתודות סטטיות
customerSchema.statics.findByIdNumber = function(idNumber) {
    return this.findOne({ idNumber });
};

// מתודות של המסמך
customerSchema.methods.getFullAddress = function() {
    const { street, city, zipCode, country } = this.address;
    return `${street || ''}, ${city}${zipCode ? ` ${zipCode}` : ''}, ${country}`;
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;