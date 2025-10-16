// app/api/analytics/cancel-stats/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 期間内のキャンセル統計を取得
    const [cancelStats] = await pool.execute(
      `SELECT
        COUNT(*) as total_cancels,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as with_contact_cancels,
        SUM(CASE WHEN b.status = 'no_show' THEN 1 ELSE 0 END) as no_show_cancels
      FROM bookings b
      WHERE b.date BETWEEN ? AND ?
        AND b.type = 'booking'
        AND b.status IN ('cancelled', 'no_show')`,
      [startDate, endDate]
    );

    // 日別キャンセル数
    const [dailyCancels] = await pool.execute(
      `SELECT
        DATE(b.date) as date,
        COUNT(*) as cancel_count,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as with_contact,
        SUM(CASE WHEN b.status = 'no_show' THEN 1 ELSE 0 END) as no_show
      FROM bookings b
      WHERE b.date BETWEEN ? AND ?
        AND b.type = 'booking'
        AND b.status IN ('cancelled', 'no_show')
      GROUP BY DATE(b.date)
      ORDER BY date DESC`,
      [startDate, endDate]
    );

    // スタッフ別キャンセル数
    const [staffCancels] = await pool.execute(
      `SELECT
        s.name as staff_name,
        s.color as staff_color,
        COUNT(*) as cancel_count,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as with_contact,
        SUM(CASE WHEN b.status = 'no_show' THEN 1 ELSE 0 END) as no_show
      FROM bookings b
      JOIN staff s ON b.staff_id = s.staff_id
      WHERE b.date BETWEEN ? AND ?
        AND b.type = 'booking'
        AND b.status IN ('cancelled', 'no_show')
      GROUP BY s.staff_id, s.name, s.color
      ORDER BY cancel_count DESC`,
      [startDate, endDate]
    );

    // 総予約数を取得（キャンセル率計算用）
    const [totalBookings] = await pool.execute(
      `SELECT COUNT(*) as total
      FROM bookings
      WHERE date BETWEEN ? AND ?
        AND type = 'booking'`,
      [startDate, endDate]
    );

    const cancelRate = totalBookings[0].total > 0
      ? ((cancelStats[0].total_cancels / totalBookings[0].total) * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_cancels: cancelStats[0].total_cancels,
          with_contact_cancels: cancelStats[0].with_contact_cancels,
          no_show_cancels: cancelStats[0].no_show_cancels,
          total_bookings: totalBookings[0].total,
          cancel_rate: parseFloat(cancelRate)
        },
        daily: dailyCancels,
        by_staff: staffCancels
      }
    });
  } catch (error) {
    console.error('キャンセル統計取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}