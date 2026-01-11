const express = require('express');
const cors = require('cors');
const db = require('./src/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

db.query('SELECT * FROM users').then((results) => {
    console.log(results);
}).catch((err) => {
    console.log(err);
});

// Register route
app.post('/register', async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (full_name, email, phone, password) VALUES (?, ?, ?, ?)', [full_name, email, phone, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET);
    res.json({ token, user: { user_id: user.user_id, full_name: user.full_name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT user_id, full_name, email, phone, is_premium_member FROM users WHERE user_id = ?', [req.user.user_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

app.listen(8081, () => {
    console.log('Server is running on port 8081');
});