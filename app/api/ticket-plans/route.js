// app/api/ticket-plans/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';

// 回数券プラン一覧取得
export async function GET(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    
    let query = `
      SELECT 
        tp.plan_id,
        tp.service_id,
        tp.name,
        tp.total_sessions,
        tp.price,
        tp.validity_days,
        s.name as service_name,
        s.category as service_category,
        s.price as service_unit_price
      FROM ticket_plans tp
      JOIN services s ON tp.service_id = s.service_id
    `;
    
    const params = [];
    if (serviceId) {
      query += ' WHERE tp.service_id = ?';
      params.push(serviceId);
    }
    
    query += ' ORDER BY s.category, s.name, tp.total_sessions';
    
    const [rows] = await pool.execute(query, params);

    // 1回あたりの価格を計算
    const plansWithCalculation = rows.map(plan => ({
      ...plan,
      price_per_session: Math.floor(plan.price / plan.total_sessions),
      discount_rate: Math.round((1 - (plan.price / (plan.service_unit_price * plan.total_sessions))) * 100)
    }));

    return NextResponse.json({
      success: true,
      data: plansWithCalculation
    });
  } catch (error) {
    console.error('回数券プラン取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 回数券プラン新規登録
export async function POST(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      service_id,
      name,
      total_sessions,
      price,
      validity_days
    } = body;

    // バリデーション
    if (!service_id || !name || !total_sessions || !price || !validity_days) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // 同じサービス・回数の重複チェック
    const [existing] = await pool.execute(
      'SELECT plan_id FROM ticket_plans WHERE service_id = ? AND total_sessions = ?',
      [service_id, total_sessions]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: '同じ回数のプランが既に存在します' },
        { status: 400 }
      );
    }

    // 挿入
    await pool.execute(
      `INSERT INTO ticket_plans (
        plan_id,
        service_id,
        name,
        total_sessions,
        price,
        validity_days
      ) VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [service_id, name, total_sessions, price, validity_days]
    );

    return NextResponse.json({
      success: true,
      message: '回数券プランを登録しました'
    });
  } catch (error) {
    console.error('回数券プラン登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 回数券プラン更新
export async function PUT(request) {
  try {
    const pool = await getConnection();
    const body = await request.json();

    const {
      plan_id,
      name,
      total_sessions,
      price,
      validity_days
    } = body;

    // バリデーション
    if (!plan_id || !name || !total_sessions || !price || !validity_days) {
      return NextResponse.json(
        { success: false, error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // 更新
    await pool.execute(
      `UPDATE ticket_plans 
       SET name = ?, 
           total_sessions = ?, 
           price = ?,
           validity_days = ?
       WHERE plan_id = ?`,
      [name, total_sessions, price, validity_days, plan_id]
    );

    return NextResponse.json({
      success: true,
      message: '回数券プランを更新しました'
    });
  } catch (error) {
    console.error('回数券プラン更新エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}

// 回数券プラン削除
export async function DELETE(request) {
  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'プランIDが必要です' },
        { status: 400 }
      );
    }

    // 販売済み回数券があるかチェック
    const [tickets] = await pool.execute(
      'SELECT COUNT(*) as count FROM customer_tickets WHERE plan_id = ?',
      [planId]
    );

    if (tickets[0].count > 0) {
      return NextResponse.json(
        { success: false, error: '販売済みの回数券があるため削除できません' },
        { status: 400 }
      );
    }

    // 削除実行
    await pool.execute(
      'DELETE FROM ticket_plans WHERE plan_id = ?',
      [planId]
    );

    return NextResponse.json({
      success: true,
      message: '回数券プランを削除しました'
    });
  } catch (error) {
    console.error('回数券プラン削除エラー:', error);
    return NextResponse.json(
      { success: false, error: 'データベースエラー' },
      { status: 500 }
    );
  }
}