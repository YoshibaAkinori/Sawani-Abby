// app/api/customers/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

export async function POST(request) {
  const pool = await getConnection();

  try {
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
      line_user_id
    } = body;

    // バリデーション: 姓名は必須
    if (!last_name || !first_name) {
      return NextResponse.json(
        { success: false, error: '姓と名は必須です' },
        { status: 400 }
      );
    }

    // SQLインジェクション対策として、全ての値をプレースホルダ(?)で渡す
    const query = `
      INSERT INTO customers (
        customer_id,
        line_user_id,
        last_name,
        first_name,
        last_name_kana,
        first_name_kana,
        phone_number,
        email,
        birth_date,
        notes,
        created_at,
        updated_at
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
    `;

    const params = [
      line_user_id ?? null,
      last_name,
      first_name,
      last_name_kana ?? null,
      first_name_kana ?? null,
      phone_number ?? null,
      email ?? null,
      birth_date ?? null,
      notes ?? null
    ];

    await pool.execute(query, params);

    // 登録した顧客の情報を取得して返す
    const [rows] = await pool.execute(
      'SELECT * FROM customers WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1',
      [phone_number]
    );

    if (rows.length === 0) {
      throw new Error('登録した顧客の取得に失敗しました');
    }

    const newCustomer = rows[0];

    return NextResponse.json(
      {
        success: true,
        message: '顧客を登録しました',
        data: newCustomer
      },
      { status: 201 } // 201 Created ステータスを返すのがRESTful
    );

  } catch (error) {
    console.error('顧客登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー: ' + error.message },
      { status: 500 }
    );
  }
}