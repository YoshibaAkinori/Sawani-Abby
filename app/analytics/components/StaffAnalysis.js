// ============================================
// app/analytics/components/StaffAnalysis.js
// ============================================

"use client";
import React, { useMemo } from 'react';
import { Users, TrendingUp, Award } from 'lucide-react';

const StaffAnalysis = ({ data, period }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  // データが存在しない、または配列でない場合
  if (!data || !Array.isArray(data)) {
    return (
      <div className="staff-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // スタッフ別合計
  const staffStats = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.staff_name]) {
        acc[item.staff_name] = {
          staff_name: item.staff_name,
          staff_color: item.staff_color,
          transaction_count: 0,
          total_sales: 0,
          unique_customers: 0
        };
      }
      acc[item.staff_name].transaction_count += item.transaction_count;
      acc[item.staff_name].total_sales += item.total_sales;
      // unique_customersは重複があるため最大値を取る
      acc[item.staff_name].unique_customers = Math.max(
        acc[item.staff_name].unique_customers, 
        item.unique_customers
      );
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => b.total_sales - a.total_sales);
  }, [data]);

  // トップパフォーマー
  const topPerformer = staffStats.length > 0 ? staffStats[0] : null;

  return (
    <div className="staff-analysis">
      {/* トップパフォーマー */}
      {topPerformer && (
        <div className="analytics-card top-performer-card">
          <div className="top-performer-badge">
            <Award size={24} />
            <span>トップパフォーマー</span>
          </div>
          <h3 className="top-performer-name">{topPerformer.staff_name}</h3>
          <div className="top-performer-stats">
            <div className="stat-item">
              <span className="stat-label">総売上</span>
              <span className="stat-value">{formatCurrency(topPerformer.total_sales)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">取引数</span>
              <span className="stat-value">{topPerformer.transaction_count}件</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">平均単価</span>
              <span className="stat-value">
                {formatCurrency(topPerformer.total_sales / topPerformer.transaction_count)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* スタッフ別サマリー */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Users size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          スタッフ別売上ランキング
        </h3>
        {staffStats.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>順位</th>
                <th>スタッフ名</th>
                <th className="analytics-table__number">取引数</th>
                <th className="analytics-table__number">総売上</th>
                <th className="analytics-table__number">平均単価</th>
                <th className="analytics-table__number">顧客数</th>
              </tr>
            </thead>
            <tbody>
              {staffStats.map((staff, index) => (
                <tr key={index}>
                  <td>
                    <div className="rank-indicator" style={{ background: staff.staff_color }}>
                      {index + 1}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div 
                        className="staff-color-dot" 
                        style={{ background: staff.staff_color }}
                      />
                      <strong>{staff.staff_name}</strong>
                    </div>
                  </td>
                  <td className="analytics-table__number">{staff.transaction_count}件</td>
                  <td className="analytics-table__number">{formatCurrency(staff.total_sales)}</td>
                  <td className="analytics-table__number">
                    {formatCurrency(staff.total_sales / staff.transaction_count)}
                  </td>
                  <td className="analytics-table__number">{staff.unique_customers}人</td>
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
          {period === 'yearly' ? '年別' : '月別'}スタッフ詳細
        </h3>
        {data && Array.isArray(data) && data.length > 0 ? (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>スタッフ名</th>
                <th>期間</th>
                <th className="analytics-table__number">取引数</th>
                <th className="analytics-table__number">売上</th>
                <th className="analytics-table__number">平均単価</th>
              </tr>
            </thead>
            <tbody>
              {data.map((staff, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div 
                        className="staff-color-dot" 
                        style={{ background: staff.staff_color }}
                      />
                      {staff.staff_name}
                    </div>
                  </td>
                  <td>{staff.period}</td>
                  <td className="analytics-table__number">{staff.transaction_count}件</td>
                  <td className="analytics-table__number">{formatCurrency(staff.total_sales)}</td>
                  <td className="analytics-table__number">{formatCurrency(staff.average_sale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">データがありません</p>
        )}
      </div>

      <style jsx>{`
        .staff-analysis {
          padding: 0;
        }

        .top-performer-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          text-align: center;
          border: none;
        }

        .top-performer-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.25);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .top-performer-name {
          font-size: 2rem;
          font-weight: 700;
          margin: 1rem 0;
        }

        .top-performer-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
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

        .rank-indicator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .staff-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .top-performer-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StaffAnalysis;