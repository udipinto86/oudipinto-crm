const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    company: {
        name: {
            type: String,
            default: 'אודי פינטו - סוכנות לביטוח'
        },
        contact: {
            email: {
                type: String,
                default: 'pintoudi@gmail.com'
            },
            phone: String,
            address: {
                street: String,
                city: String,
                zipCode: String
            }
        }
    },
    notifications: {
        email: {
            enabled: {
                type: Boolean,
                default: true
            },
            dailyReport: {
                type: Boolean,
                default: true,
                time: {
                    type: String,
                    default: '08:00'
                }
            },
            policyExpiry: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                daysBeforeExpiry: {
                    type: Number,
                    default: 30
                }
            },
            birthdays: {
                type: Boolean,
                default: true
            }
        }
    },
    backup: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'daily'
        },
        time: {
            type: String,
            default: '02:00'
        },
        retentionDays: {
            type: Number,
            default: 30
        }
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;