const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    // פרטי המשתמש שביצע את הפעולה
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // פרטי הפעולה
    action: {
        type: String,
        required: [true, 'סוג פעולה הוא שדה חובה'],
        enum: ['POST', 'PUT', 'DELETE', 'PATCH', 'LOGIN', 'LOGOUT']
    },

    // המודול שבו בוצעה הפעולה
    module: {
        type: String,
        required: [true, 'מודול הוא שדה חובה'],
        enum: ['customers', 'policies', 'alerts', 'settings', 'auth']
    },

    // פרטי הפעולה
    details: {
        url: String,
        method: String,
        body: Object,
        params: Object,
        statusCode: Number
    },

    // מידע טכני
    ipAddress: String,
    userAgent: String,
    
    // פרטי מערכת
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// אינדקסים
activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ module: 1, action: 1 });

// וירטואלים
activitySchema.virtual('formattedTimestamp').get(function() {
    return new Date(this.timestamp).toLocaleString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
});

// מתודות סטטיות
activitySchema.statics.findByUser = function(userId, limit = 50) {
    return this.find({ user: userId })
        .sort('-timestamp')
        .limit(limit)
        .populate('user', 'name');
};

activitySchema.statics.findByModule = function(module, limit = 50) {
    return this.find({ module })
        .sort('-timestamp')
        .limit(limit)
        .populate('user', 'name');
};

activitySchema.statics.findRecentActivities = function(limit = 50) {
    return this.find()
        .sort('-timestamp')
        .limit(limit)
        .populate('user', 'name');
};

// מתודות מסמך
activitySchema.methods.toAuditLog = function() {
    return {
        user: this.user.name,
        action: this.action,
        module: this.module,
        timestamp: this.formattedTimestamp,
        details: this.details
    };
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;