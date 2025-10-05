// app/api/coupons/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

// クーポン一覧取得 (変更なし)
export async function GET(request) {
  try {
    const pool = await getConnection();
    
    const [rows] = await pool.execute(
      `SELECT 
        c.coupon_id,
        c.name,
        c.description,
        c.total_duration_minutes,
        c.base_service_id,
        c.free_option_count,
        c.total_price,
        c.validity_days,
        c.usage_limit,
        c.used_count,
        c.is_active,
        c.created_at,
        s.name as service_name,
        s.duration_minutes as service_duration,
        s.price as service_price
      FROM coupons c
      LEFT JOIN services s ON c.base_service_id = s.service_id
      ORDER BY c.created_at DESC`
    );

    // 各クーポンの指定オプションを取得
    for (let coupon of rows) {
      const [options] = await pool.execute(
        `SELECT 
          cio.option_id,
          cio.quantity,
          o.name as option_name,
          o.price as option_price,
          o.duration_minutes
        FROM coupon_included_options cio
        JOIN options o ON cio.option_id = o.option_id
        WHERE cio.coupon_id = ?
        ORDER BY o.name`,
        [coupon.coupon_id]
      );
      coupon.included_options = options;
    }

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('クーポン取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// クーポン新規登録
export async function POST(request) {
  const pool = await getConnection();
  const connection = await pool.getConnection(); // ★★★ 修正 ★★★
  
  try {
    const body = await request.json();

    const {
      name, description, total_duration_minutes, base_service_id, 
      included_options = [], free_option_count = 0, total_price, 
      validity_days = 180, usage_limit, is_active = true
    } = body;

    if (!name || !total_price) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO coupons (
        coupon_id, name, description, total_duration_minutes, base_service_id, free_option_count,
        total_price, validity_days, usage_limit, is_active
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description || '', total_duration_minutes || 0, base_service_id || null,
        free_option_count, total_price, validity_days, usage_limit || null, is_active
      ]
    );

    const [couponRow] = await connection.execute(
      'SELECT coupon_id FROM coupons WHERE name = ? ORDER BY created_at DESC LIMIT 1',
      [name]
    );
    const couponId = couponRow[0].coupon_id;

    if (included_options && included_options.length > 0) {
      for (const option of included_options) {
        await connection.execute(
          `INSERT INTO coupon_included_options (
            coupon_option_id, coupon_id, option_id, quantity
          ) VALUES (UUID(), ?, ?, ?)`,
          [couponId, option.option_id, option.quantity || 1]
        );
      }
    }

    await connection.commit();

    return NextResponse.json({ success: true, message: 'クーポンを登録しました' });
  } catch (error) {
    await connection.rollback();
    console.error('クーポン登録エラー:', error);
    return NextResponse.json({ success: false, error: 'データベースエラー' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release(); // ★★★ 修正 ★★★
    }
  }
}

// クーポン更新
export async function PUT(request) {
  const pool = await getConnection();
  const connection = await pool.getConnection(); // ★★★ 修正 ★★★
  
  try {
    const body = await request.json();

    const {
      coupon_id, name, description, total_duration_minutes, base_service_id,
      included_options = [], free_option_count, total_price, 
      validity_days, usage_limit, is_active
    } = body;

    if (!coupon_id || !name || !total_price) {
      return NextResponse.json({ success: false, error: '必須項目を入力してください' }, { status: 400 });
    }

    await connection.beginTransaction();

    await connection.execute(
      `UPDATE coupons 
       SET name = ?, description = ?, total_duration_minutes = ?, base_service_id = ?, 
           free_option_count = ?, total_price = ?, validity_days = ?, 
           usage_limit = ?, is_active = ?
       WHERE coupon_id = ?`,
      [
        name, description || '', total_duration_minutes || 0, base_service_id || null,
        free_option_count, total_price, validity_days, usage_limit || null,
        is_active, coupon_id
      ]
    );

    await connection.execute('DELETE FROM coupon_included_options WHERE coupon_id = ?', [coupon_id]);

    if (included_options && included_options.length > 0) {
      for (const option of included_options) {
        await connection.execute(
          `INSERT INTO coupon_included_options (
            coupon_option_id, coupon_id, option_id, quantity
          ) VALUES (UUID(), ?, ?, ?)`,
          [coupon_id, option.option_id, option.quantity || 1]
        );
      }
    }

    await connection.commit();

    return NextResponse.json({ success: true, message: 'クーポン情報を更新しました' });
  } catch (error) {
    await connection.rollback();
    console.error('クーポン更新エラー:', error);
    return NextResponse.json({ success: false, error: 'データベースエラー' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release(); // ★★★ 修正 ★★★
    }
  }
}

// クーポン削除 (変更なし)
export async function DELETE(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('id');

    if (!couponId) {
      return NextResponse.json({ success: false, error: 'クーポンIDが必要です' }, { status: 400 });
    }

    const [usage] = await pool.execute('SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?', [couponId]);

    if (usage[0].count > 0) {
      await pool.execute('UPDATE coupons SET is_active = FALSE WHERE coupon_id = ?', [couponId]);
      return NextResponse.json({ success: true, message: '使用履歴があるため無効化しました' });
    }

    await pool.execute('DELETE FROM coupons WHERE coupon_id = ?', [couponId]);

    return NextResponse.json({ success: true, message: 'クーポンを削除しました' });
  } catch (error) {
    console.error('クーポン削除エラー:', error);
    return NextResponse.json({ success: false, error: 'データベースエラー' }, { status: 500 });
  }
}