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
        c.customer_id,
        c.last_name,
        c.first_name,
        c.last_name_kana,
        c.first_name_kana,
        c.phone_number,
        c.email,
        c.birth_date,
        c.base_visit_count,
        c.created_at,
        COUNT(CASE 
          WHEN p.is_cancelled = FALSE 
            AND (p.related_payment_id IS NULL OR p.related_payment_id = '') 
          THEN 1 
        END) as payment_count
      FROM customers c
      LEFT JOIN payments p ON c.customer_id = p.customer_id
      WHERE 1=1
    `;
    
    const params = [];

    if (name) {
      query += ` AND (
        c.last_name LIKE ? OR 
        c.first_name LIKE ? OR 
        CONCAT(c.last_name, c.first_name) LIKE ? OR
        CONCAT(c.last_name, ' ', c.first_name) LIKE ? OR
        c.last_name_kana LIKE ? OR
        c.first_name_kana LIKE ? OR
        CONCAT(c.last_name_kana, c.first_name_kana) LIKE ?
      )`;
      const searchTerm = `%${name}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (phone) {
      query += ' AND c.phone_number LIKE ?';
      params.push(`%${phone.replace(/-/g, '')}%`);
    }

    query += ' GROUP BY c.customer_id ORDER BY c.created_at DESC LIMIT 50';

    const [rows] = await pool.execute(query, params);

    // visit_countを計算して追加
    const customersWithVisitCount = rows.map(customer => ({
      ...customer,
      visit_count: (customer.base_visit_count || 0) + customer.payment_count
    }));

    return NextResponse.json({
      success: true,
      data: customersWithVisitCount
    });
  } catch (error) {
    console.error('顧客検索エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}