// app/analytics/components/ServiceAnalysis.js
"use client";
import React from 'react';
import { Briefcase, Award, Users } from 'lucide-react';

const ServiceAnalysis = ({ data }) => {
  function formatCurrency(amount) {
    return `¥${Math.round(amount || 0).toLocaleString()}`;
  }

  const serviceData = data?.serviceData || data || [];
  const genderData = data?.genderData || [];

  if (!serviceData || !Array.isArray(serviceData) || serviceData.length === 0) {
    return (
      <div className="service-analysis">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  // 全期間通してのトップサービス
  const topService = serviceData[0];

  // 性別別データを整形（利用回数の表用）
  const genderTableData = [];
  if (genderData.length > 0) {
    const serviceMap = {};
    
    genderData.forEach(row => {
      if (!serviceMap[row.service_name]) {
        serviceMap[row.service_name] = {
          service_name: row.service_name,
          category: row.category,
          female_count: 0,
          male_count: 0,
          total_count: 0
        };
      }
      if (row.gender === 'female') {
        serviceMap[row.service_name].female_count = row.usage_count || 0;
      } else if (row.gender === 'male') {
        serviceMap[row.service_name].male_count = row.usage_count || 0;
      }
    });

    // 合計回数を計算してソート
    Object.values(serviceMap).forEach(service => {
      service.total_count = service.female_count + service.male_count;
      genderTableData.push(service);
    });
    
    genderTableData.sort((a, b) => b.total_count - a.total_count);
  }

  // 性別合計
  const genderTotals = genderData.reduce((acc, item) => {
    if (item.gender === 'female') {
      acc.female += item.total_revenue || 0;
      acc.femaleCount += item.usage_count || 0;
    } else if (item.gender === 'male') {
      acc.male += item.total_revenue || 0;
      acc.maleCount += item.usage_count || 0;
    }
    return acc;
  }, { female: 0, male: 0, femaleCount: 0, maleCount: 0 });

  const totalGenderSales = genderTotals.female + genderTotals.male;

  return (
    <div className="service-analysis">
      {/* トップサービス */}
      {topService && (
        <div className="top-service-card">
          <div className="top-service-header">
            <Award size={32} />
            <h3>全期間人気No.1サービス</h3>
          </div>
          <div className="top-service-name">{topService.service_name}</div>
          <div className="top-service-category">{topService.category}</div>
          <div className="top-service-stats">
            <div className="stat-item">
              <div className="stat-label">総売上</div>
              <div className="stat-value">{formatCurrency(topService.total_revenue)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">利用回数</div>
              <div className="stat-value">{topService.usage_count}回</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">平均単価</div>
              <div className="stat-value">{formatCurrency(topService.avg_price)}</div>
            </div>
          </div>
        </div>
      )}

      {/* サービスランキング（全体） */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Briefcase size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          サービス別売上ランキング
        </h3>
        
        <div className="service-table">
          {/* ヘッダー */}
          <div className="service-row service-row--header">
            <div className="service-cell service-cell--rank">順位</div>
            <div className="service-cell service-cell--name">サービス名</div>
            <div className="service-cell service-cell--category">カテゴリ</div>
            <div className="service-cell service-cell--number">回数</div>
            <div className="service-cell service-cell--number">売上</div>
            <div className="service-cell service-cell--number">平均単価</div>
          </div>
          
          {/* データ行 */}
          {serviceData.slice(0, 10).map((service, index) => (
            <div key={index} className="service-row">
              <div className="service-cell service-cell--rank">
                <div className={`rank-badge rank-${index + 1}`}>
                  {index + 1}
                </div>
              </div>
              <div className="service-cell service-cell--name">
                <strong>{service.service_name}</strong>
                {index === 0 && <span className="medal">🥇</span>}
                {index === 1 && <span className="medal">🥈</span>}
                {index === 2 && <span className="medal">🥉</span>}
              </div>
              <div className="service-cell service-cell--category">{service.category}</div>
              <div className="service-cell service-cell--number">{service.usage_count}回</div>
              <div className="service-cell service-cell--number">{formatCurrency(service.total_revenue)}</div>
              <div className="service-cell service-cell--number">
                {formatCurrency(service.avg_price)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 性別別サービス利用回数表 */}
      {genderTableData.length > 0 && (
        <div className="analytics-card">
          <h3 className="analytics-card__title">
            <Users size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            性別別サービス利用回数
          </h3>
          
          {/* 性別サマリー */}
          {totalGenderSales > 0 && (
            <div className="gender-summary" style={{ marginBottom: '1.5rem' }}>
              <div className="gender-summary-row">
                <div className="gender-summary-item">
                  <span className="gender-label gender-label--female">👩 女性</span>
                  <span className="gender-value">
                    {genderTotals.femaleCount.toLocaleString()}
                    <span className="gender-unit">回</span>
                  </span>
                  <span className="gender-count">
                    売上: {formatCurrency(genderTotals.female)}
                  </span>
                </div>
                <div className="gender-summary-item">
                  <span className="gender-label gender-label--male">👨 男性</span>
                  <span className="gender-value">
                    {genderTotals.maleCount.toLocaleString()}
                    <span className="gender-unit">回</span>
                  </span>
                  <span className="gender-count">
                    売上: {formatCurrency(genderTotals.male)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 女性の表 */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ec4899', marginBottom: '0.75rem' }}>
              👩 女性の利用状況
            </h4>
            <div className="service-table service-table--gender">
              {/* ヘッダー */}
              <div className="service-row service-row--header service-row--gender">
                <div className="service-cell service-cell--rank">順位</div>
                <div className="service-cell service-cell--name">サービス名</div>
                <div className="service-cell service-cell--category">カテゴリ</div>
                <div className="service-cell service-cell--number">利用回数</div>
                <div className="service-cell service-cell--number">売上</div>
              </div>
              
              {/* データ行 */}
              {genderTableData
                .filter(s => s.female_count > 0)
                .sort((a, b) => b.female_count - a.female_count)
                .map((service, index) => {
                  const femaleRevenue = genderData.find(
                    d => d.service_name === service.service_name && d.gender === 'female'
                  )?.total_revenue || 0;
                  
                  return (
                    <div key={index} className="service-row service-row--gender">
                      <div className="service-cell service-cell--rank">
                        <div className={`rank-badge rank-${index + 1}`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="service-cell service-cell--name">
                        <strong>{service.service_name}</strong>
                        {index === 0 && <span className="medal">🥇</span>}
                        {index === 1 && <span className="medal">🥈</span>}
                        {index === 2 && <span className="medal">🥉</span>}
                      </div>
                      <div className="service-cell service-cell--category">{service.category}</div>
                      <div className="service-cell service-cell--number">
                        <strong style={{ color: '#ec4899' }}>{service.female_count}回</strong>
                      </div>
                      <div className="service-cell service-cell--number">
                        {formatCurrency(femaleRevenue)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 男性の表 */}
          <div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', marginBottom: '0.75rem' }}>
              👨 男性の利用状況
            </h4>
            <div className="service-table service-table--gender">
              {/* ヘッダー */}
              <div className="service-row service-row--header service-row--gender">
                <div className="service-cell service-cell--rank">順位</div>
                <div className="service-cell service-cell--name">サービス名</div>
                <div className="service-cell service-cell--category">カテゴリ</div>
                <div className="service-cell service-cell--number">利用回数</div>
                <div className="service-cell service-cell--number">売上</div>
              </div>
              
              {/* データ行 */}
              {genderTableData
                .filter(s => s.male_count > 0)
                .sort((a, b) => b.male_count - a.male_count)
                .map((service, index) => {
                  const maleRevenue = genderData.find(
                    d => d.service_name === service.service_name && d.gender === 'male'
                  )?.total_revenue || 0;
                  
                  return (
                    <div key={index} className="service-row service-row--gender">
                      <div className="service-cell service-cell--rank">
                        <div className={`rank-badge rank-${index + 1}`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="service-cell service-cell--name">
                        <strong>{service.service_name}</strong>
                        {index === 0 && <span className="medal">🥇</span>}
                        {index === 1 && <span className="medal">🥈</span>}
                        {index === 2 && <span className="medal">🥉</span>}
                      </div>
                      <div className="service-cell service-cell--category">{service.category}</div>
                      <div className="service-cell service-cell--number">
                        <strong style={{ color: '#3b82f6' }}>{service.male_count}回</strong>
                      </div>
                      <div className="service-cell service-cell--number">
                        {formatCurrency(maleRevenue)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .service-analysis {
          padding: 0;
        }

        .top-service-card {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          color: white;
        }

        .top-service-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .top-service-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .top-service-name {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .top-service-category {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
        }

        .top-service-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .stat-item {
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
          margin-top: 0.25rem;
        }

        .gender-summary {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
        }
        
        .gender-summary-row {
          display: flex;
          gap: 2rem;
          justify-content: center;
        }
        
        .gender-summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .gender-label {
          font-size: 1rem;
          font-weight: 600;
        }
        
        .gender-label--female {
          color: #ec4899;
        }
        
        .gender-label--male {
          color: #3b82f6;
        }
        
        .gender-value {
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .gender-percent {
          font-size: 1rem;
          color: #6b7280;
          margin-left: 0.5rem;
        }
        
        .gender-count {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .service-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .service-row {
          display: grid;
          grid-template-columns: 60px 2fr 1fr 1fr 1.2fr 1fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }
        
        .service-row--gender {
          grid-template-columns: 60px 2fr 1fr 1fr 1.2fr;
        }

        .service-row:last-child {
          border-bottom: none;
        }

        .service-row:not(.service-row--header):hover {
          background: #f9fafb;
        }

        .service-row--header {
          background: #f9fafb;
          font-weight: 600;
        }

        .service-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .service-cell:last-child {
          border-right: none;
        }

        .service-cell--rank {
          justify-content: center;
        }

        .service-cell--name {
          justify-content: flex-start;
          gap: 0.5rem;
        }

        .service-cell--category {
          justify-content: flex-start;
        }

        .service-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        .rank-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .rank-1 {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
        }

        .rank-2 {
          background: linear-gradient(135deg, #d1d5db, #9ca3af);
          color: white;
        }

        .rank-3 {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
        }

        .rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
          background: #f3f4f6;
          color: #6b7280;
        }

        .medal {
          font-size: 1.25rem;
        }
        
        .percent-badge {
          font-size: 0.75rem;
          margin-left: 0.25rem;
          font-weight: 400;
        }
        
        .gender-unit {
          font-size: 1rem;
          font-weight: 400;
          margin-left: 0.25rem;
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