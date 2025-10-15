// app/analytics/components/OptionAnalysis.js
"use client";
import React, { useMemo } from 'react';
import { Tag, TrendingUp } from 'lucide-react';

const OptionAnalysis = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  // データが存在しない、または配列でない場合
  if (!data || !Array.isArray(data)) {
    return (
      <div className="option-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // カテゴリ別集計
  const categoryStats = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const grouped = data.reduce((acc, item) => {
      const category = item.option_category || 'その他';
      if (!acc[category]) {
        acc[category] = {
          category,
          usage_count: 0,
          total_quantity: 0,
          total_revenue: 0,
          free_count: 0,
          paid_count: 0
        };
      }
      acc[category].usage_count += item.usage_count;
      acc[category].total_quantity += item.total_quantity;
      acc[category].total_revenue += item.total_revenue;
      acc[category].free_count += item.free_count;
      acc[category].paid_count += item.paid_count;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => b.total_revenue - a.total_revenue);
  }, [data]);

  // 期間別集計
  const periodStats = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.period]) {
        acc[item.period] = {
          period: item.period,
          usage_count: 0,
          total_revenue: 0,
          free_count: 0,
          paid_count: 0
        };
      }
      acc[item.period].usage_count += item.usage_count;
      acc[item.period].total_revenue += item.total_revenue;
      acc[item.period].free_count += item.free_count;
      acc[item.period].paid_count += item.paid_count;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => b.period.localeCompare(a.period));
  }, [data]);

  return (
    <div className="option-analysis">
      {/* カテゴリ別サマリー */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Tag size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          カテゴリ別オプション利用状況
        </h3>
        {categoryStats.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>カテゴリ</th>
                <th className="analytics-table__number">使用回数</th>
                <th className="analytics-table__number">総数量</th>
                <th className="analytics-table__number">売上</th>
                <th className="analytics-table__number">無料</th>
                <th className="analytics-table__number">有料</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((cat, index) => (
                <tr key={index}>
                  <td><strong>{cat.category}</strong></td>
                  <td className="analytics-table__number">{cat.usage_count}回</td>
                  <td className="analytics-table__number">{cat.total_quantity}個</td>
                  <td className="analytics-table__number">{formatCurrency(cat.total_revenue)}</td>
                  <td className="analytics-table__number">{cat.free_count}回</td>
                  <td className="analytics-table__number">{cat.paid_count}回</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* 期間別推移 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}オプション利用推移
        </h3>
        {periodStats.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>期間</th>
                <th className="analytics-table__number">使用回数</th>
                <th className="analytics-table__number">売上</th>
                <th className="analytics-table__number">無料</th>
                <th className="analytics-table__number">有料</th>
              </tr>
            </thead>
            <tbody>
              {periodStats.map((stat, index) => (
                <tr key={index}>
                  <td><strong>{stat.period}</strong></td>
                  <td className="analytics-table__number">{stat.usage_count}回</td>
                  <td className="analytics-table__number">{formatCurrency(stat.total_revenue)}</td>
                  <td className="analytics-table__number">{stat.free_count}回</td>
                  <td className="analytics-table__number">{stat.paid_count}回</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* オプション詳細 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">オプション詳細</h3>
        {data && Array.isArray(data) && data.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>オプション名</th>
                <th>カテゴリ</th>
                <th>期間</th>
                <th className="analytics-table__number">使用回数</th>
                <th className="analytics-table__number">総数量</th>
                <th className="analytics-table__number">売上</th>
              </tr>
            </thead>
            <tbody>
              {data.map((option, index) => (
                <tr key={index}>
                  <td>{option.option_name}</td>
                  <td>{option.option_category}</td>
                  <td>{option.period}</td>
                  <td className="analytics-table__number">{option.usage_count}回</td>
                  <td className="analytics-table__number">{option.total_quantity}個</td>
                  <td className="analytics-table__number">{formatCurrency(option.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      <style jsx>{`
        .option-analysis {
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

export default OptionAnalysis;