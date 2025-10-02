// app/api/customers/[id]/visit-history/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'salon_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function GET(request, { params }) {
  try {
    const customerId = params.id;
    const connection = await pool.getConnection();

    // 来店履歴取得（paymentsテーブルから）
    const [payments] = await connection.query(`
      SELECT 
        p.payment_id,
        p.payment_date,
        p.service_name,
        p.service_id,
        p.payment_type,
        p.payment_method,
        p.total_amount,
        p.ticket_id,
        p.coupon_id,
        p.limited_offer_id,
        s.name as staff_name,
        DATE(p.payment_date) as date
      FROM payments p
      LEFT JOIN staff s ON p.staff_id = s.staff_id
      WHERE p.customer_id = ? 
        AND p.is_cancelled = FALSE
      ORDER BY p.payment_date DESC
    `, [customerId]);

    // 各会計のオプション情報と詳細情報を取得
    const visitHistory = [];
    
    for (const payment of payments) {
      // オプション情報取得
      const [options] = await connection.query(`
        SELECT 
          option_name,
          price,
          is_free
        FROM payment_options
        WHERE payment_id = ?
      `, [payment.payment_id]);

      let serviceDisplay = payment.service_name;
      let detailInfo = null;

      // payment_typeに応じて追加情報を取得
      if (payment.payment_type === 'ticket' && payment.ticket_id) {
        // 回数券情報
        const [ticketInfo] = await connection.query(`
          SELECT 
            ct.sessions_remaining,
            tp.name as plan_name,
            tp.total_sessions,
            s.name as service_name
          FROM customer_tickets ct
          JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
          LEFT JOIN services s ON tp.service_id = s.service_id
          WHERE ct.customer_ticket_id = ?
        `, [payment.ticket_id]);
        
        if (ticketInfo.length > 0) {
          // 回数券購入か使用かを判定
          const isTicketPurchase = payment.service_name && payment.service_name.includes('回数券購入');
          
          detailInfo = {
            type: isTicketPurchase ? 'ticket_purchase' : 'ticket_use',
            plan_name: ticketInfo[0].plan_name,
            service_name: ticketInfo[0].service_name,
            total_sessions: ticketInfo[0].total_sessions,
            is_purchase: isTicketPurchase
          };
          
          if (isTicketPurchase) {
            serviceDisplay = `${ticketInfo[0].plan_name}`;
          } else {
            // 回数券使用の場合は実際の施術名を表示
            serviceDisplay = ticketInfo[0].service_name || payment.service_name;
          }
        }
      } else if (payment.payment_type === 'coupon' && payment.coupon_id) {
        // クーポン情報
        const [couponInfo] = await connection.query(`
          SELECT 
            c.name as coupon_name,
            c.description,
            c.total_price,
            s.name as base_service_name
          FROM coupons c
          LEFT JOIN services s ON c.base_service_id = s.service_id
          WHERE c.coupon_id = ?
        `, [payment.coupon_id]);
        
        if (couponInfo.length > 0) {
          detailInfo = {
            type: 'coupon',
            coupon_name: couponInfo[0].coupon_name,
            description: couponInfo[0].description,
            base_service: couponInfo[0].base_service_name
          };
          serviceDisplay = couponInfo[0].coupon_name;
        }
      } else if (payment.payment_type === 'limited_offer' && payment.limited_offer_id) {
        // 期間限定オファー情報
        const [offerInfo] = await connection.query(`
          SELECT 
            name,
            description,
            original_price,
            total_sessions
          FROM limited_offers
          WHERE offer_id = ?
        `, [payment.limited_offer_id]);
        
        if (offerInfo.length > 0) {
          detailInfo = {
            type: 'limited_offer',
            offer_name: offerInfo[0].name,
            description: offerInfo[0].description,
            sessions: offerInfo[0].total_sessions
          };
          serviceDisplay = offerInfo[0].name;
        }
      }

      visitHistory.push({
        payment_id: payment.payment_id,
        date: payment.date,
        service: serviceDisplay,
        staff: payment.staff_name || '不明',
        payment_type: payment.payment_type,
        payment_method: payment.payment_method,
        amount: payment.total_amount,
        options: options,
        detail_info: detailInfo // 追加情報
      });
    }

    connection.release();

    return NextResponse.json({
      success: true,
      data: visitHistory
    });

  } catch (error) {
    console.error('来店履歴取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}