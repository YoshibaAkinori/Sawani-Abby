// app/analytics/components/StaffAnalysis.js
"use client";
import React from 'react';
import { Users, TrendingUp, Award } from 'lucide-react';

const StaffAnalysis = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  if (!data || !Array.isArray(data)) {
    return (
      <div className="staff-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // 期間ごとにグループ化
  const groupedByPeriod = data.reduce((acc, row) => {
    if (!acc[row.period]) {
      acc[row.period] = [];
    }
    acc[row.period].push(row);
    return acc;
  }, {});

  // 各期間内でランキング
  const rankedPeriods = Object.entries(groupedByPeriod).map(([period, rows]) => {
    const sortedRows = rows.sort((a, b) => b.total_sales - a.total_sales);
    return { period, rankings: sortedRows };
  }).sort((a, b) => b.period.localeCompare(a.period)); // 期間を降順に並べ替え

  // 全期間通してのトップパフォーマー
  const allStaffStats = data.reduce((acc, row) => {
    const existing = acc.find(s => s.staff_name === row.staff_name);
    if (existing) {
      existing.transaction_count += row.transaction_count;
      existing.total_sales += row.total_sales;
      existing.unique_customers += row.unique_customers;
    } else {
      acc.push({
        staff_name: row.staff_name,
        staff_color: row.staff_color,
        transaction_count: row.transaction_count,
        total_sales: row.total_sales,
        unique_customers: row.unique_customers
      });
    }
    return acc;
  }, []).sort((a, b) => b.total_sales - a.total_sales);

  const topPerformer = allStaffStats[0];

  return (
    <div className="staff-analysis">
      {/* トップパフォーマー */}
      {topPerformer && (
        <div className="top-performer-card" style={{ background: `linear-gradient(135deg, ${topPerformer.staff_color}dd, ${topPerformer.staff_color}88)` }}>
          <div className="top-performer-header">
            <Award size={32} color="white" />
            <h3>全期間トップパフォーマー</h3>
          </div>
          <div className="top-performer-name">{topPerformer.staff_name}</div>
          <div className="top-performer-stats">
            <div className="stat-item">
              <div className="stat-label">総売上</div>
              <div className="stat-value">{formatCurrency(topPerformer.total_sales)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">取引数</div>
              <div className="stat-value">{topPerformer.transaction_count}件</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">顧客数</div>
              <div className="stat-value">{topPerformer.unique_customers}人</div>
            </div>
          </div>
        </div>
      )}

      {/* 期間別ランキング */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}スタッフランキング
        </h3>
        
        {rankedPeriods.map(({ period: periodName, rankings }) => (
          <div key={periodName} className="period-section">
            <h4 className="period-title">{periodName}</h4>
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
              {rankings.map((staff, index) => (
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
                  <div className="staff-cell staff-cell--number">{staff.transaction_count}件</div>
                  <div className="staff-cell staff-cell--number">{formatCurrency(staff.total_sales)}</div>
                  <div className="staff-cell staff-cell--number">
                    {formatCurrency(staff.total_sales / staff.transaction_count)}
                  </div>
                  <div className="staff-cell staff-cell--number">{staff.unique_customers}人</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .staff-analysis {
          padding: 0;
        }

        /* トップパフォーマーカード */
        .top-performer-card {
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          color: white;
        }

        .top-performer-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .top-performer-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .top-performer-name {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .top-performer-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.15);
          padding: 1rem;
          border-radius: 0.5rem;
          backdrop-filter: blur(10px);
        }

        .stat-label {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
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

        /* 共通スタイル */
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

        .trophy {
          font-size: 1.25rem;
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
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

          .top-performer-stats {
            grid-template-columns: 1fr;
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