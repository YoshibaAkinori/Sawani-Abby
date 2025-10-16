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
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 初期日付設定（今月）
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
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
    csv += `総売上,${data.total_sales || 0}\n`;
    csv += `取引数,${data.transaction_count || 0}\n`;
    csv += `平均単価,${Math.round(data.average_sale || 0)}\n`;
    csv += `現金売上,${data.total_cash || 0}\n`;
    csv += `カード売上,${data.total_card || 0}\n`;
    csv += `ユニーク顧客数,${data.unique_customers || 0}\n`;
    return csv;
  }

  function generateSalesCSV(data) {
    let csv = '売上推移\n';
    csv += '期間,取引数,総売上,平均単価\n';
    data.forEach(row => {
      csv += `${row.date || row.month},${row.transaction_count},${row.total_sales},${Math.round(row.average_sale)}\n`;
    });
    return csv;
  }

  function generateServiceCSV(data) {
    let csv = 'サービス別売上\n';
    csv += 'サービス名,カテゴリ,利用回数,総売上,平均単価\n';
    data.forEach(row => {
      csv += `${row.service_name},${row.category},${row.usage_count},${row.total_revenue},${Math.round(row.avg_price)}\n`;
    });
    return csv;
  }

  function generateOptionCSV(data) {
    let csv = 'オプション利用状況\n';
    csv += 'オプション名,カテゴリ,利用回数,総売上,無料,有料\n';
    data.forEach(row => {
      csv += `${row.option_name},${row.category},${row.usage_count},${row.total_revenue},${row.free_count},${row.paid_count}\n`;
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
    return csv;
  }

  function generateCouponCSV(data) {
    let csv = 'クーポン使用状況\n';
    csv += 'クーポン名,使用回数,総割引額\n';
    data.usageByCoupon?.forEach(row => {
      csv += `${row.coupon_name},${row.usage_count},${row.total_discount}\n`;
    });
    return csv;
  }

  function generateLimitedCSV(data) {
    let csv = '期間限定オファー販売状況\n';
    csv += 'オファー名,購入数,総売上\n';
    data.salesByOffer?.forEach(row => {
      csv += `${row.offer_name},${row.current_sales},${row.total_revenue}\n`;
    });
    return csv;
  }

  function generateCancelCSV(data) {
    let csv = 'キャンセル統計\n\n';
    csv += '項目,値\n';
    csv += `総キャンセル数,${data.summary.total_cancels}\n`;
    csv += `連絡ありキャンセル,${data.summary.with_contact_cancels}\n`;
    csv += `無断キャンセル,${data.summary.no_show_cancels}\n`;
    csv += `キャンセル率,${data.summary.cancel_rate}%\n`;
    csv += `総予約数,${data.summary.total_bookings}\n\n`;
    
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
          <div className="analytics__date-range">
            <Calendar size={18} />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="analytics__date-input"
            />
            <span>〜</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="analytics__date-input"
            />
          </div>

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
              <div className="analytics__loading-spinner"></div>
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
    </div>
  );
};

export default AnalyticsPage;