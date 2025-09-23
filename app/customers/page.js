"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import './customers.css';

const CustomersPage = () => {
  return (
    <div className="customers">
      {/* ヘッダー */}
      <header className="customers__header">
        <div className="customers__header-container">
          <div className="customers__header-nav">
            <Link href="/" className="customers__back-link">
              <ArrowLeft className="customers__back-icon" />
              <span>ダッシュボードに戻る</span>
            </Link>
          </div>
          <div className="customers__header-title">
            <Users className="customers__header-icon" />
            <h1>ABBY 顧客情報</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="customers__main">
        <div className="customers__content-card">
          <div className="customers__content-header">
            <Users className="customers__content-icon" />
            <h2 className="customers__content-title">顧客情報</h2>
            <p className="customers__content-description">顧客一覧・詳細情報管理</p>
          </div>
          <div className="customers__content-status">
            ※ このページは準備中です
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomersPage;