"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  Tag,
  Clock,
  Download,
  Calendar
} from 'lucide-react';
import './analytics.css';
import SummarySection from './components/SummarySection';
import SalesTrendChart from './components/SalesTrendChart';
import ServiceAnalysis from './components/ServiceAnalysis';
import OptionAnalysis from './components/OptionAnalysis';
import StaffAnalysis from './components/StaffAnalysis';
import CustomerAnalysis from './components/CustomerAnalysis';
import CouponAnalysis from './components/CouponAnalysis';
import LimitedOfferAnalysis from './components/LimitedOfferAnalysis';

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [period, setPeriod] = useState('monthly'); // monthly or yearly
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  // デフォルトの開始日（過去6ヶ月）
  function getDefaultStartDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  }

  // データ取得
  useEffect(() => {
    fetchAnalyticsData();
  }, [activeTab, period, dateRange]);

  async function fetchAnalyticsData() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        period: period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('分析データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // CSV出力
  function handleExportCSV() {
    if (!data) return;
    
    // タブごとに異なるCSVを生成
    let csvContent = '';
    let filename = '';

    switch (activeTab) {
      case 'summary':
        csvContent = generateSummaryCSV(data);
        filename = 'summary';
        break;
      case 'sales':
        csvContent = generateSalesCSV(data);
        filename = 'sales_trend';
        break;
      case 'service':
        csvContent = generateServiceCSV(data);
        filename = 'service_analysis';
        break;
      case 'option':
        csvContent = generateOptionCSV(data);
        filename = 'option_analysis';
        break;
      case 'staff':
        csvContent = generateStaffCSV(data);
        filename = 'staff_analysis';
        break;
      case 'customer':
        csvContent = generateCustomerCSV(data);
        filename = 'customer_analysis';
        break;
      case 'coupon':
        csvContent = generateCouponCSV(data);
        filename = 'coupon_analysis';
        break;
      case 'limited':
        csvContent = generateLimitedCSV(data);
        filename = 'limited_offer_analysis';
        break;
    }

    downloadCSV(csvContent, `${filename}_${dateRange.startDate}_${dateRange.endDate}.csv`);
  }

  function downloadCSV(content, filename) {
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  // CSV生成関数（各タブ用）
  function generateSummaryCSV(data) {
    const summary = data.summary;
    let csv = '項目,値\n';
    csv += `総取引数,${summary.total_transactions}\n`;
    csv += `総売上,${summary.total_sales}\n`;
    csv += `平均単価,${Math.round(summary.average_sale)}\n`;
    csv += `現金売上,${summary.total_cash}\n`;
    csv += `カード売上,${summary.total_card}\n`;
    csv += `ユニーク顧客数,${summary.unique_customers}\n`;
    csv += `回数券使用,${summary.ticket_usage}\n`;
    csv += `クーポン使用,${summary.coupon_usage}\n`;
    return csv;
  }

  function generateSalesCSV(data) {
    let csv = '期間,取引数,総売上,現金売上,カード売上,平均単価,ユニーク顧客数\n';
    data.forEach(row => {
      csv += `${row.period},${row.transaction_count},${row.total_sales},${row.cash_sales},${row.card_sales},${Math.round(row.average_sale)},${row.unique_customers}\n`;
    });
    return csv;
  }

  function generateServiceCSV(data) {
    let csv = 'サービス名,期間,回数,売上,平均単価,総施術時間\n';
    data.forEach(row => {
      csv += `${row.service_name},${row.period},${row.count},${row.total_revenue},${Math.round(row.average_price)},${row.total_minutes}\n`;
    });
    return csv;
  }

  function generateOptionCSV(data) {
    let csv = 'オプション名,カテゴリ,期間,使用回数,総数量,売上,無料回数,有料回数\n';
    data.forEach(row => {
      csv += `${row.option_name},${row.option_category},${row.period},${row.usage_count},${row.total_quantity},${row.total_revenue},${row.free_count},${row.paid_count}\n`;
    });
    return csv;
  }

  function generateStaffCSV(data) {
    let csv = 'スタッフ名,期間,取引数,総売上,平均単価,ユニーク顧客数\n';
    data.forEach(row => {
      csv += `${row.staff_name},${row.period},${row.transaction_count},${row.total_sales},${Math.round(row.average_sale)},${row.unique_customers}\n`;
    });
    return csv;
  }

  function generateCustomerCSV(data) {
    let csv = '顧客分析サマリー\n\n';
    csv += '項目,値\n';
    csv += `総顧客数,${data.repeatAnalysis.total_customers}\n`;
    csv += `リピート顧客数,${data.repeatAnalysis.repeat_customers}\n`;
    csv += `リピート率,${data.repeatAnalysis.repeat_rate}%\n`;
    csv += `平均リピート日数,${Math.round(data.avgRepeatDays.avg_repeat_days)}\n`;
    csv += `平均LTV,${Math.round(data.ltvAnalysis.avg_ltv)}\n\n`;
    
    csv += '来店回数分布\n';
    csv += '来店回数,顧客数\n';
    data.visitDistribution.forEach(row => {
      csv += `${row.visit_range},${row.customer_count}\n`;
    });
    
    csv += '\n回数券購入タイミング\n';
    csv += '来店タイミング,購入数\n';
    data.ticketPurchaseTiming.forEach(row => {
      csv += `${row.visit_timing},${row.purchase_count}\n`;
    });
    
    return csv;
  }

  function generateCouponCSV(data) {
    let csv = 'クーポン使用状況（期間別）\n';
    csv += '期間,使用回数,総割引額,平均割引額\n';
    data.usageByPeriod.forEach(row => {
      csv += `${row.period},${row.usage_count},${row.total_discount},${Math.round(row.avg_discount)}\n`;
    });
    
    csv += '\nクーポン別使用状況\n';
    csv += 'クーポン名,使用回数,総割引額,使用制限,有効\n';
    data.usageByCoupon.forEach(row => {
      csv += `${row.coupon_name},${row.usage_count},${row.total_discount},${row.usage_limit || '無制限'},${row.is_active ? '有効' : '無効'}\n`;
    });
    
    return csv;
  }

  function generateLimitedCSV(data) {
    let csv = '期間限定販売状況（期間別）\n';
    csv += '期間,購入数,総売上,平均単価\n';
    data.salesByPeriod.forEach(row => {
      csv += `${row.period},${row.purchase_count},${row.total_revenue},${Math.round(row.avg_price)}\n`;
    });
    
    csv += '\nオファー別販売状況\n';
    csv += 'オファー名,サービス名,特別価格,最大販売数,現在販売数,総売上,販売終了日,有効\n';
    data.salesByOffer.forEach(row => {
      csv += `${row.offer_name},${row.service_name},${row.special_price},${row.max_sales || '無制限'},${row.current_sales},${row.total_revenue},${row.sale_end_date || '無期限'},${row.is_active ? '有効' : '無効'}\n`;
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
            サービス別
          </button>
          <button
            className={`analytics__tab ${activeTab === 'option' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('option')}
          >
            <Tag size={18} />
            オプション別
          </button>
          <button
            className={`analytics__tab ${activeTab === 'staff' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            <Users size={18} />
            スタッフ別
          </button>
          <button
            className={`analytics__tab ${activeTab === 'customer' ? 'analytics__tab--active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            <Users size={18} />
            顧客分析
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
        </div>

        {/* コンテンツエリア */}
        <div className="analytics__content">
          {isLoading ? (
            <div className="analytics__loading">データを読み込み中...</div>
          ) : data ? (
            <>
              {activeTab === 'summary' && <SummarySection data={data} />}
              {activeTab === 'sales' && <SalesTrendChart data={data} period={period} />}
              {activeTab === 'service' && <ServiceAnalysis data={data} period={period} />}
              {activeTab === 'option' && <OptionAnalysis data={data} period={period} />}
              {activeTab === 'staff' && <StaffAnalysis data={data} period={period} />}
              {activeTab === 'customer' && <CustomerAnalysis data={data} />}
              {activeTab === 'coupon' && <CouponAnalysis data={data} period={period} />}
              {activeTab === 'limited' && <LimitedOfferAnalysis data={data} period={period} />}
            </>
          ) : (
            <div className="analytics__no-data">データがありません</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;