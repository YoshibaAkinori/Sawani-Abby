// app/analytics/components/CancelAnalysis.js
"use client";
import React from 'react';
import { Ban, AlertTriangle, Phone, Users, Calendar, TrendingUp } from 'lucide-react';

const CancelAnalysis = ({ data, period }) => {
  if (!data) {
    return <p className="no-data-message">データがありません</p>;
  }

  const { summary = {}, by_staff = [], daily = [] } = data;

  const totalCancels = summary.total_cancels || 0;
  const withContactCancels = summary.with_contact_cancels || 0;
  const noShowCancels = summary.no_show_cancels || 0;
  const cancelRate = summary.cancel_rate || 0;
  const totalBookings = summary.total_bookings || 0;

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
          <div className="staff-cancel-table">
            {/* ヘッダー */}
            <div className="staff-cancel-row staff-cancel-row--header">
              <div className="staff-cancel-cell staff-cancel-cell--staff">スタッフ</div>
              <div className="staff-cancel-cell staff-cancel-cell--number">総キャンセル</div>
              <div className="staff-cancel-cell staff-cancel-cell--number">連絡あり</div>
              <div className="staff-cancel-cell staff-cancel-cell--number">無断</div>
            </div>
            
            {/* データ行 */}
            {by_staff.map((staff, index) => (
              <div key={index} className="staff-cancel-row">
                <div className="staff-cancel-cell staff-cancel-cell--staff">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div 
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        backgroundColor: staff.staff_color,
                        flexShrink: 0
                      }}
                    />
                    <span>{staff.staff_name}</span>
                  </div>
                </div>
                <div className="staff-cancel-cell staff-cancel-cell--number">
                  <strong>{staff.cancel_count}件</strong>
                </div>
                <div className="staff-cancel-cell staff-cancel-cell--number staff-cancel-cell--contact">
                  {staff.with_contact}件
                </div>
                <div className="staff-cancel-cell staff-cancel-cell--number staff-cancel-cell--noshow">
                  {staff.no_show}件
                </div>
              </div>
            ))}
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
          <div className="daily-cancel-table">
            {/* ヘッダー */}
            <div className="daily-cancel-row daily-cancel-row--header">
              <div className="daily-cancel-cell daily-cancel-cell--date">
                {period === 'yearly' ? '月' : '日付'}
              </div>
              <div className="daily-cancel-cell daily-cancel-cell--number">総キャンセル</div>
              <div className="daily-cancel-cell daily-cancel-cell--number">連絡あり</div>
              <div className="daily-cancel-cell daily-cancel-cell--number">無断</div>
            </div>
            
            {/* データ行 */}
            {daily.map((day, index) => (
              <div key={index} className="daily-cancel-row">
                <div className="daily-cancel-cell daily-cancel-cell--date">
                  <strong>
                    {new Date(day.date).toLocaleDateString('ja-JP', 
                      period === 'yearly' 
                        ? { year: 'numeric', month: 'long' }
                        : { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
                    )}
                  </strong>
                </div>
                <div className="daily-cancel-cell daily-cancel-cell--number">
                  <strong>{day.cancel_count}件</strong>
                </div>
                <div className="daily-cancel-cell daily-cancel-cell--number daily-cancel-cell--contact">
                  {day.with_contact}件
                </div>
                <div className="daily-cancel-cell daily-cancel-cell--number daily-cancel-cell--noshow">
                  {day.no_show}件
                </div>
              </div>
            ))}
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

      <style jsx>{`
        .cancel-analysis {
          padding: 0;
        }

        /* メトリクスグリッド */
        .analytics-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .analytics-metric-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          border-left: 4px solid;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .analytics-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .analytics-metric-card--total {
          border-left-color: #6b7280;
        }

        .analytics-metric-card--contact {
          border-left-color: #3b82f6;
        }

        .analytics-metric-card--noshow {
          border-left-color: #ef4444;
        }

        .analytics-metric-card--rate {
          border-left-color: #f59e0b;
        }

        .analytics-metric-card__icon {
          flex-shrink: 0;
          color: #6b7280;
        }

        .analytics-metric-card--contact .analytics-metric-card__icon {
          color: #3b82f6;
        }

        .analytics-metric-card--noshow .analytics-metric-card__icon {
          color: #ef4444;
        }

        .analytics-metric-card--rate .analytics-metric-card__icon {
          color: #f59e0b;
        }

        .analytics-metric-card__content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .analytics-metric-card__label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .analytics-metric-card__value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }

        .analytics-metric-card__unit {
          font-size: 1rem;
          font-weight: 400;
          margin-left: 0.25rem;
        }

        .analytics-metric-card__sub {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        /* スタッフ別テーブル */
        .staff-cancel-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .staff-cancel-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        .staff-cancel-row:last-child {
          border-bottom: none;
        }

        .staff-cancel-row:not(.staff-cancel-row--header):hover {
          background: #f9fafb;
        }

        .staff-cancel-row--header {
          background: #f9fafb;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .staff-cancel-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .staff-cancel-cell:last-child {
          border-right: none;
        }

        .staff-cancel-row--header .staff-cancel-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .staff-cancel-cell--staff {
          justify-content: flex-start;
        }

        .staff-cancel-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        .staff-cancel-cell--contact {
          color: #3b82f6;
          font-weight: 600;
        }

        .staff-cancel-cell--noshow {
          color: #ef4444;
          font-weight: 600;
        }

        /* 日別テーブル */
        .daily-cancel-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .daily-cancel-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        .daily-cancel-row:last-child {
          border-bottom: none;
        }

        .daily-cancel-row:not(.daily-cancel-row--header):hover {
          background: #f9fafb;
        }

        .daily-cancel-row--header {
          background: #f9fafb;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .daily-cancel-cell {
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          font-size: 0.9375rem;
          color: #1f2937;
          border-right: 1px solid #f3f4f6;
        }

        .daily-cancel-cell:last-child {
          border-right: none;
        }

        .daily-cancel-row--header .daily-cancel-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .daily-cancel-cell--date {
          justify-content: flex-start;
        }

        .daily-cancel-cell--number {
          justify-content: flex-end;
          font-variant-numeric: tabular-nums;
        }

        .daily-cancel-cell--contact {
          color: #3b82f6;
          font-weight: 600;
        }

        .daily-cancel-cell--noshow {
          color: #ef4444;
          font-weight: 600;
        }

        /* インサイトカード */
        .insight-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .insights {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .insight-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .insight-item svg {
          flex-shrink: 0;
        }

        .insight-item--warning {
          background: #fef3c7;
          color: #92400e;
        }

        .insight-item--danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .insight-item--success {
          background: #d1fae5;
          color: #065f46;
        }

        .no-data-message {
          color: #6b7280;
          text-align: center;
          padding: 2rem;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .staff-cancel-row,
          .daily-cancel-row {
            grid-template-columns: 1.5fr 0.8fr 0.8fr 0.8fr;
          }

          .staff-cancel-cell,
          .daily-cancel-cell {
            padding: 0.75rem 0.5rem;
            font-size: 0.875rem;
          }

          .analytics-metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CancelAnalysis;