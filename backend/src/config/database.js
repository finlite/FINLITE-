const { Pool } = require('pg');

const useSsl = process.env.DB_SSL === 'true';
const dbPort = Number(process.env.DB_PORT || 5432);
const connectTimeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000);
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  host: connectionString ? undefined : process.env.DB_HOST,
  port: connectionString ? undefined : dbPort,
  user: connectionString ? undefined : process.env.DB_USER,
  password: connectionString ? undefined : (process.env.DB_PASSWORD || ''),
  database: connectionString ? undefined : process.env.DB_NAME,
  max: 10,
  connectionTimeoutMillis: connectTimeoutMs,
  idleTimeoutMillis: 30000,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

module.exports = pool;
