const authManager = {
    init() {
        this.checkAuthStatus();
        this.bindEvents();
    },

    // בדיקת סטטוס התחברות
    checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (!token && window.location.pathname !== '/login') {
            window.location.href = '/login';
            return;
        }

        if (token) {
            this.validateToken(token);
        }
    },

    // וולידציה של טוקן
    async validateToken(token) {
        try {
            const response = await fetch('/api/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                this.logout();
                return;
            }

            const userData = await response.json();
            this.updateUserInfo(userData);
        } catch (error) {
            console.error('Token validation error:', error);
            this.logout();
        }
    },

    // התחברות
    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            this.updateUserInfo(data.user);
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Login error:', error);
            utils.showAlert('שם משתמש או סיסמה שגויים', 'error');
        }
    },

    // התנתקות
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    // עדכון פרטי משתמש בממשק
    updateUserInfo(user) {
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
        if (userRoleElement) {
            userRoleElement.textContent = this.getRoleText(user.role);
        }

        this.updatePermissions(user.role);
    },

    // עדכון הרשאות בממשק
    updatePermissions(role) {
        const elements = document.querySelectorAll('[data-permission]');
        elements.forEach(element => {
            const [module, action] = element.dataset.permission.split(':');
            if (!this.checkPermission(role, module, action)) {
                element.style.display = 'none';
            }
        });
    },

    // בדיקת הרשאה
    checkPermission(role, module, action) {
        const permissions = {
            admin: {
                customers: ['view', 'create', 'edit', 'delete'],
                policies: ['view', 'create', 'edit', 'delete'],
                alerts: ['view', 'create', 'edit', 'delete'],
                settings: ['view', 'edit']
            },
            manager: {
                customers: ['view', 'create', 'edit'],
                policies: ['view', 'create', 'edit'],
                alerts: ['view', 'create', 'edit'],
                settings: ['view']
            },
            agent: {
                customers: ['view', 'create'],
                policies: ['view', 'create'],
                alerts: ['view', 'create'],
                settings: ['view']
            }
        };

        if (role === 'admin') return true;
        return permissions[role]?.[module]?.includes(action) ?? false;
    },

    // אירועים
    bindEvents() {
        // טיפול בטופס התחברות
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = e.target.username.value;
                const password = e.target.password.value;
                this.login(username, password);
            });
        }

        // טיפול בכפתור התנתקות
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    // המרת תפקיד לטקסט
    getRoleText(role) {
        const roles = {
            admin: 'מנהל מערכת',
            manager: 'מנהל',
            agent: 'סוכן'
        };
        return roles[role] || role;
    }
};

// אתחול כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    authManager.init();
});

// ייצוא למודולים אחרים
window.auth = authManager;