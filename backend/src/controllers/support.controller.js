const db = require('../config/database');

exports.createSupportTicket = async (req, res) => {
    const { full_name, email, subject, message } = req.body;
    const user_id = req.user.user_id;

    try {
        const [result] = await db.execute(
            'INSERT INTO support (user_id, full_name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
            [user_id, full_name, email, subject, message]
        );
        res.status(201).json({ message: 'Support ticket created successfully', ticketId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating support ticket' });
    }
};

exports.getUserTickets = async (req, res) => {
    const user_id = req.user.user_id;
    try {
        const [rows] = await db.execute('SELECT * FROM support WHERE user_id = ?', [user_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching support tickets' });
    }
};
