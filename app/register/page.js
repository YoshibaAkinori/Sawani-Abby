"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import './register.css';

const RegisterPage = () => {
  return (
    <div className="register">
      {/* ヘッダー */}
      <header className="register__header">
        <div className="register__header-container">
          <div className="register__header-nav">
            <Link href="/" className="register__back-link">
              <ArrowLeft className="register__back-icon" />
              <span>ダッシュボードに戻る</span>
            </Link>
          </div>
          <div className="register__header-title">
            <CreditCard className="register__header-icon" />
            <h1>ABBY レジ・お会計</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="register__main">
        <div className="register__content-card">
          <div className="register__content-header">
            <CreditCard className="register__content-icon" />
            <h2 className="register__content-title">レジ・お会計</h2>
            <p className="register__content-description">お会計処理・決済システム</p>
          </div>
          <div className="register__content-status">
            ※ このページは準備中です
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;