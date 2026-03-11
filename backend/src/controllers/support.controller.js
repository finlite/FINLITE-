const db = require('../config/database');

exports.createSupportTicket = async (req, res) => {
    const { full_name, email, subject, message } = req.body;
    const user_id = req.user.user_id;

    try {
        const result = await db.query(
            'INSERT INTO support (user_id, full_name, email, subject, message) VALUES ($1, $2, $3, $4, $5) RETURNING support_id',
            [user_id, full_name, email, subject, message]
        );
        res.status(201).json({ message: 'Support ticket created successfully', ticketId: result.rows[0].support_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating support ticket' });
    }
};

exports.getUserTickets = async (req, res) => {
    const user_id = req.user.user_id;
    try {
        const result = await db.query('SELECT * FROM support WHERE user_id = $1', [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching support tickets' });
    }
};
