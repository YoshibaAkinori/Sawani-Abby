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

    const [usageByPeriod] = await pool.execute(
      `SELECT 
        DATE_FORMAT(p.payment_date, ?) as period,
        COUNT(*) as usage_count,
        SUM(p.discount_amount) as total_discount,
        AVG(p.discount_amount) as avg_discount
      FROM payments p
      WHERE p.payment_type = 'coupon'
        AND p.is_cancelled = FALSE
        AND DATE(p.payment_date) BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period DESC`,
      [dateFormat, startDate, endDate]
    );

    const [usageByCoupon] = await pool.execute(
      `SELECT 
        c.name as coupon_name,
        COUNT(p.payment_id) as usage_count,
        SUM(p.discount_amount) as total_discount,
        c.usage_limit,
        c.is_active
      FROM coupons c
      LEFT JOIN payments p ON c.coupon_id = p.coupon_id
        AND p.payment_type = 'coupon'
        AND p.is_cancelled = FALSE
        AND DATE(p.payment_date) BETWEEN ? AND ?
      GROUP BY c.coupon_id, c.name, c.usage_limit, c.is_active
      ORDER BY usage_count DESC`,
      [startDate, endDate]
    );

    return NextResponse.json({
      success: true,
      data: {
        usageByPeriod,
        usageByCoupon
      }
    });
  } catch (error) {
    console.error('クーポン分析取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}