// app/api/customers/[id]/tickets/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../../lib/db';

// 顧客の回数券一覧取得(残額計算含む)
export async function GET(request, { params }) {
  try {
    const pool = await getConnection();
    const { id } = await params;
    const customerId = id;

    // 回数券情報と支払い済み金額を取得
    const [rows] = await pool.execute(
      `SELECT 
        ct.customer_ticket_id,
        ct.customer_id,
        ct.plan_id,
        ct.sessions_remaining,
        ct.purchase_date,
        ct.expiry_date,
        ct.purchase_price,
        tp.name as plan_name,
        tp.price as plan_price,
        tp.total_sessions,
        tp.validity_days,
        s.name as service_name,
        s.category as service_category,
        s.duration_minutes,
        COALESCE(
          (SELECT SUM(amount_paid) 
           FROM ticket_payments 
           WHERE customer_ticket_id = ct.customer_ticket_id),
          0
        ) as total_paid
      FROM customer_tickets ct
      JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
      JOIN services s ON tp.service_id = s.service_id
      WHERE ct.customer_id = ?
      ORDER BY ct.purchase_date DESC`,
      [customerId]
    );

    // 残額を計算して各回数券にステータスを追加
    const today = new Date().toISOString().split('T')[0];
    const ticketsWithRemaining = rows.map(ticket => {
      const remaining_payment = Math.max(0, ticket.purchase_price - ticket.total_paid);
      
      // ステータスを判定
      let status = 'active';
      if (ticket.sessions_remaining === 0) {
        status = 'used_up';
      } else if (ticket.expiry_date < today) {
        status = 'expired';
      }
      
      return {
        ...ticket,
        remaining_payment,
        status
      };
    });

    return NextResponse.json({
      success: true,
      data: ticketsWithRemaining
    });
  } catch (error) {
    console.error('回数券取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}