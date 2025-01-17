require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const policyRoutes = require('./routes/policy.routes');
const alertRoutes = require('./routes/alert.routes');
const settingRoutes = require('./routes/setting.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// הגדרות Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// חיבור למסד נתונים
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB!');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// הגדרת נתיבי API
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// שירות קבצים סטטיים
app.use(express.static(path.join(__dirname, '../client/public')));

// כל הבקשות שלא מתאימות לנתיבים הקודמים יקבלו את דף ה-index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// טיפול בשגיאות
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'שגיאת שרת פנימית',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// התחלת השרת
const port = process.env.PORT || 5008;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;