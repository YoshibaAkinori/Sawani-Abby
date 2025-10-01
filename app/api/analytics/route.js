// app/api/analytics/route.js
// 売上分析API
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // daily, monthly, service, option, staff
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let data = {};

    switch (type) {
      case 'daily':
        data = await getDailySales(pool, startDate, endDate);
        break;
      case 'monthly':
        data = await getMonthlySales(pool, startDate, endDate);
        break;
      case 'service':
        data = await getServiceAnalysis(pool, startDate, endDate);
        break;
      case 'option':
        data = await getOptionAnalysis(pool, startDate, endDate);
        break;
      case 'staff':
        data = await getStaffAnalysis(pool, startDate, endDate);
        break;
      case 'summary':
        data = await getSummary(pool, startDate, endDate);
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
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
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

// サービス別分析
async function getServiceAnalysis(pool, startDate, endDate) {
  const [rows] = await pool.execute(
    `SELECT 
      service_name,
      COUNT(*) as count,
      SUM(service_price) as total_revenue,
      AVG(service_price) as average_price,
      SUM(service_duration) as total_minutes
    FROM payments
    WHERE is_cancelled = FALSE
      AND service_name IS NOT NULL
      AND DATE(payment_date) BETWEEN ? AND ?
    GROUP BY service_name
    ORDER BY total_revenue DESC`,
    [startDate, endDate]
  );
  return rows;
}

// オプション別分析
async function getOptionAnalysis(pool, startDate, endDate) {
  const [rows] = await pool.execute(
    `SELECT 
      po.option_name,
      po.option_category,
      COUNT(*) as count,
      SUM(po.quantity) as total_quantity,
      SUM(po.price * po.quantity) as total_revenue,
      SUM(CASE WHEN po.is_free = TRUE THEN 1 ELSE 0 END) as free_count
    FROM payment_options po
    JOIN payments p ON po.payment_id = p.payment_id
    WHERE p.is_cancelled = FALSE
      AND DATE(p.payment_date) BETWEEN ? AND ?
    GROUP BY po.option_name, po.option_category
    ORDER BY total_revenue DESC`,
    [startDate, endDate]
  );
  return rows;
}

// スタッフ別分析
async function getStaffAnalysis(pool, startDate, endDate) {
  const [rows] = await pool.execute(
    `SELECT 
      s.name as staff_name,
      s.color as staff_color,
      COUNT(p.payment_id) as transaction_count,
      SUM(p.total_amount) as total_sales,
      AVG(p.total_amount) as average_sale
    FROM payments p
    JOIN staff s ON p.staff_id = s.staff_id
    WHERE p.is_cancelled = FALSE
      AND DATE(p.payment_date) BETWEEN ? AND ?
    GROUP BY s.staff_id, s.name, s.color
    ORDER BY total_sales DESC`,
    [startDate, endDate]
  );
  return rows;
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
    `SELECT service_name, COUNT(*) as count
     FROM payments
     WHERE is_cancelled = FALSE
       AND service_name IS NOT NULL
       AND DATE(payment_date) BETWEEN ? AND ?
     GROUP BY service_name
     ORDER BY count DESC
     LIMIT 5`,
    [startDate, endDate]
  );

  const [topOptions] = await pool.execute(
    `SELECT po.option_name, SUM(po.quantity) as count
     FROM payment_options po
     JOIN payments p ON po.payment_id = p.payment_id
     WHERE p.is_cancelled = FALSE
       AND DATE(p.payment_date) BETWEEN ? AND ?
     GROUP BY po.option_name
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