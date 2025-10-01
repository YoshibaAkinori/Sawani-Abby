// app/api/customers/[id]/route.js
// 顧客詳細取得
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const pool = await getConnection();
    const { id: customerId } = await params;

    const [rows] = await pool.execute(
      `SELECT 
        customer_id,
        line_user_id,
        last_name,
        first_name,
        last_name_kana,
        first_name_kana,
        phone_number,
        email,
        birth_date,
        notes,
        created_at,
        updated_at
      FROM customers
      WHERE customer_id = ?`,
      [customerId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '顧客が見つかりません' },
        { status: 404 }
      );
    }

    // 来店回数を取得
    const [visitCount] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM payments 
       WHERE customer_id = ? AND is_cancelled = FALSE`,
      [customerId]
    );

    const customerData = {
      ...rows[0],
      visit_count: visitCount[0].count
    };

    return NextResponse.json({
      success: true,
      data: customerData
    });
  } catch (error) {
    console.error('顧客詳細取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}