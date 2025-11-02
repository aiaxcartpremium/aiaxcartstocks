const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// For Supabase connection - CORRECT VERSION
const dbConfig = {
    host: process.env.DB_HOST || 'tjwxdjaybeoekefougzt.supabase.co', // WALANG 'db.' at WALANG 'https://'
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Smfmariano09',
    database: process.env.DB_NAME || 'postgres',
    port: 5432,
    ssl: { rejectUnauthorized: false } // Lagyan mo na lang palagi para safe
};
// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stock_management'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Auth middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const [users] = await pool.execute(
            'SELECT id, username, email, role FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(403).json({ error: 'User not found or inactive' });
        }
        
        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );
        
        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Account routes
app.get('/api/accounts', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT a.*, u.username as created_by_name 
            FROM account_stocks a 
            LEFT JOIN users u ON a.created_by = u.id 
            WHERE 1=1
        `;
        const params = [];
        
        // Filter by status if provided
        if (req.query.status) {
            query += ' AND a.status = ?';
            params.push(req.query.status);
        }
        
        // If admin, only show available accounts
        if (req.user.role === 'admin') {
            query += ' AND a.status = "available" AND a.available_quantity > 0';
        }
        
        query += ' ORDER BY a.created_at DESC';
        
        const [accounts] = await pool.execute(query, params);
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/accounts', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can create accounts' });
        }
        
        const { account_name, account_type, description, price, quantity } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO account_stocks 
            (account_name, account_type, description, price, quantity, available_quantity, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [account_name, account_type, description, price, quantity, quantity, req.user.id]
        );
        
        res.status(201).json({ 
            message: 'Account stock created successfully',
            accountId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { account_stock_id, quantity_sold, sold_price, notes } = req.body;
        
        // Check if account exists and has enough quantity
        const [accounts] = await connection.execute(
            'SELECT * FROM account_stocks WHERE id = ? AND status = "available" FOR UPDATE',
            [account_stock_id]
        );
        
        if (accounts.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Account not found or not available' });
        }
        
        const account = accounts[0];
        
        if (account.available_quantity < quantity_sold) {
            await connection.rollback();
            return res.status(400).json({ error: 'Insufficient quantity available' });
        }
        
        // Update account quantity
        const newQuantity = account.available_quantity - quantity_sold;
        const newStatus = newQuantity === 0 ? 'sold_out' : 'available';
        
        await connection.execute(
            'UPDATE account_stocks SET available_quantity = ?, status = ? WHERE id = ?',
            [newQuantity, newStatus, account_stock_id]
        );
        
        // Record sale
        const [saleResult] = await connection.execute(
            `INSERT INTO sales 
            (account_stock_id, sold_by, quantity_sold, sold_price, notes) 
            VALUES (?, ?, ?, ?, ?)`,
            [account_stock_id, req.user.id, quantity_sold, sold_price, notes]
        );
        
        // Update admin sales summary
        const [summary] = await connection.execute(
            'SELECT * FROM admin_sales_summary WHERE admin_id = ?',
            [req.user.id]
        );
        
        if (summary.length > 0) {
            await connection.execute(
                `UPDATE admin_sales_summary 
                SET total_sales = total_sales + ?, 
                    total_revenue = total_revenue + ?,
                    last_sale_date = NOW(),
                    updated_at = NOW()
                WHERE admin_id = ?`,
                [quantity_sold, sold_price * quantity_sold, req.user.id]
            );
        } else {
            await connection.execute(
                `INSERT INTO admin_sales_summary 
                (admin_id, total_sales, total_revenue, last_sale_date) 
                VALUES (?, ?, ?, NOW())`,
                [req.user.id, quantity_sold, sold_price * quantity_sold]
            );
        }
        
        await connection.commit();
        
        res.status(201).json({ 
            message: 'Sale recorded successfully',
            saleId: saleResult.insertId,
            remainingQuantity: newQuantity
        });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

app.get('/api/sales', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT s.*, a.account_name, a.account_type, u.username as sold_by_name
            FROM sales s
            JOIN account_stocks a ON s.account_stock_id = a.id
            JOIN users u ON s.sold_by = u.id
        `;
        const params = [];
        
        // If admin, only show their sales
        if (req.user.role === 'admin') {
            query += ' WHERE s.sold_by = ?';
            params.push(req.user.id);
        }
        
        query += ' ORDER BY s.sold_at DESC';
        
        const [sales] = await pool.execute(query, params);
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin-stats', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can view admin stats' });
        }
        
        const [stats] = await pool.execute(`
            SELECT u.username, u.email, 
                   COALESCE(s.total_sales, 0) as total_sales,
                   COALESCE(s.total_revenue, 0) as total_revenue,
                   s.last_sale_date
            FROM users u
            LEFT JOIN admin_sales_summary s ON u.id = s.admin_id
            WHERE u.role = 'admin' AND u.is_active = TRUE
            ORDER BY s.total_sales DESC
        `);
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
