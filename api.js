const API_BASE = 'http://localhost:3000/api';

class API {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    // Auth methods
    static async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }
    
    static async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    // Account methods
    static async getAccounts(status = null) {
        const query = status ? `?status=${status}` : '';
        return this.request(`/accounts${query}`);
    }
    
    static async createAccount(accountData) {
        return this.request('/accounts', {
            method: 'POST',
            body: JSON.stringify(accountData)
        });
    }
    
    // Sales methods
    static async recordSale(saleData) {
        return this.request('/sales', {
            method: 'POST',
            body: JSON.stringify(saleData)
        });
    }
    
    static async getSales() {
        return this.request('/sales');
    }
    
    // Admin stats
    static async getAdminStats() {
        return this.request('/admin-stats');
    }
}
