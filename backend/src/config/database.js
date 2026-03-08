const mysql = require('mysql2');
require('dotenv').config();

const useSsl = process.env.DB_SSL === 'true';
const dbPort = Number(process.env.DB_PORT || 3306);
const connectTimeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: dbPort,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: connectTimeoutMs,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined
});

module.exports = pool.promise();
