// טיפול בניווט וניהול התצוגה
const router = {
    init() {
        this.handleNavigation();
        this.loadInitialPage();
    },

    handleNavigation() {
        // טיפול בקישורים בתפריט
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.loadPage(page);
            });
        });

        // טיפול בכפתור חזרה בדפדפן
        window.addEventListener('popstate', () => {
            this.loadInitialPage();
        });
    },

    loadInitialPage() {
        const path = window.location.pathname.substring(1) || 'dashboard';
        this.loadPage(path, false);
    },

    async loadPage(page, addToHistory = true) {
        // הוספה להיסטוריה של הדפדפן
        if (addToHistory) {
            window.history.pushState({}, page, `/${page}`);
        }

        // עדכון התפריט
        this.updateActiveNavItem(page);

        // טעינת התוכן המתאים
        const contentDiv = document.getElementById('main-content');
        try {
            const response = await fetch(`/api/${page}`);
            if (!response.ok) throw new Error('Page load failed');
            const data = await response.json();
            
            // רינדור התוכן
            contentDiv.innerHTML = this.renderPage(page, data);

            // הפעלת פונקציות ספציפיות לדף
            if (this.pageHandlers[page]) {
                this.pageHandlers[page]();
            }
        } catch (error) {
            console.error('Error loading page:', error);
            contentDiv.innerHTML = '<div class="alert alert-danger">שגיאה בטעינת העמוד</div>';
        }
    },

    updateActiveNavItem(page) {
        // עדכון הפריט הפעיל בתפריט
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkPage = link.getAttribute('data-page');
            if (linkPage === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    // רינדור תבניות לפי סוג הדף
    renderPage(page, data) {
        switch(page) {
            case 'dashboard':
                return this.renderDashboard(data);
            case 'customers':
                return this.renderCustomers(data);
            case 'policies':
                return this.renderPolicies(data);
            case 'alerts':
                return this.renderAlerts(data);
            case 'settings':
                return this.renderSettings(data);
            default:
                return '<div class="alert alert-warning">עמוד לא נמצא</div>';
        }
    },

    pageHandlers: {
        // פונקציות ספציפיות לכל דף
        dashboard() {
            this.initDashboardCharts();
        },
        customers() {
            this.initCustomerTable();
        },
        policies() {
            this.initPolicyTable();
        }
    },

    // פונקציות עזר נוספות יתווספו כאן
};

// אתחול הראוטר כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    router.init();
});