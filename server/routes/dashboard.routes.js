const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Customer = require('../models/Customer');
const Policy = require('../models/Policy');
const Alert = require('../models/Alert');
const moment = require('moment');

// קבלת סטטיסטיקות כלליות
router.get('/stats', auth, async (req, res) => {
    try {
        // סטטיסטיקות לקוחות
        const totalCustomers = await Customer.countDocuments();
        const newCustomersThisMonth = await Customer.countDocuments({
            createdAt: { 
                $gte: moment().startOf('month').toDate(),
                $lte: moment().endOf('month').toDate()
            }
        });
        const lastMonthCustomers = await Customer.countDocuments({
            createdAt: {
                $gte: moment().subtract(1, 'months').startOf('month').toDate(),
                $lte: moment().subtract(1, 'months').endOf('month').toDate()
            }
        });

        // סטטיסטיקות פוליסות
        const totalPolicies = await Policy.countDocuments({ status: 'active' });
        const newPoliciesThisMonth = await Policy.countDocuments({
            createdAt: {
                $gte: moment().startOf('month').toDate(),
                $lte: moment().endOf('month').toDate()
            },
            status: 'active'
        });
        const lastMonthPolicies = await Policy.countDocuments({
            createdAt: {
                $gte: moment().subtract(1, 'months').startOf('month').toDate(),
                $lte: moment().subtract(1, 'months').endOf('month').toDate()
            },
            status: 'active'
        });

        // סטטיסטיקות התראות
        const activeAlerts = await Alert.countDocuments({ status: 'pending' });
        const lastMonthAlerts = await Alert.countDocuments({
            createdAt: {
                $gte: moment().subtract(1, 'months').startOf('month').toDate(),
                $lte: moment().subtract(1, 'months').endOf('month').toDate()
            }
        });

        // חישוב הכנסות
        const currentMonthPolicies = await Policy.find({
            status: 'active',
            startDate: {
                $lte: new Date()
            },
            endDate: {
                $gte: new Date()
            }
        });

        let monthlyRevenue = currentMonthPolicies.reduce((sum, policy) => {
            if (policy.price.paymentFrequency === 'monthly') {
                return sum + policy.price.amount;
            } else if (policy.price.paymentFrequency === 'annual') {
                return sum + (policy.price.amount / 12);
            } else if (policy.price.paymentFrequency === 'quarterly') {
                return sum + (policy.price.amount / 3);
            }
            return sum;
        }, 0);

        // חישוב מגמות
        const customersTrend = lastMonthCustomers ? 
            ((newCustomersThisMonth - lastMonthCustomers) / lastMonthCustomers * 100).toFixed(1) : 0;
        const policiesTrend = lastMonthPolicies ? 
            ((newPoliciesThisMonth - lastMonthPolicies) / lastMonthPolicies * 100).toFixed(1) : 0;
        const alertsTrend = lastMonthAlerts ? 
            ((activeAlerts - lastMonthAlerts) / lastMonthAlerts * 100).toFixed(1) : 0;

        res.json({
            customers: {
                total: totalCustomers,
                new: newCustomersThisMonth,
                trend: parseFloat(customersTrend)
            },
            policies: {
                total: totalPolicies,
                new: newPoliciesThisMonth,
                trend: parseFloat(policiesTrend)
            },
            alerts: {
                active: activeAlerts,
                trend: parseFloat(alertsTrend)
            },
            revenue: {
                monthly: monthlyRevenue,
                trend: 0  // TODO: להוסיף חישוב מגמת הכנסות
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת נתונים לגרף הכנסות
router.get('/revenue-chart', auth, async (req, res) => {
    try {
        const months = Array.from({ length: 12 }, (_, i) => {
            return moment().subtract(11 - i, 'months').format('YYYY-MM');
        });

        const revenueData = await Promise.all(months.map(async (month) => {
            const startOfMonth = moment(month).startOf('month');
            const endOfMonth = moment(month).endOf('month');

            const policies = await Policy.find({
                status: 'active',
                startDate: { $lte: endOfMonth.toDate() },
                endDate: { $gte: startOfMonth.toDate() }
            });

            const revenue = policies.reduce((sum, policy) => {
                if (policy.price.paymentFrequency === 'monthly') {
                    return sum + policy.price.amount;
                } else if (policy.price.paymentFrequency === 'annual') {
                    return sum + (policy.price.amount / 12);
                } else if (policy.price.paymentFrequency === 'quarterly') {
                    return sum + (policy.price.amount / 3);
                }
                return sum;
            }, 0);

            return {
                month: startOfMonth.format('MM/YYYY'),
                revenue
            };
        }));

        res.json({
            labels: revenueData.map(data => data.month),
            values: revenueData.map(data => data.revenue)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת נתונים לגרף התפלגות פוליסות
router.get('/policies-chart', auth, async (req, res) => {
    try {
        const policiesByType = await Policy.aggregate([
            {
                $match: { status: 'active' }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const typeNames = {
            car_mandatory: 'ביטוח חובה',
            car_comprehensive: 'ביטוח מקיף',
            health: 'ביטוח בריאות',
            life: 'ביטוח חיים',
            pension: 'פנסיה',
            home: 'ביטוח דירה',
            business: 'ביטוח עסק',
            longterm_care: 'ביטוח סיעודי'
        };

        res.json({
            labels: policiesByType.map(type => typeNames[type._id] || type._id),
            values: policiesByType.map(type => type.count)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// קבלת התפלגות לקוחות לפי ערים
router.get('/customer-distribution', auth, async (req, res) => {
    try {
        const customersByCity = await Customer.aggregate([
            {
                $group: {
                    _id: '$address.city',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            labels: customersByCity.map(city => city._id),
            values: customersByCity.map(city => city.count)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;