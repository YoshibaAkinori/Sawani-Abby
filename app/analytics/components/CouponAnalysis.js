// ============================================
// app/analytics/components/CouponAnalysis.js
// ============================================

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

  // データが存在しない場合の表示
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
          <table className="analytics-table">
            <thead>
              <tr>
                <th>期間</th>
                <th className="analytics-table__number">使用回数</th>
                <th className="analytics-table__number">総割引額</th>
                <th className="analytics-table__number">平均割引額</th>
              </tr>
            </thead>
            <tbody>
              {usageByPeriod.map((usage, index) => (
                <tr key={index}>
                  <td><strong>{usage.period}</strong></td>
                  <td className="analytics-table__number">{usage.usage_count}回</td>
                  <td className="analytics-table__number">{formatCurrency(usage.total_discount)}</td>
                  <td className="analytics-table__number">{formatCurrency(usage.avg_discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <table className="analytics-table">
            <thead>
              <tr>
                <th>クーポン名</th>
                <th className="analytics-table__number">使用回数</th>
                <th className="analytics-table__number">総割引額</th>
                <th className="analytics-table__number">使用制限</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {usageByCoupon.map((coupon, index) => (
                <tr key={index}>
                  <td>{coupon.coupon_name}</td>
                  <td className="analytics-table__number">{coupon.usage_count || 0}回</td>
                  <td className="analytics-table__number">{formatCurrency(coupon.total_discount || 0)}</td>
                  <td className="analytics-table__number">
                    {coupon.usage_limit ? `${coupon.usage_limit}回` : '無制限'}
                  </td>
                  <td>
                    <span className={`analytics-badge ${coupon.is_active ? 'analytics-badge--active' : 'analytics-badge--inactive'}`}>
                      {coupon.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* 無料オプション利用状況 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Gift size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          無料オプション選択ランキング
        </h3>
        <p className="analytics-card__subtitle">
          クーポンで選択された無料オプションTOP10
        </p>
        {freeOptionUsage && freeOptionUsage.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>順位</th>
                <th>オプション名</th>
                <th className="analytics-table__number">選択回数</th>
              </tr>
            </thead>
            <tbody>
              {freeOptionUsage.map((option, index) => (
                <tr key={index}>
                  <td>
                    <span className="rank-badge">{index + 1}</span>
                  </td>
                  <td>{option.option_name}</td>
                  <td className="analytics-table__number">{option.selection_count}回</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      <style jsx>{`
        .coupon-analysis {
          padding: 0;
        }
        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
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
      `}</style>
    </div>
  );
};

export default CouponAnalysis;