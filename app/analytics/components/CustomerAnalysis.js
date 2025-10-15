// app/analytics/components/CustomerAnalysis.js
"use client";
import React from 'react';
import { Users, Repeat, Calendar, Ticket, TrendingUp } from 'lucide-react';

const CustomerAnalysis = ({ data }) => {
  const {
    repeatAnalysis = {},
    avgRepeatDays = {},
    visitDistribution = [],
    ticketPurchaseTiming = [],
    ltvAnalysis = {}
  } = data || {};

  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  function formatPercent(value) {
    return `${value || 0}%`;
  }

  // データが存在しない場合の表示
  if (!data) {
    return (
      <div className="customer-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  return (
    <div className="customer-analysis">
      {/* リピート分析 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Repeat size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          リピート分析
        </h3>
        <div className="analytics-metrics">
          <div className="analytics-metric">
            <span className="analytics-metric__label">
              <Users size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              総顧客数
            </span>
            <span className="analytics-metric__value">
              {(repeatAnalysis.total_customers || 0).toLocaleString()}
              <span className="analytics-metric__unit">人</span>
            </span>
          </div>

          <div className="analytics-metric">
            <span className="analytics-metric__label">リピート顧客</span>
            <span className="analytics-metric__value">
              {(repeatAnalysis.repeat_customers || 0).toLocaleString()}
              <span className="analytics-metric__unit">人</span>
            </span>
          </div>

          <div className="analytics-metric">
            <span className="analytics-metric__label">リピート率</span>
            <span className="analytics-metric__value">
              {formatPercent(repeatAnalysis.repeat_rate || 0)}
            </span>
          </div>

          <div className="analytics-metric">
            <span className="analytics-metric__label">
              <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              平均リピート日数
            </span>
            <span className="analytics-metric__value">
              {Math.round(avgRepeatDays.avg_repeat_days || 0)}
              <span className="analytics-metric__unit">日</span>
            </span>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <div className="stat-detail">
            <span>最短リピート日数:</span>
            <strong>{Math.round(avgRepeatDays.min_repeat_days || 0)}日</strong>
          </div>
          <div className="stat-detail">
            <span>最長リピート日数:</span>
            <strong>{Math.round(avgRepeatDays.max_repeat_days || 0)}日</strong>
          </div>
        </div>
      </div>

      {/* 来店回数分布 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">来店回数別顧客分布</h3>
        {visitDistribution && visitDistribution.length > 0 ? (
          <div className="distribution-chart">
            {visitDistribution.map((item, index) => {
              const total = visitDistribution.reduce((sum, v) => sum + v.customer_count, 0);
              const percentage = total > 0 ? (item.customer_count / total * 100) : 0;
              
              return (
                <div key={index} className="distribution-item">
                  <div className="distribution-label">
                    <span>{item.visit_range}</span>
                    <span className="distribution-count">
                      {item.customer_count}人 ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="analytics-progress">
                    <div 
                      className="analytics-progress__bar"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* 回数券購入タイミング */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Ticket size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          回数券購入タイミング分析
        </h3>
        <p className="analytics-card__subtitle">
          何回目の来店で回数券を購入しているか
        </p>
        {ticketPurchaseTiming && ticketPurchaseTiming.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>来店タイミング</th>
                <th className="analytics-table__number">購入数</th>
                <th className="analytics-table__number">割合</th>
              </tr>
            </thead>
            <tbody>
              {ticketPurchaseTiming.map((item, index) => {
                const total = ticketPurchaseTiming.reduce((sum, t) => sum + t.purchase_count, 0);
                const percentage = total > 0 ? (item.purchase_count / total * 100) : 0;
                
                return (
                  <tr key={index}>
                    <td>{item.visit_timing}</td>
                    <td className="analytics-table__number">{item.purchase_count}件</td>
                    <td className="analytics-table__number">{percentage.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* 顧客LTV分析 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          顧客生涯価値 (LTV) 分析
        </h3>
        <div className="analytics-metrics">
          <div className="analytics-metric">
            <span className="analytics-metric__label">平均LTV</span>
            <span className="analytics-metric__value">
              {formatCurrency(ltvAnalysis.avg_ltv || 0)}
            </span>
          </div>

          <div className="analytics-metric">
            <span className="analytics-metric__label">最小LTV</span>
            <span className="analytics-metric__value">
              {formatCurrency(ltvAnalysis.min_ltv || 0)}
            </span>
          </div>

          <div className="analytics-metric">
            <span className="analytics-metric__label">最大LTV</span>
            <span className="analytics-metric__value">
              {formatCurrency(ltvAnalysis.max_ltv || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* インサイトカード */}
      <div className="analytics-card insight-card">
        <h3 className="analytics-card__title">💡 インサイト</h3>
        <div className="insights">
          {repeatAnalysis.repeat_rate >= 50 && (
            <div className="insight-item insight-item--positive">
              <strong>優秀なリピート率!</strong>
              <p>リピート率が{formatPercent(repeatAnalysis.repeat_rate)}と高く、顧客満足度が高いことが伺えます。</p>
            </div>
          )}
          
          {repeatAnalysis.repeat_rate < 30 && (
            <div className="insight-item insight-item--warning">
              <strong>リピート率改善の余地あり</strong>
              <p>リピート率が{formatPercent(repeatAnalysis.repeat_rate)}です。アフターフォローやリピート特典の強化を検討しましょう。</p>
            </div>
          )}
          
          {avgRepeatDays.avg_repeat_days > 0 && (
            <div className="insight-item">
              <strong>リピートサイクル</strong>
              <p>
                平均{Math.round(avgRepeatDays.avg_repeat_days)}日でリピート来店されています。
                この期間に合わせたリマインド施策が効果的です。
              </p>
            </div>
          )}
          
          {ticketPurchaseTiming && ticketPurchaseTiming.length > 0 && (
            <div className="insight-item">
              <strong>回数券購入のタイミング</strong>
              <p>
                {ticketPurchaseTiming[0]?.visit_timing}での購入が最多です。
                このタイミングで回数券の提案を強化すると効果的です。
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .customer-analysis {
          padding: 0;
        }

        .stat-detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .stat-detail:last-child {
          border-bottom: none;
        }

        .stat-detail strong {
          color: #111827;
          font-size: 1rem;
        }

        .distribution-chart {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .distribution-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .distribution-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .distribution-label > span:first-child {
          font-weight: 500;
          color: #374151;
        }

        .distribution-count {
          color: #6b7280;
        }

        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }

        .insight-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }

        .insight-card .analytics-card__title {
          color: white;
        }

        .insights {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .insight-item {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 0.5rem;
          padding: 1rem;
          backdrop-filter: blur(10px);
        }

        .insight-item--positive {
          background: rgba(16, 185, 129, 0.2);
          border-left: 4px solid #10b981;
        }

        .insight-item--warning {
          background: rgba(251, 191, 36, 0.2);
          border-left: 4px solid #fbbf24;
        }

        .insight-item strong {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .insight-item p {
          margin: 0;
          font-size: 0.875rem;
          opacity: 0.9;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default CustomerAnalysis;