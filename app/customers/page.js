"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, Calendar, Phone, Mail, CreditCard, Tag, Clock, Edit2, Plus, FileText } from 'lucide-react';
import './customers.css';

const CustomersPage = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [searchName, setSearchName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // デモデータ: 今日の予約者
  const todayBookings = [
    { id: 1, time: '10:00', name: '田中 花子', service: 'フェイシャル60分' },
    { id: 2, time: '11:30', name: '山田 太郎', service: 'ボディトリート90分' },
    { id: 3, time: '14:00', name: '鈴木 美香', service: 'ヘッドスパ45分' },
    { id: 4, time: '16:00', name: '佐藤 健', service: 'フェイシャル90分' },
  ];

  // デモデータ: 顧客詳細
  const demoCustomer = {
    customer_id: '1',
    line_user_id: 'U1234567890abcdef',
    last_name: '田中',
    first_name: '花子',
    last_name_kana: 'タナカ',
    first_name_kana: 'ハナコ',
    phone_number: '090-1234-5678',
    email: 'tanaka@example.com',
    birth_date: '1985-05-15',
    notes: '初回来店のお客様。肩こりが気になるとのこと。',
    created_at: '2024-01-15',
    visit_count: 15,
    tickets: [
      {
        id: '1',
        plan_name: 'フェイシャル10回券',
        sessions_remaining: 7,
        expiry_date: '2025-07-15',
        status: 'active'
      },
      {
        id: '2',
        plan_name: 'ボディトリート5回券',
        sessions_remaining: 2,
        expiry_date: '2025-03-20',
        status: 'active'
      }
    ],
    coupons: [
      {
        id: '1',
        name: '【男女共通人気NO.1】上半身ケア+小顔コルギ80分',
        used_date: '2024-12-20'
      },
      {
        id: '2',
        name: '【朝割/女性限定】上半身ケア50分',
        used_date: '2024-11-10'
      }
    ],
    visitHistory: [
      {
        id: '1',
        date: '2025-01-10',
        service: 'フェイシャル60分',
        staff: '佐野 智里',
        amount: 8000
      },
      {
        id: '2',
        date: '2024-12-20',
        service: '上半身ケア+小顔コルギ80分',
        staff: '星野 加奈恵',
        amount: 6000
      },
      {
        id: '3',
        date: '2024-11-15',
        service: 'ボディトリート90分',
        staff: '佐野 智里',
        amount: 14000
      },
      {
        id: '4',
        date: '2024-10-05',
        service: 'フェイシャル60分',
        staff: '星野 加奈恵',
        amount: 8000
      }
    ]
  };

  // 顧客選択
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(demoCustomer);
  };

  // 名前検索
  const handleNameSearch = () => {
    // 実際はAPIを呼び出す
    setSelectedCustomer(demoCustomer);
  };

  return (
    <div className="customers-page">
      {/* ヘッダー */}
      <header className="customers-page__header">
        <div className="customers-page__header-container">
          <Link href="/" className="customers-page__back-link">
            <ArrowLeft size={20} />
            <span>ダッシュボードに戻る</span>
          </Link>
          <div className="customers-page__header-title">
            <Users size={24} />
            <h1>ABBY 顧客管理</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="customers-page__main">
        {/* 検索セクション */}
        <section className="customers-page__search-section">
          <div className="customers-page__search-grid">
            {/* 左側: 名前検索 */}
            <div className="customers-page__search-box">
              <label className="customers-page__search-label">
                <Search size={16} />
                お客様検索（名前）
              </label>
              <div className="customers-page__search-input-group">
                <input
                  type="text"
                  className="customers-page__search-input"
                  placeholder="姓名を入力（例: 田中、田中花子）"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSearch()}
                />
                <button 
                  className="customers-page__search-btn"
                  onClick={handleNameSearch}
                >
                  <Search size={16} />
                  検索
                </button>
              </div>

              {/* 検索結果（デモ） */}
              {searchName && (
                <div className="customers-page__search-results">
                  <div 
                    className="customers-page__search-result-item"
                    onClick={() => handleSelectCustomer(demoCustomer)}
                  >
                    <div className="customers-page__result-name">
                      田中 花子（タナカ ハナコ）
                    </div>
                    <div className="customers-page__result-info">
                      <div className="customers-page__result-info-item">
                        <Phone size={14} />
                        090-1234-5678
                      </div>
                      <div className="customers-page__result-info-item">
                        <Calendar size={14} />
                        最終来店: 2025-01-10
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 右側: 今日の予約者 */}
            <div className="customers-page__search-box">
              <label className="customers-page__search-label">
                <Calendar size={16} />
                今日の予約者
              </label>
              <div className="customers-page__today-bookings">
                {todayBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="customers-page__today-booking-item"
                    onClick={() => handleSelectCustomer(demoCustomer)}
                  >
                    <div className="customers-page__today-booking-info">
                      <span className="customers-page__today-booking-time">
                        {booking.time}
                      </span>
                      <div>
                        <div className="customers-page__today-booking-name">
                          {booking.name}
                        </div>
                        <div className="customers-page__today-booking-service">
                          {booking.service}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 詳細情報セクション */}
        {selectedCustomer ? (
          <section className="customers-page__detail-section">
            {/* ヘッダー */}
            <div className="customers-page__detail-header">
              <div className="customers-page__detail-title">
                <Users size={24} />
                <h2>{selectedCustomer.last_name} {selectedCustomer.first_name} 様</h2>
              </div>
              <div className="customers-page__detail-actions">
                <button className="customers-page__action-btn customers-page__action-btn--secondary">
                  <Edit2 size={16} />
                  編集
                </button>
                <button className="customers-page__action-btn customers-page__action-btn--primary">
                  <Plus size={16} />
                  新規予約
                </button>
              </div>
            </div>

            {/* タブナビゲーション */}
            <div className="customers-page__tabs">
              <button
                className={`customers-page__tab ${activeTab === 'basic' ? 'customers-page__tab--active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                基本情報
              </button>
              <button
                className={`customers-page__tab ${activeTab === 'tickets' ? 'customers-page__tab--active' : ''}`}
                onClick={() => setActiveTab('tickets')}
              >
                保有回数券
              </button>
              <button
                className={`customers-page__tab ${activeTab === 'coupons' ? 'customers-page__tab--active' : ''}`}
                onClick={() => setActiveTab('coupons')}
              >
                クーポン利用履歴
              </button>
              <button
                className={`customers-page__tab ${activeTab === 'history' ? 'customers-page__tab--active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                来店履歴
              </button>
            </div>

            {/* タブコンテンツ */}
            <div className="customers-page__tab-content">
              {/* 基本情報タブ */}
              {activeTab === 'basic' && (
                <div className="customers-page__info-grid">
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">来店回数</div>
                    <div className="customers-page__info-value" style={{ color: '#3b82f6', fontWeight: 700 }}>
                      {selectedCustomer.visit_count} 回
                    </div>
                  </div>
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">フリガナ</div>
                    <div className="customers-page__info-value">
                      {selectedCustomer.last_name_kana} {selectedCustomer.first_name_kana}
                    </div>
                  </div>
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">電話番号</div>
                    <div className="customers-page__info-value">
                      <Phone size={20} />
                      {selectedCustomer.phone_number}
                    </div>
                  </div>
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">メールアドレス</div>
                    <div className="customers-page__info-value">
                      <Mail size={20} />
                      {selectedCustomer.email}
                    </div>
                  </div>
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">生年月日</div>
                    <div className="customers-page__info-value">
                      {selectedCustomer.birth_date}
                    </div>
                  </div>
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">初回登録日</div>
                    <div className="customers-page__info-value">
                      {selectedCustomer.created_at}
                    </div>
                  </div>
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">LINE ユーザーID</div>
                    <div className="customers-page__info-value">
                      {selectedCustomer.line_user_id || <span className="customers-page__info-value--empty">未登録</span>}
                    </div>
                  </div>
                  <div className="customers-page__info-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="customers-page__info-label">備考</div>
                    <div className="customers-page__info-value">
                      {selectedCustomer.notes || <span className="customers-page__info-value--empty">なし</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* 保有回数券タブ */}
              {activeTab === 'tickets' && (
                <div className="customers-page__ticket-list">
                  {selectedCustomer.tickets.map(ticket => (
                    <div key={ticket.id} className="customers-page__ticket-item">
                      <div className="customers-page__ticket-info">
                        <h3>{ticket.plan_name}</h3>
                        <div className="customers-page__ticket-details">
                          <span>有効期限: {ticket.expiry_date}</span>
                        </div>
                      </div>
                      <div className="customers-page__ticket-status">
                        <div className="customers-page__ticket-remaining">
                          残り {ticket.sessions_remaining} 回
                        </div>
                        <span className={`customers-page__ticket-badge ${
                          ticket.status === 'active' 
                            ? 'customers-page__ticket-badge--active' 
                            : 'customers-page__ticket-badge--expired'
                        }`}>
                          {ticket.status === 'active' ? '有効' : '期限切れ'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {selectedCustomer.tickets.length === 0 && (
                    <div className="customers-page__empty-state">
                      <CreditCard size={48} />
                      <p>保有している回数券はありません</p>
                    </div>
                  )}
                </div>
              )}

              {/* クーポン利用履歴タブ */}
              {activeTab === 'coupons' && (
                <div className="customers-page__coupon-list">
                  {selectedCustomer.coupons.map(coupon => (
                    <div key={coupon.id} className="customers-page__coupon-item">
                      <div className="customers-page__coupon-info">
                        <Tag className="customers-page__coupon-icon" size={20} />
                        <div>
                          <div className="customers-page__coupon-name">
                            {coupon.name}
                          </div>
                          <div className="customers-page__coupon-date">
                            利用日: {coupon.used_date}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedCustomer.coupons.length === 0 && (
                    <div className="customers-page__empty-state">
                      <Tag size={48} />
                      <p>クーポンの利用履歴はありません</p>
                    </div>
                  )}
                </div>
              )}

              {/* 来店履歴タブ */}
              {activeTab === 'history' && (
                <div>
                  <table className="customers-page__history-table">
                    <thead>
                      <tr>
                        <th>来店日</th>
                        <th>施術内容</th>
                        <th>担当スタッフ</th>
                        <th>金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.visitHistory.map(visit => (
                        <tr key={visit.id}>
                          <td className="customers-page__history-date">
                            {visit.date}
                          </td>
                          <td className="customers-page__history-service">
                            {visit.service}
                          </td>
                          <td className="customers-page__history-staff">
                            {visit.staff}
                          </td>
                          <td className="customers-page__history-amount">
                            ¥{visit.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {selectedCustomer.visitHistory.length === 0 && (
                    <div className="customers-page__empty-state">
                      <FileText size={48} />
                      <p>来店履歴はありません</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        ) : (
          /* 顧客未選択時の表示 */
          <div className="customers-page__detail-section">
            <div className="customers-page__empty-state" style={{ padding: '4rem' }}>
              <Users size={64} />
              <p style={{ fontSize: '1rem', marginTop: '1rem' }}>
                上の検索欄からお客様を検索してください
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomersPage;