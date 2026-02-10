const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const businessRoutes = require('./src/routes/businessRoutes');
const supportRoutes = require('./src/routes/supportRoutes');

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

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
