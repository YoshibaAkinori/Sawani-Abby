// app/analytics/components/ServiceAnalysis.js
"use client";
import React from 'react';
import { Briefcase, TrendingUp, Award } from 'lucide-react';

const ServiceAnalysis = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  if (!data || !Array.isArray(data)) {
    return (
      <div className="service-analysis">
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
    const sortedRows = rows.sort((a, b) => b.total_revenue - a.total_revenue);
    return { period, rankings: sortedRows };
  }).sort((a, b) => b.period.localeCompare(a.period));

  // 全期間通してのトップサービス
  const allServiceStats = data.reduce((acc, row) => {
    const existing = acc.find(s => s.service_name === row.service_name);
    if (existing) {
      existing.count += row.count;
      existing.total_revenue += row.total_revenue;
      existing.total_minutes += row.total_minutes;
    } else {
      acc.push({
        service_name: row.service_name,
        category: row.category,
        count: row.count,
        total_revenue: row.total_revenue,
        total_minutes: row.total_minutes
      });
    }
    return acc;
  }, []).sort((a, b) => b.total_revenue - a.total_revenue);

  const topService = allServiceStats[0];

  return (
    <div className="service-analysis">
      {/* トップサービス */}
      {topService && (
        <div className="top-service-card">
          <div className="top-service-header">
            <Award size={32} />
            <h3>全期間人気No.1サービス</h3>
          </div>
          <div className="top-service-name">{topService.service_name}</div>
          <div className="top-service-category">{topService.category}</div>
          <div className="top-service-stats">
            <div className="stat-item">
              <div className="stat-label">総売上</div>
              <div className="stat-value">{formatCurrency(topService.total_revenue)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">利用回数</div>
              <div className="stat-value">{topService.count}回</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">平均単価</div>
              <div className="stat-value">{formatCurrency(topService.total_revenue / topService.count)}</div>
            </div>
          </div>
        </div>
      )}

      {/* 期間別ランキング */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Briefcase size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}サービスランキング
        </h3>
        
        {rankedPeriods.map(({ period: periodName, rankings }) => (
          <div key={periodName} className="period-section">
            <h4 className="period-title">{periodName}</h4>
            <div className="service-table">
              {/* ヘッダー */}
              <div className="service-row service-row--header">
                <div className="service-cell service-cell--rank">順位</div>
                <div className="service-cell service-cell--name">サービス名</div>
                <div className="service-cell service-cell--category">カテゴリ</div>
                <div className="service-cell service-cell--number">回数</div>
                <div className="service-cell service-cell--number">売上</div>
                <div className="service-cell service-cell--number">平均単価</div>
                <div className="service-cell service-cell--number">総施術時間</div>
              </div>
              
              {/* データ行 */}
              {rankings.map((service, index) => (
                <div key={index} className="service-row">
                  <div className="service-cell service-cell--rank">
                    <div className={`rank-badge rank-${index + 1}`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="service-cell service-cell--name">
                    <strong>{service.service_name}</strong>
                    {index === 0 && <span className="medal">🥇</span>}
                    {index === 1 && <span className="medal">🥈</span>}
                    {index === 2 && <span className="medal">🥉</span>}
                  </div>
                  <div className="service-cell service-cell--category">{service.category}</div>
                  <div className="service-cell service-cell--number">{service.count}回</div>
                  <div className="service-cell service-cell--number">{formatCurrency(service.total_revenue)}</div>
                  <div className="service-cell service-cell--number">
                    {formatCurrency(service.total_revenue / service.count)}
                  </div>
                  <div className="service-cell service-cell--number">{service.total_minutes}分</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .service-analysis {
          padding: 0;
        }

        /* トップサービスカード */
        .top-service-card {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          color: white;
        }

        .top-service-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .top-service-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .top-service-name {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .top-service-category {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
        }

        .top-service-stats {
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

        /* サービステーブル */
        .service-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .service-row {
          display: grid;
          grid-template-columns: 70px 2.5fr 1.2fr 0.8fr 1.2fr 1fr 1fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        .service-row:last-child {
          border-bottom: none;
        }

        .service-row:not(.service-row--header):hover {
          background: #f9fafb;
        }

        .service-row--header {
          background: #f9fafb;
          font-weight: 600;
        }

        .service-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .service-cell:last-child {
          border-right: none;
        }

        .service-row--header .service-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .service-cell--rank {
          justify-content: center;
        }

        .service-cell--name {
          justify-content: flex-start;
          gap: 0.5rem;
        }

        .service-cell--category {
          justify-content: flex-start;
        }

        .service-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #e5e7eb;
          color: #374151;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .rank-1 {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          box-shadow: 0 2px 6px rgba(251, 191, 36, 0.3);
        }

        .rank-2 {
          background: linear-gradient(135deg, #94a3b8, #64748b);
          color: white;
        }

        .rank-3 {
          background: linear-gradient(135deg, #cd7f32, #b8692f);
          color: white;
        }

        .medal {
          font-size: 1.25rem;
        }

        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .service-row {
            grid-template-columns: 60px 2fr 1fr 0.7fr 1fr 0.8fr 0.8fr;
          }

          .service-cell {
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
          }

          .top-service-stats {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .service-table {
            overflow-x: auto;
          }

          .service-row {
            min-width: 900px;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceAnalysis;