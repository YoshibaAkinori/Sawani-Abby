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
    const period = searchParams.get('period') || 'monthly'; // monthly or yearly

    let data = {};

    switch (type) {
      case 'summary':
        data = await getSummary(pool, startDate, endDate);
        break;
      case 'sales':
        data = await getSalesTrend(pool, startDate, endDate, period);
        break;
      case 'service':
        data = await getServiceAnalysis(pool, startDate, endDate, period);
        break;
      case 'option':
        data = await getOptionAnalysis(pool, startDate, endDate, period);
        break;
      case 'staff':
        data = await getStaffAnalysis(pool, startDate, endDate, period);
        break;
      case 'customer':
        data = await getCustomerAnalysis(pool, startDate, endDate);
        break;
      case 'coupon':
        data = await getCouponAnalysis(pool, startDate, endDate, period);
        break;
      case 'limited':
        data = await getLimitedOfferAnalysis(pool, startDate, endDate, period);
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
      CASE 
        WHEN p.payment_type = 'service' THEN s.name
        WHEN p.payment_type = 'ticket' THEN CONCAT(tp.name, ' (回数券)')
        WHEN p.payment_type = 'coupon' THEN CONCAT(c.name, ' (クーポン)')
        WHEN p.payment_type = 'limited' THEN CONCAT(lto.name, ' (期間限定)')
        ELSE p.service_name
      END as service_name,
      COUNT(*) as count, 
      SUM(p.service_price) as revenue
     FROM payments p
     LEFT JOIN services s ON p.service_id = s.service_id AND p.payment_type = 'service'
     LEFT JOIN customer_tickets ct ON p.ticket_id = ct.customer_ticket_id AND p.payment_type = 'ticket'
     LEFT JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
     LEFT JOIN coupons c ON p.payment_type = 'coupon' 
       AND c.coupon_id = (
         SELECT cu.coupon_id FROM coupon_usage cu 
         WHERE cu.customer_id = p.customer_id 
         AND DATE(cu.used_at) = DATE(p.payment_date)
         LIMIT 1
       )
     LEFT JOIN bookings b ON p.booking_id = b.booking_id
     LEFT JOIN limited_ticket_purchases ltp ON b.limited_ticket_id = ltp.purchase_id AND p.payment_type = 'limited'
     LEFT JOIN limited_ticket_offers lto ON ltp.offer_id = lto.offer_id
     WHERE p.is_cancelled = FALSE
       AND DATE(p.payment_date) BETWEEN ? AND ?
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
     GROUP BY o.name
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

// 売上推移
async function getSalesTrend(pool, startDate, endDate, period) {
  const dateFormat = period === 'yearly' 
    ? '%Y' 
    : '%Y-%m';
  
  const [rows] = await pool.execute(
    `SELECT 
      DATE_FORMAT(payment_date, ?) as period,
      COUNT(*) as transaction_count,
      SUM(total_amount) as total_sales,
      SUM(cash_amount) as cash_sales,
      SUM(card_amount) as card_sales,
      AVG(total_amount) as average_sale,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM payments
    WHERE is_cancelled = FALSE
      AND DATE(payment_date) BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(payment_date, ?)
    ORDER BY period DESC`,
    [dateFormat, startDate, endDate, dateFormat]
  );
  return rows;
}

// サービス別分析
async function getServiceAnalysis(pool, startDate, endDate, period) {
  const dateFormat = period === 'yearly' ? '%Y' : '%Y-%m';
  
  const [rows] = await pool.execute(
    `SELECT 
      CASE 
        WHEN p.payment_type = 'service' THEN s.name
        WHEN p.payment_type = 'ticket' THEN CONCAT(tp.name, ' (回数券)')
        WHEN p.payment_type = 'coupon' THEN CONCAT(c.name, ' (クーポン)')
        WHEN p.payment_type = 'limited' THEN CONCAT(lto.name, ' (期間限定)')
        ELSE p.service_name
      END as service_name,
      p.payment_type,
      DATE_FORMAT(p.payment_date, ?) as period,
      COUNT(*) as count,
      SUM(p.service_price) as total_revenue,
      AVG(p.service_price) as average_price,
      SUM(p.service_duration) as total_minutes
    FROM payments p
    LEFT JOIN services s ON p.service_id = s.service_id AND p.payment_type = 'service'
    LEFT JOIN customer_tickets ct ON p.ticket_id = ct.customer_ticket_id AND p.payment_type = 'ticket'
    LEFT JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
    LEFT JOIN coupons c ON p.payment_type = 'coupon' 
      AND EXISTS (
        SELECT 1 FROM coupon_usage cu 
        WHERE cu.customer_id = p.customer_id 
        AND DATE(cu.used_at) = DATE(p.payment_date)
      )
      AND c.coupon_id = (
        SELECT cu2.coupon_id FROM coupon_usage cu2 
        WHERE cu2.customer_id = p.customer_id 
        AND DATE(cu2.used_at) = DATE(p.payment_date)
        LIMIT 1
      )
    LEFT JOIN bookings b ON p.booking_id = b.booking_id
    LEFT JOIN limited_ticket_purchases ltp ON b.limited_ticket_id = ltp.purchase_id AND p.payment_type = 'limited'
    LEFT JOIN limited_ticket_offers lto ON ltp.offer_id = lto.offer_id
    WHERE p.is_cancelled = FALSE
      AND DATE(p.payment_date) BETWEEN ? AND ?
    GROUP BY 
      CASE 
        WHEN p.payment_type = 'service' THEN s.name
        WHEN p.payment_type = 'ticket' THEN CONCAT(tp.name, ' (回数券)')
        WHEN p.payment_type = 'coupon' THEN CONCAT(c.name, ' (クーポン)')
        WHEN p.payment_type = 'limited' THEN CONCAT(lto.name, ' (期間限定)')
        ELSE p.service_name
      END,
      p.payment_type,
      DATE_FORMAT(p.payment_date, ?)
    ORDER BY period DESC, total_revenue DESC`,
    [dateFormat, startDate, endDate, dateFormat]
  );
  return rows;
}

// オプション別分析
async function getOptionAnalysis(pool, startDate, endDate, period) {
  const dateFormat = period === 'yearly' ? '%Y' : '%Y-%m';
  
  const [rows] = await pool.execute(
    `SELECT 
      o.name as option_name,
      o.category as option_category,
      DATE_FORMAT(p.payment_date, ?) as period,
      COUNT(*) as usage_count,
      SUM(po.quantity) as total_quantity,
      SUM(po.price * po.quantity) as total_revenue,
      SUM(CASE WHEN po.is_free = TRUE THEN 1 ELSE 0 END) as free_count,
      SUM(CASE WHEN po.is_free = FALSE THEN 1 ELSE 0 END) as paid_count
    FROM payment_options po
    JOIN payments p ON po.payment_id = p.payment_id
    JOIN options o ON po.option_id = o.option_id
    WHERE p.is_cancelled = FALSE
      AND DATE(p.payment_date) BETWEEN ? AND ?
    GROUP BY o.name, o.category, DATE_FORMAT(p.payment_date, ?)
    ORDER BY period DESC, total_revenue DESC`,
    [dateFormat, startDate, endDate, dateFormat]
  );
  return rows;
}

// スタッフ別分析
async function getStaffAnalysis(pool, startDate, endDate, period) {
  const dateFormat = period === 'yearly' ? '%Y' : '%Y-%m';
  
  const [rows] = await pool.execute(
    `SELECT 
      s.name as staff_name,
      s.color as staff_color,
      DATE_FORMAT(p.payment_date, ?) as period,
      COUNT(p.payment_id) as transaction_count,
      SUM(p.total_amount) as total_sales,
      AVG(p.total_amount) as average_sale,
      COUNT(DISTINCT p.customer_id) as unique_customers
    FROM payments p
    JOIN staff s ON p.staff_id = s.staff_id
    WHERE p.is_cancelled = FALSE
      AND DATE(p.payment_date) BETWEEN ? AND ?
    GROUP BY s.staff_id, s.name, s.color, DATE_FORMAT(p.payment_date, ?)
    ORDER BY period DESC, total_sales DESC`,
    [dateFormat, startDate, endDate, dateFormat]
  );
  return rows;
}

// 顧客分析
async function getCustomerAnalysis(pool, startDate, endDate) {
  // リピート率分析
  const [repeatAnalysis] = await pool.execute(
    `SELECT 
      COUNT(DISTINCT customer_id) as total_customers,
      COUNT(DISTINCT CASE WHEN visit_count > 1 THEN customer_id END) as repeat_customers,
      ROUND(COUNT(DISTINCT CASE WHEN visit_count > 1 THEN customer_id END) * 100.0 / COUNT(DISTINCT customer_id), 2) as repeat_rate
    FROM (
      SELECT 
        customer_id,
        COUNT(*) as visit_count
      FROM payments
      WHERE is_cancelled = FALSE
        AND DATE(payment_date) BETWEEN ? AND ?
      GROUP BY customer_id
    ) as customer_visits`,
    [startDate, endDate]
  );

  // 平均リピート日数
  const [avgRepeatDays] = await pool.execute(
    `SELECT 
      AVG(days_between) as avg_repeat_days,
      MIN(days_between) as min_repeat_days,
      MAX(days_between) as max_repeat_days
    FROM (
      SELECT 
        customer_id,
        DATEDIFF(
          payment_date,
          LAG(payment_date) OVER (PARTITION BY customer_id ORDER BY payment_date)
        ) as days_between
      FROM payments
      WHERE is_cancelled = FALSE
        AND DATE(payment_date) BETWEEN ? AND ?
    ) as repeat_intervals
    WHERE days_between IS NOT NULL`,
    [startDate, endDate]
  );

  // 来店回数別顧客分布
  const [visitDistribution] = await pool.execute(
    `SELECT 
      CASE 
        WHEN visit_count = 1 THEN '1回'
        WHEN visit_count BETWEEN 2 AND 3 THEN '2-3回'
        WHEN visit_count BETWEEN 4 AND 5 THEN '4-5回'
        WHEN visit_count BETWEEN 6 AND 10 THEN '6-10回'
        ELSE '11回以上'
      END as visit_range,
      COUNT(*) as customer_count
    FROM (
      SELECT 
        customer_id,
        COUNT(*) as visit_count
      FROM payments
      WHERE is_cancelled = FALSE
        AND DATE(payment_date) BETWEEN ? AND ?
      GROUP BY customer_id
    ) as customer_visits
    GROUP BY visit_range
    ORDER BY 
      CASE visit_range
        WHEN '1回' THEN 1
        WHEN '2-3回' THEN 2
        WHEN '4-5回' THEN 3
        WHEN '6-10回' THEN 4
        ELSE 5
      END`,
    [startDate, endDate]
  );

  // 回数券購入タイミング分析
  const [ticketPurchaseTiming] = await pool.execute(
    `SELECT 
      CASE 
        WHEN visit_number = 1 THEN '初回'
        WHEN visit_number = 2 THEN '2回目'
        WHEN visit_number = 3 THEN '3回目'
        WHEN visit_number BETWEEN 4 AND 5 THEN '4-5回目'
        ELSE '6回目以降'
      END as visit_timing,
      COUNT(*) as purchase_count
    FROM (
      SELECT 
        ct.customer_ticket_id,
        ct.purchase_date,
        (
          SELECT COUNT(*)
          FROM payments p
          WHERE p.customer_id = ct.customer_id
            AND p.is_cancelled = FALSE
            AND DATE(p.payment_date) < ct.purchase_date
        ) + 1 as visit_number
      FROM customer_tickets ct
      WHERE DATE(ct.purchase_date) BETWEEN ? AND ?
    ) as ticket_visits
    GROUP BY visit_timing
    ORDER BY 
      CASE visit_timing
        WHEN '初回' THEN 1
        WHEN '2回目' THEN 2
        WHEN '3回目' THEN 3
        WHEN '4-5回目' THEN 4
        ELSE 5
      END`,
    [startDate, endDate]
  );

  // 顧客LTV分析
  const [ltvAnalysis] = await pool.execute(
    `SELECT 
      AVG(customer_ltv) as avg_ltv,
      MIN(customer_ltv) as min_ltv,
      MAX(customer_ltv) as max_ltv
    FROM (
      SELECT 
        customer_id,
        SUM(total_amount) as customer_ltv
      FROM payments
      WHERE is_cancelled = FALSE
        AND DATE(payment_date) BETWEEN ? AND ?
      GROUP BY customer_id
    ) as customer_values`,
    [startDate, endDate]
  );

  return {
    repeatAnalysis: repeatAnalysis[0],
    avgRepeatDays: avgRepeatDays[0],
    visitDistribution,
    ticketPurchaseTiming,
    ltvAnalysis: ltvAnalysis[0]
  };
}

// クーポン分析
async function getCouponAnalysis(pool, startDate, endDate, period) {
  const dateFormat = period === 'yearly' ? '%Y' : '%Y-%m';
  
  // クーポン使用状況
  const [usageByPeriod] = await pool.execute(
    `SELECT 
      DATE_FORMAT(cu.used_at, ?) as period,
      COUNT(*) as usage_count,
      SUM(cu.total_discount_amount) as total_discount,
      AVG(cu.total_discount_amount) as avg_discount
    FROM coupon_usage cu
    WHERE DATE(cu.used_at) BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(cu.used_at, ?)
    ORDER BY period DESC`,
    [dateFormat, startDate, endDate, dateFormat]
  );

  // クーポン別使用状況
  const [usageByCoupon] = await pool.execute(
    `SELECT 
      c.name as coupon_name,
      COUNT(cu.usage_id) as usage_count,
      SUM(cu.total_discount_amount) as total_discount,
      c.usage_limit,
      c.is_active
    FROM coupons c
    LEFT JOIN coupon_usage cu ON c.coupon_id = cu.coupon_id
      AND DATE(cu.used_at) BETWEEN ? AND ?
    GROUP BY c.coupon_id, c.name, c.usage_limit, c.is_active
    ORDER BY usage_count DESC`,
    [startDate, endDate]
  );

  // クーポンの無料オプション利用状況
  const [freeOptionUsage] = await pool.execute(
    `SELECT 
      o.name as option_name,
      COUNT(*) as selection_count
    FROM coupon_usage cu
    JOIN JSON_TABLE(
      cu.selected_free_options,
      '$[*]' COLUMNS(
        option_id CHAR(36) PATH '$.option_id'
      )
    ) AS jt
    JOIN options o ON jt.option_id = o.option_id
    WHERE DATE(cu.used_at) BETWEEN ? AND ?
    GROUP BY o.name
    ORDER BY selection_count DESC
    LIMIT 10`,
    [startDate, endDate]
  );

  return {
    usageByPeriod,
    usageByCoupon,
    freeOptionUsage
  };
}

// 期間限定オファー分析
async function getLimitedOfferAnalysis(pool, startDate, endDate, period) {
  const dateFormat = period === 'yearly' ? '%Y' : '%Y-%m';
  
  // 期間限定販売状況
  const [salesByPeriod] = await pool.execute(
    `SELECT 
      DATE_FORMAT(ltp.purchase_date, ?) as period,
      COUNT(*) as purchase_count,
      SUM(ltp.purchase_price) as total_revenue,
      AVG(ltp.purchase_price) as avg_price
    FROM limited_ticket_purchases ltp
    WHERE DATE(ltp.purchase_date) BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(ltp.purchase_date, ?)
    ORDER BY period DESC`,
    [dateFormat, startDate, endDate, dateFormat]
  );

  // オファー別販売状況
  const [salesByOffer] = await pool.execute(
    `SELECT 
      lto.name as offer_name,
      lto.service_name,
      lto.special_price,
      lto.max_sales,
      COUNT(ltp.purchase_id) as current_sales,
      SUM(ltp.purchase_price) as total_revenue,
      lto.sale_end_date,
      lto.is_active
    FROM limited_ticket_offers lto
    LEFT JOIN limited_ticket_purchases ltp ON lto.offer_id = ltp.offer_id
      AND DATE(ltp.purchase_date) BETWEEN ? AND ?
    GROUP BY lto.offer_id, lto.name, lto.service_name, lto.special_price, lto.max_sales, lto.sale_end_date, lto.is_active
    ORDER BY current_sales DESC`,
    [startDate, endDate]
  );

  // 期間限定チケット使用状況
  const [usageStatus] = await pool.execute(
    `SELECT 
      COUNT(*) as total_purchased,
      SUM(CASE WHEN sessions_remaining > 0 THEN 1 ELSE 0 END) as active_tickets,
      SUM(CASE WHEN sessions_remaining = 0 THEN 1 ELSE 0 END) as completed_tickets,
      SUM(CASE WHEN expiry_date < CURDATE() AND sessions_remaining > 0 THEN 1 ELSE 0 END) as expired_tickets,
      AVG(sessions_remaining) as avg_sessions_remaining
    FROM limited_ticket_purchases
    WHERE DATE(purchase_date) BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  return {
    salesByPeriod,
    salesByOffer,
    usageStatus: usageStatus[0]
  };
}