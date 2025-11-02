class Auth {
    static isLoggedIn() {
        return localStorage.getItem('authToken') !== null;
    }
    
    static getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    static logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
    
    static requireAuth(requiredRole = null) {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        
        if (requiredRole) {
            const user = this.getCurrentUser();
            if (user.role !== requiredRole) {
                window.location.href = 'login.html';
                return false;
            }
        }
        
        return true;
    }
}

// Auto-redirect if not logged in
if (!Auth.isLoggedIn() && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
}
