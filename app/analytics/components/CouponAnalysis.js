// app/analytics/components/CouponAnalysis.js
"use client";
import React from 'react';
import { Tag, TrendingUp, Gift } from 'lucide-react';

const CouponAnalysis = ({ data, period }) => {
  const { 
    usageByPeriod = [], 
    usageByCoupon = [], 
    freeOptionUsage = [] 
  } = data || {};

  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  if (!data) {
    return (
      <div className="coupon-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  return (
    <div className="coupon-analysis">
      {/* 期間別使用状況 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}クーポン使用推移
        </h3>
        {usageByPeriod && usageByPeriod.length > 0 ? (
          <div className="period-table">
            {/* ヘッダー */}
            <div className="period-row period-row--header">
              <div className="period-cell period-cell--period">期間</div>
              <div className="period-cell period-cell--number">使用回数</div>
              <div className="period-cell period-cell--number">総割引額</div>
              <div className="period-cell period-cell--number">平均割引額</div>
            </div>
            
            {/* データ行 */}
            {usageByPeriod.map((usage, index) => (
              <div key={index} className="period-row">
                <div className="period-cell period-cell--period">
                  <strong>{usage.period}</strong>
                </div>
                <div className="period-cell period-cell--number">{usage.usage_count}回</div>
                <div className="period-cell period-cell--number">{formatCurrency(usage.total_discount)}</div>
                <div className="period-cell period-cell--number">{formatCurrency(usage.avg_discount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* クーポン別使用状況 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Tag size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          クーポン別使用状況
        </h3>
        {usageByCoupon && usageByCoupon.length > 0 ? (
          <div className="coupon-table">
            {/* ヘッダー */}
            <div className="coupon-row coupon-row--header">
              <div className="coupon-cell coupon-cell--name">クーポン名</div>
              <div className="coupon-cell coupon-cell--number">使用回数</div>
              <div className="coupon-cell coupon-cell--number">総割引額</div>
              <div className="coupon-cell coupon-cell--number">使用制限</div>
              <div className="coupon-cell coupon-cell--status">ステータス</div>
            </div>
            
            {/* データ行 */}
            {usageByCoupon.map((coupon, index) => (
              <div key={index} className="coupon-row">
                <div className="coupon-cell coupon-cell--name">{coupon.coupon_name}</div>
                <div className="coupon-cell coupon-cell--number">{coupon.usage_count || 0}回</div>
                <div className="coupon-cell coupon-cell--number">{formatCurrency(coupon.total_discount || 0)}</div>
                <div className="coupon-cell coupon-cell--number">
                  {coupon.usage_limit ? `${coupon.usage_limit}回` : '無制限'}
                </div>
                <div className="coupon-cell coupon-cell--status">
                  <span className={`status-badge ${coupon.is_active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                    {coupon.is_active ? '有効' : '無効'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* 無料オプション利用状況 */}
      {freeOptionUsage && freeOptionUsage.length > 0 && (
        <div className="analytics-card">
          <h3 className="analytics-card__title">
            <Gift size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            無料オプション選択ランキング
          </h3>
          <p className="analytics-card__subtitle">
            クーポンで選択された無料オプションTOP10
          </p>
          <div className="option-table">
            {/* ヘッダー */}
            <div className="option-row option-row--header">
              <div className="option-cell option-cell--rank">順位</div>
              <div className="option-cell option-cell--name">オプション名</div>
              <div className="option-cell option-cell--number">選択回数</div>
            </div>
            
            {/* データ行 */}
            {freeOptionUsage.map((option, index) => (
              <div key={index} className="option-row">
                <div className="option-cell option-cell--rank">
                  <span className="rank-badge">{index + 1}</span>
                </div>
                <div className="option-cell option-cell--name">{option.option_name}</div>
                <div className="option-cell option-cell--number">{option.selection_count}回</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .coupon-analysis {
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

        /* クーポンテーブル */
        .coupon-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .coupon-row {
          display: grid;
          grid-template-columns: 2.5fr 1fr 1.2fr 1fr 0.8fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        .coupon-row:last-child {
          border-bottom: none;
        }

        .coupon-row:not(.coupon-row--header):hover {
          background: #f9fafb;
        }

        .coupon-row--header {
          background: #f9fafb;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .coupon-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .coupon-cell:last-child {
          border-right: none;
        }

        .coupon-row--header .coupon-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .coupon-cell--name {
          justify-content: flex-start;
        }

        .coupon-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        .coupon-cell--status {
          justify-content: center;
        }

        /* オプションテーブル */
        .option-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .option-row {
          display: grid;
          grid-template-columns: 80px 3fr 1fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        .option-row:last-child {
          border-bottom: none;
        }

        .option-row:not(.option-row--header):hover {
          background: #f9fafb;
        }

        .option-row--header {
          background: #f9fafb;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .option-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .option-cell:last-child {
          border-right: none;
        }

        .option-row--header .option-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .option-cell--rank {
          justify-content: center;
        }

        .option-cell--name {
          justify-content: flex-start;
        }

        .option-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        /* 共通スタイル */
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

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .period-row {
            grid-template-columns: 1.2fr 0.8fr 1fr 0.8fr;
          }

          .coupon-row {
            grid-template-columns: 2fr 0.8fr 1fr 0.8fr 0.7fr;
          }

          .option-row {
            grid-template-columns: 70px 2.5fr 0.8fr;
          }

          .period-cell, .coupon-cell, .option-cell {
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
          }
        }

        @media (max-width: 768px) {
          .period-table,
          .coupon-table,
          .option-table {
            overflow-x: auto;
          }

          .period-row {
            min-width: 600px;
          }

          .coupon-row {
            min-width: 700px;
          }

          .option-row {
            min-width: 500px;
          }
        }
      `}</style>
    </div>
  );
};

export default CouponAnalysis