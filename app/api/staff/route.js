// app/api/staff/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

// スタッフ一覧取得
export async function GET(request) {
  try {
    const pool = await getConnection();
    
    const [rows] = await pool.execute(
      `SELECT 
        staff_id,
        name,
        color,
        role,
        is_active,
        created_at
      FROM staff
      ORDER BY created_at ASC`  
    );

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('スタッフ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// スタッフ新規登録
export async function POST(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      name,
      color,
      role,
      is_active = true
    } = body;

    // バリデーション
    if (!name || !color || !role) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // 重複チェック
    const [existing] = await pool.execute(
      'SELECT staff_id FROM staff WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: '同名のスタッフが既に登録されています' },
        { status: 400 }
      );
    }

    // 挿入
    const [result] = await pool.execute(
      `INSERT INTO staff (
        staff_id,
        name,
        color,
        role,
        is_active
      ) VALUES (UUID(), ?, ?, ?, ?)`,
      [name, color, role, is_active]
    );

    return NextResponse.json({
      success: true,
      message: 'スタッフを登録しました',
      id: result.insertId
    });
  } catch (error) {
    console.error('スタッフ登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}