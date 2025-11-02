document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!Auth.requireAuth('admin')) return;
    
    const currentUser = Auth.getCurrentUser();
    document.getElementById('current-user').textContent = 
        `Welcome, ${currentUser.username}`;
    
    // Initialize dashboard
    initializeAdminDashboard();
    
    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', Auth.logout);
    document.getElementById('cancel-sell-btn').addEventListener('click', hideSellModal);
    document.getElementById('sell-account-form').addEventListener('submit', handleSellAccount);
    
    // Tab functionality
    setupTabs();
    
    // Modal close functionality
    setupModalClose();
});

async function initializeAdminDashboard() {
    await loadAvailableStock();
    await loadMySales();
    updateAdminStats();
}

async function loadAvailableStock() {
    try {
        const accounts = await API.getAccounts();
        const availableAccounts = accounts.filter(acc => 
            acc.status === 'available' && acc.available_quantity > 0
        );
        
        const tbody = document.getElementById('available-stock-body');
        
        tbody.innerHTML = availableAccounts.map(account => `
            <tr>
                <td>${account.id}</td>
                <td>${account.account_name}</td>
                <td><span class="badge badge-type">${account.account_type}</span></td>
                <td>₱${parseFloat(account.price || 0).toFixed(2)}</td>
                <td>${account.available_quantity}</td>
                <td>${account.description || 'No description'}</td>
                <td>
                    <button class="btn btn-sell" 
                            onclick="showSellModal(${account.id}, '${account.account_name}', '${account.account_type}', ${account.available_quantity}, ${account.price})">
                        Sell
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Update available stock count
        document.getElementById('available-stock').textContent = availableAccounts.length;
        
    } catch (error) {
        console.error('Error loading available stock:', error);
        showNotification('Error loading available stock', 'error');
    }
}

async function loadMySales() {
    try {
        const sales = await API.getSales();
        const tbody = document.getElementById('my-sales-body');
        
        tbody.innerHTML = sales.map(sale => `
            <tr>
                <td>${sale.id}</td>
                <td>${sale.account_name}</td>
                <td>${sale.account_type}</td>
                <td>${sale.quantity_sold}</td>
                <td>₱${parseFloat(sale.sold_price || 0).toFixed(2)}</td>
                <td>₱${(parseFloat(sale.sold_price || 0) * sale.quantity_sold).toFixed(2)}</td>
                <td>${new Date(sale.sold_at).toLocaleString()}</td>
                <td>${sale.notes || '-'}</td>
            </tr>
        `).join('');
        
        // Update sales stats
        const totalSales = sales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
        const totalRevenue = sales.reduce((sum, sale) => 
            sum + (parseFloat(sale.sold_price || 0) * sale.quantity_sold), 0
        );
        
        document.getElementById('total-sales').textContent = totalSales;
        document.getElementById('total-revenue').textContent = `₱${totalRevenue.toFixed(2)}`;
        document.getElementById('sales-count').textContent = `Sales: ${totalSales}`;
        
    } catch (error) {
        console.error('Error loading sales:', error);
        showNotification('Error loading sales history', 'error');
    }
}

function updateAdminStats() {
    // Stats are updated in loadMySales and loadAvailableStock
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
        });
    });
}

function showSellModal(accountId, accountName, accountType, availableQty, price) {
    document.getElementById('sell-account-id').value = accountId;
    document.getElementById('sell-account-name').textContent = accountName;
    document.getElementById('sell-account-type').textContent = accountType;
    document.getElementById('sell-available-qty').textContent = availableQty;
    document.getElementById('sell-account-price').textContent = parseFloat(price).toFixed(2);
    
    // Set max quantity
    const quantityInput = document.getElementById('sell-quantity');
    quantityInput.max = availableQty;
    quantityInput.value = 1;
    
    // Set default selling price
    document.getElementById('sell-price').value = parseFloat(price).toFixed(2);
    
    document.getElementById('sell-account-modal').classList.add('active');
}

function hideSellModal() {
    document.getElementById('sell-account-modal').classList.remove('active');
    document.getElementById('sell-account-form').reset();
}

async function handleSellAccount(e) {
    e.preventDefault();
    
    const accountId = document.getElementById('sell-account-id').value;
    const quantitySold = parseInt(document.getElementById('sell-quantity').value);
    const soldPrice = parseFloat(document.getElementById('sell-price').value);
    const notes = document.getElementById('sell-notes').value;
    
    const saleData = {
        account_stock_id: parseInt(accountId),
        quantity_sold: quantitySold,
        sold_price: soldPrice,
        notes: notes
    };
    
    const confirmBtn = document.getElementById('confirm-sell-btn');
    
    try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';
        
        await API.recordSale(saleData);
        
        showNotification('Sale recorded successfully!', 'success');
        hideSellModal();
        
        // Refresh data
        await loadAvailableStock();
        await loadMySales();
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Sale';
    }
}

function setupModalClose() {
    const modal = document.getElementById('sell-account-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', hideSellModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideSellModal();
        }
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
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
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
