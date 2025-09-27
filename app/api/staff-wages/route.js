// app/api/staff-wages/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

// スタッフ給与設定取得
export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'スタッフIDが必要です' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT 
        wage_id,
        staff_id,
        hourly_wage,
        transport_allowance,
        effective_date,
        end_date
      FROM staff_wages
      WHERE staff_id = ? 
        AND (end_date IS NULL OR end_date >= CURDATE())
      ORDER BY effective_date DESC
      LIMIT 1`,
      [staffId]
    );

    if (rows.length === 0) {
      // デフォルト値を返す
      return NextResponse.json({
        success: true,
        data: {
          staff_id: staffId,
          hourly_wage: 900,
          transport_allowance: 313
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('給与設定取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// スタッフ給与設定登録・更新
export async function POST(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      staff_id,
      hourly_wage,
      transport_allowance
    } = body;

    // バリデーション
    if (!staff_id || hourly_wage === undefined || transport_allowance === undefined) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // 現在の設定を終了
    await pool.execute(
      `UPDATE staff_wages 
       SET end_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
       WHERE staff_id = ? AND end_date IS NULL`,
      [staff_id]
    );

    // 新しい設定を挿入
    const [result] = await pool.execute(
      `INSERT INTO staff_wages (
        wage_id,
        staff_id,
        hourly_wage,
        transport_allowance,
        effective_date
      ) VALUES (UUID(), ?, ?, ?, CURDATE())`,
      [staff_id, hourly_wage, transport_allowance]
    );

    return NextResponse.json({
      success: true,
      message: '給与設定を更新しました'
    });
  } catch (error) {
    console.error('給与設定登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}