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

    const [salesByPeriod] = await pool.execute(
      `SELECT 
        DATE_FORMAT(p.payment_date, ?) as period,
        COUNT(*) as purchase_count,
        SUM(p.total_amount) as total_revenue,
        AVG(p.total_amount) as avg_price
      FROM payments p
      WHERE p.payment_type = 'limited_offer'
        AND p.is_cancelled = FALSE
        AND DATE(p.payment_date) BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period DESC`,
      [dateFormat, startDate, endDate]
    );

    const [salesByOffer] = await pool.execute(
      `SELECT 
        lo.name as offer_name,
        lo.description as service_name,
        lo.special_price,
        lo.max_sales,
        COUNT(p.payment_id) as current_sales,
        SUM(p.total_amount) as total_revenue,
        lo.end_date as sale_end_date,
        lo.is_active
      FROM limited_offers lo
      LEFT JOIN payments p ON lo.offer_id = p.limited_offer_id
        AND p.payment_type = 'limited_offer'
        AND p.is_cancelled = FALSE
        AND DATE(p.payment_date) BETWEEN ? AND ?
      GROUP BY lo.offer_id, lo.name, lo.description, lo.special_price, lo.max_sales, lo.end_date, lo.is_active
      ORDER BY current_sales DESC`,
      [startDate, endDate]
    );

    return NextResponse.json({
      success: true,
      data: {
        salesByPeriod,
        salesByOffer
      }
    });
  } catch (error) {
    console.error('期間限定オファー分析取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}