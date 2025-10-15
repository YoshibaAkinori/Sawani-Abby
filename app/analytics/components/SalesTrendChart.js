// app/analytics/components/SalesTrendChart.js
"use client";
import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';

const SalesTrendChart = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  // データが存在しない、または配列でない場合
  if (!data || !Array.isArray(data)) {
    return (
      <div className="sales-trend">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // 合計値計算
  const totals = data.reduce((acc, item) => ({
    transactions: acc.transactions + (item.transaction_count || 0),
    sales: acc.sales + (item.total_sales || 0),
    customers: acc.customers + (item.unique_customers || 0)
  }), { transactions: 0, sales: 0, customers: 0 });

  return (
    <div className="sales-trend">
      {/* サマリーメトリクス */}
      <div className="analytics-metrics">
        <div className="analytics-metric">
          <span className="analytics-metric__label">
            <DollarSign size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
            期間合計売上
          </span>
          <span className="analytics-metric__value">
            {formatCurrency(totals.sales)}
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
          <span className="analytics-metric__label">平均単価</span>
          <span className="analytics-metric__value">
            {formatCurrency(totals.sales / totals.transactions)}
          </span>
        </div>
      </div>

      {/* 推移テーブル */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}売上推移
        </h3>
        {data && Array.isArray(data) && data.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>期間</th>
                <th className="analytics-table__number">取引数</th>
                <th className="analytics-table__number">総売上</th>
                <th className="analytics-table__number">現金</th>
                <th className="analytics-table__number">カード</th>
                <th className="analytics-table__number">平均単価</th>
                <th className="analytics-table__number">顧客数</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td><strong>{row.period}</strong></td>
                  <td className="analytics-table__number">{row.transaction_count}件</td>
                  <td className="analytics-table__number">{formatCurrency(row.total_sales)}</td>
                  <td className="analytics-table__number">{formatCurrency(row.cash_sales)}</td>
                  <td className="analytics-table__number">{formatCurrency(row.card_sales)}</td>
                  <td className="analytics-table__number">{formatCurrency(row.average_sale)}</td>
                  <td className="analytics-table__number">{row.unique_customers}人</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      <style jsx>{`
        .sales-trend {
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

export default SalesTrendChart;