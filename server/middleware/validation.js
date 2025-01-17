// פונקציית עזר לבדיקת תעודת זהות
const validateIdNumber = idNumber => {
    // הסרת מקפים אם קיימים
    idNumber = idNumber.replace(/[-]/g, '');
    
    // בדיקת אורך
    if (!idNumber.match(/^\d{9}$/)) return false;
    
    // אלגוריתם בדיקת ספרת ביקורת
    const digits = Array.from(idNumber).map(Number);
    const checkDigit = digits.pop();
    
    const sum = digits.reduce((acc, digit, i) => {
        const num = digit * ((i % 2) + 1);
        return acc + (num > 9 ? num - 9 : num);
    }, 0);

    return (10 - (sum % 10)) % 10 === checkDigit;
};

// בדיקת תקינות לקוח
const validateCustomer = (req, res, next) => {
    try {
        const { name, idNumber, email, phone } = req.body;

        // בדיקת שדות חובה
        if (!name || !idNumber || !email || !phone.mobile) {
            return res.status(400).json({ message: 'כל שדות החובה חייבים להיות מלאים' });
        }

        // בדיקת תעודת זהות
        if (!validateIdNumber(idNumber)) {
            return res.status(400).json({ message: 'מספר תעודת זהות לא תקין' });
        }

        // בדיקת אימייל
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'כתובת אימייל לא תקינה' });
        }

        // בדיקת טלפון נייד
        const phoneRegex = /^05[0-9]{8}$/;
        if (!phoneRegex.test(phone.mobile)) {
            return res.status(400).json({ message: 'מספר טלפון נייד לא תקין' });
        }

        next();
    } catch (error) {
        res.status(400).json({ message: 'שגיאה בבדיקת נתונים' });
    }
};

// בדיקת תקינות פוליסה
const validatePolicy = (req, res, next) => {
    try {
        const { policyNumber, customerId, type, company, startDate, endDate, price } = req.body;

        // בדיקת שדות חובה
        if (!policyNumber || !customerId || !type || !company || !startDate || !endDate || !price) {
            return res.status(400).json({ message: 'כל שדות החובה חייבים להיות מלאים' });
        }

        // בדיקת מספר פוליסה
        if (!policyNumber.match(/^[A-Za-z0-9-]{5,20}$/)) {
            return res.status(400).json({ message: 'מספר פוליסה לא תקין' });
        }

        // בדיקת תאריכים
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'תאריכים לא תקינים' });
        }

        if (end <= start) {
            return res.status(400).json({ message: 'תאריך סיום חייב להיות אחרי תאריך התחלה' });
        }

        // בדיקת מחיר
        if (price.amount <= 0) {
            return res.status(400).json({ message: 'סכום פרמיה חייב להיות גדול מ-0' });
        }

        next();
    } catch (error) {
        res.status(400).json({ message: 'שגיאה בבדיקת נתונים' });
    }
};

// בדיקת תקינות התראה
const validateAlert = (req, res, next) => {
    try {
        const { type, title, message, priority, dueDate } = req.body;

        // בדיקת שדות חובה
        if (!type || !title || !message || !priority || !dueDate) {
            return res.status(400).json({ message: 'כל שדות החובה חייבים להיות מלאים' });
        }

        // בדיקת אורך כותרת והודעה
        if (title.length < 3 || title.length > 100) {
            return res.status(400).json({ message: 'אורך כותרת חייב להיות בין 3 ל-100 תווים' });
        }

        if (message.length < 10 || message.length > 500) {
            return res.status(400).json({ message: 'אורך הודעה חייב להיות בין 10 ל-500 תווים' });
        }

        // בדיקת תאריך
        const due = new Date(dueDate);
        if (isNaN(due.getTime())) {
            return res.status(400).json({ message: 'תאריך יעד לא תקין' });
        }

        next();
    } catch (error) {
        res.status(400).json({ message: 'שגיאה בבדיקת נתונים' });
    }
};

module.exports = {
    validateCustomer,
    validatePolicy,
    validateAlert
};