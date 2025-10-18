// app/api/register-closing/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'salon_user',
  password: process.env.DB_PASSWORD || 'salon_password',
  database: process.env.DB_NAME || 'salon_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// GET: 特定日付のレジ締めデータ取得
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'Date parameter is required' },
      { status: 400 }
    );
  }

  try {
    const [rows] = await pool.query(
      `SELECT 
        closing_id,
        date,
        staff_id,
        ten_thousand_count,
        ten_thousand_count_after,
        five_thousand_count,
        five_thousand_count_after,
        two_thousand_count,
        two_thousand_count_after,
        one_thousand_count,
        one_thousand_count_after,
        five_hundred_count,
        five_hundred_count_after,
        one_hundred_count,
        one_hundred_count_after,
        fifty_count,
        fifty_count_after,
        ten_count,
        ten_count_after,
        five_count,
        five_count_after,
        one_count,
        one_count_after,
        actual_cash,
        expected_cash,
        discrepancy,
        record_amount,
        cash_sales as cash_amount,
        card_sales as card_amount,
        total_sales,
        transaction_count,
        fixed_amount,
        payments,
        total_payments,
        notes,
        created_at
      FROM daily_closings
      WHERE date = ?`,
      [date]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    const closing = rows[0];
    
    // ★★★ payments処理の修正 ★★★
    // MySQLのJSON型は既にオブジェクトとして返される場合がある
    if (closing.payments) {
      // すでに配列ならそのまま使用
      if (Array.isArray(closing.payments)) {
        closing.payments = closing.payments;
      }
      // 文字列ならパース
      else if (typeof closing.payments === 'string') {
        try {
          closing.payments = JSON.parse(closing.payments);
        } catch (e) {
          console.error('JSON parse error:', e);
          closing.payments = [];
        }
      }
      // オブジェクトならそのまま（念のため配列チェック）
      else if (typeof closing.payments === 'object') {
        closing.payments = Array.isArray(closing.payments) ? closing.payments : [closing.payments];
      }
    } else {
      closing.payments = [];
    }

    // cash_countオブジェクトを作成
    closing.cash_count = {
      ten_thousand: closing.ten_thousand_count || 0,
      five_thousand: closing.five_thousand_count || 0,
      two_thousand: closing.two_thousand_count || 0,
      one_thousand: closing.one_thousand_count || 0,
      five_hundred: closing.five_hundred_count || 0,
      one_hundred: closing.one_hundred_count || 0,
      fifty: closing.fifty_count || 0,
      ten: closing.ten_count || 0,
      five: closing.five_count || 0,
      one: closing.one_count || 0
    };

    // cash_count_afterオブジェクトを作成
    closing.cash_count_after = {
      ten_thousand: closing.ten_thousand_count_after || 0,
      five_thousand: closing.five_thousand_count_after || 0,
      two_thousand: closing.two_thousand_count_after || 0,
      one_thousand: closing.one_thousand_count_after || 0,
      five_hundred: closing.five_hundred_count_after || 0,
      one_hundred: closing.one_hundred_count_after || 0,
      fifty: closing.fifty_count_after || 0,
      ten: closing.ten_count_after || 0,
      five: closing.five_count_after || 0,
      one: closing.one_count_after || 0
    };

    return NextResponse.json({
      success: true,
      data: closing
    });

  } catch (error) {
    console.error('レジ締めデータ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: レジ締めデータの保存/更新
export async function POST(request) {
  let connection;
  
  try {
    const data = await request.json();
    
    const {
      date,
      ten_thousand_count,
      ten_thousand_count_after,
      five_thousand_count,
      five_thousand_count_after,
      two_thousand_count,
      two_thousand_count_after,
      one_thousand_count,
      one_thousand_count_after,
      five_hundred_count,
      five_hundred_count_after,
      one_hundred_count,
      one_hundred_count_after,
      fifty_count,
      fifty_count_after,
      ten_count,
      ten_count_after,
      five_count,
      five_count_after,
      one_count,
      one_count_after,
      actual_cash,
      expected_cash,
      discrepancy,
      record_amount,
      cash_amount,
      card_amount,
      total_sales,
      transaction_count,
      fixed_amount,
      payments,
      total_payments,
      staff_id,
      notes
    } = data;

    if (!date || !staff_id) {
      return NextResponse.json(
        { success: false, error: '日付とスタッフIDは必須です' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    const [existing] = await connection.query(
      'SELECT closing_id FROM daily_closings WHERE date = ?',
      [date]
    );

    const paymentsJson = JSON.stringify(payments || []);

    if (existing.length > 0) {
      // 更新
      await connection.query(
        `UPDATE daily_closings SET
          staff_id = ?,
          ten_thousand_count = ?,
          ten_thousand_count_after = ?,
          five_thousand_count = ?,
          five_thousand_count_after = ?,
          two_thousand_count = ?,
          two_thousand_count_after = ?,
          one_thousand_count = ?,
          one_thousand_count_after = ?,
          five_hundred_count = ?,
          five_hundred_count_after = ?,
          one_hundred_count = ?,
          one_hundred_count_after = ?,
          fifty_count = ?,
          fifty_count_after = ?,
          ten_count = ?,
          ten_count_after = ?,
          five_count = ?,
          five_count_after = ?,
          one_count = ?,
          one_count_after = ?,
          actual_cash = ?,
          expected_cash = ?,
          discrepancy = ?,
          record_amount = ?,
          cash_sales = ?,
          card_sales = ?,
          total_sales = ?,
          transaction_count = ?,
          fixed_amount = ?,
          payments = ?,
          total_payments = ?,
          notes = ?
        WHERE date = ?`,
        [
          staff_id,
          ten_thousand_count,
          ten_thousand_count_after,
          five_thousand_count,
          five_thousand_count_after,
          two_thousand_count,
          two_thousand_count_after,
          one_thousand_count,
          one_thousand_count_after,
          five_hundred_count,
          five_hundred_count_after,
          one_hundred_count,
          one_hundred_count_after,
          fifty_count,
          fifty_count_after,
          ten_count,
          ten_count_after,
          five_count,
          five_count_after,
          one_count,
          one_count_after,
          actual_cash,
          expected_cash,
          discrepancy,
          record_amount,
          cash_amount,
          card_amount,
          total_sales,
          transaction_count,
          fixed_amount,
          paymentsJson,
          total_payments,
          notes || null,
          date
        ]
      );
    } else {
      // 新規作成
      const closingId = crypto.randomUUID();
      
      await connection.query(
        `INSERT INTO daily_closings (
          closing_id,
          date,
          staff_id,
          ten_thousand_count,
          ten_thousand_count_after,
          five_thousand_count,
          five_thousand_count_after,
          two_thousand_count,
          two_thousand_count_after,
          one_thousand_count,
          one_thousand_count_after,
          five_hundred_count,
          five_hundred_count_after,
          one_hundred_count,
          one_hundred_count_after,
          fifty_count,
          fifty_count_after,
          ten_count,
          ten_count_after,
          five_count,
          five_count_after,
          one_count,
          one_count_after,
          actual_cash,
          expected_cash,
          discrepancy,
          record_amount,
          cash_sales,
          card_sales,
          total_sales,
          transaction_count,
          fixed_amount,
          payments,
          total_payments,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          closingId,
          date,
          staff_id,
          ten_thousand_count,
          ten_thousand_count_after,
          five_thousand_count,
          five_thousand_count_after,
          two_thousand_count,
          two_thousand_count_after,
          one_thousand_count,
          one_thousand_count_after,
          five_hundred_count,
          five_hundred_count_after,
          one_hundred_count,
          one_hundred_count_after,
          fifty_count,
          fifty_count_after,
          ten_count,
          ten_count_after,
          five_count,
          five_count_after,
          one_count,
          one_count_after,
          actual_cash,
          expected_cash,
          discrepancy,
          record_amount,
          cash_amount,
          card_amount,
          total_sales,
          transaction_count,
          fixed_amount,
          paymentsJson,
          total_payments,
          notes || null
        ]
      );
    }

    connection.release();

    return NextResponse.json({
      success: true,
      message: 'レジ締めデータを保存しました'
    });

  } catch (error) {
    if (connection) connection.release();
    console.error('レジ締めデータ保存エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}