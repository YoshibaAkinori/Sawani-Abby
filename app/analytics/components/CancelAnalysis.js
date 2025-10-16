// app/analytics/components/CancelAnalysis.js
"use client";
import React from 'react';
import { Ban, AlertTriangle, Phone, Users, Calendar, TrendingUp } from 'lucide-react';
import './CancelAnalysis.css';


const CancelAnalysis = ({ data, period }) => {
  if (!data) {
    return <p className="no-data-message">データがありません</p>;
  }

  const { summary = {}, by_staff = [], daily = [] } = data;

  // summaryが空の場合のデフォルト値
  const totalCancels = summary.total_cancels || 0;
  const withContactCancels = summary.with_contact_cancels || 0;
  const noShowCancels = summary.no_show_cancels || 0;
  const cancelRate = summary.cancel_rate || 0;
  const totalBookings = summary.total_bookings || 0;

  // パーセンテージ計算
  const withContactPercent = totalCancels > 0 
    ? ((withContactCancels / totalCancels) * 100).toFixed(1)
    : 0;
  
  const noShowPercent = totalCancels > 0 
    ? ((noShowCancels / totalCancels) * 100).toFixed(1)
    : 0;

  return (
    <div className="cancel-analysis">
      {/* サマリーメトリクス */}
      <div className="analytics-metrics-grid">
        <div className="analytics-metric-card analytics-metric-card--total">
          <div className="analytics-metric-card__icon">
            <Ban size={32} />
          </div>
          <div className="analytics-metric-card__content">
            <span className="analytics-metric-card__label">総キャンセル数</span>
            <span className="analytics-metric-card__value">
              {totalCancels}
              <span className="analytics-metric-card__unit">件</span>
            </span>
          </div>
        </div>

        <div className="analytics-metric-card analytics-metric-card--contact">
          <div className="analytics-metric-card__icon">
            <Phone size={32} />
          </div>
          <div className="analytics-metric-card__content">
            <span className="analytics-metric-card__label">連絡ありキャンセル</span>
            <span className="analytics-metric-card__value">
              {withContactCancels}
              <span className="analytics-metric-card__unit">件</span>
            </span>
            <span className="analytics-metric-card__sub">
              全体の {withContactPercent}%
            </span>
          </div>
        </div>

        <div className="analytics-metric-card analytics-metric-card--noshow">
          <div className="analytics-metric-card__icon">
            <AlertTriangle size={32} />
          </div>
          <div className="analytics-metric-card__content">
            <span className="analytics-metric-card__label">無断キャンセル</span>
            <span className="analytics-metric-card__value">
              {noShowCancels}
              <span className="analytics-metric-card__unit">件</span>
            </span>
            <span className="analytics-metric-card__sub">
              全体の {noShowPercent}%
            </span>
          </div>
        </div>

        <div className="analytics-metric-card analytics-metric-card--rate">
          <div className="analytics-metric-card__icon">
            <TrendingUp size={32} />
          </div>
          <div className="analytics-metric-card__content">
            <span className="analytics-metric-card__label">キャンセル率</span>
            <span className="analytics-metric-card__value">
              {cancelRate}
              <span className="analytics-metric-card__unit">%</span>
            </span>
            <span className="analytics-metric-card__sub">
              総予約数: {totalBookings}件
            </span>
          </div>
        </div>
      </div>

      {/* スタッフ別キャンセル */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Users size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          スタッフ別キャンセル数
        </h3>
        
        {by_staff && by_staff.length > 0 ? (
          <div className="analytics-table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>スタッフ</th>
                  <th className="analytics-table__number">総キャンセル</th>
                  <th className="analytics-table__number">連絡あり</th>
                  <th className="analytics-table__number">無断</th>
                </tr>
              </thead>
              <tbody>
                {by_staff.map((staff, index) => (
                  <tr key={index}>
                    <td>
                      <div className="analytics-table__staff-cell">
                        <div 
                          className="analytics-table__staff-color"
                          style={{ backgroundColor: staff.staff_color }}
                        />
                        <span>{staff.staff_name}</span>
                      </div>
                    </td>
                    <td className="analytics-table__number">
                      <strong>{staff.cancel_count}件</strong>
                    </td>
                    <td className="analytics-table__number analytics-table__number--with-contact">
                      {staff.with_contact}件
                    </td>
                    <td className="analytics-table__number analytics-table__number--no-show">
                      {staff.no_show}件
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">この期間のキャンセルはありません</p>
        )}
      </div>

      {/* 日別/月別キャンセル推移 */}
      <div className="analytics-card">
        <h3 className="analytics-card__title">
          <Calendar size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {period === 'yearly' ? '月別' : '日別'}キャンセル推移
        </h3>
        
        {daily && daily.length > 0 ? (
          <div className="analytics-table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>{period === 'yearly' ? '月' : '日付'}</th>
                  <th className="analytics-table__number">総キャンセル</th>
                  <th className="analytics-table__number">連絡あり</th>
                  <th className="analytics-table__number">無断</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((day, index) => (
                  <tr key={index}>
                    <td>
                      <strong>
                        {new Date(day.date).toLocaleDateString('ja-JP', 
                          period === 'yearly' 
                            ? { year: 'numeric', month: 'long' }
                            : { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
                        )}
                      </strong>
                    </td>
                    <td className="analytics-table__number">
                      <strong>{day.cancel_count}件</strong>
                    </td>
                    <td className="analytics-table__number analytics-table__number--with-contact">
                      {day.with_contact}件
                    </td>
                    <td className="analytics-table__number analytics-table__number--no-show">
                      {day.no_show}件
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">この期間のキャンセルはありません</p>
        )}
      </div>

      {/* インサイトカード */}
      {totalCancels > 0 && (
        <div className="analytics-card insight-card">
          <h3 className="analytics-card__title">💡 インサイト</h3>
          <div className="insights">
            {cancelRate > 20 && (
              <div className="insight-item insight-item--warning">
                <AlertTriangle size={18} />
                <span>キャンセル率が20%を超えています。予約確認の強化を検討してください。</span>
              </div>
            )}
            
            {noShowCancels > withContactCancels && (
              <div className="insight-item insight-item--danger">
                <Ban size={18} />
                <span>無断キャンセルが連絡ありキャンセルを上回っています。リマインド機能の導入を推奨します。</span>
              </div>
            )}
            
            {cancelRate <= 10 && (
              <div className="insight-item insight-item--success">
                <Phone size={18} />
                <span>キャンセル率が低く抑えられています。良好な予約管理が行われています。</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelAnalysis;