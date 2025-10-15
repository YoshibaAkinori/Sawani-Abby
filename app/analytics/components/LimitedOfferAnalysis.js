// ============================================
// app/analytics/components/LimitedOfferAnalysis.js
// ============================================

"use client";
import React from 'react';
import { Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const LimitedOfferAnalysis = ({ data, period }) => {
  const { 
    salesByPeriod = [], 
    salesByOffer = [], 
    usageStatus = {} 
  } = data || {};

  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  function formatDate(dateString) {
    if (!dateString) return '無期限';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  }

  // データが存在しない場合の表示
  if (!data) {
    return (
      <div className="limited-offer-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  return (
    <div className="limited-offer-analysis">
      {/* 使用状況サマリー */}
      <div className="analytics-metrics">
        <div className="analytics-metric">
          <span className="analytics-metric__label">
            <CheckCircle size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
            購入済み
          </span>
          <span className="analytics-metric__value">
            {(usageStatus.total_purchased || 0).toLocaleString()}
            <span className="analytics-metric__unit">件</span>
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">有効チケット</span>
          <span className="analytics-metric__value">
            {(usageStatus.active_tickets || 0).toLocaleString()}
            <span className="analytics-metric__unit">件</span>
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">消化済み</span>
          <span className="analytics-metric__value">
            {(usageStatus.completed_tickets || 0).toLocaleString()}
            <span className="analytics-metric__unit">件</span>
          </span>
        </div>

        <div className="analytics-metric">
          <span className="analytics-metric__label">
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
            期限切れ
          </span>
          <span className="analytics-metric__value">
            {(usageStatus.expired_tickets || 0).toLocaleString()}
            <span className="analytics-metric__unit">件</span>
          </span>
        </div>
      </div>

      {/* 期間別販売推移 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}販売推移
        </h3>
        {salesByPeriod && salesByPeriod.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>期間</th>
                <th className="analytics-table__number">購入数</th>
                <th className="analytics-table__number">総売上</th>
                <th className="analytics-table__number">平均単価</th>
              </tr>
            </thead>
            <tbody>
              {salesByPeriod.map((sale, index) => (
                <tr key={index}>
                  <td><strong>{sale.period}</strong></td>
                  <td className="analytics-table__number">{sale.purchase_count}件</td>
                  <td className="analytics-table__number">{formatCurrency(sale.total_revenue)}</td>
                  <td className="analytics-table__number">{formatCurrency(sale.avg_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* オファー別販売状況 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Clock size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          オファー別販売状況
        </h3>
        {salesByOffer && salesByOffer.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>オファー名</th>
                <th>サービス名</th>
                <th className="analytics-table__number">特別価格</th>
                <th className="analytics-table__number">販売数</th>
                <th className="analytics-table__number">売上</th>
                <th className="analytics-table__number">販売終了日</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {salesByOffer.map((offer, index) => {
                const salesRate = offer.max_sales 
                  ? (offer.current_sales / offer.max_sales * 100) 
                  : null;
                const isEndingSoon = offer.sale_end_date && 
                  new Date(offer.sale_end_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                return (
                  <tr key={index}>
                    <td>
                      <strong>{offer.offer_name}</strong>
                      {isEndingSoon && (
                        <span className="analytics-badge analytics-badge--warning" style={{ marginLeft: '0.5rem' }}>
                          終了間近
                        </span>
                      )}
                    </td>
                    <td>{offer.service_name}</td>
                    <td className="analytics-table__number">{formatCurrency(offer.special_price)}</td>
                    <td className="analytics-table__number">
                      {offer.current_sales || 0}
                      {offer.max_sales && ` / ${offer.max_sales}`}
                      {salesRate && (
                        <div className="analytics-progress" style={{ marginTop: '0.25rem' }}>
                          <div 
                            className="analytics-progress__bar"
                            style={{ 
                              width: `${salesRate}%`,
                              background: salesRate >= 80 ? '#ef4444' : '#3b82f6'
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="analytics-table__number">{formatCurrency(offer.total_revenue || 0)}</td>
                    <td className="analytics-table__number">{formatDate(offer.sale_end_date)}</td>
                    <td>
                      <span className={`analytics-badge ${offer.is_active ? 'analytics-badge--active' : 'analytics-badge--inactive'}`}>
                        {offer.is_active ? '販売中' : '終了'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      <style jsx>{`
        .limited-offer-analysis {
          padding: 0;
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

export default LimitedOfferAnalysis;