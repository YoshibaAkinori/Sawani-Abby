// app/api/customers/[id]/visit-history/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const pool = await getConnection();
    const { id: customerId } = await params;
    const connection = await pool.getConnection();

    const [payments] = await connection.query(`
      SELECT 
        p.payment_id,
        p.payment_date,
        p.service_name,
        p.service_price,
        p.service_id,
        p.payment_type,
        p.payment_method,
        p.total_amount,
        p.ticket_id,
        p.coupon_id,
        p.limited_offer_id,
        p.notes,
        p.related_payment_id,
        p.payment_amount,
        s.name as staff_name,
        DATE(p.payment_date) as date
      FROM payments p
      LEFT JOIN staff s ON p.staff_id = s.staff_id
      WHERE p.customer_id = ? 
        AND p.is_cancelled = FALSE
        AND p.related_payment_id IS NULL
      ORDER BY p.payment_date DESC
    `, [customerId]);

    const visitHistory = [];

    for (const payment of payments) {
      const [childPayments] = await connection.query(`
        SELECT 
          payment_id,
          service_name,
          total_amount,
          notes,
          ticket_id,
          payment_type,
          payment_amount
        FROM payments
        WHERE related_payment_id = ?
        ORDER BY payment_date ASC
      `, [payment.payment_id]);

      // 孫レコードも取得
      const allChildPayments = [...childPayments];
      for (const child of childPayments) {
        const [grandChildren] = await connection.query(`
          SELECT 
            payment_id,
            service_name,
            total_amount,
            notes,
            ticket_id,
            payment_type,
            payment_amount
          FROM payments
          WHERE related_payment_id = ?
          ORDER BY payment_date ASC
        `, [child.payment_id]);
        
        allChildPayments.push(...grandChildren);
      }

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
      let ticketPurchases = [];
      let ticketUses = [];
      let totalAmount = payment.total_amount;

      // ★親レコード自体の残金支払い額を加算
      if (payment.payment_amount > 0) {
        totalAmount += payment.payment_amount;
      }

      const immediateUseMap = new Map();

      for (const child of allChildPayments) {
        if (child.notes && child.notes.includes('回数券購入時の初回使用') && child.ticket_id) {
          immediateUseMap.set(child.ticket_id, true);
        }
      }

      const isParentTicketPurchase = payment.payment_type === 'ticket' &&
        payment.service_name &&
        payment.service_name.includes('回数券購入');

      if (isParentTicketPurchase && payment.ticket_id) {
        const [ticketInfo] = await connection.query(`
          SELECT 
            tp.name as plan_name,
            tp.total_sessions,
            s.name as service_name
          FROM customer_tickets ct
          JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
          LEFT JOIN services s ON tp.service_id = s.service_id
          WHERE ct.customer_ticket_id = ?
        `, [payment.ticket_id]);

        if (ticketInfo.length > 0) {
          const hasImmediateUse = immediateUseMap.get(payment.ticket_id) || false;
          ticketPurchases.push({
            plan_name: ticketInfo[0].plan_name,
            service_name: ticketInfo[0].service_name,
            total_sessions: ticketInfo[0].total_sessions,
            amount: payment.total_amount,
            is_immediate_use: hasImmediateUse
          });
        }
      }

      const isParentTicketUse = payment.payment_type === 'ticket' && 
        payment.ticket_id && 
        !isParentTicketPurchase;

      for (const child of allChildPayments) {
        if (child.notes && child.notes.includes('回数券購入時の初回使用')) {
          continue;
        } else if (child.service_name && child.service_name.includes('回数券購入')) {
          totalAmount += child.total_amount;

          const [ticketInfo] = await connection.query(`
            SELECT 
              tp.name as plan_name,
              tp.total_sessions,
              s.name as service_name
            FROM customer_tickets ct
            JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
            LEFT JOIN services s ON tp.service_id = s.service_id
            WHERE ct.customer_ticket_id = ?
          `, [child.ticket_id]);

          if (ticketInfo.length > 0) {
            const hasImmediateUse = immediateUseMap.get(child.ticket_id) || false;
            ticketPurchases.push({
              plan_name: ticketInfo[0].plan_name,
              service_name: ticketInfo[0].service_name,
              total_sessions: ticketInfo[0].total_sessions,
              amount: child.total_amount,
              is_immediate_use: hasImmediateUse
            });
          }
        } else if (child.payment_type === 'ticket' && child.ticket_id) {
          // ★子レコードの残金支払い額も加算
          if (child.payment_amount > 0) {
            totalAmount += child.payment_amount;
          }

          const [ticketInfo] = await connection.query(`
            SELECT 
              tp.name as plan_name
            FROM customer_tickets ct
            JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
            WHERE ct.customer_ticket_id = ?
          `, [child.ticket_id]);

          if (ticketInfo.length > 0) {
            ticketUses.push({
              plan_name: ticketInfo[0].plan_name,
              remaining_payment: child.payment_amount || 0
            });
          }
        }
      }

      if (isParentTicketUse) {
        const [ticketInfo] = await connection.query(`
          SELECT 
            tp.name as plan_name
          FROM customer_tickets ct
          JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
          WHERE ct.customer_ticket_id = ?
        `, [payment.ticket_id]);

        if (ticketInfo.length > 0) {
          ticketUses.unshift({
            plan_name: ticketInfo[0].plan_name,
            remaining_payment: payment.payment_amount || 0
          });
        }
      }

      if (ticketUses.length > 0) {
        detailInfo = {
          type: 'ticket_use',
          ticket_uses: ticketUses,
          total_remaining_payment: ticketUses.reduce((sum, t) => sum + (t.remaining_payment || 0), 0)
        };
      } else if (payment.payment_type === 'coupon' && payment.coupon_id) {
        const [couponInfo] = await connection.query(`
          SELECT 
            c.name as coupon_name,
            c.description
          FROM coupons c
          WHERE c.coupon_id = ?
        `, [payment.coupon_id]);

        if (couponInfo.length > 0) {
          detailInfo = {
            type: 'coupon',
            coupon_name: couponInfo[0].coupon_name,
            description: couponInfo[0].description
          };
        }
      } else if (payment.payment_type === 'limited_offer' && payment.limited_offer_id) {
        const [offerInfo] = await connection.query(`
          SELECT 
            name,
            description,
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
        }
      }

      visitHistory.push({
        payment_id: payment.payment_id,
        date: payment.date,
        service: isParentTicketPurchase ? '' : serviceDisplay,
        price: payment.service_price,
        staff: payment.staff_name || '不明',
        payment_type: payment.payment_type,
        payment_method: payment.payment_method,
        amount: totalAmount,
        options: options,
        detail_info: detailInfo,
        ticket_purchases: ticketPurchases
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