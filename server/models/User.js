const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'שם משתמש הוא שדה חובה'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'שם משתמש חייב להכיל לפחות 3 תווים'],
        maxlength: [20, 'שם משתמש יכול להכיל עד 20 תווים']
    },
    password: {
        type: String,
        required: [true, 'סיסמה היא שדה חובה'],
        minlength: [6, 'סיסמה חייבת להכיל לפחות 6 תווים'],
        select: false // לא מחזיר את הסיסמה בשאילתות
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
    name: {
        type: String,
        required: [true, 'שם מלא הוא שדה חובה'],
        trim: true,
        minlength: [2, 'שם מלא חייב להכיל לפחות 2 תווים'],
        maxlength: [50, 'שם מלא יכול להכיל עד 50 תווים']
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'manager', 'agent'],
            message: 'תפקיד {VALUE} אינו תקין'
        },
        default: 'agent'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date
}, {
    timestamps: true
});

// הצפנת סיסמה לפני שמירה
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// השוואת סיסמאות
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

// יצירת טוקן JWT
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            userId: this._id,
            role: this.role 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '24h' 
        }
    );
};

// טיפול בניסיונות התחברות כושלים
userSchema.methods.incLoginAttempts = async function() {
    // אם המשתמש נעול ועדיין לא עבר הזמן
    if (this.lockUntil && this.lockUntil > Date.now()) {
        return false;
    }
    
    // איפוס אם עבר הזמן
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.loginAttempts = 1;
        this.lockUntil = undefined;
    } else {
        this.loginAttempts += 1;
    }

    // נעילה אחרי 5 ניסיונות
    if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 3600000; // נעילה לשעה
    }

    await this.save();
    return true;
};

const User = mongoose.model('User', userSchema);

module.exports = User;