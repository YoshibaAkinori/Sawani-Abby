import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'monthly';
    const dateFormat = period === 'yearly' ? '%Y' : '%Y-%m';

    const [rows] = await pool.execute(
      `SELECT 
        s.name as staff_name,
        s.color as staff_color,
        DATE_FORMAT(p.payment_date, ?) as period,
        COUNT(*) as transaction_count,
        SUM(p.total_amount) as total_sales,
        AVG(p.total_amount) as average_sale,
        COUNT(DISTINCT p.customer_id) as unique_customers
      FROM payments p
      JOIN staff s ON p.staff_id = s.staff_id
      WHERE p.is_cancelled = FALSE
        AND DATE(p.payment_date) BETWEEN ? AND ?
      GROUP BY s.staff_id, s.name, s.color, period
      ORDER BY period DESC, total_sales DESC`,
      [dateFormat, startDate, endDate]
    );

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('スタッフ分析取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}