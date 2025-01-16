require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// ייבוא מודלים
const Customer = require('./models/Customer');
const Policy = require('./models/Policy');
const Alert = require('./models/Alert');
const Setting = require('./models/Setting');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// חיבור למסד נתונים
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('MongoDB error:', err));

// נתיבים
app.use('/api', require('./routes/routes'));

// Serve static files
app.use(express.static(path.join(__dirname, '../client/public')));

// כל הבקשות שלא מתאימות לנתיבים הקודמים יקבלו את דף ה-index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

const port = process.env.PORT || 5008;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;