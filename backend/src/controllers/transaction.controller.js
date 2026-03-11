const db = require('../config/database');

exports.getTransactions = async (req, res) => {
    const user_id = req.user.user_id;
    try {
        const result = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC', [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

exports.createTransaction = async (req, res) => {
    const user_id = req.user.user_id;
    const { transaction_id, category, amount, service, notes, transaction_date } = req.body;

    try {
        await db.query(
            `INSERT INTO transactions (transaction_id, user_id, category, amount, service, notes, transaction_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [transaction_id, user_id, category, amount, service, notes, transaction_date]
        );
        res.status(201).json({ message: 'Transaction created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating transaction' });
    }
};

exports.updateTransaction = async (req, res) => {
    const user_id = req.user.user_id;
    const transactionId = req.params.id;
    const { category, amount, service, notes, transaction_date } = req.body;

    try {
        const result = await db.query(
            `UPDATE transactions 
             SET category = $1, amount = $2, service = $3, notes = $4, transaction_date = $5 
             WHERE id = $6 AND user_id = $7`,
            [category, amount, service, notes, transaction_date, transactionId, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }

        res.json({ message: 'Transaction updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating transaction' });
    }
};

exports.deleteTransaction = async (req, res) => {
    const user_id = req.user.user_id;
    const transactionId = req.params.id;

    try {
        const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [transactionId, user_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting transaction' });
    }
};
