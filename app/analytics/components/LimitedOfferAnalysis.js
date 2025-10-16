// app/analytics/components/LimitedOfferAnalysis.js
"use client";
import React from 'react';
import { Clock, TrendingUp, Tag } from 'lucide-react';

const LimitedOfferAnalysis = ({ data, period }) => {
  const { salesByPeriod = [], salesByOffer = [] } = data || {};

  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  if (!data) {
    return (
      <div className="limited-offer-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  return (
    <div className="limited-offer-analysis">
      {/* 期間別販売推移 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}販売推移
        </h3>
        {salesByPeriod && salesByPeriod.length > 0 ? (
          <div className="period-table">
            {/* ヘッダー */}
            <div className="period-row period-row--header">
              <div className="period-cell period-cell--period">期間</div>
              <div className="period-cell period-cell--number">購入数</div>
              <div className="period-cell period-cell--number">総売上</div>
              <div className="period-cell period-cell--number">平均単価</div>
            </div>
            
            {/* データ行 */}
            {salesByPeriod.map((sale, index) => (
              <div key={index} className="period-row">
                <div className="period-cell period-cell--period">
                  <strong>{sale.period}</strong>
                </div>
                <div className="period-cell period-cell--number">{sale.purchase_count}件</div>
                <div className="period-cell period-cell--number">{formatCurrency(sale.total_revenue)}</div>
                <div className="period-cell period-cell--number">{formatCurrency(sale.avg_price)}</div>
              </div>
            ))}
          </div>
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
          <div className="offer-table">
            {/* ヘッダー */}
            <div className="offer-row offer-row--header">
              <div className="offer-cell offer-cell--name">オファー名</div>
              <div className="offer-cell offer-cell--service">サービス名</div>
              <div className="offer-cell offer-cell--number">特別価格</div>
              <div className="offer-cell offer-cell--number">販売数</div>
              <div className="offer-cell offer-cell--number">売上</div>
              <div className="offer-cell offer-cell--date">販売終了日</div>
              <div className="offer-cell offer-cell--status">ステータス</div>
            </div>
            
            {/* データ行 */}
            {salesByOffer.map((offer, index) => {
              const salesRate = offer.max_sales 
                ? Math.round((offer.current_sales / offer.max_sales) * 100) 
                : null;
              
              const statusClass = offer.is_active 
                ? 'status-badge--active' 
                : 'status-badge--inactive';
              
              return (
                <div key={index} className="offer-row">
                  <div className="offer-cell offer-cell--name">
                    <strong>{offer.offer_name}</strong>
                  </div>
                  <div className="offer-cell offer-cell--service">{offer.service_name}</div>
                  <div className="offer-cell offer-cell--number">{formatCurrency(offer.special_price)}</div>
                  <div className="offer-cell offer-cell--number">
                    {offer.current_sales}
                    {offer.max_sales && ` / ${offer.max_sales}`}
                    {salesRate !== null && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.25rem' }}>
                        ({salesRate}%)
                      </span>
                    )}
                  </div>
                  <div className="offer-cell offer-cell--number">{formatCurrency(offer.total_revenue)}</div>
                  <div className="offer-cell offer-cell--date">
                    {offer.sale_end_date ? new Date(offer.sale_end_date).toLocaleDateString('ja-JP') : '無期限'}
                  </div>
                  <div className="offer-cell offer-cell--status">
                    <span className={`status-badge ${statusClass}`}>
                      {offer.is_active ? '有効' : '終了'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      <style jsx>{`
        .limited-offer-analysis {
          padding: 0;
        }

        /* 期間別テーブル */
        .period-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .period-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1.2fr 1fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        .period-row:last-child {
          border-bottom: none;
        }

        .period-row:not(.period-row--header):hover {
          background: #f9fafb;
        }

        .period-row--header {
          background: #f9fafb;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .period-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .period-cell:last-child {
          border-right: none;
        }

        .period-row--header .period-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .period-cell--period {
          justify-content: flex-start;
        }

        .period-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        /* オファーテーブル */
        .offer-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .offer-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1.2fr 1fr 1.2fr 0.8fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        .offer-row:last-child {
          border-bottom: none;
        }

        .offer-row:not(.offer-row--header):hover {
          background: #f9fafb;
        }

        .offer-row--header {
          background: #f9fafb;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .offer-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .offer-cell:last-child {
          border-right: none;
        }

        .offer-row--header .offer-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .offer-cell--name,
        .offer-cell--service,
        .offer-cell--date {
          justify-content: flex-start;
        }

        .offer-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        .offer-cell--status {
          justify-content: center;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge--active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge--inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }

        @media (max-width: 1200px) {
          .offer-row {
            grid-template-columns: 1.5fr 1.5fr 0.8fr 1fr 0.8fr 1fr 0.7fr;
          }

          .period-cell, .offer-cell {
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
          }
        }

        @media (max-width: 768px) {
          .period-table,
          .offer-table {
            overflow-x: auto;
          }

          .period-row {
            min-width: 600px;
          }

          .offer-row {
            min-width: 1000px;
          }
        }
      `}</style>
    </div>
  );
};

export default LimitedOfferAnalysis;