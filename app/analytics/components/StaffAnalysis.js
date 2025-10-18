// app/analytics/components/StaffAnalysis.js
"use client";
import React from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StaffAnalysis = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(Number(amount) || 0).toLocaleString()}`;
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="staff-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // グラフ用データ整形（常に月別グラフ）
  // 横軸: 2023年1月、2023年2月...2025年12月のように時系列で伸ばす
  let chartData = [];
  const staffColors = {};
  const monthlyData = {};
  
  // データから年月を抽出してソート
  const yearMonths = new Set();
  
  data.forEach(row => {
    if (!row.period || typeof row.period !== 'string') return;
    
    const parts = row.period.split('-');
    if (parts.length < 2) return;
    
    const yearMonth = `${parts[0]}-${parts[1]}`;
    yearMonths.add(yearMonth);
    
    if (!monthlyData[yearMonth]) {
      monthlyData[yearMonth] = {};
    }
    
    monthlyData[yearMonth][row.staff_name] = Number(row.total_sales) || 0;
    staffColors[row.staff_name] = row.staff_color;
  });
  
  // 年月を時系列順にソート
  const sortedYearMonths = Array.from(yearMonths).sort();
  
  // グラフ用データを作成
  sortedYearMonths.forEach(yearMonth => {
    const [year, month] = yearMonth.split('-');
    chartData.push({
      period: `${year}年${parseInt(month)}月`,
      yearMonth: yearMonth,
      ...monthlyData[yearMonth]
    });
  });

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#111827' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '14px' }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="staff-analysis">
      {/* 折れ線グラフ */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          スタッフ別売上推移（月別）
        </h3>

        <div style={{ width: '100%', height: '450px', marginTop: '1rem' }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="period"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#e5e7eb"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
                tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                iconType="line"
              />
              {/* スタッフごとに線を生成 */}
              {Object.keys(staffColors).map((staffName, index) => {
                const color = staffColors[staffName];
                return (
                  <Line 
                    key={staffName}
                    type="monotone" 
                    dataKey={staffName}
                    name={staffName}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 月別ランキングテーブル */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Users size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          月別スタッフランキング
        </h3>
        
        {sortedYearMonths.slice().reverse().map((yearMonth) => {
          const [year, month] = yearMonth.split('-');
          const periodLabel = `${year}年${parseInt(month)}月`;
          
          // その月のスタッフデータを取得してソート
          const monthStaff = data
            .filter(row => row.period && row.period.startsWith(yearMonth))
            .sort((a, b) => (Number(b.total_sales) || 0) - (Number(a.total_sales) || 0));
          
          if (monthStaff.length === 0) return null;
          
          return (
            <div key={yearMonth} className="period-section">
              <h4 className="period-title">{periodLabel}</h4>
              <div className="staff-table">
                {/* ヘッダー */}
                <div className="staff-row staff-row--header">
                  <div className="staff-cell staff-cell--rank">順位</div>
                  <div className="staff-cell staff-cell--name">スタッフ名</div>
                  <div className="staff-cell staff-cell--number">取引数</div>
                  <div className="staff-cell staff-cell--number">総売上</div>
                  <div className="staff-cell staff-cell--number">平均単価</div>
                  <div className="staff-cell staff-cell--number">顧客数</div>
                </div>
                
                {/* データ行 */}
                {monthStaff.map((staff, index) => {
                  const totalSales = Number(staff.total_sales) || 0;
                  const transactionCount = Number(staff.transaction_count) || 0;
                  const averageSale = transactionCount > 0 ? totalSales / transactionCount : 0;
                  
                  return (
                    <div key={index} className="staff-row">
                      <div className="staff-cell staff-cell--rank">
                        <div className={`rank-indicator rank-${index + 1}`} style={{ 
                          background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : staff.staff_color 
                        }}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="staff-cell staff-cell--name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="staff-color-dot" style={{ background: staff.staff_color }} />
                          <strong>{staff.staff_name}</strong>
                        </div>
                      </div>
                      <div className="staff-cell staff-cell--number">{transactionCount}件</div>
                      <div className="staff-cell staff-cell--number">{formatCurrency(totalSales)}</div>
                      <div className="staff-cell staff-cell--number">
                        {formatCurrency(averageSale)}
                      </div>
                      <div className="staff-cell staff-cell--number">{Number(staff.unique_customers) || 0}人</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .staff-analysis {
          padding: 0;
        }

        /* 期間セクション */
        .period-section {
          margin-bottom: 2rem;
        }

        .period-section:last-child {
          margin-bottom: 0;
        }

        .period-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem 0;
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border-left: 4px solid #3b82f6;
          border-radius: 0.25rem;
        }

        /* スタッフテーブル */
        .staff-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .staff-row {
          display: grid;
          grid-template-columns: 80px 2fr 1fr 1.2fr 1fr 0.8fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        .staff-row:last-child {
          border-bottom: none;
        }

        .staff-row:not(.staff-row--header):hover {
          background: #f9fafb;
        }

        .staff-row--header {
          background: #f9fafb;
          font-weight: 600;
        }

        .staff-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .staff-cell:last-child {
          border-right: none;
        }

        .staff-row--header .staff-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .staff-cell--rank {
          justify-content: center;
        }

        .staff-cell--name {
          justify-content: flex-start;
        }

        .staff-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        .rank-indicator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .rank-1 {
          background: linear-gradient(135deg, #fbbf24, #f59e0b) !important;
          box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
        }

        .rank-2 {
          background: linear-gradient(135deg, #94a3b8, #64748b) !important;
        }

        .rank-3 {
          background: linear-gradient(135deg, #cd7f32, #b8692f) !important;
        }

        .staff-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .staff-row {
            grid-template-columns: 60px 1.5fr 0.8fr 1fr 0.8fr 0.7fr;
          }

          .staff-cell {
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
          }
        }

        @media (max-width: 768px) {
          .staff-table {
            overflow-x: auto;
          }

          .staff-row {
            min-width: 800px;
          }
        }
      `}</style>
    </div>
  );
};

export default StaffAnalysis;