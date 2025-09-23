"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import './analytics.css';

const AnalyticsPage = () => {
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
        <div className="analytics__content-card">
          <div className="analytics__content-header">
            <BarChart3 className="analytics__content-icon" />
            <h2 className="analytics__content-title">売上分析</h2>
            <p className="analytics__content-description">売上データの分析・レポート機能</p>
          </div>
          <div className="analytics__content-status">
            ※ このページは準備中です
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;