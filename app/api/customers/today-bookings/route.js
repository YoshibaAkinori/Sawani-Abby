// app/api/customers/today-bookings/route.js
// 今日の予約者一覧

import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.execute(
      `SELECT 
        b.booking_id,
        b.customer_id,
        b.start_time,
        b.service_id,
        c.last_name,
        c.first_name,
        s.name as service_name,
        st.name as staff_name
      FROM bookings b
      JOIN customers c ON b.customer_id = c.customer_id
      LEFT JOIN services s ON b.service_id = s.service_id
      LEFT JOIN staff st ON b.staff_id = st.staff_id
      WHERE b.date = ? 
        AND b.status IN ('pending', 'confirmed')
        AND b.type = 'booking'
      ORDER BY b.start_time ASC`,
      [today]
    );

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('今日の予約者取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}