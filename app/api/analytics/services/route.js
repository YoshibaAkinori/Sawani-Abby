// app/api/analytics/services/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'monthly'; // monthly or yearly

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: '期間を指定してください' },
        { status: 400 }
      );
    }

    // 期間のフォーマットを決定
    const periodFormat = period === 'yearly' 
      ? "DATE_FORMAT(p.payment_date, '%Y')"
      : "DATE_FORMAT(p.payment_date, '%Y-%m')";

    // 全体のサービス別集計
    const [rows] = await pool.execute(
      `SELECT 
        service_name,
        category,
        CAST(COUNT(*) AS UNSIGNED) as usage_count,
        CAST(SUM(service_price) AS DECIMAL(15,2)) as total_revenue,
        CAST(AVG(service_price) AS DECIMAL(15,2)) as avg_price
      FROM (
        SELECT 
          CASE 
            WHEN p.payment_type = 'normal' THEN s.name
            WHEN p.payment_type = 'ticket' THEN CONCAT(tp.name, ' (回数券使用)')
            WHEN p.payment_type = 'coupon' THEN c.name
            WHEN p.payment_type = 'limited_offer' THEN lo.name
            ELSE p.service_name
          END as service_name,
          CASE 
            WHEN p.payment_type = 'normal' THEN s.category
            WHEN p.payment_type = 'ticket' THEN '回数券'
            WHEN p.payment_type = 'coupon' THEN 'クーポン'
            WHEN p.payment_type = 'limited_offer' THEN '期間限定'
            ELSE 'その他'
          END as category,
          CASE
            WHEN p.payment_type = 'ticket' AND p.service_price = 0 THEN 
              ROUND(ct.purchase_price / tp.total_sessions)
            ELSE p.service_price
          END as service_price
        FROM payments p
        LEFT JOIN services s ON p.service_id = s.service_id
        LEFT JOIN customer_tickets ct ON p.ticket_id = ct.customer_ticket_id
        LEFT JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
        LEFT JOIN coupons c ON p.coupon_id = c.coupon_id
        LEFT JOIN limited_offers lo ON p.limited_offer_id = lo.offer_id
        WHERE p.is_cancelled = FALSE
          AND DATE(p.payment_date) BETWEEN ? AND ?
          AND (p.service_name NOT LIKE '%回数券購入%' OR p.service_name IS NULL)
      ) as service_data
      GROUP BY service_name, category
      ORDER BY total_revenue DESC`,
      [startDate, endDate]
    );

    // 期間別サービス集計
    const [periodRows] = await pool.execute(
      `SELECT 
        period,
        service_name,
        category,
        CAST(COUNT(*) AS UNSIGNED) as usage_count,
        CAST(SUM(service_price) AS DECIMAL(15,2)) as total_revenue,
        CAST(AVG(service_price) AS DECIMAL(15,2)) as avg_price
      FROM (
        SELECT 
          ${periodFormat} as period,
          CASE 
            WHEN p.payment_type = 'normal' THEN s.name
            WHEN p.payment_type = 'ticket' THEN CONCAT(tp.name, ' (回数券使用)')
            WHEN p.payment_type = 'coupon' THEN c.name
            WHEN p.payment_type = 'limited_offer' THEN lo.name
            ELSE p.service_name
          END as service_name,
          CASE 
            WHEN p.payment_type = 'normal' THEN s.category
            WHEN p.payment_type = 'ticket' THEN '回数券'
            WHEN p.payment_type = 'coupon' THEN 'クーポン'
            WHEN p.payment_type = 'limited_offer' THEN '期間限定'
            ELSE 'その他'
          END as category,
          CASE
            WHEN p.payment_type = 'ticket' AND p.service_price = 0 THEN 
              ROUND(ct.purchase_price / tp.total_sessions)
            ELSE p.service_price
          END as service_price
        FROM payments p
        LEFT JOIN services s ON p.service_id = s.service_id
        LEFT JOIN customer_tickets ct ON p.ticket_id = ct.customer_ticket_id
        LEFT JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
        LEFT JOIN coupons c ON p.coupon_id = c.coupon_id
        LEFT JOIN limited_offers lo ON p.limited_offer_id = lo.offer_id
        WHERE p.is_cancelled = FALSE
          AND DATE(p.payment_date) BETWEEN ? AND ?
          AND (p.service_name NOT LIKE '%回数券購入%' OR p.service_name IS NULL)
      ) as service_data
      GROUP BY period, service_name, category
      ORDER BY period, total_revenue DESC`,
      [startDate, endDate]
    );

    // 性別ごとのサービス別集計(実際の支払額ベース)
    const [genderRows] = await pool.execute(
      `SELECT 
        service_name,
        category,
        gender,
        CAST(COUNT(*) AS UNSIGNED) as usage_count,
        CAST(SUM(actual_payment) AS DECIMAL(15,2)) as total_revenue
      FROM (
        SELECT 
          CASE 
            WHEN p.payment_type = 'normal' THEN s.name
            WHEN p.payment_type = 'ticket' THEN CONCAT(tp.name, ' (回数券使用)')
            WHEN p.payment_type = 'coupon' THEN c.name
            WHEN p.payment_type = 'limited_offer' THEN lo.name
            ELSE p.service_name
          END as service_name,
          CASE 
            WHEN p.payment_type = 'normal' THEN s.category
            WHEN p.payment_type = 'ticket' THEN '回数券'
            WHEN p.payment_type = 'coupon' THEN 'クーポン'
            WHEN p.payment_type = 'limited_offer' THEN '期間限定'
            ELSE 'その他'
          END as category,
          p.total_amount as actual_payment,
          cu.gender
        FROM payments p
        LEFT JOIN services s ON p.service_id = s.service_id
        LEFT JOIN customer_tickets ct ON p.ticket_id = ct.customer_ticket_id
        LEFT JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
        LEFT JOIN coupons c ON p.coupon_id = c.coupon_id
        LEFT JOIN limited_offers lo ON p.limited_offer_id = lo.offer_id
        JOIN customers cu ON p.customer_id = cu.customer_id
        WHERE p.is_cancelled = FALSE
          AND DATE(p.payment_date) BETWEEN ? AND ?
          AND cu.gender IS NOT NULL
          AND cu.gender IN ('female', 'male')
          AND (p.service_name NOT LIKE '%回数券購入%' OR p.service_name IS NULL)
      ) as service_data
      GROUP BY service_name, category, gender
      ORDER BY service_name, gender`,
      [startDate, endDate]
    );

    return NextResponse.json({
      success: true,
      data: {
        serviceData: rows,
        serviceByPeriod: periodRows,
        genderData: genderRows
      }
    });
  } catch (error) {
    console.error('サービス分析取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}