// app/api/bookings/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';


// 予約一覧取得
export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const staffId = searchParams.get('staffId');
    const customerId = searchParams.get('customerId');
    const bookingId = searchParams.get('id');

    let query = `
  SELECT 
    b.booking_id,
    b.customer_id,
    b.staff_id,
    b.service_id,
    b.customer_ticket_id,
    b.coupon_id,
    b.limited_offer_id,
    b.date,
    b.start_time,
    b.end_time,
    b.bed_id,
    b.type,
    b.status,
    b.notes,
    b.created_at,
    c.last_name,
    c.first_name,
    s.name as staff_name,
    s.color as staff_color,
    -- 直接のサービス情報(通常予約)
    sv_direct.name as direct_service_name,
    sv_direct.category as direct_service_category,
    -- 回数券情報(後方互換性用・最初の1つのみ)
    tp.name as ticket_plan_name,
    sv_ticket.category as ticket_service_category,
    -- クーポン情報
    cp.name as coupon_name,
    cp.description as coupon_description,
    cp.total_price as coupon_price,
    -- 期間限定オファー情報(後方互換性用・最初の1つのみ)
    lo.name as limited_offer_name,
    lo.description as limited_offer_description,
    lo.special_price as limited_offer_price,
    lo.total_sessions as limited_offer_sessions,
    -- 表示用の名前(優先順位: クーポン > 期間限定 > 回数券 > 通常サービス)
    COALESCE(cp.name, lo.name, tp.name, sv_direct.name) as service_name,
    -- カテゴリ(優先順位: クーポン > 期間限定 > 回数券 > 通常サービス)
    CASE
      WHEN cp.coupon_id IS NOT NULL THEN 'クーポン'
      WHEN lo.offer_id IS NOT NULL THEN '期間限定'
      ELSE COALESCE(sv_direct.category, sv_ticket.category)
    END as service_category
  FROM bookings b
  LEFT JOIN customers c ON b.customer_id = c.customer_id
  LEFT JOIN staff s ON b.staff_id = s.staff_id
  LEFT JOIN services sv_direct ON b.service_id = sv_direct.service_id
  LEFT JOIN customer_tickets ct ON b.customer_ticket_id = ct.customer_ticket_id
  LEFT JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
  LEFT JOIN services sv_ticket ON tp.service_id = sv_ticket.service_id
  LEFT JOIN coupons cp ON b.coupon_id = cp.coupon_id
  LEFT JOIN limited_offers lo ON b.limited_offer_id = lo.offer_id
  WHERE 1=1
`;

    const params = [];

    if (bookingId) {
      query += ' AND b.booking_id = ?';
      params.push(bookingId);
    }

    if (date) {
      query += ' AND b.date = ?';
      params.push(date);
    }

    if (staffId) {
      query += ' AND b.staff_id = ?';
      params.push(staffId);
    }

    if (customerId) {
      query += ' AND b.customer_id = ?';
      params.push(customerId);
    }

    query += ' ORDER BY b.date, b.start_time';

    const [rows] = await pool.execute(query, params);

    // 各予約の追加情報を取得
    for (let booking of rows) {
      // オプション情報を取得
      const [options] = await pool.execute(
        `SELECT 
          bo.booking_option_id,
          o.option_id,
          o.name as option_name,
          o.category as option_category,
          o.price,
          o.duration_minutes
        FROM booking_options bo
        JOIN options o ON bo.option_id = o.option_id
        WHERE bo.booking_id = ?`,
        [booking.booking_id]
      );
      booking.options = options;

      // 複数の回数券情報を取得
      const [tickets] = await pool.execute(
        `SELECT 
          bt.booking_ticket_id,
          bt.customer_ticket_id,
          ct.customer_id,
          tp.name as plan_name,
          tp.total_sessions,
          ct.sessions_remaining,
          ct.expiry_date,
          s.name as service_name,
          s.category as service_category,
          s.duration_minutes,
          s.price
        FROM booking_tickets bt
        JOIN customer_tickets ct ON bt.customer_ticket_id = ct.customer_ticket_id
        JOIN ticket_plans tp ON ct.plan_id = tp.plan_id
        JOIN services s ON tp.service_id = s.service_id
        WHERE bt.booking_id = ?`,
        [booking.booking_id]
      );
      booking.tickets = tickets;

      // 複数の期間限定オファー情報を取得
      const [limitedOffers] = await pool.execute(
        `SELECT 
          blo.booking_limited_offer_id,
          blo.offer_id,
          lo.offer_type,
          lo.name,
          lo.description,
          lo.category,
          lo.duration_minutes,
          lo.special_price,
          lo.total_sessions
        FROM booking_limited_offers blo
        JOIN limited_offers lo ON blo.offer_id = lo.offer_id
        WHERE blo.booking_id = ?`,
        [booking.booking_id]
      );
      booking.limited_offers = limitedOffers;

      // service_nameを複数の回数券・期間限定がある場合は更新
      if (tickets.length > 0) {
        const ticketNames = tickets.map(t => t.plan_name).join(' + ');
        booking.service_name = ticketNames;
        booking.service_category = '回数券';
      } else if (limitedOffers.length > 0) {
        const offerNames = limitedOffers.map(o => o.name).join(' + ');
        booking.service_name = offerNames;
        booking.service_category = '期間限定';
      }
    }

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('予約取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 予約・予定新規登録
export async function POST(request) {
  const pool = await getConnection();
  const connection = await pool.getConnection();

  try {
    const body = await request.json();

    const {
      customer_id,
      staff_id,
      service_id,
      customer_ticket_ids, // ← 配列に変更
      coupon_id,
      limited_offer_ids, // ← 配列に変更
      date,
      start_time,
      end_time,
      bed_id,
      type = 'booking',
      status = 'confirmed',
      notes = '',
      option_ids = []
    } = body;

    // バリデーション
    if (type === 'schedule') {
      // 予定の場合: スタッフと日時のみ必須
      if (!staff_id || !date || !start_time || !end_time) {
        return NextResponse.json(
          { success: false, error: 'スタッフと日時を入力してください' },
          { status: 400 }
        );
      }
    } else {
      // 予約の場合: 従来通りの厳格なバリデーション
      if (!staff_id || !date || !start_time || !end_time) {
        return NextResponse.json(
          { success: false, error: '必須項目を入力してください' },
          { status: 400 }
        );
      }

      // 予約の場合は顧客情報も必要(ただしcustomer_idは後で生成する場合もある)
      if (!customer_id && !body.last_name && !body.first_name) {
        return NextResponse.json(
          { success: false, error: '顧客情報を入力してください' },
          { status: 400 }
        );
      }

      // サービスまたはチケット/クーポン/期間限定のいずれかが必要
      const hasTickets = customer_ticket_ids && customer_ticket_ids.length > 0;
      const hasLimitedOffers = limited_offer_ids && limited_offer_ids.length > 0;

      if (!service_id && !hasTickets && !coupon_id && !hasLimitedOffers) {
        return NextResponse.json(
          { success: false, error: '施術メニューを選択してください' },
          { status: 400 }
        );
      }
    }

    await connection.beginTransaction();

    let finalCustomerId = customer_id;

    // 予約の場合で新規顧客の場合は顧客を先に登録
    if (type === 'booking' && !customer_id && body.last_name && body.first_name) {
      const [customerResult] = await connection.execute(
        `INSERT INTO customers (
          customer_id,
          last_name,
          first_name,
          last_name_kana,
          first_name_kana,
          phone_number,
          email
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
        [
          body.last_name,
          body.first_name,
          body.last_name_kana || '',
          body.first_name_kana || '',
          body.phone_number || '',
          body.email || ''
        ]
      );

      // 挿入されたcustomer_idを取得
      const [customerRow] = await connection.execute(
        'SELECT customer_id FROM customers WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1',
        [body.phone_number]
      );
      finalCustomerId = customerRow[0].customer_id;
    }

    // 予約/予定登録（既存カラムは互換性のため保持、最初の要素のみ設定）
    const [result] = await connection.execute(
      `INSERT INTO bookings (
        booking_id,
        customer_id,
        staff_id,
        service_id,
        customer_ticket_id,
        coupon_id,
        limited_offer_id,
        date,
        start_time,
        end_time,
        bed_id,
        type,
        status,
        notes
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalCustomerId,
        staff_id,
        service_id ?? null,
        customer_ticket_ids && customer_ticket_ids.length > 0 ? customer_ticket_ids[0] : null, // 互換性のため最初の1つ
        coupon_id ?? null,
        limited_offer_ids && limited_offer_ids.length > 0 ? limited_offer_ids[0] : null, // 互換性のため最初の1つ
        date,
        start_time,
        end_time,
        bed_id ?? null,
        type,
        status,
        notes
      ]
    );

    // 挿入されたbooking_idを取得
    const [bookingRow] = await connection.execute(
      `SELECT booking_id FROM bookings 
       WHERE staff_id = ? AND date = ? AND start_time = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [staff_id, date, start_time]
    );
    const bookingId = bookingRow[0].booking_id;

    // 複数の回数券を中間テーブルに登録
    if (customer_ticket_ids && customer_ticket_ids.length > 0) {
      for (const ticketId of customer_ticket_ids) {
        // booking_tickets テーブルに記録するだけ（残回数は減らさない）
        await pool.execute(
          `INSERT INTO booking_tickets (booking_id, customer_ticket_id)
       VALUES (?, ?)`,
          [bookingId, ticketId]
        );
      }
    }

    // 複数の期間限定オファーを中間テーブルに登録
    if (limited_offer_ids && limited_offer_ids.length > 0) {
      for (const offerId of limited_offer_ids) {
        await connection.execute(
          `INSERT INTO booking_limited_offers (
            booking_limited_offer_id,
            booking_id,
            offer_id
          ) VALUES (UUID(), ?, ?)`,
          [bookingId, offerId]
        );
      }
    }

    // 予約の場合のみオプション登録
    if (type === 'booking' && option_ids && option_ids.length > 0) {
      for (const optionId of option_ids) {
        await connection.execute(
          `INSERT INTO booking_options (
            booking_option_id,
            booking_id,
            option_id
          ) VALUES (UUID(), ?, ?)`,
          [bookingId, optionId]
        );
      }
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: type === 'schedule' ? '予定を登録しました' : '予約を登録しました',
      data: {
        booking_id: bookingId,
        customer_id: finalCustomerId
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('登録エラー:', error);
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

// 予約更新
export async function PUT(request) {
  // ★★★ 修正点 ★★★
  const pool = await getConnection();
  const connection = await pool.getConnection();

  try {
    const body = await request.json();

    const {
      booking_id,
      date,
      start_time,
      end_time,
      staff_id,
      bed_id,
      status,
      notes
    } = body;

    if (!booking_id) {
      return NextResponse.json(
        { success: false, error: '予約IDが必要です' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // 予約を更新
    await connection.execute(
      `UPDATE bookings 
       SET date = ?,
           start_time = ?,
           end_time = ?,
           staff_id = ?,
           bed_id = ?,
           status = ?,
           notes = ?
       WHERE booking_id = ?`,
      [date, start_time, end_time, staff_id, bed_id, status, notes, booking_id]
    );

    // 履歴を記録
    await connection.execute(
      `INSERT INTO booking_history (
        history_id,
        booking_id,
        change_type,
        details
      ) VALUES (UUID(), ?, 'update', ?)`,
      [booking_id, JSON.stringify({ date, start_time, end_time, staff_id, bed_id, status })]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: '予約を更新しました'
    });
  } catch (error) {
    await connection.rollback();
    console.error('予約更新エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  } finally {
    // ★★★ 修正点 ★★★
    if (connection) {
      connection.release();
    }
  }
}
// 予約削除/キャンセル
export async function DELETE(request) {
  const pool = await getConnection();
  const connection = await pool.getConnection();

  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: '予約IDが必要です' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // 予約情報を取得
    const [booking] = await connection.execute(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (booking.length === 0) {
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    // 回数券使用の予約の場合は回数を戻す（後方互換性用）
    if (booking[0].customer_ticket_id) {
      await connection.execute(
        `UPDATE customer_tickets 
         SET sessions_remaining = sessions_remaining + 1
         WHERE customer_ticket_id = ?`,
        [booking[0].customer_ticket_id]
      );
    }

    // 中間テーブルに登録されている回数券の回数を戻す
    const [bookingTickets] = await connection.execute(
      'SELECT customer_ticket_id FROM booking_tickets WHERE booking_id = ?',
      [bookingId]
    );

    for (const ticket of bookingTickets) {
      await connection.execute(
        `UPDATE customer_tickets 
         SET sessions_remaining = sessions_remaining + 1
         WHERE customer_ticket_id = ?`,
        [ticket.customer_ticket_id]
      );
    }

    // 履歴を記録
    await connection.execute(
      `INSERT INTO booking_history (
        history_id,
        booking_id,
        change_type,
        details
      ) VALUES (UUID(), ?, 'cancel', ?)`,
      [bookingId, JSON.stringify(booking[0])]
    );

    // 予約をキャンセルに
    await connection.execute(
      `UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [bookingId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: '予約をキャンセルしました'
    });
  } catch (error) {
    await connection.rollback();
    console.error('予約削除エラー:', error);
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