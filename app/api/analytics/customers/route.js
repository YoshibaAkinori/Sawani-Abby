import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const [repeatAnalysis] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN visit_count > 1 THEN customer_id END) as repeat_customers,
        ROUND(COUNT(DISTINCT CASE WHEN visit_count > 1 THEN customer_id END) / COUNT(DISTINCT customer_id) * 100, 1) as repeat_rate
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

    const [avgRepeatDays] = await pool.execute(
      `SELECT 
        AVG(days_between) as avg_repeat_days
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

    return NextResponse.json({
      success: true,
      data: {
        repeatAnalysis: repeatAnalysis[0],
        avgRepeatDays: avgRepeatDays[0],
        visitDistribution,
        ticketPurchaseTiming,
        ltvAnalysis: ltvAnalysis[0]
      }
    });
  } catch (error) {
    console.error('顧客分析取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}