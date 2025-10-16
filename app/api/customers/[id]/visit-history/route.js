// app/api/customers/[id]/visit-history/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const pool = await getConnection();
    const { id: customerId } = await params;
    const connection = await pool.getConnection();

    // 通常の支払い履歴を取得
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
        p.is_cancelled,
        s.name as staff_name,
        DATE(p.payment_date) as date,
        'payment' as record_type
      FROM payments p
      LEFT JOIN staff s ON p.staff_id = s.staff_id
      WHERE p.customer_id = ? 
        AND p.related_payment_id IS NULL
      ORDER BY p.payment_date DESC
    `, [customerId]);

    // キャンセルされた予約を取得
    const [cancelledBookings] = await connection.query(`
      SELECT 
        bh.history_id,
        bh.booking_id,
        bh.changed_at,
        bh.change_type,
        bh.details,
        b.date,
        b.start_time,
        sv.name as service_name,
        s.name as staff_name,
        'cancelled_booking' as record_type
      FROM booking_history bh
      JOIN bookings b ON bh.booking_id = b.booking_id
      LEFT JOIN services sv ON b.service_id = sv.service_id
      LEFT JOIN staff s ON b.staff_id = s.staff_id
      WHERE b.customer_id = ? 
        AND bh.change_type IN ('cancel', 'no_show')
      ORDER BY bh.changed_at DESC
    `, [customerId]);

    const visitHistory = [];

    // 支払い履歴の処理
    for (const payment of payments) {
      // キャンセルされた支払いの場合
      if (payment.is_cancelled) {
        visitHistory.push({
          id: `cancelled_payment_${payment.payment_id}`, // ユニークなID
          payment_id: payment.payment_id,
          date: payment.date,
          service: payment.service_name,
          price: payment.service_price,
          staff: payment.staff_name || '不明',
          payment_type: payment.payment_type,
          payment_method: payment.payment_method,
          amount: payment.total_amount,
          record_type: 'cancelled_payment',
          is_cancelled: true,
          options: [],
          detail_info: null,
          ticket_purchases: []
        });
        continue;
      }

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
        id: `payment_${payment.payment_id}`, // ユニークなID
        payment_id: payment.payment_id,
        date: payment.date,
        service: isParentTicketPurchase ? '' : serviceDisplay,
        price: payment.service_price,
        staff: payment.staff_name || '不明',
        payment_type: payment.payment_type,
        payment_method: payment.payment_method,
        amount: totalAmount,
        record_type: 'payment',
        is_cancelled: false,
        options: options,
        detail_info: detailInfo,
        ticket_purchases: ticketPurchases
      });
    }

    // キャンセルされた予約を追加
    for (const booking of cancelledBookings) {
      // change_typeから無断キャンセルかどうかを判定
      const isNoShow = booking.change_type === 'no_show';
      
      // detailsからキャンセル理由を取得
      let cancelReason = '';
      
      if (booking.details) {
        try {
          const details = typeof booking.details === 'string' 
            ? JSON.parse(booking.details) 
            : booking.details;
          
          // notesフィールドまたはその他の理由フィールドをチェック
          cancelReason = details.notes || details.reason || details.cancel_reason || '';
        } catch (e) {
          // JSON解析失敗時は空文字列
          console.error('JSON parse error:', e);
        }
      }
      
      const cancelType = isNoShow ? '無断キャンセル' : '連絡ありキャンセル';
      const cancelInfo = cancelReason ? `${cancelType} (${cancelReason})` : cancelType;
      
      visitHistory.push({
        id: `booking_${booking.booking_id}_${booking.history_id}`, // ユニークなID
        booking_id: booking.booking_id,
        date: booking.date,
        start_time: booking.start_time,
        service: `${booking.service_name || '予約'} - ${cancelInfo}`,
        staff: booking.staff_name || '不明',
        record_type: 'cancelled_booking',
        is_cancelled: true,
        cancel_type: cancelType,
        cancel_notes: cancelReason
      });
    }

    // 日付順にソート（新しい順）
    visitHistory.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

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