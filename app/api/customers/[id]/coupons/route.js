// app/api/customers/[id]/coupons/route.js
// クーポン利用履歴取得

import { NextResponse } from 'next/server';
import { getConnection } from '../../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const pool = await getConnection();
    const { id: customerId } = await params;

    const [rows] = await pool.execute(
      `SELECT 
        cu.usage_id,
        cu.used_at,
        c.name as coupon_name,
        c.description,
        cu.total_discount_amount,
        p.payment_id
      FROM coupon_usage cu
      JOIN coupons c ON cu.coupon_id = c.coupon_id
      LEFT JOIN payments p ON cu.booking_id = p.booking_id
      WHERE cu.customer_id = ?
      ORDER BY cu.used_at DESC`,
      [customerId]
    );

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('クーポン履歴取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}