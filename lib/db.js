// lib/db.js
import mysql from 'mysql2/promise';

let pool = null;

export async function getConnection() {
  if (!pool) {
    // シンプルな接続設定（開発環境用）
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'salon_user',
      password: process.env.DB_PASSWORD || 'salonPass456!',
      database: process.env.DB_NAME || 'salon_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('データベース接続プール作成成功');
  }

  return pool;
}