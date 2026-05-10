const { Pool } = require('pg');
require('dotenv').config();

// Support both individual variables and full Connection String (Render style)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render gives this
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // Required for Render/ElephantSQL
  // Fallback for local
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

module.exports = pool;
