import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const [rows] = await pool.execute(
      `SELECT 
        service_name,
        category,
        COUNT(*) as usage_count,
        SUM(service_price) as total_revenue,
        AVG(service_price) as avg_price
      FROM (
        SELECT 
          CASE 
            WHEN p.payment_type = 'service' THEN s.name
            WHEN p.payment_type = 'ticket' THEN tp.name
            WHEN p.payment_type = 'coupon' THEN c.name
            WHEN p.payment_type = 'limited_offer' THEN lo.name
            ELSE p.service_name
          END as service_name,
          CASE 
            WHEN p.payment_type = 'service' THEN s.category
            WHEN p.payment_type = 'ticket' THEN '回数券'
            WHEN p.payment_type = 'coupon' THEN 'クーポン'
            WHEN p.payment_type = 'limited_offer' THEN '期間限定'
            ELSE 'その他'
          END as category,
          p.service_price
        FROM payments p
        LEFT JOIN services s ON p.service_id = s.service_id
        LEFT JOIN customer_tickets ct ON p.ticket_id = ct.customer_ticket_id
        LEFT JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
        LEFT JOIN coupons c ON p.coupon_id = c.coupon_id
        LEFT JOIN limited_offers lo ON p.limited_offer_id = lo.offer_id
        WHERE p.is_cancelled = FALSE
          AND DATE(p.payment_date) BETWEEN ? AND ?
      ) as service_data
      GROUP BY service_name, category
      ORDER BY total_revenue DESC`,
      [startDate, endDate]
    );

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('サービス分析取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}