const customersManager = {
    init() {
        this.customersTable = null;
        this.initializeTable();
        this.bindEvents();
    },

    // יצירת טבלת לקוחות
    async initializeTable() {
        try {
            const response = await fetch('/api/customers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const customers = await response.json();
            
            this.customersTable = new DataTable('#customersTable', {
                data: customers,
                columns: [
                    { 
                        data: null,
                        render: (data, type, row) => `
                            <div class="d-flex align-items-center">
                                <div>
                                    <div class="fw-bold">${row.name}</div>
                                    <div class="small text-muted">${row.idNumber}</div>
                                </div>
                            </div>
                        `
                    },
                    { 
                        data: null,
                        render: (data, type, row) => `
                            <div>
                                <div>${row.phone.mobile}</div>
                                <div class="small text-muted">${row.email}</div>
                            </div>
                        `
                    },
                    { 
                        data: null,
                        render: (data, type, row) => `
                            <div>
                                <div>${row.address.city}</div>
                                <div class="small text-muted">${row.address.street || ''}</div>
                            </div>
                        `
                    },
                    {
                        data: null,
                        render: (data, type, row) => `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary edit-customer" data-id="${row._id}">
                                    <i class="fas fa-edit"></i> ערוך
                                </button>
                                <button class="btn btn-sm btn-outline-info view-policies" data-id="${row._id}">
                                    <i class="fas fa-file-alt"></i> פוליסות
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-customer" data-id="${row._id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `
                    }
                ],
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/he.json'
                },
                order: [[0, 'asc']],
                responsive: true
            });
        } catch (error) {
            console.error('Error initializing customers table:', error);
            showAlert('שגיאה בטעינת נתוני לקוחות', 'error');
        }
    },

    // אירועים
    bindEvents() {
        // הוספת לקוח חדש
        document.getElementById('addCustomerBtn').addEventListener('click', () => {
            this.showCustomerModal();
        });

        // טיפול בשליחת טופס לקוח
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCustomerSubmit();
        });

        // טיפול בכפתורי פעולה בטבלה
        document.querySelector('#customersTable').addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const customerId = target.dataset.id;
            
            if (target.classList.contains('edit-customer')) {
                this.showCustomerModal(customerId);
            } else if (target.classList.contains('view-policies')) {
                this.showCustomerPolicies(customerId);
            } else if (target.classList.contains('delete-customer')) {
                this.confirmDeleteCustomer(customerId);
            }
        });

        // חיפוש בטבלה
        document.getElementById('customerSearch').addEventListener('input', (e) => {
            this.customersTable.search(e.target.value).draw();
        });
    },

    // הצגת מודל לקוח
    async showCustomerModal(customerId = null) {
        const modal = document.getElementById('customerModal');
        const form = document.getElementById('customerForm');
        
        if (customerId) {
            try {
                const response = await fetch(`/api/customers/${customerId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const customer = await response.json();
                
                // מילוי הטופס בנתוני הלקוח
                Object.keys(customer).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) input.value = customer[key];
                });
                
                form.dataset.id = customerId;
            } catch (error) {
                console.error('Error fetching customer:', error);
                showAlert('שגיאה בטעינת נתוני לקוח', 'error');
                return;
            }
        } else {
            form.reset();
            delete form.dataset.id;
        }

        new bootstrap.Modal(modal).show();
    },

    // שמירת לקוח
    async handleCustomerSubmit() {
        const form = document.getElementById('customerForm');
        const formData = new FormData(form);
        const customerId = form.dataset.id;
        
        const customerData = {
            name: formData.get('name'),
            idNumber: formData.get('idNumber'),
            phone: {
                mobile: formData.get('mobile'),
                home: formData.get('home'),
                work: formData.get('work')
            },
            email: formData.get('email'),
            address: {
                street: formData.get('street'),
                city: formData.get('city'),
                zipCode: formData.get('zipCode')
            },
            notes: formData.get('notes')
        };

        try {
            const url = customerId ? 
                `/api/customers/${customerId}` : 
                '/api/customers';
            
            const response = await fetch(url, {
                method: customerId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(customerData)
            });

            if (!response.ok) throw new Error('Server error');

            bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
            this.refreshTable();
            showAlert(`לקוח ${customerId ? 'עודכן' : 'נוסף'} בהצלחה`, 'success');
        } catch (error) {
            console.error('Error saving customer:', error);
            showAlert('שגיאה בשמירת לקוח', 'error');
        }
    },

    // מחיקת לקוח
    async confirmDeleteCustomer(customerId) {
        if (confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) {
            try {
                const response = await fetch(`/api/customers/${customerId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('Server error');

                this.refreshTable();
                showAlert('לקוח נמחק בהצלחה', 'success');
            } catch (error) {
                console.error('Error deleting customer:', error);
                showAlert('שגיאה במחיקת לקוח', 'error');
            }
        }
    },

    // רענון הטבלה
    async refreshTable() {
        try {
            const response = await fetch('/api/customers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const customers = await response.json();
            
            this.customersTable.clear();
            this.customersTable.rows.add(customers);
            this.customersTable.draw();
        } catch (error) {
            console.error('Error refreshing table:', error);
            showAlert('שגיאה בטעינת נתונים', 'error');
        }
    }
};

// אתחול כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    customersManager.init();
});