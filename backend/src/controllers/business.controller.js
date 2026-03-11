const db = require('../config/database');

exports.getBusinessInfo = async (req, res) => {
    const user_id = req.user.user_id;
    try {
        const result = await db.query('SELECT * FROM business_info WHERE user_id = $1', [user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Business info not found' });
        }

        const businessInfo = result.rows[0];
        // Parse JSON fields if they are strings
        try {
            if (typeof businessInfo.open_hours === 'string') {
                businessInfo.open_hours = JSON.parse(businessInfo.open_hours);
            }
            if (typeof businessInfo.online_prescence === 'string') {
                businessInfo.online_prescence = JSON.parse(businessInfo.online_prescence);
            }
        } catch (e) {
            console.error('Error parsing JSON fields:', e);
            // If parsing fails, proceed with original values
        }

        res.json(businessInfo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching business info' });
    }
};

exports.upsertBusinessInfo = async (req, res) => {
    const user_id = req.user.user_id;
    const { address, business_type, business_phone, business_email, open_hours, online_prescence } = req.body;

    // Ensure open_hours and online_prescence are strings if they need to be stored as JSON
    const openHoursJson = typeof open_hours === 'object' ? JSON.stringify(open_hours) : open_hours;
    const onlinePresenceJson = typeof online_prescence === 'object' ? JSON.stringify(online_prescence) : online_prescence;

    try {
        // Check if exists
        const existing = await db.query('SELECT business_id FROM business_info WHERE user_id = $1', [user_id]);

        if (existing.rows.length > 0) {
            // Update
            await db.query(
                `UPDATE business_info 
                 SET address = $1, business_type = $2, business_phone = $3, business_email = $4, open_hours = $5, online_prescence = $6 
                 WHERE user_id = $7`,
                [address, business_type, business_phone, business_email, openHoursJson, onlinePresenceJson, user_id]
            );
            res.json({ message: 'Business info updated successfully' });
        } else {
            // Create
            await db.query(
                `INSERT INTO business_info (user_id, address, business_type, business_phone, business_email, open_hours, online_prescence) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [user_id, address, business_type, business_phone, business_email, openHoursJson, onlinePresenceJson]
            );
            res.status(201).json({ message: 'Business info created successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error saving business info' });
    }
};
