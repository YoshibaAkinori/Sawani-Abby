"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, Calendar, Phone, Mail, CreditCard, Tag, Clock, Edit2, Plus, FileText, Save, X } from 'lucide-react';
import './customers.css';

const CustomersPage = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [searchName, setSearchName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 編集モード関連
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    last_name: '',
    first_name: '',
    last_name_kana: '',
    first_name_kana: '',
    phone_number: '',
    email: '',
    birth_date: '',
    notes: '',
    base_visit_count: '',
    line_user_id: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 顧客詳細データ
  const [customerTickets, setCustomerTickets] = useState([]);
  const [customerCoupons, setCustomerCoupons] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);

  // 初期データ読み込み
  useEffect(() => {
    fetchTodayBookings();
  }, []);

  // 今日の予約者取得
  const fetchTodayBookings = async () => {
    try {
      const response = await fetch('/api/customers/today-bookings');
      const data = await response.json();
      if (data.success) {
        setTodayBookings(data.data || []);
      }
    } catch (error) {
      console.error('今日の予約者取得エラー:', error);
    }
  };

  // 名前検索
  const handleNameSearch = async () => {
    if (!searchName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/customers/search?name=${encodeURIComponent(searchName)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data || []);
        // 結果が1件のみの場合は自動選択
        if (data.data?.length === 1) {
          handleSelectCustomer(data.data[0].customer_id);
        }
      } else {
        alert('検索に失敗しました');
      }
    } catch (error) {
      console.error('検索エラー:', error);
      alert('検索中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 顧客選択
  const handleSelectCustomer = async (customerId) => {
    setIsLoading(true);
    setIsEditMode(false); // 編集モードをリセット
    try {
      // 顧客基本情報
      const customerRes = await fetch(`/api/customers/${customerId}`);
      const customerData = await customerRes.json();

      if (customerData.success) {
        setSelectedCustomer(customerData.data);

        // 回数券取得
        const ticketsRes = await fetch(`/api/customers/${customerId}/tickets`);
        const ticketsData = await ticketsRes.json();
        setCustomerTickets(ticketsData.data || []);

        // クーポン履歴取得
        const couponsRes = await fetch(`/api/customers/${customerId}/coupons`);
        const couponsData = await couponsRes.json();
        setCustomerCoupons(couponsData.data || []);

        // 来店履歴取得
        const historyRes = await fetch(`/api/customers/${customerId}/visit-history`);
        const historyData = await historyRes.json();
        setVisitHistory(historyData.data || []);

        // 検索結果をクリア
        setSearchResults([]);
        setSearchName('');
      }
    } catch (error) {
      console.error('顧客情報取得エラー:', error);
      alert('顧客情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 今日の予約者から選択
  const handleSelectFromBooking = (customerId) => {
    handleSelectCustomer(customerId);
  };

  // 編集モード開始
  const handleStartEdit = () => {
    setEditFormData({
      last_name: selectedCustomer.last_name || '',
      first_name: selectedCustomer.first_name || '',
      last_name_kana: selectedCustomer.last_name_kana || '',
      first_name_kana: selectedCustomer.first_name_kana || '',
      phone_number: selectedCustomer.phone_number || '',
      email: selectedCustomer.email || '',
      birth_date: selectedCustomer.birth_date || '',
      notes: selectedCustomer.notes || '',
      base_visit_count: selectedCustomer.base_visit_count || '',
      line_user_id: selectedCustomer.line_user_id || ''
    });
    setIsEditMode(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({
      last_name: '',
      first_name: '',
      last_name_kana: '',
      first_name_kana: '',
      phone_number: '',
      email: '',
      birth_date: '',
      notes: '',
      base_visit_count: '',
      line_user_id: ''
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 保存処理
  const handleSaveEdit = async () => {
    // バリデーション
    if (!editFormData.last_name || !editFormData.first_name || !editFormData.phone_number) {
      setErrorMessage('姓・名・電話番号は必須です');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.customer_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('顧客情報を更新しました');
        setIsEditMode(false);
        // 最新情報を再取得
        await handleSelectCustomer(selectedCustomer.customer_id);

        // 成功メッセージを3秒後に消す
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setErrorMessage(result.error || '更新に失敗しました');
      }
    } catch (error) {
      console.error('更新エラー:', error);
      setErrorMessage('更新中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
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
                お客様検索(名前)
              </label>
              <div className="customers-page__search-input-group">
                <input
                  type="text"
                  className="customers-page__search-input"
                  placeholder="姓名を入力(例: 田中、田中花子)"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSearch()}
                  disabled={isLoading}
                />
                <button
                  className="customers-page__search-btn"
                  onClick={handleNameSearch}
                  disabled={isLoading}
                >
                  <Search size={16} />
                  {isLoading ? '検索中...' : '検索'}
                </button>
              </div>

              {/* 検索結果 */}
              {searchResults.length > 0 && (
                <div className="customers-page__search-results">
                  {searchResults.map(customer => (
                    <div
                      key={customer.customer_id}
                      className="customers-page__search-result-item"
                      onClick={() => handleSelectCustomer(customer.customer_id)}
                    >
                      <div className="customers-page__result-name">
                        {customer.last_name} {customer.first_name}
                        ({customer.last_name_kana} {customer.first_name_kana})
                      </div>
                      <div className="customers-page__result-info">
                        <div className="customers-page__result-info-item">
                          <Phone size={14} />
                          {customer.phone_number}
                        </div>
                        {customer.email && (
                          <div className="customers-page__result-info-item">
                            <Mail size={14} />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                {todayBookings.length > 0 ? (
                  todayBookings.map(booking => (
                    <div
                      key={booking.booking_id}
                      className="customers-page__today-booking-item"
                      onClick={() => handleSelectFromBooking(booking.customer_id)}
                    >
                      <div className="customers-page__today-booking-info">
                        <span className="customers-page__today-booking-time">
                          {booking.start_time?.substring(0, 5)}
                        </span>
                        <div>
                          <div className="customers-page__today-booking-name">
                            {booking.last_name} {booking.first_name}
                          </div>
                          <div className="customers-page__today-booking-service">
                            {booking.service_name} / {booking.staff_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="customers-page__empty-state">
                    <Calendar size={32} />
                    <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                      本日の予約はありません
                    </p>
                  </div>
                )}
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
                {!isEditMode ? (
                  <>
                    <button
                      className="customers-page__action-btn customers-page__action-btn--secondary"
                      onClick={handleStartEdit}
                      disabled={activeTab !== 'basic'}
                    >
                      <Edit2 size={16} />
                      編集
                    </button>
                    <button className="customers-page__action-btn customers-page__action-btn--primary">
                      <Plus size={16} />
                      新規予約
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="customers-page__action-btn customers-page__action-btn--secondary"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X size={16} />
                      キャンセル
                    </button>
                    <button
                      className="customers-page__action-btn customers-page__action-btn--primary"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                    >
                      <Save size={16} />
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* エラー・成功メッセージ */}
            {errorMessage && (
              <div className="customers-page__message customers-page__message--error">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="customers-page__message customers-page__message--success">
                {successMessage}
              </div>
            )}

            {/* タブナビゲーション */}
            <div className="customers-page__tabs">
              <button
                className={`customers-page__tab ${activeTab === 'basic' ? 'customers-page__tab--active' : ''}`}
                onClick={() => {
                  setActiveTab('basic');
                  if (isEditMode) handleCancelEdit();
                }}
              >
                基本情報
              </button>
              <button
                className={`customers-page__tab ${activeTab === 'tickets' ? 'customers-page__tab--active' : ''}`}
                onClick={() => {
                  setActiveTab('tickets');
                  if (isEditMode) handleCancelEdit();
                }}
              >
                保有回数券
              </button>
              <button
                className={`customers-page__tab ${activeTab === 'coupons' ? 'customers-page__tab--active' : ''}`}
                onClick={() => {
                  setActiveTab('coupons');
                  if (isEditMode) handleCancelEdit();
                }}
              >
                クーポン利用履歴
              </button>
              <button
                className={`customers-page__tab ${activeTab === 'history' ? 'customers-page__tab--active' : ''}`}
                onClick={() => {
                  setActiveTab('history');
                  if (isEditMode) handleCancelEdit();
                }}
              >
                来店履歴
              </button>
            </div>

            {/* タブコンテンツ */}
            <div className="customers-page__tab-content">
              {/* 基本情報タブ */}
              {activeTab === 'basic' && (
                <div className="customers-page__info-grid">
                  {/* 来店回数 */}
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">
                      来店回数
                      {isEditMode && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                          (初回値調整)
                        </span>
                      )}
                    </div>
                    {isEditMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number"
                            className="customers-page__info-input"
                            // ★★★ この行を追加 ★★★
                            placeholder={selectedCustomer.base_visit_count || 0}
                            value={editFormData.base_visit_count}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              base_visit_count: parseInt(e.target.value) || ''
                            })}
                            min="0"
                            style={{ width: '120px' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            回 (来店記録分は自動加算)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="customers-page__info-value" style={{ color: '#3b82f6', fontWeight: 700 }}>
                        {selectedCustomer.visit_count} 回
                      </div>
                    )}
                  </div>

                  {/* 姓名 */}
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">
                      氏名 {isEditMode && <span className="customers-page__form-required">*</span>}
                    </div>
                    {isEditMode ? (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                          type="text"
                          className="customers-page__info-input"
                          value={editFormData.last_name}
                          onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                          placeholder="姓"
                        />
                        <input
                          type="text"
                          className="customers-page__info-input"
                          value={editFormData.first_name}
                          onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                          placeholder="名"
                        />
                      </div>
                    ) : (
                      <div className="customers-page__info-value">
                        {selectedCustomer.last_name} {selectedCustomer.first_name}
                      </div>
                    )}
                  </div>

                  {/* フリガナ */}
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">フリガナ</div>
                    {isEditMode ? (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                          type="text"
                          className="customers-page__info-input"
                          value={editFormData.last_name_kana}
                          onChange={(e) => setEditFormData({ ...editFormData, last_name_kana: e.target.value })}
                          placeholder="セイ"
                        />
                        <input
                          type="text"
                          className="customers-page__info-input"
                          value={editFormData.first_name_kana}
                          onChange={(e) => setEditFormData({ ...editFormData, first_name_kana: e.target.value })}
                          placeholder="メイ"
                        />
                      </div>
                    ) : (
                      <div className="customers-page__info-value">
                        {selectedCustomer.last_name_kana} {selectedCustomer.first_name_kana}
                      </div>
                    )}
                  </div>

                  {/* 電話番号 */}
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">
                      電話番号 {isEditMode && <span className="customers-page__form-required">*</span>}
                    </div>
                    {isEditMode ? (
                      <input
                        type="tel"
                        className="customers-page__info-input"
                        value={editFormData.phone_number}
                        onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                        placeholder="090-0000-0000"
                      />
                    ) : (
                      <div className="customers-page__info-value">
                        <Phone size={20} />
                        {selectedCustomer.phone_number}
                      </div>
                    )}
                  </div>

                  {/* メールアドレス */}
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">メールアドレス</div>
                    {isEditMode ? (
                      <input
                        type="email"
                        className="customers-page__info-input"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        placeholder="example@email.com"
                      />
                    ) : (
                      <div className="customers-page__info-value">
                        {selectedCustomer.email ? (
                          <>
                            <Mail size={20} />
                            {selectedCustomer.email}
                          </>
                        ) : (
                          <span className="customers-page__info-value--empty">未登録</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 生年月日 */}
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">生年月日</div>
                    {isEditMode ? (
                      <input
                        type="date"
                        className="customers-page__info-input"
                        value={editFormData.birth_date}
                        onChange={(e) => setEditFormData({ ...editFormData, birth_date: e.target.value })}
                      />
                    ) : (
                      <div className="customers-page__info-value">
                        {selectedCustomer.birth_date || <span className="customers-page__info-value--empty">未登録</span>}
                      </div>
                    )}
                  </div>

                  {/* 初回登録日 - 編集不可 */}
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">初回登録日</div>
                    <div className="customers-page__info-value">
                      {new Date(selectedCustomer.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>

                  {/* LINE ユーザーID */}
                  <div className="customers-page__info-item">
                    <div className="customers-page__info-label">LINE ユーザーID</div>
                    {isEditMode ? (
                      <input
                        type="text"
                        className="customers-page__info-input"
                        value={editFormData.line_user_id}
                        onChange={(e) => setEditFormData({ ...editFormData, line_user_id: e.target.value })}
                        placeholder="LINE連携時に自動入力されます"
                      />
                    ) : (
                      <div className="customers-page__info-value">
                        {selectedCustomer.line_user_id || <span className="customers-page__info-value--empty">未登録</span>}
                      </div>
                    )}
                  </div>

                  {/* 備考 */}
                  <div className="customers-page__info-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="customers-page__info-label">備考</div>
                    {isEditMode ? (
                      <textarea
                        className="customers-page__info-textarea"
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        placeholder="特記事項があれば記入してください"
                        rows={4}
                      />
                    ) : (
                      <div className="customers-page__info-value">
                        {selectedCustomer.notes || <span className="customers-page__info-value--empty">なし</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 保有回数券タブ */}
              {activeTab === 'tickets' && (
                <div className="customers-page__ticket-list">
                  {customerTickets.map(ticket => (
                    <div key={ticket.customer_ticket_id} className="customers-page__ticket-item">
                      <div className="customers-page__ticket-info">
                        <h3>{ticket.plan_name}</h3>
                        <div className="customers-page__ticket-details">
                          <span>購入日: {ticket.purchase_date}</span>
                          <span>有効期限: {ticket.expiry_date}</span>
                          <span>購入価格: ¥{ticket.purchase_price.toLocaleString()}</span>
                          <span>支払済: ¥{ticket.total_paid.toLocaleString()}</span>
                          {ticket.remaining_payment > 0 && (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>
                              残支払額: ¥{ticket.remaining_payment.toLocaleString()}
                            </span>
                          )}
                          {ticket.remaining_payment === 0 && (
                            <span style={{ color: '#059669', fontWeight: 600 }}>
                              支払済
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="customers-page__ticket-status">
                        <div className="customers-page__ticket-remaining">
                          残り {ticket.sessions_remaining} / {ticket.total_sessions} 回
                        </div>
                        <span className={`customers-page__ticket-badge ${ticket.status === 'active'
                          ? 'customers-page__ticket-badge--active'
                          : 'customers-page__ticket-badge--expired'
                          }`}>
                          {ticket.status === 'active' ? '有効' : ticket.status === 'used_up' ? '使用済' : '期限切れ'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {customerTickets.length === 0 && (
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
                  {customerCoupons.map(coupon => (
                    <div key={coupon.usage_id} className="customers-page__coupon-item">
                      <div className="customers-page__coupon-info">
                        <Tag className="customers-page__coupon-icon" size={20} />
                        <div>
                          <div className="customers-page__coupon-name">
                            {coupon.coupon_name}
                          </div>
                          <div className="customers-page__coupon-date">
                            利用日: {new Date(coupon.used_at).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {customerCoupons.length === 0 && (
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
                        <th>支払方法</th>
                        <th>金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitHistory.map(visit => {
                        const isTicketPurchaseOnly = visit.ticket_purchases &&
                          visit.ticket_purchases.length > 0 &&
                          !visit.service;

                        return (
                          <tr key={visit.payment_id}>
                            <td className="customers-page__history-date">
                              {visit.date}
                            </td>
                            <td className="customers-page__history-service">
                              {/* 通常のサービス表示 */}
                              {!isTicketPurchaseOnly && visit.service && (
                                <div style={{
                                  color: visit.detail_info?.type === 'coupon' ? '#f97316' :
                                    visit.detail_info?.type === 'limited_offer' ? '#9333ea' : 'inherit',
                                  fontSize: '1.25rem'
                                }}>
                                  {/* 期間限定の場合は名前のみ */}
                                  {visit.detail_info?.type === 'limited_offer' ? (
                                    <>期間限定: {visit.service}</>
                                  ) : (
                                    <>
                                      {visit.service}
                                      {visit.price > 0 && (
                                        <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                                          (¥{visit.price.toLocaleString()})
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}

                              {/* 詳細情報の表示 */}
                              {visit.detail_info && !isTicketPurchaseOnly && (
                                <div style={{ fontSize: '1.25rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  {visit.detail_info.type === 'ticket_use' && (
                                    <>
                                      {visit.detail_info.ticket_uses && visit.detail_info.ticket_uses.length > 0 && (
                                        <div style={{ color: '#3b82f6' }}>
                                          {visit.detail_info.ticket_uses.map((t, idx) => (
                                            <div key={idx}>
                                              回数券使用: {t.plan_name}
                                              {t.remaining_payment > 0 && (
                                                <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>
                                                  (残金支払い: ¥{t.remaining_payment.toLocaleString()})
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}

                              {/* 回数券購入情報の表示 */}
                              {visit.ticket_purchases && visit.ticket_purchases.length > 0 && (
                                <div style={{ fontSize: '1.25rem', marginTop: isTicketPurchaseOnly ? 0 : '0.25rem' }}>
                                  {visit.ticket_purchases.map((ticket, idx) => (
                                    <div key={idx} style={{ color: '#10b981' }}>
                                      {isTicketPurchaseOnly ? '' : '+ '}
                                      回数券購入: {
                                        ticket.plan_name}
                                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                                        (¥{ticket.amount.toLocaleString()})
                                      </span>
                                      {ticket.is_immediate_use && (
                                        <span style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>
                                          + 初回使用
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* オプション情報の表示 */}
                              {visit.options && visit.options.length > 0 && (
                                <div style={{ fontSize: '1.25rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  オプション: {visit.options.map((opt, idx) => (
                                    <span key={idx}>
                                      {opt.option_name}
                                      {opt.is_free ? ' (無料)' : ` (+¥${opt.price.toLocaleString()})`}
                                      {idx < visit.options.length - 1 && ', '}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="customers-page__history-staff">
                              {visit.staff}
                            </td>
                            <td className="customers-page__history-payment">
                              {visit.detail_info?.type === 'ticket_use' && visit.amount === 0 ? (
                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>回数券</span>
                              ) : (
                                <>
                                  {visit.payment_method === 'cash' && '現金'}
                                  {visit.payment_method === 'card' && 'カード'}
                                  {visit.payment_method === 'mixed' && '混合'}
                                  {!visit.payment_method && '-'}
                                </>
                              )}
                            </td>
                            <td className="customers-page__history-amount">
                              ¥{visit.amount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {visitHistory.length === 0 && (
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