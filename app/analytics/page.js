// app/analytics/page.js
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, Package, Settings2, Users, Tag, Clock, Calendar, Download, Ban } from 'lucide-react';
import SummarySection from './components/SummarySection';
import SalesAnalysis from './components/SalesTrendChart';
import ServiceAnalysis from './components/ServiceAnalysis';
import OptionAnalysis from './components/OptionAnalysis';
import StaffAnalysis from './components/StaffAnalysis';
import CustomerAnalysis from './components/CustomerAnalysis';
import CouponAnalysis from './components/CouponAnalysis';
import LimitedOfferAnalysis from './components/LimitedOfferAnalysis';
import CancelAnalysis from './components/CancelAnalysis';
import './analytics.css';

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [period, setPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const [datePreset, setDatePreset] = useState('thisYear'); // 期間プリセット
  const [showCalendarModal, setShowCalendarModal] = useState(false); // カレンダーモーダル表示
  const [tempDateRange, setTempDateRange] = useState({ startYear: '', startMonth: '', endYear: '', endMonth: '' }); // モーダル内の一時的な日付
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // プリセット期間の計算
  const calculatePresetDates = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'past3Years':
        startDate = new Date(today.getFullYear() - 2, 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  // プリセット変更時の処理
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === 'custom') {
      // カスタムの場合はモーダルを開く
      // 現在の日付範囲から年月を抽出
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      setTempDateRange({
        startYear: startDate.getFullYear().toString(),
        startMonth: (startDate.getMonth() + 1).toString().padStart(2, '0'),
        endYear: endDate.getFullYear().toString(),
        endMonth: (endDate.getMonth() + 1).toString().padStart(2, '0')
      });
      setShowCalendarModal(true);
    } else {
      setShowCalendarModal(false);
      calculatePresetDates(preset);
    }
  };

  // カレンダーモーダルの適用
  const handleApplyCustomDate = () => {
    if (tempDateRange.startYear && tempDateRange.startMonth && tempDateRange.endYear && tempDateRange.endMonth) {
      // 開始日: その月の1日
      const startDate = new Date(parseInt(tempDateRange.startYear), parseInt(tempDateRange.startMonth) - 1, 1);
      // 終了日: その月の最終日
      const endDate = new Date(parseInt(tempDateRange.endYear), parseInt(tempDateRange.endMonth), 0);
      
      setDateRange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      setShowCalendarModal(false);
    }
  };

  // カレンダーモーダルのキャンセル
  const handleCancelCustomDate = () => {
    setShowCalendarModal(false);
    // プリセットを前の状態に戻す
    if (datePreset === 'custom') {
      setDatePreset('thisYear');
    }
  };

  // 初期設定（今年）
  useEffect(() => {
    calculatePresetDates('thisYear');
  }, []);

  // データ取得
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchData();
    }
  }, [activeTab, period, dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let response;
      
      switch (activeTab) {
        case 'summary':
          response = await fetch(`/api/analytics?type=summary&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
          break;
        case 'sales':
          const salesType = period === 'yearly' ? 'monthly' : 'daily';
          response = await fetch(`/api/analytics?type=${salesType}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
          break;
        case 'service':
          response = await fetch(`/api/analytics/services?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=${period}`);
          break;
        case 'option':
          response = await fetch(`/api/analytics/options?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=${period}`);
          break;
        case 'staff':
          response = await fetch(`/api/analytics/staff?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=${period}`);
          break;
        case 'customer':
          response = await fetch(`/api/analytics/customers?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
          break;
        case 'coupon':
          response = await fetch(`/api/analytics/coupons?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=${period}`);
          break;
        case 'limited':
          response = await fetch(`/api/analytics/limited-offers?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period=${period}`);
          break;
        case 'cancel':
          response = await fetch(`/api/analytics/cancel-stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
          break;
        default:
          return;
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        console.error('データ取得エラー:', result.error);
        setData(null);
      }
    } catch (error) {
      console.error('API呼び出しエラー:', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // CSV出力
  const handleExportCSV = () => {
    if (!data) return;

    let csv = '';
    let filename = '';

    switch (activeTab) {
      case 'summary':
        csv = generateSummaryCSV(data);
        filename = 'summary';
        break;
      case 'sales':
        csv = generateSalesCSV(data);
        filename = 'sales';
        break;
      case 'service':
        csv = generateServiceCSV(data);
        filename = 'services';
        break;
      case 'option':
        csv = generateOptionCSV(data);
        filename = 'options';
        break;
      case 'staff':
        csv = generateStaffCSV(data);
        filename = 'staff';
        break;
      case 'customer':
        csv = generateCustomerCSV(data);
        filename = 'customers';
        break;
      case 'coupon':
        csv = generateCouponCSV(data);
        filename = 'coupons';
        break;
      case 'limited':
        csv = generateLimitedCSV(data);
        filename = 'limited_offers';
        break;
      case 'cancel':
        csv = generateCancelCSV(data);
        filename = 'cancellations';
        break;
      default:
        return;
    }

    // BOM付きUTF-8でダウンロード
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${dateRange.startDate}_${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV生成関数
  function generateSummaryCSV(data) {
    let csv = 'サマリーレポート\n\n';
    csv += `期間,${dateRange.startDate} 〜 ${dateRange.endDate}\n\n`;
    csv += '項目,値\n';
    csv += `総売上,${data.summary?.total_sales || 0}\n`;
    csv += `取引数,${data.summary?.total_transactions || 0}\n`;
    csv += `平均単価,${Math.round(data.summary?.average_sale || 0)}\n`;
    csv += `現金売上,${data.summary?.total_cash || 0}\n`;
    csv += `カード売上,${data.summary?.total_card || 0}\n`;
    csv += `ユニーク顧客数,${data.summary?.unique_customers || 0}\n`;
    return csv;
  }

  function generateSalesCSV(data) {
    let csv = '売上推移\n';
    csv += '期間,取引数,総売上,現金,カード,平均単価,顧客数\n';
    data.forEach(row => {
      csv += `${row.period},${row.transaction_count},${row.total_sales},${row.cash_sales},${row.card_sales},${Math.round(row.average_sale)},${row.unique_customers}\n`;
    });
    return csv;
  }

  function generateServiceCSV(data) {
    let csv = 'サービス別売上\n';
    csv += 'サービス名,カテゴリ,期間,利用回数,総売上,平均単価,総施術時間\n';
    data.forEach(row => {
      csv += `${row.service_name},${row.category},${row.period},${row.count},${row.total_revenue},${Math.round(row.average_price)},${row.total_minutes}\n`;
    });
    return csv;
  }

  function generateOptionCSV(data) {
    let csv = 'オプション利用状況\n';
    csv += 'オプション名,カテゴリ,期間,使用回数,総数量,売上,無料,有料\n';
    data.forEach(row => {
      csv += `${row.option_name},${row.option_category},${row.period},${row.usage_count},${row.total_quantity},${row.total_revenue},${row.free_count},${row.paid_count}\n`;
    });
    return csv;
  }

  function generateStaffCSV(data) {
    let csv = 'スタッフ別売上\n';
    csv += 'スタッフ名,期間,取引数,総売上,平均単価,ユニーク顧客数\n';
    data.forEach(row => {
      csv += `${row.staff_name},${row.period},${row.transaction_count},${row.total_sales},${Math.round(row.average_sale)},${row.unique_customers}\n`;
    });
    return csv;
  }

  function generateCustomerCSV(data) {
    let csv = '顧客分析\n\n';
    csv += '項目,値\n';
    csv += `総顧客数,${data.repeatAnalysis?.total_customers || 0}\n`;
    csv += `リピート顧客数,${data.repeatAnalysis?.repeat_customers || 0}\n`;
    csv += `リピート率,${data.repeatAnalysis?.repeat_rate || 0}%\n`;
    csv += `平均リピート日数,${Math.round(data.avgRepeatDays?.avg_repeat_days || 0)}\n`;
    csv += `平均LTV,${Math.round(data.ltvAnalysis?.avg_ltv || 0)}\n`;
    return csv;
  }

  function generateCouponCSV(data) {
    let csv = 'クーポン使用状況\n';
    csv += 'クーポン名,使用回数,総割引額,使用制限,有効\n';
    data.usageByCoupon?.forEach(row => {
      csv += `${row.coupon_name},${row.usage_count},${row.total_discount},${row.usage_limit || '無制限'},${row.is_active ? '有効' : '無効'}\n`;
    });
    return csv;
  }

  function generateLimitedCSV(data) {
    let csv = '期間限定オファー販売状況\n';
    csv += 'オファー名,サービス名,特別価格,販売数,総売上,販売終了日,有効\n';
    data.salesByOffer?.forEach(row => {
      csv += `${row.offer_name},${row.service_name},${row.special_price},${row.current_sales},${row.total_revenue},${row.sale_end_date || '無期限'},${row.is_active ? '有効' : '無効'}\n`;
    });
    return csv;
  }

  function generateCancelCSV(data) {
    let csv = 'キャンセル統計\n\n';
    csv += '項目,値\n';
    csv += `総キャンセル数,${data.summary?.total_cancels || 0}\n`;
    csv += `連絡ありキャンセル,${data.summary?.with_contact_cancels || 0}\n`;
    csv += `無断キャンセル,${data.summary?.no_show_cancels || 0}\n`;
    csv += `キャンセル率,${data.summary?.cancel_rate || 0}%\n`;
    csv += `総予約数,${data.summary?.total_bookings || 0}\n\n`;
    
    csv += 'スタッフ別キャンセル\n';
    csv += 'スタッフ名,総キャンセル数,連絡あり,無断\n';
    data.by_staff?.forEach(row => {
      csv += `${row.staff_name},${row.cancel_count},${row.with_contact},${row.no_show}\n`;
    });
    
    return csv;
  }

  return (
    <div className="analytics">
      {/* ヘッダー */}
      <header className="analytics__header">
        <div className="analytics__header-container">
          <div className="analytics__header-nav">
            <Link href="/" className="analytics__back-link">
              <ArrowLeft className="analytics__back-icon" />
              <span>ダッシュボードに戻る</span>
            </Link>
          </div>
          <div className="analytics__header-title">
            <BarChart3 className="analytics__header-icon" />
            <h1>ABBY 売上分析</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="analytics__main">
        {/* コントロールパネル */}
        <div className="analytics__controls">
          {/* 期間選択ボタン */}
          <div className="analytics__preset-buttons">
            <button
              className={`analytics__preset-btn ${datePreset === 'thisYear' ? 'analytics__preset-btn--active' : ''}`}
              onClick={() => handlePresetChange('thisYear')}
            >
              今年
            </button>
            <button
              className={`analytics__preset-btn ${datePreset === 'lastYear' ? 'analytics__preset-btn--active' : ''}`}
              onClick={() => handlePresetChange('lastYear')}
            >
              去年
            </button>
            <button
              className={`analytics__preset-btn ${datePreset === 'past3Years' ? 'analytics__preset-btn--active' : ''}`}
              onClick={() => handlePresetChange('past3Years')}
            >
              過去3年
            </button>
            <button
              className={`analytics__preset-btn ${datePreset === 'custom' ? 'analytics__preset-btn--active' : ''}`}
              onClick={() => handlePresetChange('custom')}
            >
              カスタム期間
            </button>
          </div>

          {/* 月別/年別切り替え */}
          <div className="analytics__period-toggle">
            <button
              className={`analytics__period-btn ${period === 'monthly' ? 'analytics__period-btn--active' : ''}`}
              onClick={() => setPeriod('monthly')}
            >
              月別
            </button>
            <button
              className={`analytics__period-btn ${period === 'yearly' ? 'analytics__period-btn--active' : ''}`}
              onClick={() => setPeriod('yearly')}
            >
              年別
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="analytics__export-btn"
            disabled={!data || isLoading}
          >
            <Download size={18} />
            CSV出力
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="analytics__tabs">
          <button
            className={`analytics__tab ${activeTab === 'summary' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <BarChart3 size={18} />
            サマリー
          </button>
          <button
            className={`analytics__tab ${activeTab === 'sales' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <TrendingUp size={18} />
            売上推移
          </button>
          <button
            className={`analytics__tab ${activeTab === 'service' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('service')}
          >
            <Package size={18} />
            サービス
          </button>
          <button
            className={`analytics__tab ${activeTab === 'option' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('option')}
          >
            <Settings2 size={18} />
            オプション
          </button>
          <button
            className={`analytics__tab ${activeTab === 'staff' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            <Users size={18} />
            スタッフ
          </button>
          <button
            className={`analytics__tab ${activeTab === 'customer' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            <Users size={18} />
            顧客
          </button>
          <button
            className={`analytics__tab ${activeTab === 'coupon' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('coupon')}
          >
            <Tag size={18} />
            クーポン
          </button>
          <button
            className={`analytics__tab ${activeTab === 'limited' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('limited')}
          >
            <Clock size={18} />
            期間限定
          </button>
          <button
            className={`analytics__tab ${activeTab === 'cancel' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('cancel')}
          >
            <Ban size={18} />
            キャンセル
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="analytics__content">
          {isLoading ? (
            <div className="analytics__loading">
              <p>データを読み込み中...</p>
            </div>
          ) : (
            <>
              {activeTab === 'summary' && <SummarySection data={data} />}
              {activeTab === 'sales' && <SalesAnalysis data={data} period={period} />}
              {activeTab === 'service' && <ServiceAnalysis data={data} period={period} />}
              {activeTab === 'option' && <OptionAnalysis data={data} period={period} />}
              {activeTab === 'staff' && <StaffAnalysis data={data} period={period} />}
              {activeTab === 'customer' && <CustomerAnalysis data={data} />}
              {activeTab === 'coupon' && <CouponAnalysis data={data} period={period} />}
              {activeTab === 'limited' && <LimitedOfferAnalysis data={data} period={period} />}
              {activeTab === 'cancel' && <CancelAnalysis data={data} period={period} />}
            </>
          )}
        </div>
      </main>

      {/* カレンダーモーダル */}
      {showCalendarModal && (
        <div className="calendar-modal-overlay" onClick={handleCancelCustomDate}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal__header">
              <h3>期間を選択</h3>
              <button className="calendar-modal__close" onClick={handleCancelCustomDate}>
                ✕
              </button>
            </div>
            <div className="calendar-modal__content">
              {/* 開始年月 */}
              <div className="calendar-modal__section">
                <label className="calendar-modal__label">開始年月</label>
                <div className="calendar-modal__date-inputs">
                  <select
                    value={tempDateRange.startYear}
                    onChange={(e) => setTempDateRange(prev => ({ ...prev, startYear: e.target.value }))}
                    className="calendar-modal__select"
                  >
                    <option value="">年を選択</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                  <select
                    value={tempDateRange.startMonth}
                    onChange={(e) => setTempDateRange(prev => ({ ...prev, startMonth: e.target.value }))}
                    className="calendar-modal__select"
                  >
                    <option value="">月を選択</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month.toString().padStart(2, '0')}>
                        {month}月
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 終了年月 */}
              <div className="calendar-modal__section">
                <label className="calendar-modal__label">終了年月</label>
                <div className="calendar-modal__date-inputs">
                  <select
                    value={tempDateRange.endYear}
                    onChange={(e) => setTempDateRange(prev => ({ ...prev, endYear: e.target.value }))}
                    className="calendar-modal__select"
                  >
                    <option value="">年を選択</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                  <select
                    value={tempDateRange.endMonth}
                    onChange={(e) => setTempDateRange(prev => ({ ...prev, endMonth: e.target.value }))}
                    className="calendar-modal__select"
                  >
                    <option value="">月を選択</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month.toString().padStart(2, '0')}>
                        {month}月
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* プレビュー */}
              {tempDateRange.startYear && tempDateRange.startMonth && tempDateRange.endYear && tempDateRange.endMonth && (
                <div className="calendar-modal__preview">
                  <span className="calendar-modal__preview-label">選択期間:</span>
                  <span className="calendar-modal__preview-text">
                    {tempDateRange.startYear}年{parseInt(tempDateRange.startMonth)}月 〜 {tempDateRange.endYear}年{parseInt(tempDateRange.endMonth)}月
                  </span>
                </div>
              )}
            </div>
            <div className="calendar-modal__footer">
              <button className="calendar-modal__btn calendar-modal__btn--cancel" onClick={handleCancelCustomDate}>
                キャンセル
              </button>
              <button 
                className="calendar-modal__btn calendar-modal__btn--apply" 
                onClick={handleApplyCustomDate}
                disabled={!tempDateRange.startYear || !tempDateRange.startMonth || !tempDateRange.endYear || !tempDateRange.endMonth}
              >
                適用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;