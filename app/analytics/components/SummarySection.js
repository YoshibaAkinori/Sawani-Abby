// app/analytics/components/SummarySection.js
"use client";
import React from 'react';
import { TrendingUp, Users, CreditCard, Ticket, Tag, ShoppingCart } from 'lucide-react';

const SummarySection = ({ data }) => {
  const { 
    summary = {}, 
    topServices = [], 
    topOptions = [] 
  } = data || {};

  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  function formatPercent(value) {
    return `${(value || 0).toFixed(1)}%`;
  }

  // データが存在しない場合の表示
  if (!data) {
    return (
      <div className="summary-section">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  const cashRatio = summary.actual_sales > 0 
    ? (summary.total_cash / summary.actual_sales * 100) 
    : 0;
  
  const cardRatio = summary.actual_sales > 0 
    ? (summary.total_card / summary.actual_sales * 100) 
    : 0;

  return (
    <div className="summary-section">
      {/* メインメトリクス */}
      <div className="analytics-metrics">
        <div className="analytics-metric">
          <span className="analytics-metric__label">
            <TrendingUp size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
            理想売上
          </span>
          <span className="analytics-metric__value">
            {formatCurrency(summary.ideal_sales || 0)}
          </span>
          <span className="analytics-metric__sub" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            (最終的に得られる金額)
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">現状売上</span>
          <span className="analytics-metric__value">
            {formatCurrency(summary.actual_sales || 0)}
          </span>
          <span className="analytics-metric__sub" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            (実際に支払われた金額)
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">差額</span>
          <span className="analytics-metric__value" style={{ 
            color: (summary.ideal_sales - summary.actual_sales) > 0 ? '#f59e0b' : '#10b981' 
          }}>
            {formatCurrency((summary.ideal_sales || 0) - (summary.actual_sales || 0))}
          </span>
          <span className="analytics-metric__sub" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            (未回収金額)
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">総取引数</span>
          <span className="analytics-metric__value">
            {(summary.total_transactions || 0).toLocaleString()}
            <span className="analytics-metric__unit">件</span>
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">
            <Users size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
            ユニーク顧客
          </span>
          <span className="analytics-metric__value">
            {(summary.unique_customers || 0).toLocaleString()}
            <span className="analytics-metric__unit">人</span>
          </span>
        </div>
      </div>

      {/* 決済方法内訳 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <CreditCard size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          決済方法内訳
        </h3>
        <div className="payment-breakdown">
          <div className="payment-item">
            <div className="payment-label">
              <span>現金</span>
              <span className="payment-ratio">{formatPercent(cashRatio)}</span>
            </div>
            <div className="analytics-progress">
              <div 
                className="analytics-progress__bar" 
                style={{ width: `${cashRatio}%`, background: '#10b981' }}
              />
            </div>
            <div className="payment-amount">{formatCurrency(summary.total_cash || 0)}</div>
          </div>

          <div className="payment-item">
            <div className="payment-label">
              <span>カード</span>
              <span className="payment-ratio">{formatPercent(cardRatio)}</span>
            </div>
            <div className="analytics-progress">
              <div 
                className="analytics-progress__bar" 
                style={{ width: `${cardRatio}%`, background: '#3b82f6' }}
              />
            </div>
            <div className="payment-amount">{formatCurrency(summary.total_card || 0)}</div>
          </div>
        </div>
      </div>

      {/* 回数券・クーポン利用状況 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">特典利用状況</h3>
        <div className="analytics-metrics">
          <div className="analytics-metric">
            <span className="analytics-metric__label">
              <ShoppingCart size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              回数券購入
            </span>
            <span className="analytics-metric__value">
              {(summary.ticket_purchase || 0).toLocaleString()}
              <span className="analytics-metric__unit">件</span>
            </span>
          </div>

          <div className="analytics-metric">
            <span className="analytics-metric__label">
              <Ticket size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              回数券使用
            </span>
            <span className="analytics-metric__value">
              {(summary.ticket_usage || 0).toLocaleString()}
              <span className="analytics-metric__unit">回</span>
            </span>
          </div>

          <div className="analytics-metric">
            <span className="analytics-metric__label">
              <Tag size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              クーポン使用
            </span>
            <span className="analytics-metric__value">
              {(summary.coupon_usage || 0).toLocaleString()}
              <span className="analytics-metric__unit">回</span>
            </span>
          </div>
        </div>
      </div>

      {/* トップサービス */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">人気サービス TOP5</h3>
        {topServices && topServices.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>サービス名</th>
                <th className="analytics-table__number">回数</th>
                <th className="analytics-table__number">売上</th>
              </tr>
            </thead>
            <tbody>
              {topServices.map((service, index) => (
                <tr key={index}>
                  <td>{service.service_name}</td>
                  <td className="analytics-table__number">{service.count}回</td>
                  <td className="analytics-table__number">{formatCurrency(service.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            データがありません
          </p>
        )}
      </div>

      {/* トップオプション */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">人気オプション TOP5</h3>
        {topOptions && topOptions.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>オプション名</th>
                <th className="analytics-table__number">回数</th>
                <th className="analytics-table__number">売上</th>
              </tr>
            </thead>
            <tbody>
              {topOptions.map((option, index) => (
                <tr key={index}>
                  <td>{option.option_name}</td>
                  <td className="analytics-table__number">{option.count}回</td>
                  <td className="analytics-table__number">{formatCurrency(option.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            データがありません
          </p>
        )}
      </div>
      
      {/* トップパフォーマー */}
      {data.topStaff && (
        <div className="analytics-card">
          <h3 className="analytics-card__title">
            <Users size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            全期間トップパフォーマー
          </h3>
          <div className="top-performer-card" style={{ 
            background: `linear-gradient(135deg, ${data.topStaff.staff_color}dd, ${data.topStaff.staff_color}88)`,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            color: 'white',
            marginTop: '1rem'
          }}>
            <div className="top-performer-name" style={{ 
              fontSize: '1.75rem', 
              fontWeight: 700, 
              marginBottom: '1rem' 
            }}>
              {data.topStaff.staff_name}
            </div>
            <div className="top-performer-stats" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1rem' 
            }}>
              <div className="stat-item" style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                padding: '0.75rem', 
                borderRadius: '0.5rem' 
              }}>
                <div className="stat-label" style={{ fontSize: '0.875rem', opacity: 0.9 }}>総売上</div>
                <div className="stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  {formatCurrency(data.topStaff.total_sales)}
                </div>
              </div>
              <div className="stat-item" style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                padding: '0.75rem', 
                borderRadius: '0.5rem' 
              }}>
                <div className="stat-label" style={{ fontSize: '0.875rem', opacity: 0.9 }}>取引数</div>
                <div className="stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  {data.topStaff.transaction_count}件
                </div>
              </div>
              <div className="stat-item" style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                padding: '0.75rem', 
                borderRadius: '0.5rem' 
              }}>
                <div className="stat-label" style={{ fontSize: '0.875rem', opacity: 0.9 }}>顧客数</div>
                <div className="stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  {data.topStaff.unique_customers}人
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .summary-section {
          padding: 0;
        }

        .payment-breakdown {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .payment-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .payment-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .payment-ratio {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .payment-amount {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          text-align: right;
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

export default SummarySection;