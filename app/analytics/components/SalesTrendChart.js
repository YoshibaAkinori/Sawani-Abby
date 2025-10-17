// app/analytics/components/SalesTrendChart.js
"use client";
import React from 'react';
import { TrendingUp, DollarSign, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesTrendChart = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  // データ構造チェック
  const salesData = data?.salesData || data || [];
  const genderData = data?.genderData || [];

  if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
    return (
      <div className="sales-trend">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // 合計値計算
  const totals = salesData.reduce((acc, item) => ({
    transactions: acc.transactions + (item.transaction_count || 0),
    idealSales: acc.idealSales + (item.ideal_sales || 0),
    actualSales: acc.actualSales + (item.actual_sales || 0),
    customers: acc.customers + (item.unique_customers || 0)
  }), { transactions: 0, idealSales: 0, actualSales: 0, customers: 0 });

  // 性別別合計
  const genderTotals = genderData.reduce((acc, item) => {
    if (item.gender === 'female') {
      acc.female += item.total_sales || 0;
      acc.femaleCount += item.transaction_count || 0;
    } else if (item.gender === 'male') {
      acc.male += item.total_sales || 0;
      acc.maleCount += item.transaction_count || 0;
    }
    return acc;
  }, { female: 0, male: 0, femaleCount: 0, maleCount: 0 });

  const totalGenderSales = genderTotals.female + genderTotals.male;

  // グラフ用データ整形（全体売上）
  let chartData = [];
  let lines = [];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (period === 'yearly') {
    // 年別表示: 横軸は月(1-12)、各年を別の線で表示
    const yearlyData = {};
    const years = new Set();

    salesData.forEach(row => {
      if (!row.period || typeof row.period !== 'string') return;
      
      const parts = row.period.split('-');
      if (parts.length < 2) return;
      
      const [year, month] = parts;
      years.add(year);
      const monthNum = parseInt(month);
      
      if (!yearlyData[monthNum]) {
        yearlyData[monthNum] = { month: `${monthNum}月` };
      }
      yearlyData[monthNum][year] = row.ideal_sales || 0;
    });

    // 1-12月のデータを作成
    for (let i = 1; i <= 12; i++) {
      chartData.push(yearlyData[i] || { month: `${i}月` });
    }

    // 各年を線として追加
    Array.from(years).sort().forEach((year, index) => {
      lines.push({
        key: year,
        label: `${year}年`,
        color: colors[index % colors.length]
      });
    });

  } else {
    // 月別表示: 横軸は日(1-31)、各月を別の線で表示
    const monthlyData = {};
    const months = new Set();

    salesData.forEach(row => {
      if (!row.period) return;
      
      let date;
      if (row.period.includes('-')) {
        const parts = row.period.split('-');
        if (parts.length === 3) {
          date = new Date(row.period);
        } else if (parts.length === 2) {
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
      monthlyData[day][monthKey] = row.ideal_sales || 0;
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

  // 性別別グラフ用データ整形（全体グラフと同じX軸構造）
  let genderChartData = [];
  if (genderData.length > 0) {
    if (period === 'yearly') {
      // 年別表示: 横軸は月(1-12)
      const yearlyGenderData = {};
      const genderYears = new Set();

      genderData.forEach(row => {
        if (!row.period || typeof row.period !== 'string') return;
        
        const parts = row.period.split('-');
        if (parts.length < 2) return;
        
        const [year, month] = parts;
        genderYears.add(year);
        const monthNum = parseInt(month);
        
        if (!yearlyGenderData[monthNum]) {
          yearlyGenderData[monthNum] = { month: `${monthNum}月`, female: {}, male: {} };
        }
        
        if (row.gender === 'female') {
          yearlyGenderData[monthNum].female[year] = row.total_sales || 0;
        } else if (row.gender === 'male') {
          yearlyGenderData[monthNum].male[year] = row.total_sales || 0;
        }
      });

      // 1-12月のデータを作成（年ごとに女性・男性の線を作成）
      for (let i = 1; i <= 12; i++) {
        const monthData = yearlyGenderData[i] || { month: `${i}月`, female: {}, male: {} };
        const dataPoint = { month: `${i}月` };
        
        Array.from(genderYears).sort().forEach(year => {
          dataPoint[`${year}年_女性`] = monthData.female[year] || 0;
          dataPoint[`${year}年_男性`] = monthData.male[year] || 0;
        });
        
        genderChartData.push(dataPoint);
      }
    } else {
      // 月別表示: 横軸は日(1-31)
      const dailyGenderData = {};
      const genderMonths = new Set();

      genderData.forEach(row => {
        if (!row.period) return;
        
        let date;
        if (row.period.includes('-')) {
          const parts = row.period.split('-');
          if (parts.length === 3) {
            date = new Date(row.period);
          } else if (parts.length === 2) {
            date = new Date(`${row.period}-01`);
          }
        }
        
        if (!date || isNaN(date.getTime())) return;
        
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const day = date.getDate();
        
        genderMonths.add(monthKey);
        
        if (!dailyGenderData[day]) {
          dailyGenderData[day] = { day: `${day}日`, female: {}, male: {} };
        }
        
        if (row.gender === 'female') {
          dailyGenderData[day].female[monthKey] = row.total_sales || 0;
        } else if (row.gender === 'male') {
          dailyGenderData[day].male[monthKey] = row.total_sales || 0;
        }
      });

      // 1-31日のデータを作成
      for (let i = 1; i <= 31; i++) {
        const dayData = dailyGenderData[i] || { day: `${i}日`, female: {}, male: {} };
        const dataPoint = { day: `${i}日` };
        
        Array.from(genderMonths).sort().forEach(month => {
          const [year, mon] = month.split('-');
          dataPoint[`${year}年${parseInt(mon)}月_女性`] = dayData.female[month] || 0;
          dataPoint[`${year}年${parseInt(mon)}月_男性`] = dayData.male[month] || 0;
        });
        
        genderChartData.push(dataPoint);
      }
    }
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
            期間理想売上
          </span>
          <span className="analytics-metric__value">
            {formatCurrency(totals.idealSales)}
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">期間現状売上</span>
          <span className="analytics-metric__value">
            {formatCurrency(totals.actualSales)}
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">差額</span>
          <span className="analytics-metric__value" style={{ 
            color: (totals.idealSales - totals.actualSales) > 0 ? '#f59e0b' : '#10b981' 
          }}>
            {formatCurrency(totals.idealSales - totals.actualSales)}
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
          <span className="analytics-metric__label">
            <Users size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
            ユニーク顧客数
          </span>
          <span className="analytics-metric__value">
            {totals.customers}
            <span className="analytics-metric__unit">人</span>
          </span>
        </div>
      </div>

      {/* 折れ線グラフ（全体売上推移） */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.25rem' }} />
          全体売上推移グラフ
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
              {lines.map((line) => (
                <Line 
                  key={line.key}
                  type="monotone" 
                  dataKey={line.key}
                  name={line.label}
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

      {/* 性別別売上グラフ */}
      {genderChartData.length > 0 && (
        <div className="analytics-card">
          <h3 className="analytics-card__title">
            <Users size={20} style={{ display: 'inline', marginRight: '0.25rem' }} />
            性別別売上推移
          </h3>
          
          {/* 性別サマリー */}
          {totalGenderSales > 0 && (
            <div className="gender-summary" style={{ marginBottom: '1.5rem' }}>
              <div className="gender-summary-row">
                <div className="gender-summary-item">
                  <span className="gender-label gender-label--female">👩 女性</span>
                  <span className="gender-value">
                    {formatCurrency(genderTotals.female)}
                    <span className="gender-percent">
                      ({((genderTotals.female / totalGenderSales) * 100).toFixed(1)}%)
                    </span>
                  </span>
                  <span className="gender-count">{genderTotals.femaleCount}件</span>
                </div>
                <div className="gender-summary-item">
                  <span className="gender-label gender-label--male">👨 男性</span>
                  <span className="gender-value">
                    {formatCurrency(genderTotals.male)}
                    <span className="gender-percent">
                      ({((genderTotals.male / totalGenderSales) * 100).toFixed(1)}%)
                    </span>
                  </span>
                  <span className="gender-count">{genderTotals.maleCount}件</span>
                </div>
              </div>
            </div>
          )}

          {/* 性別別推移グラフ（折れ線） */}
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer>
              <LineChart data={genderChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey={period === 'yearly' ? 'month' : 'day'}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
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
                {/* 動的に線を生成 */}
                {genderChartData.length > 0 && Object.keys(genderChartData[0])
                  .filter(key => key !== 'month' && key !== 'day')
                  .map((key, index) => {
                    const isFemale = key.includes('女性');
                    const color = isFemale ? '#ec4899' : '#3b82f6';
                    return (
                      <Line 
                        key={key}
                        type="monotone" 
                        dataKey={key}
                        name={key}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    );
                  })
                }
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 推移テーブル */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '月別' : '日別'}売上推移データ
        </h3>
        {salesData.length > 0 ? (
          <div className="sales-trend-table">
            <div className="sales-trend-row sales-trend-row--header">
              <div className="sales-trend-cell sales-trend-cell--period">期間</div>
              <div className="sales-trend-cell sales-trend-cell--number">取引数</div>
              <div className="sales-trend-cell sales-trend-cell--number">理想売上</div>
              <div className="sales-trend-cell sales-trend-cell--number">現状売上</div>
              <div className="sales-trend-cell sales-trend-cell--number">現金</div>
              <div className="sales-trend-cell sales-trend-cell--number">カード</div>
              <div className="sales-trend-cell sales-trend-cell--number">顧客数</div>
            </div>
            
            {salesData.map((row, index) => (
              <div key={index} className="sales-trend-row">
                <div className="sales-trend-cell sales-trend-cell--period">
                  <strong>{row.period}</strong>
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {row.transaction_count}件
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {formatCurrency(row.ideal_sales)}
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {formatCurrency(row.actual_sales)}
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {formatCurrency(row.cash_sales)}
                </div>
                <div className="sales-trend-cell sales-trend-cell--number">
                  {formatCurrency(row.card_sales)}
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
        .gender-summary {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
        }
        
        .gender-summary-row {
          display: flex;
          gap: 2rem;
          justify-content: center;
        }
        
        .gender-summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .gender-label {
          font-size: 1rem;
          font-weight: 600;
        }
        
        .gender-label--female {
          color: #ec4899;
        }
        
        .gender-label--male {
          color: #3b82f6;
        }
        
        .gender-value {
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .gender-percent {
          font-size: 1rem;
          color: #6b7280;
          margin-left: 0.5rem;
        }
        
        .gender-count {
          font-size: 0.875rem;
          color: #9ca3af;
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
          grid-template-columns: 1.2fr 0.8fr 1fr 1fr 0.8fr 0.8fr 0.7fr;
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
      `}</style>
    </div>
  );
};

export default SalesTrendChart;