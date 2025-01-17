const alertsManager = {
    init() {
        this.alertsTable = null;
        this.initializeTable();
        this.bindEvents();
        this.startAlertCheck();
    },

    // יצירת טבלת התראות
    async initializeTable() {
        try {
            const response = await fetch('/api/alerts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const alerts = await response.json();
            
            this.alertsTable = new DataTable('#alertsTable', {
                data: alerts,
                columns: [
                    { 
                        data: null,
                        render: (data, type, row) => `
                            <div class="d-flex align-items-center">
                                <div class="alert-priority ${row.priority}"></div>
                                <div>
                                    <div class="fw-bold">${row.title}</div>
                                    <div class="small text-muted">${this.getAlertTypeText(row.type)}</div>
                                </div>
                            </div>
                        `
                    },
                    {
                        data: 'message'
                    },
                    {
                        data: null,
                        render: (data, type, row) => `
                            <div>
                                <div>לטיפול עד: ${new Date(row.dueDate).toLocaleDateString('he-IL')}</div>
                                <div class="small text-muted">נוצר: ${new Date(row.createdAt).toLocaleDateString('he-IL')}</div>
                            </div>
                        `
                    },
                    {
                        data: 'status',
                        render: (data, type, row) => `
                            <span class="badge bg-${this.getStatusBadgeColor(data)}">${this.getStatusText(data)}</span>
                        `
                    },
                    {
                        data: null,
                        render: (data, type, row) => `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary handle-alert" data-id="${row._id}">
                                    <i class="fas fa-check"></i> טיפול
                                </button>
                                <button class="btn btn-sm btn-outline-info view-alert" data-id="${row._id}">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-alert" data-id="${row._id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `
                    }
                ],
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/he.json'
                },
                order: [[2, 'asc']],
                responsive: true
            });
        } catch (error) {
            console.error('Error initializing alerts table:', error);
            showAlert('שגיאה בטעינת התראות', 'error');
        }
    },

    // אירועים
    bindEvents() {
        // הוספת התראה חדשה
        document.getElementById('addAlertBtn').addEventListener('click', () => {
            this.showAlertModal();
        });

        // טיפול בשליחת טופס התראה
        document.getElementById('alertForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAlertSubmit();
        });

        // טיפול בכפתורי פעולה בטבלה
        document.querySelector('#alertsTable').addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const alertId = target.dataset.id;
            
            if (target.classList.contains('handle-alert')) {
                this.handleAlert(alertId);
            } else if (target.classList.contains('view-alert')) {
                this.showAlertDetails(alertId);
            } else if (target.classList.contains('delete-alert')) {
                this.confirmDeleteAlert(alertId);
            }
        });

        // סינון לפי סטטוס
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            const status = e.target.value;
            this.alertsTable
                .column(3)
                .search(status === 'all' ? '' : status)
                .draw();
        });

        // סינון לפי דחיפות
        document.getElementById('priorityFilter').addEventListener('change', (e) => {
            const priority = e.target.value;
            this.alertsTable
                .column(0)
                .search(priority === 'all' ? '' : priority)
                .draw();
        });
    },

    // בדיקת התראות חדשות
    startAlertCheck() {
        setInterval(async () => {
            try {
                const response = await fetch('/api/alerts?unread=true', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const newAlerts = await response.json();
                
                if (newAlerts.length > 0) {
                    this.showNewAlertsNotification(newAlerts);
                    this.refreshTable();
                }
            } catch (error) {
                console.error('Error checking for new alerts:', error);
            }
        }, 300000); // בדיקה כל 5 דקות
    },

    // פונקציות עזר
    getAlertTypeText(type) {
        const types = {
            policy_expiring: 'פוליסה מסתיימת',
            policy_renewal: 'חידוש פוליסה',
            customer_birthday: 'יום הולדת לקוח',
            payment_due: 'תשלום צפוי',
            commission_payment: 'תשלום עמלה',
            document_expiring: 'מסמך מסתיים',
            task_reminder: 'תזכורת משימה'
        };
        return types[type] || type;
    },

    getStatusBadgeColor(status) {
        const colors = {
            pending: 'warning',
            in_progress: 'info',
            handled: 'success',
            ignored: 'secondary'
        };
        return colors[status] || 'primary';
    },

    getStatusText(status) {
        const texts = {
            pending: 'ממתין',
            in_progress: 'בטיפול',
            handled: 'טופל',
            ignored: 'נדחה'
        };
        return texts[status] || status;
    },

    // טיפול בהתראה
    async handleAlert(alertId) {
        try {
            const response = await fetch(`/api/alerts/${alertId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'handled' })
            });

            if (!response.ok) throw new Error('Server error');

            this.refreshTable();
            showAlert('התראה עודכנה בהצלחה', 'success');
        } catch (error) {
            console.error('Error handling alert:', error);
            showAlert('שגיאה בעדכון התראה', 'error');
        }
    },

    // הצגת פרטי התראה
    async showAlertDetails(alertId) {
        try {
            const response = await fetch(`/api/alerts/${alertId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const alert = await response.json();
            
            const detailsHtml = `
                <div class="row">
                    <div class="col-12">
                        <h6>פרטי התראה</h6>
                        <p><strong>כותרת:</strong> ${alert.title}</p>
                        <p><strong>סוג:</strong> ${this.getAlertTypeText(alert.type)}</p>
                        <p><strong>תיאור:</strong> ${alert.message}</p>
                        <p><strong>דחיפות:</strong> ${alert.priority}</p>
                        <p><strong>סטטוס:</strong> ${this.getStatusText(alert.status)}</p>
                        <p><strong>תאריך יעד:</strong> ${new Date(alert.dueDate).toLocaleDateString('he-IL')}</p>
                        <p><strong>נוצר ב:</strong> ${new Date(alert.createdAt).toLocaleDateString('he-IL')}</p>
                    </div>
                </div>
            `;

            document.getElementById('alertDetailsContent').innerHTML = detailsHtml;
            new bootstrap.Modal(document.getElementById('alertDetailsModal')).show();
        } catch (error) {
            console.error('Error fetching alert details:', error);
            showAlert('שגיאה בטעינת פרטי התראה', 'error');
        }
    },

    // הצגת התראות חדשות
    showNewAlertsNotification(alerts) {
        const notification = new Notification('התראות חדשות', {
            body: `יש ${alerts.length} התראות חדשות`,
            icon: '/images/logo.png'
        });

        notification.onclick = () => {
            window.focus();
            this.refreshTable();
        };
    },

    // רענון הטבלה
    async refreshTable() {
        try {
            const response = await fetch('/api/alerts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const alerts = await response.json();
            
            this.alertsTable.clear();
            this.alertsTable.rows.add(alerts);
            this.alertsTable.draw();
        } catch (error) {
            console.error('Error refreshing table:', error);
            showAlert('שגיאה בטעינת נתונים', 'error');
        }
    }
};

// אתחול כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    alertsManager.init();
});