// app/api/analytics/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let data = {};

    switch (type) {
      case 'summary':
        data = await getSummary(pool, startDate, endDate);
        break;
      case 'daily':
        data = await getDailySales(pool, startDate, endDate);
        break;
      case 'monthly':
        data = await getMonthlySales(pool, startDate, endDate);
        break;
      default:
        return NextResponse.json(
          { success: false, error: '分析タイプを指定してください' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('分析データ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'データベースエラー' },
      { status: 500 }
    );
  }
}

// サマリー情報
async function getSummary(pool, startDate, endDate) {
  const [summary] = await pool.execute(
    `SELECT 
      COUNT(*) as total_transactions,
      SUM(total_amount) as total_sales,
      AVG(total_amount) as average_sale,
      SUM(cash_amount) as total_cash,
      SUM(card_amount) as total_card,
      COUNT(DISTINCT customer_id) as unique_customers,
      SUM(CASE WHEN payment_type = 'ticket' THEN 1 ELSE 0 END) as ticket_usage,
      SUM(CASE WHEN payment_type = 'coupon' THEN 1 ELSE 0 END) as coupon_usage
    FROM payments
    WHERE is_cancelled = FALSE
      AND DATE(payment_date) BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [topServices] = await pool.execute(
    `SELECT 
      service_name,
      COUNT(*) as count, 
      SUM(service_price) as revenue
    FROM (
      SELECT 
        CASE 
          WHEN p.payment_type = 'service' THEN s.name
          WHEN p.payment_type = 'ticket' THEN CONCAT(tp.name, ' (回数券)')
          WHEN p.payment_type = 'coupon' THEN CONCAT(c.name, ' (クーポン)')
          WHEN p.payment_type = 'limited_offer' THEN CONCAT(lo.name, ' (期間限定)')
          ELSE p.service_name
        END as service_name,
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
    GROUP BY service_name
    ORDER BY count DESC
    LIMIT 5`,
    [startDate, endDate]
  );

  const [topOptions] = await pool.execute(
    `SELECT 
      o.name as option_name, 
      SUM(po.quantity) as count, 
      SUM(po.price * po.quantity) as revenue
     FROM payment_options po
     JOIN payments p ON po.payment_id = p.payment_id
     JOIN options o ON po.option_id = o.option_id
     WHERE p.is_cancelled = FALSE
       AND DATE(p.payment_date) BETWEEN ? AND ?
     GROUP BY o.option_id, o.name
     ORDER BY count DESC
     LIMIT 5`,
    [startDate, endDate]
  );

  return {
    summary: summary[0],
    topServices,
    topOptions
  };
}

// 日次売上
async function getDailySales(pool, startDate, endDate) {
  const [rows] = await pool.execute(
    `SELECT 
      DATE(payment_date) as date,
      COUNT(*) as transaction_count,
      SUM(total_amount) as total_sales,
      SUM(cash_amount) as cash_sales,
      SUM(card_amount) as card_sales,
      AVG(total_amount) as average_sale
    FROM payments
    WHERE is_cancelled = FALSE
      AND DATE(payment_date) BETWEEN ? AND ?
    GROUP BY DATE(payment_date)
    ORDER BY date DESC`,
    [startDate, endDate]
  );
  return rows;
}

// 月次売上
async function getMonthlySales(pool, startDate, endDate) {
  const [rows] = await pool.execute(
    `SELECT 
      DATE_FORMAT(payment_date, '%Y-%m') as month,
      COUNT(*) as transaction_count,
      SUM(total_amount) as total_sales,
      SUM(cash_amount) as cash_sales,
      SUM(card_amount) as card_sales,
      AVG(total_amount) as average_sale
    FROM payments
    WHERE is_cancelled = FALSE
      AND DATE(payment_date) BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
    ORDER BY month DESC`,
    [startDate, endDate]
  );
  return rows;
}