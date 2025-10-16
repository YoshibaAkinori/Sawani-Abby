// app/analytics/components/SalesTrendChart.js
"use client";
import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesTrendChart = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="sales-trend">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // 合計値計算
  const totals = data.reduce((acc, item) => ({
    transactions: acc.transactions + (item.transaction_count || 0),
    sales: acc.sales + (item.total_sales || 0),
    customers: acc.customers + (item.unique_customers || 0)
  }), { transactions: 0, sales: 0, customers: 0 });

  // グラフ用データ整形
  let chartData = [];
  let lines = [];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (period === 'yearly') {
    // 年別表示: 横軸は月(1-12)、各年を別の線で表示
    const yearlyData = {};
    const years = new Set();

    data.forEach(row => {
      if (!row.period || typeof row.period !== 'string') return;
      
      const parts = row.period.split('-');
      if (parts.length < 2) return;
      
      const [year, month] = parts;
      years.add(year);
      const monthNum = parseInt(month);
      
      if (!yearlyData[monthNum]) {
        yearlyData[monthNum] = { month: `${monthNum}月` };
      }
      yearlyData[monthNum][`${year}年`] = row.total_sales || 0;
    });

    // 1-12月のデータを作成
    for (let i = 1; i <= 12; i++) {
      chartData.push(yearlyData[i] || { month: `${i}月` });
    }

    // 各年を線として追加
    Array.from(years).sort().forEach((year, index) => {
      lines.push({
        key: `${year}年`,
        color: colors[index % colors.length]
      });
    });

  } else {
    // 月別表示: 横軸は日(1-31)、各月を別の線で表示
    const monthlyData = {};
    const months = new Set();

    data.forEach(row => {
      if (!row.period) return;
      
      // periodが日付形式 (YYYY-MM-DD) または (YYYY-MM) の場合に対応
      let date;
      if (row.period.includes('-')) {
        const parts = row.period.split('-');
        if (parts.length === 3) {
          // YYYY-MM-DD形式
          date = new Date(row.period);
        } else if (parts.length === 2) {
          // YYYY-MM形式の場合は1日として扱う
          date = new Date(`${row.period}-01`);
        }
      }
      
      if (!date || isNaN(date.getTime())) return;
      
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const day = date.getDate();
      
      months.add(monthKey);
      
      if (!monthlyData[day]) {
        monthlyData[day] = { day: `${day}日` };
      }
      monthlyData[day][monthKey] = row.total_sales || 0;
    });

    // 1-31日のデータを作成
    for (let i = 1; i <= 31; i++) {
      chartData.push(monthlyData[i] || { day: `${i}日` });
    }

    // 各月を線として追加
    Array.from(months).sort().forEach((month, index) => {
      const [year, mon] = month.split('-');
      lines.push({
        key: month,
        label: `${year}年${parseInt(mon)}月`,
        color: colors[index % colors.length]
      });
    });
  }

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
    <div className="sales-trend">
      {/* サマリーメトリクス */}
      <div className="analytics-metrics">
        <div className="analytics-metric">
          <span className="analytics-metric__label">
            <DollarSign size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
            期間合計売上
          </span>
          <span className="analytics-metric__value">
            {formatCurrency(totals.sales)}
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">期間合計取引数</span>
          <span className="analytics-metric__value">
            {totals.transactions.toLocaleString()}
            <span className="analytics-metric__unit">件</span>
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">平均単価</span>
          <span className="analytics-metric__value">
            {formatCurrency(totals.sales / totals.transactions)}
          </span>
        </div>
      </div>

      {/* 折れ線グラフ */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.25rem' }} />
          売上推移グラフ
        </h3>
        <div style={{ width: '100%', height: '450px', marginTop: '1rem' }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey={period === 'yearly' ? 'month' : 'day'}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
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
              {lines.map((line, index) => (
                <Line 
                  key={line.key}
                  type="monotone" 
                  dataKey={line.key}
                  name={line.label || line.key}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ fill: line.color, r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 推移テーブル */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}売上推移データ
        </h3>
        {data.length > 0 ? (
          <div className="sales-trend-table">
            {/* ヘッダー行 */}
            <div className="sales-trend-row sales-trend-row--header">
              <div className="sales-trend-cell sales-trend-cell--period">期間</div>
              <div className="sales-trend-cell sales-trend-cell--number">取引数</div>
              <div className="sales-trend-cell sales-trend-cell--number">総売上</div>
              <div className="sales-trend-cell sales-trend-cell--number">現金</div>
              <div className="sales-trend-cell sales-trend-cell--number">カード</div>
              <div className="sales-trend-cell sales-trend-cell--number">平均単価</div>
              <div className="sales-trend-cell sales-trend-cell--number">顧客数</div>
            </div>
            
            {/* データ行 */}
            {data.map((row, index) => (
              <div key={index} className="sales-trend-row">
                <div className="sales-trend-cell sales-trend-cell--period">
                  <strong>{row.period}</strong>
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {row.transaction_count}件
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {formatCurrency(row.total_sales)}
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {formatCurrency(row.cash_sales)}
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {formatCurrency(row.card_sales)}
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {formatCurrency(row.average_sale)}
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {row.unique_customers}人
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      <style jsx>{`
        .sales-trend {
          padding: 0;
        }
        
        .sales-trend-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .sales-trend-row {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 0.7fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }
        
        .sales-trend-row:last-child {
          border-bottom: none;
        }
        
        .sales-trend-row:not(.sales-trend-row--header):hover {
          background: #f9fafb;
        }
        
        .sales-trend-row--header {
          background: #f9fafb;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        
        .sales-trend-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }
        
        .sales-trend-cell:last-child {
          border-right: none;
        }
        
        .sales-trend-row--header .sales-trend-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }
        
        .sales-trend-cell--period {
          justify-content: flex-start;
        }
        
        .sales-trend-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }
        
        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }
        
        @media (max-width: 1024px) {
          .sales-trend-row {
            grid-template-columns: 1fr 0.7fr 0.9fr 0.7fr 0.7fr 0.7fr 0.6fr;
          }
          
          .sales-trend-cell {
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
          }
        }
        
        @media (max-width: 768px) {
          .sales-trend-table {
            overflow-x: auto;
          }
          
          .sales-trend-row {
            min-width: 900px;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesTrendChart;