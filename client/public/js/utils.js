const utils = {
    // הצגת הודעות למשתמש
    showAlert(message, type = 'info', duration = 3000) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            console.error('Alert container not found');
            return;
        }

        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.role = 'alert';
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertContainer.appendChild(alertElement);

        // הסרה אוטומטית אחרי הזמן שהוגדר
        setTimeout(() => {
            alertElement.remove();
        }, duration);
    },

    // פורמט תאריכים
    formatDate(date, format = 'short') {
        if (!date) return '';
        
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString('he-IL');
        } else if (format === 'long') {
            return d.toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return d.toLocaleDateString('he-IL');
    },

    // פורמט מספרים
    formatNumber(number, style = 'decimal') {
        if (typeof number !== 'number') return '';

        const options = {
            style: style,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };

        if (style === 'currency') {
            options.currency = 'ILS';
        } else if (style === 'percent') {
            options.minimumFractionDigits = 1;
        }

        return number.toLocaleString('he-IL', options);
    },

    // וולידציה של שדות טופס
    validateForm(formElement) {
        const errors = [];
        const requiredFields = formElement.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                errors.push(`שדה ${field.getAttribute('data-label') || field.name} הוא שדה חובה`);
            }
        });

        // בדיקת אימייל
        const emailFields = formElement.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            if (field.value && !this.validateEmail(field.value)) {
                errors.push('כתובת אימייל לא תקינה');
            }
        });

        // בדיקת טלפון
        const phoneFields = formElement.querySelectorAll('input[type="tel"]');
        phoneFields.forEach(field => {
            if (field.value && !this.validatePhone(field.value)) {
                errors.push('מספר טלפון לא תקין');
            }
        });

        return errors;
    },

    // בדיקת תקינות אימייל
    validateEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email.toLowerCase());
    },

    // בדיקת תקינות טלפון
    validatePhone(phone) {
        const re = /^0[2-9]\d{7,8}$/;
        return re.test(phone);
    },

    // בדיקת תקינות תעודת זהות
    validateIdNumber(id) {
        if (!id.match(/^\d{9}$/)) return false;
        
        const digits = Array.from(id).map(Number);
        const checkDigit = digits.pop();
        
        const sum = digits.reduce((acc, digit, i) => {
            const num = digit * ((i % 2) + 1);
            return acc + (num > 9 ? num - 9 : num);
        }, 0);

        return (10 - (sum % 10)) % 10 === checkDigit;
    },

    // קבלת ההבדל בין תאריכים בימים
    dateDiffInDays(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // העתקה ללוח
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('הטקסט הועתק ללוח', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showAlert('שגיאה בהעתקה ללוח', 'error');
        }
    },

    // יצירת CSV מנתונים
    exportToCSV(data, filename) {
        let csvContent = '';
        
        // כותרות
        if (data.length > 0) {
            csvContent += Object.keys(data[0]).join(',') + '\n';
        }

        // נתונים
        data.forEach(item => {
            const row = Object.values(item).map(value => {
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            });
            csvContent += row.join(',') + '\n';
        });

        // הורדה
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // הצגת זמן יחסי
    getRelativeTimeString(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `לפני ${days} ימים`;
        if (hours > 0) return `לפני ${hours} שעות`;
        if (minutes > 0) return `לפני ${minutes} דקות`;
        return 'עכשיו';
    }
};

// ייצוא הפונקציות לשימוש גלובלי
window.utils = utils;