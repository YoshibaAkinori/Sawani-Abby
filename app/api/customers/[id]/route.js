// app/api/customers/[id]/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const pool = await getConnection();
    const customerId = params.id;

    const [rows] = await pool.execute(
      `SELECT 
        customer_id,
        last_name,
        first_name,
        last_name_kana,
        first_name_kana,
        phone_number,
        email,
        birth_date,
        notes,
        line_user_id,
        base_visit_count,  -- ★追加
        created_at,
        updated_at,
        (base_visit_count + (
          SELECT COUNT(DISTINCT payment_id) 
          FROM payments 
          WHERE customer_id = customers.customer_id 
          AND is_cancelled = FALSE
        )) as visit_count
      FROM customers
      WHERE customer_id = ?`,
      [customerId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '顧客が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('顧客取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const pool = await getConnection();
  const connection = await pool.getConnection();

  try {
    const customerId = params.id;
    const body = await request.json();

    const {
      last_name,
      first_name,
      last_name_kana,
      first_name_kana,
      phone_number,
      email,
      birth_date,
      notes,
      base_visit_count,
      line_user_id  // ★追加
    } = body;

    // バリデーション
    if (!last_name || !first_name || !phone_number) {
      return NextResponse.json(
        { success: false, error: '姓・名・電話番号は必須です' },
        { status: 400 }
      );
    }

    // base_visit_countのバリデーション
    if (base_visit_count !== undefined && base_visit_count < 0) {
      return NextResponse.json(
        { success: false, error: '来店回数は0以上の値を入力してください' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // 顧客情報を更新
    await connection.execute(
      `UPDATE customers 
       SET last_name = ?,
           first_name = ?,
           last_name_kana = ?,
           first_name_kana = ?,
           phone_number = ?,
           email = ?,
           birth_date = ?,
           notes = ?,
           base_visit_count = ?,
           line_user_id = ?,
           updated_at = NOW()
       WHERE customer_id = ?`,
      [
        last_name,
        first_name,
        last_name_kana || '',
        first_name_kana || '',
        phone_number,
        email || null,
        birth_date || null,
        notes || null,
        base_visit_count !== undefined ? base_visit_count : 0,
        line_user_id || null,  // ★追加
        customerId
      ]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: '顧客情報を更新しました'
    });
  } catch (error) {
    await connection.rollback();
    console.error('顧客更新エラー:', error);
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