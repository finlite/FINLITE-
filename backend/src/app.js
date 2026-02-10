const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/user.routes');
const transactionRoutes = require('./routes/transaction.routes');
const businessRoutes = require('./routes/business.routes');
const supportRoutes = require('./routes/support.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/support', supportRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to FinLite API' });
});

module.exports = app;
