document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!Auth.requireAuth('owner')) return;
    
    const currentUser = Auth.getCurrentUser();
    document.getElementById('current-user').textContent = 
        `Welcome, ${currentUser.username} (Owner)`;
    
    // Initialize dashboard
    initializeOwnerDashboard();
    
    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', Auth.logout);
    document.getElementById('add-account-btn').addEventListener('click', showAddAccountModal);
    document.getElementById('cancel-add-btn').addEventListener('click', hideAddAccountModal);
    document.getElementById('add-account-form').addEventListener('submit', handleAddAccount);
    
    // Tab functionality
    setupTabs();
    
    // Modal close functionality
    setupModalClose();
});

function initializeOwnerDashboard() {
    loadStats();
    loadAccounts();
    loadSales();
    loadAdminStats();
}

async function loadStats() {
    try {
        const accounts = await API.getAccounts();
        
        const totalAccounts = accounts.length;
        const availableAccounts = accounts.filter(acc => acc.status === 'available').length;
        const soldAccounts = accounts.filter(acc => acc.status === 'sold_out').length;
        
        document.getElementById('total-accounts').textContent = totalAccounts;
        document.getElementById('available-accounts').textContent = availableAccounts;
        document.getElementById('sold-accounts').textContent = soldAccounts;
        
        // For now, we'll set a static admin count
        document.getElementById('total-admins').textContent = '2';
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('Error loading statistics', 'error');
    }
}

async function loadAccounts() {
    try {
        const accounts = await API.getAccounts();
        const tbody = document.getElementById('accounts-table-body');
        
        tbody.innerHTML = accounts.map(account => `
            <tr>
                <td>${account.id}</td>
                <td>${account.account_name}</td>
                <td><span class="badge badge-type">${account.account_type}</span></td>
                <td>₱${parseFloat(account.price || 0).toFixed(2)}</td>
                <td>${account.quantity}</td>
                <td>${account.available_quantity}</td>
                <td><span class="status-badge status-${account.status}">${account.status}</span></td>
                <td>${account.created_by_name || 'System'}</td>
                <td>${new Date(account.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading accounts:', error);
        showNotification('Error loading accounts', 'error');
    }
}

async function loadSales() {
    try {
        const sales = await API.getSales();
        const tbody = document.getElementById('sales-table-body');
        
        tbody.innerHTML = sales.map(sale => `
            <tr>
                <td>${sale.id}</td>
                <td>${sale.account_name}</td>
                <td>${sale.account_type}</td>
                <td>${sale.sold_by_name}</td>
                <td>${sale.quantity_sold}</td>
                <td>₱${parseFloat(sale.sold_price || 0).toFixed(2)}</td>
                <td>₱${(parseFloat(sale.sold_price || 0) * sale.quantity_sold).toFixed(2)}</td>
                <td>${new Date(sale.sold_at).toLocaleString()}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading sales:', error);
        showNotification('Error loading sales history', 'error');
    }
}

async function loadAdminStats() {
    try {
        const stats = await API.getAdminStats();
        const tbody = document.getElementById('admins-table-body');
        
        tbody.innerHTML = stats.map(admin => `
            <tr>
                <td>${admin.username}</td>
                <td>${admin.email}</td>
                <td>${admin.total_sales}</td>
                <td>₱${parseFloat(admin.total_revenue || 0).toFixed(2)}</td>
                <td>${admin.last_sale_date ? new Date(admin.last_sale_date).toLocaleDateString() : 'No sales yet'}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading admin stats:', error);
        showNotification('Error loading admin statistics', 'error');
    }
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
            
            // Refresh data for the active tab
            if (tabId === 'accounts') {
                loadAccounts();
            } else if (tabId === 'sales') {
                loadSales();
            } else if (tabId === 'admins') {
                loadAdminStats();
            }
        });
    });
}

function showAddAccountModal() {
    document.getElementById('add-account-modal').classList.add('active');
}

function hideAddAccountModal() {
    document.getElementById('add-account-modal').classList.remove('active');
    document.getElementById('add-account-form').reset();
}

async function handleAddAccount(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const accountData = {
        account_name: formData.get('account_name'),
        account_type: formData.get('account_type'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        quantity: parseInt(formData.get('quantity'))
    };
    
    const saveBtn = document.getElementById('save-account-btn');
    
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        await API.createAccount(accountData);
        
        showNotification('Account added successfully!', 'success');
        hideAddAccountModal();
        
        // Refresh data
        loadStats();
        loadAccounts();
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Account';
    }
}

function setupModalClose() {
    const modal = document.getElementById('add-account-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', hideAddAccountModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideAddAccountModal();
        }
    });
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        max-width: 300px;
    `;
    
    if (type === 'success') {
        notification.style.background = '#27ae60';
    } else {
        notification.style.background = '#e74c3c';
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
