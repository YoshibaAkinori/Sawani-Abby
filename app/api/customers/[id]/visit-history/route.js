// app/api/customers/[id]/visit-history/route.js
// 来店履歴取得(paymentsテーブルから)

import { NextResponse } from 'next/server';
import { getConnection } from '../../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const pool = await getConnection();
    const { id: customerId } = await params;

    const [rows] = await pool.execute(
      `SELECT 
        p.payment_id,
        DATE(p.payment_date) as date,
        p.service_name as service,
        s.name as staff,
        p.total_amount as amount,
        p.payment_type,
        p.payment_method
      FROM payments p
      LEFT JOIN staff s ON p.staff_id = s.staff_id
      WHERE p.customer_id = ? AND p.is_cancelled = FALSE
      ORDER BY p.payment_date DESC
      LIMIT 50`,
      [customerId]
    );

    // 各会計のオプション情報も取得
    for (let visit of rows) {
      const [options] = await pool.execute(
        `SELECT option_name, quantity, is_free
         FROM payment_options
         WHERE payment_id = ?`,
        [visit.payment_id]
      );
      visit.options = options;
    }

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('来店履歴取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}