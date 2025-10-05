// app/api/payments/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

// お会計一覧取得
export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const customerId = searchParams.get('customerId');
    const staffId = searchParams.get('staffId');

    let query = `
      SELECT 
        p.payment_id,
        p.customer_id,
        p.staff_id,
        p.payment_date,
        p.service_name,
        p.service_price,
        p.payment_type,
        p.total_amount,
        p.payment_method,
        p.cash_amount,
        p.card_amount,
        p.is_cancelled,
        c.last_name,
        c.first_name,
        s.name as staff_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      LEFT JOIN staff s ON p.staff_id = s.staff_id
      WHERE p.is_cancelled = FALSE
    `;

    const params = [];

    if (date) {
      query += ' AND DATE(p.payment_date) = ?';
      params.push(date);
    }

    if (customerId) {
      query += ' AND p.customer_id = ?';
      params.push(customerId);
    }

    if (staffId) {
      query += ' AND p.staff_id = ?';
      params.push(staffId);
    }

    query += ' ORDER BY p.payment_date DESC';

    const [rows] = await pool.execute(query, params);

    // 各会計のオプション情報も取得
    for (let payment of rows) {
      const [options] = await pool.execute(
        `SELECT 
          option_name,
          option_category,
          price,
          quantity,
          is_free
        FROM payment_options
        WHERE payment_id = ?`,
        [payment.payment_id]
      );
      payment.options = options;
    }

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('会計取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// お会計新規登録

export async function POST(request) {
  const pool = await getConnection();
  const connection = await pool.getConnection();

  try {
    const body = await request.json();

    const {
      customer_id,
      booking_id,
      staff_id,
      service_id,
      payment_type = 'normal',
      ticket_id,
      coupon_id,
      limited_offer_id,
      options = [], // [{ option_id, quantity, is_free }]
      discount_amount = 0,
      payment_method = 'cash',
      cash_amount = 0,
      card_amount = 0,
      notes = '',
      payment_amount = 0  // ★★★ 回数券の残金支払い額を追加 ★★★
    } = body;

    // バリデーション
    if (!customer_id || !staff_id) {
      return NextResponse.json(
        { success: false, error: '顧客とスタッフは必須です' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // サービス情報を取得(スナップショット用)
    let serviceData = { name: '', price: 0, duration: 0 };
    if (service_id) {
      const [serviceRows] = await connection.execute(
        'SELECT name, price, duration_minutes FROM services WHERE service_id = ?',
        [service_id]
      );
      if (serviceRows.length > 0) {
        serviceData = {
          name: serviceRows[0].name,
          price: serviceRows[0].price,
          duration: serviceRows[0].duration_minutes
        };
      }
    }

    // 回数券使用の場合、回数券情報を取得
    if (payment_type === 'ticket' && ticket_id) {
      const [ticketRows] = await connection.execute(
        `SELECT 
          tp.name as plan_name,
          s.name as service_name,
          s.price as service_price,
          s.duration_minutes as service_duration
        FROM customer_tickets ct
        JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
        JOIN services s ON tp.service_id = s.service_id
        WHERE ct.customer_ticket_id = ?`,
        [ticket_id]
      );

      if (ticketRows.length > 0) {
        // サービス情報がない場合は回数券のサービス情報を使用
        if (!service_id) {
          serviceData = {
            name: ticketRows[0].service_name,
            price: 0, // 回数券使用なので施術自体は0円
            duration: ticketRows[0].service_duration
          };
        }
      }
    }

    // オプション合計を計算
    let optionsTotal = 0;
    const optionDetails = [];

    for (const opt of options) {
      const [optRows] = await connection.execute(
        'SELECT name, category, price, duration_minutes FROM options WHERE option_id = ?',
        [opt.option_id]
      );

      if (optRows.length > 0) {
        const optData = optRows[0];
        const optPrice = opt.is_free ? 0 : optData.price * (opt.quantity || 1);
        optionsTotal += optPrice;

        optionDetails.push({
          option_id: opt.option_id,
          name: optData.name,
          category: optData.category,
          price: optData.price,
          duration: optData.duration_minutes,
          quantity: opt.quantity || 1,
          is_free: opt.is_free || false
        });
      }
    }

    // 合計金額計算
    const serviceSubtotal = serviceData.price;
    // ★★★ 回数券の残金支払いも合計に含める ★★★
    let totalAmount;
    if (payment_type === 'ticket' && payment_amount > 0) {
      // 残金支払いの場合は、実際に支払った金額
      totalAmount = payment_method === 'mixed'
        ? (parseInt(cash_amount) || 0) + (parseInt(card_amount) || 0)
        : (payment_method === 'cash' ? parseInt(cash_amount) || 0 : parseInt(card_amount) || 0);
    } else {
      // 通常の計算
      totalAmount = serviceSubtotal + optionsTotal - discount_amount;
    }

    // お会計レコード作成
    const [result] = await connection.execute(
      `INSERT INTO payments (
        payment_id,
        customer_id,
        booking_id,
        staff_id,
        service_id,
        service_name,
        service_price,
        service_duration,
        payment_type,
        ticket_id,
        coupon_id,
        limited_offer_id,
        service_subtotal,
        options_total,
        discount_amount,
        payment_amount,
        total_amount,
        payment_method,
        cash_amount,
        card_amount,
        notes
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id,
        booking_id || null,
        staff_id,
        service_id || null,
        serviceData.name,
        serviceData.price,
        serviceData.duration,
        payment_type,
        ticket_id || null,
        coupon_id || null,
        limited_offer_id || null,
        serviceSubtotal,
        optionsTotal,
        discount_amount,
        payment_amount,
        totalAmount,  // ★★★ 残金支払いを含めた合計 ★★★
        payment_method,
        cash_amount,
        card_amount,
        notes
      ]
    );

    // 挿入されたpayment_idを取得
    const [paymentRow] = await connection.execute(
      `SELECT payment_id FROM payments 
       WHERE customer_id = ? AND staff_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [customer_id, staff_id]
    );
    const paymentId = paymentRow[0].payment_id;

    // オプション詳細を登録
    for (const opt of optionDetails) {
      await connection.execute(
        `INSERT INTO payment_options (
          payment_option_id,
          payment_id,
          option_id,
          option_name,
          option_category,
          price,
          duration_minutes,
          quantity,
          is_free
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          opt.option_id,
          opt.name,
          opt.category,
          opt.price,
          opt.duration,
          opt.quantity,
          opt.is_free
        ]
      );
    }

    // 回数券使用の場合は残り回数を減らす
    if (ticket_id) {
      await connection.execute(
        `UPDATE customer_tickets 
         SET sessions_remaining = sessions_remaining - 1
         WHERE customer_ticket_id = ? AND sessions_remaining > 0`,
        [ticket_id]
      );
    }

    // 予約のステータスを完了に更新
    if (booking_id) {
      await connection.execute(
        `UPDATE bookings SET status = 'completed' WHERE booking_id = ?`,
        [booking_id]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'お会計を登録しました',
      data: {
        payment_id: paymentId,
        total_amount: totalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('お会計登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー: ' + error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// お会計キャンセル
export async function DELETE(request) {
  const pool = await getConnection();
  const connection = await pool.getConnection();

  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const reason = searchParams.get('reason') || '';

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: '会計IDが必要です' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // 会計情報を取得
    const [payment] = await connection.execute(
      'SELECT * FROM payments WHERE payment_id = ?',
      [paymentId]
    );

    if (payment.length === 0) {
      return NextResponse.json(
        { success: false, error: '会計が見つかりません' },
        { status: 404 }
      );
    }

    // 回数券使用の場合は回数を戻す
    if (payment[0].ticket_id) {
      await connection.execute(
        `UPDATE customer_tickets 
         SET sessions_remaining = sessions_remaining + 1
         WHERE customer_ticket_id = ?`,
        [payment[0].ticket_id]
      );
    }

    // 会計をキャンセル状態に
    await connection.execute(
      `UPDATE payments 
       SET is_cancelled = TRUE, 
           cancelled_at = NOW(),
           cancelled_reason = ?
       WHERE payment_id = ?`,
      [reason, paymentId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'お会計をキャンセルしました'
    });
  } catch (error) {
    await connection.rollback();
    console.error('会計キャンセルエラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}