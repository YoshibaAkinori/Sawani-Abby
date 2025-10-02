// lib/db.js
import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'salon_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+09:00', // 日本時間（JST）を指定
  dateStrings: ['DATE', 'DATETIME'] // DATE, DATETIMEを文字列で取得
};

const pool = mysql.createPool(poolConfig);

export async function getConnection() {
  return pool;
}

export default pool;