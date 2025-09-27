// app/api/attendance/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

// 勤怠記録取得（月単位）
export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!staffId || !year || !month) {
      return NextResponse.json(
        { success: false, error: 'パラメータが不足しています' },
        { status: 400 }
      );
    }

    // 勤怠記録を取得
    const [attendance] = await pool.execute(
      `SELECT 
        attendance_id,
        staff_id,
        date,
        TIME_FORMAT(check_in, '%H:%i') as check_in,
        TIME_FORMAT(check_out, '%H:%i') as check_out,
        break_minutes,
        work_minutes,
        transport_cost,
        daily_wage,
        notes
      FROM daily_attendance
      WHERE staff_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
      ORDER BY date ASC`,
      [staffId, year, month]
    );

    // スタッフの給与設定を取得
    const [wageSettings] = await pool.execute(
      `SELECT 
        hourly_wage,
        transport_allowance
      FROM staff_wages
      WHERE staff_id = ? 
        AND effective_date <= LAST_DAY(CONCAT(?, '-', ?, '-01'))
        AND (end_date IS NULL OR end_date >= CONCAT(?, '-', ?, '-01'))
      ORDER BY effective_date DESC
      LIMIT 1`,
      [staffId, year, month, year, month]
    );

    const wageSetting = wageSettings[0] || { hourly_wage: 900, transport_allowance: 313 };

    return NextResponse.json({
      success: true,
      data: {
        attendance,
        wageSetting
      }
    });
  } catch (error) {
    console.error('勤怠取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 勤怠記録登録・更新
export async function POST(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      staff_id,
      date,
      check_in,
      check_out,
      break_minutes = 0,
      transport_cost = 0,
      notes = ''
    } = body;

    // バリデーション
    if (!staff_id || !date) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // スタッフの時給を取得
    const [wageSettings] = await pool.execute(
      `SELECT hourly_wage
       FROM staff_wages
       WHERE staff_id = ? 
         AND effective_date <= ?
         AND (end_date IS NULL OR end_date >= ?)
       ORDER BY effective_date DESC
       LIMIT 1`,
      [staff_id, date, date]
    );

    const hourlyWage = wageSettings[0]?.hourly_wage || 900;

    // 日給を計算
    let dailyWage = 0;
    if (check_in && check_out) {
      const [inHour, inMin] = check_in.split(':').map(Number);
      const [outHour, outMin] = check_out.split(':').map(Number);
      const workMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin) - break_minutes;
      dailyWage = Math.floor((workMinutes / 60) * hourlyWage);
    }

    // 既存レコードをチェック
    const [existing] = await pool.execute(
      'SELECT attendance_id FROM daily_attendance WHERE staff_id = ? AND date = ?',
      [staff_id, date]
    );

    if (existing.length > 0) {
      if (check_in || check_out) {
        // 更新
        await pool.execute(
          `UPDATE daily_attendance 
           SET check_in = ?, check_out = ?, break_minutes = ?, 
               transport_cost = ?, daily_wage = ?, notes = ?
           WHERE staff_id = ? AND date = ?`,
          [check_in || null, check_out || null, break_minutes, 
           transport_cost, dailyWage, notes, staff_id, date]
        );
      } else {
        // 削除
        await pool.execute(
          'DELETE FROM daily_attendance WHERE staff_id = ? AND date = ?',
          [staff_id, date]
        );
      }
    } else {
      // 新規登録
      if (check_in || check_out) {
        await pool.execute(
          `INSERT INTO daily_attendance (
            attendance_id,
            staff_id,
            date,
            check_in,
            check_out,
            break_minutes,
            transport_cost,
            daily_wage,
            notes
          ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
          [staff_id, date, check_in || null, check_out || null, 
           break_minutes, transport_cost, dailyWage, notes]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '勤怠を更新しました'
    });
  } catch (error) {
    console.error('勤怠登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 月次集計
export async function PUT(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const { staff_id, year, month } = body;

    if (!staff_id || !year || !month) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // 月次集計を計算
    const [summary] = await pool.execute(
      `SELECT 
        SUM(work_minutes) as total_work_minutes,
        SUM(daily_wage) as total_wage,
        SUM(transport_cost) as total_transport,
        SUM(daily_wage + transport_cost) as total_amount
      FROM daily_attendance
      WHERE staff_id = ? AND YEAR(date) = ? AND MONTH(date) = ?`,
      [staff_id, year, month]
    );

    const data = summary[0] || {
      total_work_minutes: 0,
      total_wage: 0,
      total_transport: 0,
      total_amount: 0
    };

    // 月次給与記録を更新または作成
    const [existing] = await pool.execute(
      'SELECT monthly_wage_id FROM monthly_wages WHERE staff_id = ? AND year = ? AND month = ?',
      [staff_id, year, month]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE monthly_wages 
         SET total_work_minutes = ?, total_wage = ?, 
             total_transport = ?, total_amount = ?
         WHERE staff_id = ? AND year = ? AND month = ?`,
        [data.total_work_minutes, data.total_wage, 
         data.total_transport, data.total_amount,
         staff_id, year, month]
      );
    } else {
      await pool.execute(
        `INSERT INTO monthly_wages (
          monthly_wage_id,
          staff_id,
          year,
          month,
          total_work_minutes,
          total_wage,
          total_transport,
          total_amount
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [staff_id, year, month,
         data.total_work_minutes, data.total_wage,
         data.total_transport, data.total_amount]
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '月次集計を更新しました'
    });
  } catch (error) {
    console.error('月次集計エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}