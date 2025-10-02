// app/api/customers/[id]/tickets/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const pool = await getConnection();
    const { id: customerId } = await params;

    // 回数券情報と支払い状況を取得
    const [rows] = await pool.execute(
      `SELECT 
        ct.customer_ticket_id,
        ct.purchase_date,
        ct.expiry_date,
        ct.sessions_remaining,
        ct.purchase_price,
        tp.name as plan_name,
        tp.total_sessions,
        s.name as service_name,
        s.free_option_choices,
        -- すでに支払った金額の合計
        COALESCE((
          SELECT SUM(amount_paid) 
          FROM ticket_payments 
          WHERE customer_ticket_id = ct.customer_ticket_id
        ), 0) as total_paid,
        CASE 
          WHEN ct.sessions_remaining > 0 AND ct.expiry_date >= CURDATE() THEN 'active'
          WHEN ct.sessions_remaining <= 0 THEN 'used_up'
          ELSE 'expired'
        END as status
      FROM customer_tickets ct
      JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
      JOIN services s ON tp.service_id = s.service_id
      WHERE ct.customer_id = ?
      ORDER BY ct.expiry_date DESC`,
      [customerId]
    );

    // 残り支払額を計算
    const ticketsWithPayment = rows.map(ticket => ({
      ...ticket,
      remaining_payment: ticket.purchase_price - ticket.total_paid
    }));

    return NextResponse.json({
      success: true,
      data: ticketsWithPayment
    });
  } catch (error) {
    console.error('回数券取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}