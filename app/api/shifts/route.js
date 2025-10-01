// app/api/shifts/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

// シフト一覧取得（月単位）
export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    //console.log('シフト取得:', { staffId, year, month }); // デバッグ用

    let query = `
      SELECT 
        shift_id,
        staff_id,
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        TIME_FORMAT(start_time, '%H:%i') as start_time,
        TIME_FORMAT(end_time, '%H:%i') as end_time,
        break_minutes,
        transport_cost,
        hourly_wage,
        daily_wage,
        type,
        notes
      FROM shifts
      WHERE 1=1
    `;
    
    const params = [];

    if (staffId) {
      query += ' AND staff_id = ?';
      params.push(staffId);
    }

    if (year && month) {
      query += ' AND YEAR(date) = ? AND MONTH(date) = ?';
      params.push(year, month);
    }

    query += ' ORDER BY date ASC';

    const [rows] = await pool.execute(query, params);
    //console.log('取得したシフト件数:', rows.length); // デバッグ用

    // スタッフの給与設定を取得
    let wageSetting = { hourly_wage: 1500, transport_allowance: 900 };
    if (staffId) {
      const [staffRows] = await pool.execute(
        `SELECT hourly_wage, transport_allowance 
         FROM staff 
         WHERE staff_id = ?`,
        [staffId]
      );
      if (staffRows.length > 0) {
        wageSetting = staffRows[0];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        shifts: rows,
        wageSetting
      }
    });
  } catch (error) {
    console.error('シフト取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// シフト登録・更新（1日単位）
export async function POST(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      staff_id,
      date,
      start_time,
      end_time,
      break_minutes = 0,
      transport_cost = 900,
      type = 'work',
      notes = ''
    } = body;

    //console.log('シフト登録:', { staff_id, date, start_time, end_time }); // デバッグ用

    // バリデーション
    if (!staff_id || !date) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // スタッフの時給を取得
    const [staffData] = await pool.execute(
      `SELECT hourly_wage FROM staff WHERE staff_id = ?`,
      [staff_id]
    );

    const hourlyWage = staffData[0]?.hourly_wage || 1500;

    // 日給を計算
    let dailyWage = 0;
    if (start_time && end_time) {
      const [startH, startM] = start_time.split(':').map(Number);
      const [endH, endM] = end_time.split(':').map(Number);
      const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - break_minutes;
      dailyWage = Math.floor((totalMinutes / 60) * hourlyWage);
    }

    // 既存のシフトをチェック
    const [existing] = await pool.execute(
      'SELECT shift_id FROM shifts WHERE staff_id = ? AND date = ?',
      [staff_id, date]
    );

    if (existing.length > 0) {
      // 更新
      if (start_time && end_time) {
        await pool.execute(
          `UPDATE shifts 
           SET start_time = ?, end_time = ?, break_minutes = ?,
               transport_cost = ?, hourly_wage = ?, daily_wage = ?, type = ?, notes = ?
           WHERE staff_id = ? AND date = ?`,
          [start_time, end_time, break_minutes, transport_cost, 
           hourlyWage, dailyWage, type, notes, staff_id, date]
        );
      } else {
        // 削除（休日の場合）
        await pool.execute(
          'DELETE FROM shifts WHERE staff_id = ? AND date = ?',
          [staff_id, date]
        );
      }
    } else {
      // 新規登録
      if (start_time && end_time) {
        await pool.execute(
          `INSERT INTO shifts (
            shift_id, staff_id, date, start_time, end_time, 
            break_minutes, transport_cost, hourly_wage, daily_wage, type, notes
          ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [staff_id, date, start_time, end_time, break_minutes,
           transport_cost, hourlyWage, dailyWage, type, notes]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'シフトを更新しました'
    });
  } catch (error) {
    console.error('シフト登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 一括登録（月単位）★★★ここが重要★★★
export async function PUT(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      staff_id,
      year,
      month,
      shifts
    } = body;

    console.log('一括保存開始:', { staff_id, year, month, shiftsCount: Object.keys(shifts).length }); // デバッグ用

    if (!staff_id || !year || !month || !shifts) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // スタッフの時給を取得
      const [staffData] = await connection.execute(
        `SELECT hourly_wage FROM staff WHERE staff_id = ?`,
        [staff_id]
      );
      const hourlyWage = staffData[0]?.hourly_wage || 1500;

      // ★重要★ 該当月の「このスタッフの」既存シフトのみを削除
      const deleteResult = await connection.execute(
        'DELETE FROM shifts WHERE staff_id = ? AND YEAR(date) = ? AND MONTH(date) = ?',
        [staff_id, year, month]
      );
      console.log('削除したシフト件数:', deleteResult[0].affectedRows); // デバッグ用

      // 新しいシフトを挿入（給与計算込み）
      let insertCount = 0;
      for (const [date, shift] of Object.entries(shifts)) {
        if (shift.start_time && shift.end_time) {
          // 日給を計算
          const [startH, startM] = shift.start_time.split(':').map(Number);
          const [endH, endM] = shift.end_time.split(':').map(Number);
          const breakMinutes = shift.break_minutes || 0;
          const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - breakMinutes;
          const dailyWage = Math.floor((totalMinutes / 60) * hourlyWage);

          await connection.execute(
            `INSERT INTO shifts (
              shift_id, staff_id, date, start_time, end_time,
              break_minutes, transport_cost, hourly_wage, daily_wage, type
            ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              staff_id, date, shift.start_time, shift.end_time,
              breakMinutes, shift.transport_cost || 0, hourlyWage, dailyWage, shift.type || 'work'
            ]
          );
          insertCount++;
        }
      }
      console.log('挿入したシフト件数:', insertCount); // デバッグ用

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: '月間シフトを更新しました',
        data: {
          deleted: deleteResult[0].affectedRows,
          inserted: insertCount
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('シフト一括登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー: ' + error.message },
      { status: 500 }
    );
  }
}