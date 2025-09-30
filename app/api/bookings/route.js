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

    let query = `
      SELECT 
        b.booking_id,
        b.customer_id,
        b.staff_id,
        b.service_id,
        b.customer_ticket_id,
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
        sv.name as service_name,
        sv.category as service_category
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.customer_id
      LEFT JOIN staff s ON b.staff_id = s.staff_id
      LEFT JOIN services sv ON b.service_id = sv.service_id
      WHERE 1=1
    `;

    const params = [];

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

    // 各予約のオプション情報も取得
    for (let booking of rows) {
      const [options] = await pool.execute(
        `SELECT 
          o.option_id,
          o.name as option_name,
          o.price,
          o.duration_minutes
        FROM booking_options bo
        JOIN options o ON bo.option_id = o.option_id
        WHERE bo.booking_id = ?`,
        [booking.booking_id]
      );
      booking.options = options;
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
      customer_ticket_id,
      coupon_id,
      limited_offer_id,
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

      // 予約の場合は顧客情報も必要（ただしcustomer_idは後で生成する場合もある）
      if (!customer_id && !body.last_name && !body.first_name) {
        return NextResponse.json(
          { success: false, error: '顧客情報を入力してください' },
          { status: 400 }
        );
      }

      // サービスまたはチケット/クーポン/期間限定のいずれかが必要
      if (!service_id && !customer_ticket_id && !coupon_id && !limited_offer_id) {
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

    // 予約/予定登録
    const [result] = await connection.execute(
      `INSERT INTO bookings (
        booking_id,
        customer_id,
        staff_id,
        service_id,
        customer_ticket_id,
        date,
        start_time,
        end_time,
        bed_id,
        type,
        status,
        notes
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalCustomerId,
        staff_id,
        service_id ?? null,         // undefinedの場合はnullを渡す
        customer_ticket_id ?? null, // undefinedの場合はnullを渡す
        date,
        start_time,
        end_time,
        bed_id ?? null,             // undefinedの場合はnullを渡す
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

    // 回数券使用の場合は残り回数を減らす
    if (customer_ticket_id) {
      await connection.execute(
        `UPDATE customer_tickets 
         SET sessions_remaining = sessions_remaining - 1
         WHERE customer_ticket_id = ? AND sessions_remaining > 0`,
        [customer_ticket_id]
      );
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
    // ★★★ 修正点 ★★★
    // connectionが存在する場合のみreleaseを呼び出す
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
  // ★★★ 修正点 ★★★
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

    // 回数券使用の予約の場合は回数を戻す
    if (booking[0].customer_ticket_id) {
      await connection.execute(
        `UPDATE customer_tickets 
         SET sessions_remaining = sessions_remaining + 1
         WHERE customer_ticket_id = ?`,
        [booking[0].customer_ticket_id]
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

    // 予約を削除（またはステータスをキャンセルに）
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
    // ★★★ 修正点 ★★★
    if (connection) {
      connection.release();
    }
  }
}