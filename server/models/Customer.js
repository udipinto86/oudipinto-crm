const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'שם לקוח הוא שדה חובה'],
        trim: true
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
    phone: {
        mobile: {
            type: String,
            required: [true, 'מספר טלפון נייד הוא שדה חובה']
        },
        home: String,
        work: String
    },
    email: {
        type: String,
        required: [true, 'אימייל הוא שדה חובה'],
        trim: true,
        lowercase: true
    },
    address: {
        street: String,
        city: {
            type: String,
            required: [true, 'עיר היא שדה חובה']
        },
        zipCode: String
    },
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;