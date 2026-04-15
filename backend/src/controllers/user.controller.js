const db = require('../config/database');
const ensureAppSchema = require('../config/ensure-schema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const isDatabaseUnavailableError = (err) =>
    ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'].includes(err?.code);

const defaultPreferences = {
    preferred_language: 'en',
    date_format: 'DD/MM/YYYY',
    currency_display: '₦ (Nigerian Naira)',
    number_format: '1,234.56',
    auto_translate: true,
    show_original_text: false
};

const normalizePhone = (phone) => {
    if (phone === undefined || phone === null || phone === '') {
        return null;
    }

    const normalizedPhone = String(phone).replace(/\D/g, '');
    return normalizedPhone || null;
};

const serializePhoto = (photoBuffer) => {
    if (!photoBuffer || !photoBuffer.length) {
        return null;
    }

    const rawValue = Buffer.isBuffer(photoBuffer)
        ? photoBuffer.toString('utf8')
        : String(photoBuffer);

    return rawValue.startsWith('data:') ? rawValue : null;
};

exports.register = async (req, res) => {
    const { full_name, email, phone, password } = req.body;
    try {
        await ensureAppSchema();
        if (!full_name || !email || !password || !phone) {
            return res.status(400).json({ message: 'full_name, email, phone and password are required' });
        }

        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) {
            return res.status(400).json({ message: 'Phone number must contain digits' });
        }

        // Check if user exists
        const existing = await db.query('SELECT email FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (full_name, email, phone, password, photo) VALUES ($1, $2, $3, $4, $5)',
            [full_name, email, normalizedPhone, hashedPassword, Buffer.alloc(0)]
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        if (isDatabaseUnavailableError(err)) {
            return res.status(503).json({ message: 'Database is currently unreachable. Please try again.' });
        }
        res.status(500).json({ message: 'Error registering user' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        await ensureAppSchema();
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'User not found' });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid password' });

        const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                is_premium_member: user.is_premium_member,
                premium_start_date: user.premium_start_date,
                created_at: user.created_at,
                photo_data_url: serializePhoto(user.photo)
            }
        });
    } catch (err) {
        console.error(err);
        if (isDatabaseUnavailableError(err)) {
            return res.status(503).json({ message: 'Database is currently unreachable. Please try again.' });
        }
        res.status(500).json({ message: 'Error logging in' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        await ensureAppSchema();
        const result = await db.query(
            'SELECT user_id, full_name, email, phone, is_premium_member, premium_start_date, created_at, photo FROM users WHERE user_id = $1',
            [req.user.user_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        const profile = result.rows[0];
        res.json({
            ...profile,
            photo_data_url: serializePhoto(profile.photo)
        });
    } catch (err) {
        console.error(err);
        if (isDatabaseUnavailableError(err)) {
            return res.status(503).json({ message: 'Database is currently unreachable. Please try again.' });
        }
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

exports.updateProfile = async (req, res) => {
    const { full_name, email, phone, photo_data_url } = req.body;

    if (!full_name || !email) {
        return res.status(400).json({ message: 'full_name and email are required' });
    }

    const normalizedPhone = normalizePhone(phone);
    if (phone !== undefined && !normalizedPhone) {
        return res.status(400).json({ message: 'Phone number must contain digits' });
    }

    if (photo_data_url !== undefined && photo_data_url !== null && photo_data_url !== '' && !String(photo_data_url).startsWith('data:image/')) {
        return res.status(400).json({ message: 'Photo must be a valid image data URL' });
    }

    try {
        await ensureAppSchema();
        const emailOwner = await db.query(
            'SELECT user_id FROM users WHERE email = $1 AND user_id <> $2',
            [email, req.user.user_id]
        );

        if (emailOwner.rows.length > 0) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        const result = await db.query(
            `UPDATE users
             SET full_name = $1,
                 email = $2,
                 phone = COALESCE($3, phone),
                 photo = COALESCE($4, photo)
             WHERE user_id = $5
             RETURNING user_id, full_name, email, phone, is_premium_member, premium_start_date, created_at, photo`,
            [
                full_name,
                email,
                normalizedPhone,
                photo_data_url ? Buffer.from(String(photo_data_url), 'utf8') : null,
                req.user.user_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = result.rows[0];
        res.json({
            ...profile,
            photo_data_url: serializePhoto(profile.photo)
        });
    } catch (err) {
        console.error(err);
        if (isDatabaseUnavailableError(err)) {
            return res.status(503).json({ message: 'Database is currently unreachable. Please try again.' });
        }
        res.status(500).json({ message: 'Error updating profile' });
    }
};

exports.getPreferences = async (req, res) => {
    try {
        await ensureAppSchema();
        await db.query(
            `INSERT INTO user_settings (user_id)
             VALUES ($1)
             ON CONFLICT (user_id) DO NOTHING`,
            [req.user.user_id]
        );

        const settings = await db.query(
            `SELECT preferred_language, date_format, currency_display, number_format, auto_translate, show_original_text
             FROM user_settings
             WHERE user_id = $1`,
            [req.user.user_id]
        );

        res.json(settings.rows[0] || defaultPreferences);
    } catch (err) {
        console.error(err);
        if (isDatabaseUnavailableError(err)) {
            return res.status(503).json({ message: 'Database is currently unreachable. Please try again.' });
        }
        res.status(500).json({ message: 'Error fetching preferences' });
    }
};

exports.updatePreferences = async (req, res) => {
    const {
        preferred_language = defaultPreferences.preferred_language,
        date_format = defaultPreferences.date_format,
        currency_display = defaultPreferences.currency_display,
        number_format = defaultPreferences.number_format,
        auto_translate = defaultPreferences.auto_translate,
        show_original_text = defaultPreferences.show_original_text
    } = req.body;

    try {
        await ensureAppSchema();
        const result = await db.query(
            `INSERT INTO user_settings (
                user_id, preferred_language, date_format, currency_display, number_format, auto_translate, show_original_text
             ) VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id)
             DO UPDATE SET
                preferred_language = EXCLUDED.preferred_language,
                date_format = EXCLUDED.date_format,
                currency_display = EXCLUDED.currency_display,
                number_format = EXCLUDED.number_format,
                auto_translate = EXCLUDED.auto_translate,
                show_original_text = EXCLUDED.show_original_text
             RETURNING preferred_language, date_format, currency_display, number_format, auto_translate, show_original_text`,
            [
                req.user.user_id,
                preferred_language,
                date_format,
                currency_display,
                number_format,
                Boolean(auto_translate),
                Boolean(show_original_text)
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (isDatabaseUnavailableError(err)) {
            return res.status(503).json({ message: 'Database is currently unreachable. Please try again.' });
        }
        res.status(500).json({ message: 'Error updating preferences' });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    try {
        await ensureAppSchema();
        const result = await db.query(
            'SELECT user_id, password FROM users WHERE user_id = $1',
            [req.user.user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            'UPDATE users SET password = $1 WHERE user_id = $2',
            [hashedPassword, req.user.user_id]
        );
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        if (isDatabaseUnavailableError(err)) {
            return res.status(503).json({ message: 'Database is currently unreachable. Please try again.' });
        }
        res.status(500).json({ message: 'Error changing password' });
    }
};
