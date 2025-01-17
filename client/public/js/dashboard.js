const dashboardManager = {
    init() {
        this.loadDashboardData();
        this.initCharts();
        this.startAutoRefresh();
        this.bindEvents();
    },

    // טעינת נתוני לוח המחוונים
    async loadDashboardData() {
        try {
            // טעינת סטטיסטיקות
            const statsResponse = await fetch('/api/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const stats = await statsResponse.json();
            this.updateStats(stats);

            // טעינת התראות דחופות
            const alertsResponse = await fetch('/api/alerts?priority=urgent', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const alerts = await alertsResponse.json();
            this.updateUrgentAlerts(alerts);

            // טעינת פוליסות שעומדות להסתיים
            const policiesResponse = await fetch('/api/policies/expiring/30', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const policies = await policiesResponse.json();
            this.updateExpiringPolicies(policies);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            utils.showAlert('שגיאה בטעינת נתוני לוח המחוונים', 'error');
        }
    },

    // עדכון סטטיסטיקות
    updateStats(stats) {
        document.getElementById('totalCustomers').textContent = stats.customers.total;
        document.getElementById('totalPolicies').textContent = stats.policies.total;
        document.getElementById('activeAlerts').textContent = stats.alerts.active;
        document.getElementById('monthlyRevenue').textContent = utils.formatNumber(stats.revenue.monthly, 'currency');
        
        // עדכון שינויים מהחודש הקודם
        this.updateTrend('customersTrend', stats.customers.trend);
        this.updateTrend('policiesTrend', stats.policies.trend);
        this.updateTrend('alertsTrend', stats.alerts.trend);
        this.updateTrend('revenueTrend', stats.revenue.trend);
    },

    // עדכון מגמות
    updateTrend(elementId, trend) {
        const element = document.getElementById(elementId);
        const value = Math.abs(trend);
        
        element.innerHTML = `
            <i class="fas fa-arrow-${trend >= 0 ? 'up' : 'down'} text-${trend >= 0 ? 'success' : 'danger'}"></i>
            ${value}% ${trend >= 0 ? 'עלייה' : 'ירידה'} מהחודש הקודם
        `;
    },

    // עדכון התראות דחופות
    updateUrgentAlerts(alerts) {
        const container = document.getElementById('urgentAlerts');
        container.innerHTML = alerts.length ? '' : '<p class="text-muted">אין התראות דחופות</p>';

        alerts.forEach(alert => {
            container.innerHTML += `
                <div class="alert alert-warning">
                    <h6 class="alert-heading">${alert.title}</h6>
                    <p class="mb-0">${alert.message}</p>
                    <small class="text-muted">לטיפול עד: ${utils.formatDate(alert.dueDate)}</small>
                </div>
            `;
        });
    },

    // עדכון פוליסות שעומדות להסתיים
    updateExpiringPolicies(policies) {
        const container = document.getElementById('expiringPolicies');
        container.innerHTML = policies.length ? '' : '<p class="text-muted">אין פוליסות שעומדות להסתיים בקרוב</p>';

        policies.forEach(policy => {
            const daysLeft = utils.dateDiffInDays(new Date(), policy.endDate);
            container.innerHTML += `
                <div class="alert alert-info">
                    <h6 class="alert-heading">${policy.policyNumber} - ${policy.customerId.name}</h6>
                    <p class="mb-0">${policy.type} - ${policy.company}</p>
                    <small class="text-muted">מסתיימת בעוד ${daysLeft} ימים</small>
                </div>
            `;
        });
    },

    // יצירת תרשימים
    initCharts() {
        this.initRevenueChart();
        this.initPoliciesChart();
        this.initCustomerDistributionChart();
    },

    // תרשים הכנסות
    async initRevenueChart() {
        try {
            const response = await fetch('/api/dashboard/revenue-chart', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            const ctx = document.getElementById('revenueChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'הכנסות',
                        data: data.values,
                        borderColor: '#1976d2',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => utils.formatNumber(value, 'currency')
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading revenue chart:', error);
        }
    },

    // תרשים פוליסות
    async initPoliciesChart() {
        try {
            const response = await fetch('/api/dashboard/policies-chart', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            const ctx = document.getElementById('policiesChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#1976d2',
                            '#2196f3',
                            '#64b5f6',
                            '#90caf9',
                            '#bbdefb'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading policies chart:', error);
        }
    },

    // תרשים התפלגות לקוחות
    async initCustomerDistributionChart() {
        try {
            const response = await fetch('/api/dashboard/customer-distribution', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            const ctx = document.getElementById('customerDistributionChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'מספר לקוחות',
                        data: data.values,
                        backgroundColor: '#1976d2'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading customer distribution chart:', error);
        }
    },

    // התחלת רענון אוטומטי
    startAutoRefresh() {
        setInterval(() => {
            this.loadDashboardData();
        }, 300000); // רענון כל 5 דקות
    },

    // אירועים
    bindEvents() {
        // טיפול בשינוי טווח תאריכים
        document.getElementById('dateRange').addEventListener('change', (e) => {
            this.loadDashboardData();
        });

        // טיפול בלחיצה על פוליסה שעומדת להסתיים
        document.getElementById('expiringPolicies').addEventListener('click', (e) => {
            const policyCard = e.target.closest('.alert');
            if (policyCard) {
                const policyNumber = policyCard.querySelector('.alert-heading').textContent.split(' - ')[0];
                window.location.href = `/policies?policy=${policyNumber}`;
            }
        });
    }
};

// אתחול כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager.init();
});