// app/api/customers/search/route.js
// 顧客検索API
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');

    if (!name && !phone) {
      return NextResponse.json(
        { success: false, error: '検索キーワードを入力してください' },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        customer_id,
        last_name,
        first_name,
        last_name_kana,
        first_name_kana,
        phone_number,
        email,
        birth_date,
        created_at
      FROM customers
      WHERE 1=1
    `;
    
    const params = [];

    if (name) {
      query += ` AND (
        last_name LIKE ? OR 
        first_name LIKE ? OR 
        CONCAT(last_name, first_name) LIKE ? OR
        CONCAT(last_name, ' ', first_name) LIKE ? OR
        last_name_kana LIKE ? OR
        first_name_kana LIKE ? OR
        CONCAT(last_name_kana, first_name_kana) LIKE ?
      )`;
      const searchTerm = `%${name}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (phone) {
      query += ' AND phone_number LIKE ?';
      params.push(`%${phone.replace(/-/g, '')}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [rows] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('顧客検索エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}