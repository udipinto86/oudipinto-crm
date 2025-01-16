const policiesManager = {
    init() {
        this.policiesTable = null;
        this.initializeTable();
        this.bindEvents();
    },

    // יצירת טבלת פוליסות
    async initializeTable() {
        try {
            const response = await fetch('/api/policies', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const policies = await response.json();
            
            this.policiesTable = new DataTable('#policiesTable', {
                data: policies,
                columns: [
                    { 
                        data: null,
                        render: (data, type, row) => `
                            <div class="d-flex align-items-center">
                                <div>
                                    <div class="fw-bold">${row.policyNumber}</div>
                                    <div class="small text-muted">${row.type}</div>
                                </div>
                            </div>
                        `
                    },
                    { 
                        data: null,
                        render: (data, type, row) => `
                            <div>
                                <div class="fw-bold">${row.customerId?.name || 'לא מוגדר'}</div>
                                <div class="small text-muted">${row.customerId?.idNumber || ''}</div>
                            </div>
                        `
                    },
                    {
                        data: null,
                        render: (data, type, row) => `
                            <div>
                                <div>${row.company}</div>
                                <div class="small text-muted">${row.department}</div>
                            </div>
                        `
                    },
                    {
                        data: null,
                        render: (data, type, row) => `
                            <div>
                                <div>מ: ${new Date(row.startDate).toLocaleDateString('he-IL')}</div>
                                <div>עד: ${new Date(row.endDate).toLocaleDateString('he-IL')}</div>
                            </div>
                        `
                    },
                    {
                        data: null,
                        render: (data, type, row) => `
                            <div>
                                <div class="fw-bold">${row.price.amount.toLocaleString()} ${row.price.currency}</div>
                                <div class="small text-muted">${row.price.paymentFrequency}</div>
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
                                <button class="btn btn-sm btn-outline-primary edit-policy" data-id="${row._id}">
                                    <i class="fas fa-edit"></i> ערוך
                                </button>
                                <button class="btn btn-sm btn-outline-info view-details" data-id="${row._id}">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-policy" data-id="${row._id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `
                    }
                ],
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/he.json'
                },
                order: [[3, 'desc']],
                responsive: true
            });
        } catch (error) {
            console.error('Error initializing policies table:', error);
            showAlert('שגיאה בטעינת נתוני פוליסות', 'error');
        }
    },

    // אירועים
    bindEvents() {
        // הוספת פוליסה חדשה
        document.getElementById('addPolicyBtn').addEventListener('click', () => {
            this.showPolicyModal();
        });

        // טיפול בשליחת טופס פוליסה
        document.getElementById('policyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePolicySubmit();
        });

        // טיפול בכפתורי פעולה בטבלה
        document.querySelector('#policiesTable').addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const policyId = target.dataset.id;
            
            if (target.classList.contains('edit-policy')) {
                this.showPolicyModal(policyId);
            } else if (target.classList.contains('view-details')) {
                this.showPolicyDetails(policyId);
            } else if (target.classList.contains('delete-policy')) {
                this.confirmDeletePolicy(policyId);
            }
        });

        // חיפוש בטבלה
        document.getElementById('policySearch').addEventListener('input', (e) => {
            this.policiesTable.search(e.target.value).draw();
        });

        // סינון לפי סטטוס
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            const status = e.target.value;
            this.policiesTable
                .column(5)
                .search(status === 'all' ? '' : status)
                .draw();
        });
    },

    // פונקציות עזר
    getStatusBadgeColor(status) {
        const colors = {
            active: 'success',
            pending: 'warning',
            cancelled: 'danger',
            expired: 'secondary'
        };
        return colors[status] || 'primary';
    },

    getStatusText(status) {
        const texts = {
            active: 'פעיל',
            pending: 'ממתין',
            cancelled: 'מבוטל',
            expired: 'פג תוקף'
        };
        return texts[status] || status;
    },

    // הצגת מודל פוליסה
    async showPolicyModal(policyId = null) {
        const modal = document.getElementById('policyModal');
        const form = document.getElementById('policyForm');
        
        if (policyId) {
            try {
                const response = await fetch(`/api/policies/${policyId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const policy = await response.json();
                
                // מילוי הטופס בנתוני הפוליסה
                form.elements['policyNumber'].value = policy.policyNumber;
                form.elements['type'].value = policy.type;
                form.elements['customerId'].value = policy.customerId._id;
                form.elements['company'].value = policy.company;
                form.elements['department'].value = policy.department;
                form.elements['startDate'].value = policy.startDate.split('T')[0];
                form.elements['endDate'].value = policy.endDate.split('T')[0];
                form.elements['price.amount'].value = policy.price.amount;
                form.elements['price.currency'].value = policy.price.currency;
                form.elements['price.paymentFrequency'].value = policy.price.paymentFrequency;
                form.elements['status'].value = policy.status;
                
                form.dataset.id = policyId;
            } catch (error) {
                console.error('Error fetching policy:', error);
                showAlert('שגיאה בטעינת נתוני פוליסה', 'error');
                return;
            }
        } else {
            form.reset();
            delete form.dataset.id;
        }

        new bootstrap.Modal(modal).show();
    },

    // שמירת פוליסה
    async handlePolicySubmit() {
        const form = document.getElementById('policyForm');
        const formData = new FormData(form);
        const policyId = form.dataset.id;
        
        const policyData = {
            policyNumber: formData.get('policyNumber'),
            type: formData.get('type'),
            customerId: formData.get('customerId'),
            company: formData.get('company'),
            department: formData.get('department'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            price: {
                amount: parseFloat(formData.get('price.amount')),
                currency: formData.get('price.currency'),
                paymentFrequency: formData.get('price.paymentFrequency')
            },
            status: formData.get('status')
        };

        try {
            const url = policyId ? 
                `/api/policies/${policyId}` : 
                '/api/policies';
            
            const response = await fetch(url, {
                method: policyId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(policyData)
            });

            if (!response.ok) throw new Error('Server error');

            bootstrap.Modal.getInstance(document.getElementById('policyModal')).hide();
            this.refreshTable();
            showAlert(`פוליסה ${policyId ? 'עודכנה' : 'נוספה'} בהצלחה`, 'success');
        } catch (error) {
            console.error('Error saving policy:', error);
            showAlert('שגיאה בשמירת פוליסה', 'error');
        }
    },

    // מחיקת פוליסה
    async confirmDeletePolicy(policyId) {
        if (confirm('האם אתה בטוח שברצונך למחוק פוליסה זו?')) {
            try {
                const response = await fetch(`/api/policies/${policyId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('Server error');

                this.refreshTable();
                showAlert('פוליסה נמחקה בהצלחה', 'success');
            } catch (error) {
                console.error('Error deleting policy:', error);
                showAlert('שגיאה במחיקת פוליסה', 'error');
            }
        }
    },

    // הצגת פרטי פוליסה
    async showPolicyDetails(policyId) {
        try {
            const response = await fetch(`/api/policies/${policyId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const policy = await response.json();
            
            const detailsHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>פרטי פוליסה</h6>
                        <p>מספר: ${policy.policyNumber}</p>
                        <p>סוג: ${policy.type}</p>
                        <p>חברה: ${policy.company}</p>
                        <p>מחלקה: ${policy.department}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>פרטי תשלום</h6>
                        <p>סכום: ${policy.price.amount} ${policy.price.currency}</p>
                        <p>תדירות: ${policy.price.paymentFrequency}</p>
                        <p>תקופה: ${new Date(policy.startDate).toLocaleDateString('he-IL')} - ${new Date(policy.endDate).toLocaleDateString('he-IL')}</p>
                        <p>סטטוס: ${this.getStatusText(policy.status)}</p>
                    </div>
                </div>
            `;

            document.getElementById('policyDetailsContent').innerHTML = detailsHtml;
            new bootstrap.Modal(document.getElementById('policyDetailsModal')).show();
        } catch (error) {
            console.error('Error fetching policy details:', error);
            showAlert('שגיאה בטעינת פרטי פוליסה', 'error');
        }
    },

    // רענון הטבלה
    async refreshTable() {
        try {
            const response = await fetch('/api/policies', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const policies = await response.json();
            
            this.policiesTable.clear();
            this.policiesTable.rows.add(policies);
            this.policiesTable.draw();
        } catch (error) {
            console.error('Error refreshing table:', error);
            showAlert('שגיאה בטעינת נתונים', 'error');
        }
    }
};

// אתחול כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    policiesManager.init();
});