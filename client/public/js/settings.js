const settingsManager = {
    init() {
        this.loadSettings();
        this.bindEvents();
    },

    // טעינת הגדרות
    async loadSettings() {
        try {
            const response = await fetch('/api/settings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const settings = await response.json();
            
            this.fillSettingsForm(settings);
            this.updateLastModifiedInfo(settings);
        } catch (error) {
            console.error('Error loading settings:', error);
            showAlert('שגיאה בטעינת הגדרות', 'error');
        }
    },

    // מילוי טופס הגדרות
    fillSettingsForm(settings) {
        const form = document.getElementById('settingsForm');
        
        // הגדרות חברה
        form.elements['companyName'].value = settings.company.name;
        form.elements['email'].value = settings.company.contact.email;
        form.elements['phone'].value = settings.company.contact.phone || '';
        form.elements['street'].value = settings.company.contact.address.street || '';
        form.elements['city'].value = settings.company.contact.address.city || '';
        form.elements['zipCode'].value = settings.company.contact.address.zipCode || '';

        // הגדרות התראות
        form.elements['emailNotifications'].checked = settings.notifications.email.enabled;
        form.elements['dailyReport'].checked = settings.notifications.email.dailyReport.enabled;
        form.elements['dailyReportTime'].value = settings.notifications.email.dailyReport.time;
        form.elements['policyExpiryNotifications'].checked = settings.notifications.email.policyExpiry.enabled;
        form.elements['daysBeforeExpiry'].value = settings.notifications.email.policyExpiry.daysBeforeExpiry;
        form.elements['birthdayNotifications'].checked = settings.notifications.email.birthdays;

        // הגדרות גיבוי
        form.elements['backupFrequency'].value = settings.backup.frequency;
        form.elements['backupTime'].value = settings.backup.time;
        form.elements['retentionDays'].value = settings.backup.retentionDays;
    },

    // עדכון מידע על שינוי אחרון
    updateLastModifiedInfo(settings) {
        const lastModifiedElement = document.getElementById('lastModifiedInfo');
        if (settings.updatedAt && settings.lastModifiedBy) {
            const date = new Date(settings.updatedAt).toLocaleString('he-IL');
            lastModifiedElement.textContent = `עודכן לאחרונה ב-${date} על ידי ${settings.lastModifiedBy.name}`;
        }
    },

    // אירועים
    bindEvents() {
        // שמירת הגדרות
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // טיפול בשינוי הגדרות התראות אימייל
        document.getElementById('emailNotifications').addEventListener('change', (e) => {
            const emailSettings = document.getElementById('emailSettingsSection');
            emailSettings.style.display = e.target.checked ? 'block' : 'none';
        });

        // טיפול בשינוי הגדרות דוח יומי
        document.getElementById('dailyReport').addEventListener('change', (e) => {
            const timeInput = document.getElementById('dailyReportTime');
            timeInput.disabled = !e.target.checked;
        });
    },

    // שמירת הגדרות
    async saveSettings() {
        const form = document.getElementById('settingsForm');
        const formData = new FormData(form);
        
        const settingsData = {
            company: {
                name: formData.get('companyName'),
                contact: {
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    address: {
                        street: formData.get('street'),
                        city: formData.get('city'),
                        zipCode: formData.get('zipCode')
                    }
                }
            },
            notifications: {
                email: {
                    enabled: formData.get('emailNotifications') === 'on',
                    dailyReport: {
                        enabled: formData.get('dailyReport') === 'on',
                        time: formData.get('dailyReportTime')
                    },
                    policyExpiry: {
                        enabled: formData.get('policyExpiryNotifications') === 'on',
                        daysBeforeExpiry: parseInt(formData.get('daysBeforeExpiry'))
                    },
                    birthdays: formData.get('birthdayNotifications') === 'on'
                }
            },
            backup: {
                frequency: formData.get('backupFrequency'),
                time: formData.get('backupTime'),
                retentionDays: parseInt(formData.get('retentionDays'))
            }
        };

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(settingsData)
            });

            if (!response.ok) throw new Error('Server error');

            const updatedSettings = await response.json();
            this.updateLastModifiedInfo(updatedSettings);
            showAlert('הגדרות נשמרו בהצלחה', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showAlert('שגיאה בשמירת הגדרות', 'error');
        }
    },

    // ייצוא הגדרות
    async exportSettings() {
        try {
            const response = await fetch('/api/settings/export', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const settings = await response.json();
            
            const dataStr = JSON.stringify(settings, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportName = 'settings_' + new Date().toISOString().split('T')[0] + '.json';
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportName);
            linkElement.click();
        } catch (error) {
            console.error('Error exporting settings:', error);
            showAlert('שגיאה בייצוא הגדרות', 'error');
        }
    }
};

// אתחול כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    settingsManager.init();
});