// ============================================
// app/analytics/components/ServiceAnalysis.js
// ============================================

"use client";
import React, { useMemo } from 'react';
import { Package, TrendingUp } from 'lucide-react';

const ServiceAnalysis = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  // データが存在しない、または配列でない場合
  if (!data || !Array.isArray(data)) {
    return (
      <div className="service-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // サービス別合計
  const serviceStats = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.service_name]) {
        acc[item.service_name] = {
          service_name: item.service_name,
          count: 0,
          total_revenue: 0,
          total_minutes: 0
        };
      }
      acc[item.service_name].count += item.count;
      acc[item.service_name].total_revenue += item.total_revenue;
      acc[item.service_name].total_minutes += item.total_minutes;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => b.total_revenue - a.total_revenue);
  }, [data]);

  return (
    <div className="service-analysis">
      {/* サービス別サマリー */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          サービス別売上ランキング
        </h3>
        {serviceStats.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>サービス名</th>
                <th className="analytics-table__number">回数</th>
                <th className="analytics-table__number">売上</th>
                <th className="analytics-table__number">平均単価</th>
                <th className="analytics-table__number">総施術時間</th>
              </tr>
            </thead>
            <tbody>
              {serviceStats.map((service, index) => (
                <tr key={index}>
                  <td><strong>{service.service_name}</strong></td>
                  <td className="analytics-table__number">{service.count}回</td>
                  <td className="analytics-table__number">{formatCurrency(service.total_revenue)}</td>
                  <td className="analytics-table__number">{formatCurrency(service.total_revenue / service.count)}</td>
                  <td className="analytics-table__number">{service.total_minutes}分</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      {/* 期間別詳細 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '年別' : '月別'}サービス詳細
        </h3>
        {data && Array.isArray(data) && data.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>サービス名</th>
                <th>期間</th>
                <th className="analytics-table__number">回数</th>
                <th className="analytics-table__number">売上</th>
                <th className="analytics-table__number">平均単価</th>
              </tr>
            </thead>
            <tbody>
              {data.map((service, index) => (
                <tr key={index}>
                  <td>{service.service_name}</td>
                  <td>{service.period}</td>
                  <td className="analytics-table__number">{service.count}回</td>
                  <td className="analytics-table__number">{formatCurrency(service.total_revenue)}</td>
                  <td className="analytics-table__number">{formatCurrency(service.average_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      <style jsx>{`
        .service-analysis {
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

export default ServiceAnalysis;