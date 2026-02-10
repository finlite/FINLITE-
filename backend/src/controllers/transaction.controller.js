const db = require('../config/database');

exports.getTransactions = async (req, res) => {
    const user_id = req.user.user_id;
    try {
        const [rows] = await db.execute('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC', [user_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

exports.createTransaction = async (req, res) => {
    const user_id = req.user.user_id;
    const { transaction_id, category, amount, service, notes, transaction_date } = req.body;

    try {
        await db.execute(
            `INSERT INTO transactions (transaction_id, user_id, category, amount, service, notes, transaction_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
        const [result] = await db.execute(
            `UPDATE transactions 
             SET category = ?, amount = ?, service = ?, notes = ?, transaction_date = ? 
             WHERE id = ? AND user_id = ?`,
            [category, amount, service, notes, transaction_date, transactionId, user_id]
        );

        if (result.affectedRows === 0) {
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
        const [result] = await db.execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [transactionId, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting transaction' });
    }
};
