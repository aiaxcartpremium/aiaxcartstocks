document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const alertMessage = document.getElementById('alert-message');
    
    // Redirect if already logged in
    if (Auth.isLoggedIn()) {
        const user = Auth.getCurrentUser();
        redirectToDashboard(user.role);
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showAlert('Please enter both username and password', 'error');
            return;
        }
        
        try {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
            
            const response = await API.login(username, password);
            
            // Store auth data
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to appropriate dashboard
            setTimeout(() => {
                redirectToDashboard(response.user.role);
            }, 1000);
            
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
    
    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = `alert alert-${type}`;
        alertMessage.style.display = 'block';
        
        setTimeout(() => {
            alertMessage.style.display = 'none';
        }, 5000);
    }
    
    function redirectToDashboard(role) {
        if (role === 'owner') {
            window.location.href = 'owner.html';
        } else {
            window.location.href = 'admin.html';
        }
    }
});
