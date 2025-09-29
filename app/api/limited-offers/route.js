// app/api/limited-offers/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

// 期間限定オファー一覧取得
export async function GET(request) {
  try {
    const pool = await getConnection();
    
    const [rows] = await pool.execute(
      `SELECT 
        offer_id,
        name,
        description,
        service_name,
        total_sessions,
        regular_price,
        special_price,
        validity_days,
        sale_end_date,
        max_sales,
        current_sales,
        is_active,
        created_at,
        ROUND((1 - (special_price / regular_price)) * 100) as discount_rate,
        FLOOR(special_price / total_sessions) as price_per_session
      FROM limited_ticket_offers
      ORDER BY created_at DESC`
    );

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('期間限定オファー取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 期間限定オファー新規登録
export async function POST(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      name,
      description,
      service_name,
      total_sessions = 5,
      regular_price,
      special_price,
      validity_days = 180,
      sale_end_date,
      max_sales,
      is_active = true
    } = body;

    // バリデーション
    if (!name || !service_name || !regular_price || !special_price) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    if (special_price >= regular_price) {
      return NextResponse.json(
        { success: false, error: '特別価格は通常価格より安く設定してください' },
        { status: 400 }
      );
    }

    // 挿入
    await pool.execute(
      `INSERT INTO limited_ticket_offers (
        offer_id,
        name,
        description,
        service_name,
        total_sessions,
        regular_price,
        special_price,
        validity_days,
        sale_end_date,
        max_sales,
        is_active
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || '',
        service_name,
        total_sessions,
        regular_price,
        special_price,
        validity_days,
        sale_end_date || null,
        max_sales || null,
        is_active
      ]
    );

    return NextResponse.json({
      success: true,
      message: '期間限定オファーを登録しました'
    });
  } catch (error) {
    console.error('期間限定オファー登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 期間限定オファー更新
export async function PUT(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      offer_id,
      name,
      description,
      service_name,
      total_sessions,
      regular_price,
      special_price,
      validity_days,
      sale_end_date,
      max_sales,
      is_active
    } = body;

    // バリデーション
    if (!offer_id || !name || !service_name || !regular_price || !special_price) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    if (special_price >= regular_price) {
      return NextResponse.json(
        { success: false, error: '特別価格は通常価格より安く設定してください' },
        { status: 400 }
      );
    }

    // 更新
    await pool.execute(
      `UPDATE limited_ticket_offers 
       SET name = ?, 
           description = ?,
           service_name = ?,
           total_sessions = ?,
           regular_price = ?,
           special_price = ?,
           validity_days = ?,
           sale_end_date = ?,
           max_sales = ?,
           is_active = ?
       WHERE offer_id = ?`,
      [
        name,
        description || '',
        service_name,
        total_sessions,
        regular_price,
        special_price,
        validity_days,
        sale_end_date || null,
        max_sales || null,
        is_active,
        offer_id
      ]
    );

    return NextResponse.json({
      success: true,
      message: '期間限定オファー情報を更新しました'
    });
  } catch (error) {
    console.error('期間限定オファー更新エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 期間限定オファー削除
export async function DELETE(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('id');

    if (!offerId) {
      return NextResponse.json(
        { success: false, error: 'オファーIDが必要です' },
        { status: 400 }
      );
    }

    // 購入履歴があるかチェック
    const [purchases] = await pool.execute(
      'SELECT COUNT(*) as count FROM limited_ticket_purchases WHERE offer_id = ?',
      [offerId]
    );

    if (purchases[0].count > 0) {
      // 購入履歴がある場合は無効化のみ
      await pool.execute(
        'UPDATE limited_ticket_offers SET is_active = FALSE WHERE offer_id = ?',
        [offerId]
      );
      return NextResponse.json({
        success: true,
        message: '購入履歴があるため無効化しました'
      });
    }

    // 削除実行
    await pool.execute(
      'DELETE FROM limited_ticket_offers WHERE offer_id = ?',
      [offerId]
    );

    return NextResponse.json({
      success: true,
      message: '期間限定オファーを削除しました'
    });
  } catch (error) {
    console.error('期間限定オファー削除エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}