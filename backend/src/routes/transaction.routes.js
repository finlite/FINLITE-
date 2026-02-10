const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken); // Protect all transaction routes

router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
