import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Clock, User, Phone, Mail, AlertCircle, Tag, Package, Timer, Settings2, CalendarPlus, CalendarCheck } from 'lucide-react';
import './BookingModal.css';

const BookingModal = ({ activeModal, selectedSlot, onClose, onModalChange }) => {
  // フォームの状態管理
  const [formData, setFormData] = useState({
    // 予約タイプ（booking: 予約, schedule: 予定）
    bookingType: 'booking',

    // 予約情報
    date: selectedSlot?.date || new Date().toISOString().split('T')[0],
    startTime: selectedSlot?.timeSlot || new Date().toTimeString().slice(0, 5),
    endTime: '',
    staffId: selectedSlot?.staffId || '',
    bedId: '1',

    // 顧客情報
    customerId: '',
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    phoneNumber: '',
    email: '',

    // 施術情報
    serviceId: '',
    serviceType: 'normal', // normal, ticket, coupon, limited
    optionIds: [],

    // 支払い情報
    ticketId: '',
    couponId: '',
    limitedOfferId: '',

    // 備考
    notes: '',
    scheduleTitle: '' // 予定用タイトル
  });

  // マスタデータ
  const [services, setServices] = useState([]);
  const [options, setOptions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [ticketPlans, setTicketPlans] = useState([]);
  const [limitedOffers, setLimitedOffers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerTickets, setCustomerTickets] = useState([]);

  // UI状態
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 初期データ読み込み
  useEffect(() => {
    if (activeModal === 'booking') {
      fetchMasterData();
    }
  }, [activeModal]);

  // マスタデータ一括取得
  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      // 並列でAPIを呼び出し
      const [servicesRes, optionsRes, staffRes, couponsRes, ticketsRes, limitedRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/options'),
        fetch('/api/staff'),
        fetch('/api/coupons'),
        fetch('/api/ticket-plans'),
        fetch('/api/limited-offers')
      ]);

      const servicesData = await servicesRes.json();
      const optionsData = await optionsRes.json();
      const staffData = await staffRes.json();
      const couponsData = await couponsRes.json();
      const ticketsData = await ticketsRes.json();
      const limitedData = await limitedRes.json();

      setServices(servicesData.data || []);
      setOptions(optionsData.data || []);
      setStaff(staffData.data?.filter(s => s.is_active) || []);
      setCoupons(couponsData.data || []);
      setTicketPlans(ticketsData.data || []);
      setLimitedOffers(limitedData.data || []);
    } catch (err) {
      console.error('マスタデータ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 顧客検索（名前検索）
  const searchCustomers = async () => {
    if (!searchName.trim()) return;

    try {
      const response = await fetch(`/api/customers/search?name=${encodeURIComponent(searchName)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data || []);
        // 検索結果が1件の場合は自動選択
        if (data.data?.length === 1) {
          selectCustomer(data.data[0]);
        }
      }
    } catch (err) {
      console.error('顧客検索エラー:', err);
      setSearchResults([]);
    }
  };

  // 顧客選択
  const selectCustomer = async (customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.customer_id,
      lastName: customer.last_name,
      firstName: customer.first_name,
      lastNameKana: customer.last_name_kana,
      firstNameKana: customer.first_name_kana,
      phoneNumber: customer.phone_number,
      email: customer.email
    }));

    // 顧客の回数券情報を取得
    try {
      const response = await fetch(`/api/customers/${customer.customer_id}/tickets`);
      const data = await response.json();
      if (data.success) {
        setCustomerTickets(data.data || []);
      }
    } catch (err) {
      console.error('回数券情報取得エラー:', err);
    }

    // 検索結果をクリア
    setSearchResults([]);
    setSearchName('');
  };

  // 施術時間から終了時間を計算（修正版）
  const calculateEndTime = (updatedFormData) => {
    let duration = 0;

    // 予定モードの場合は計算しない
    if (updatedFormData.bookingType === 'schedule') {
      return updatedFormData.endTime;
    }

    // サービスタイプに応じて時間を計算
    if (updatedFormData.serviceType === 'normal' && updatedFormData.serviceId) {
      // 通常メニュー
      const service = services.find(s => s.service_id === updatedFormData.serviceId);
      duration = service?.duration_minutes || 0;
    } else if (updatedFormData.serviceType === 'ticket' && updatedFormData.ticketId) {
      // 回数券 - 回数券プランからサービスIDを取得して施術時間を取得
      const ticket = customerTickets.find(t => t.customer_ticket_id === updatedFormData.ticketId);
      if (ticket) {
        // ticket.service_name から対応するサービスを検索
        const service = services.find(s => s.name === ticket.service_name);
        duration = service?.duration_minutes || 60;
      } else {
        duration = 60; // デフォルト
      }
    } else if (updatedFormData.serviceType === 'coupon' && updatedFormData.couponId) {
      // クーポン - total_duration_minutesを優先的に使用
      const coupon = coupons.find(c => c.coupon_id === updatedFormData.couponId);

      if (coupon?.total_duration_minutes) {
        // クーポンテーブルに直接登録されている施術時間を使用
        duration = coupon.total_duration_minutes;
      } else if (coupon?.service_duration) {
        // JOINで取得したベースサービスの時間を使用
        duration = coupon.service_duration;
      } else if (coupon?.base_service_id) {
        // それでもない場合はservicesから検索
        const service = services.find(s => s.service_id === coupon.base_service_id);
        duration = service?.duration_minutes || 60;
      } else {
        duration = 60; // デフォルト
      }
    } else if (updatedFormData.serviceType === 'limited' && updatedFormData.limitedOfferId) {
      // 期間限定オファー - service_name から施術時間を推定
      const offer = limitedOffers.find(o => o.offer_id === updatedFormData.limitedOfferId);
      if (offer?.duration_minutes) {
        duration = offer?.duration_minutes || 60;
      } else {
        duration = 60; // デフォルト
      }
    }

    // オプションの時間を加算
    const optionMinutes = updatedFormData.optionIds.reduce((sum, optId) => {
      const option = options.find(o => o.option_id === optId);
      return sum + (option?.duration_minutes || 0);
    }, 0);

    const totalMinutes = duration + optionMinutes;

    if (totalMinutes === 0) return updatedFormData.endTime;

    const [hour, minute] = updatedFormData.startTime.split(':').map(Number);
    const startMinutes = hour * 60 + minute;
    const endMinutes = startMinutes + totalMinutes;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;

    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  // フォーム入力処理（修正版）
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // サービスタイプ変更時にIDをリセット
      if (field === 'serviceType') {
        updated.serviceId = '';
        updated.ticketId = '';
        updated.couponId = '';
        updated.limitedOfferId = '';
      }

      // 予約モードの場合のみ終了時間を再計算
      if (updated.bookingType === 'booking' &&
        ['serviceId', 'serviceType', 'ticketId', 'couponId', 'limitedOfferId', 'startTime'].includes(field)) {
        updated.endTime = calculateEndTime(updated);
      }

      return updated;
    });
  };

  // オプション選択処理（修正版）
  const handleOptionToggle = (optionId) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (prev.optionIds.includes(optionId)) {
        updated.optionIds = prev.optionIds.filter(id => id !== optionId);
      } else {
        updated.optionIds = [...prev.optionIds, optionId];
      }
      // 終了時間を再計算
      updated.endTime = calculateEndTime(updated);
      return updated;
    });
  };

  // 予約登録処理
  const handleSubmit = async () => {
    // 予定モードの場合は簡略化バリデーション
    if (formData.bookingType === 'schedule') {
      if (!formData.staffId) {
        setError('スタッフを選択してください');
        setTimeout(() => setError(''), 3000);
        return;
      }
      if (!formData.date || !formData.startTime || !formData.endTime) {
        setError('日時を入力してください');
        setTimeout(() => setError(''), 3000);
        return;
      }

      setIsLoading(true);
      try {
        const scheduleData = {
          customer_id: null,
          staff_id: formData.staffId,
          service_id: null,
          date: formData.date,
          start_time: formData.startTime,
          end_time: formData.endTime,
          bed_id: null,
          type: 'schedule',
          status: 'blocked',
          notes: formData.scheduleTitle || '予定'
        };

        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData)
        });

        const result = await response.json();
        if (result.success) {
          alert(`予定「${formData.scheduleTitle || '予定'}」を登録しました`);
          onClose();
          window.location.reload();
        } else {
          throw new Error(result.error || '予定登録に失敗しました');
        }
      } catch (err) {
        console.error('予定登録エラー:', err);
        setError(err.message || '予定登録中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 通常の予約バリデーション
    if (!formData.serviceId && !formData.ticketId && !formData.couponId && !formData.limitedOfferId) {
      setError('施術メニューを選択してください');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!formData.lastName || !formData.firstName) {
      setError('お客様名を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!formData.phoneNumber) {
      setError('電話番号を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!formData.staffId) {
      setError('スタッフを選択してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      // 新規顧客の場合は先に顧客を登録
      let customerId = formData.customerId;
      if (!customerId) {
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            last_name: formData.lastName,
            first_name: formData.firstName,
            last_name_kana: formData.lastNameKana,
            first_name_kana: formData.firstNameKana,
            phone_number: formData.phoneNumber,
            email: formData.email
          })
        });

        const customerData = await customerResponse.json();
        if (customerData.success) {
          customerId = customerData.data.customer_id;
        }
      }

      // 予約登録データを構築
      const bookingData = {
        customer_id: customerId,
        staff_id: formData.staffId,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        bed_id: formData.bedId,
        option_ids: formData.optionIds,
        notes: formData.notes,
        status: 'confirmed',
        type: 'booking',
        // ★初期値としてすべてnullを設定
        service_id: null,
        customer_ticket_id: null,
        coupon_id: null,
        limited_offer_id: null
      };

      // サービスタイプに応じて適切なIDを設定
      if (formData.serviceType === 'normal') {
        bookingData.service_id = formData.serviceId;
      } else if (formData.serviceType === 'ticket') {
        bookingData.customer_ticket_id = formData.ticketId;
      } else if (formData.serviceType === 'coupon') {
        bookingData.coupon_id = formData.couponId;
      } else if (formData.serviceType === 'limited') {
        bookingData.limited_offer_id = formData.limitedOfferId;
      }

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const result = await bookingResponse.json();
      if (result.success) {
        alert('予約を登録しました');
        onClose();
        window.location.reload();
      } else {
        throw new Error(result.error || '予約登録に失敗しました');
      }
    } catch (err) {
      console.error('予約登録エラー:', err);
      setError(err.message || '予約登録中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // カテゴリ別にサービスをグループ化
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'その他';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  // カテゴリ別にオプションをグループ化
  const groupedOptions = options.reduce((acc, option) => {
    const category = option.category || 'その他';
    if (!acc[category]) acc[category] = [];
    acc[category].push(option);
    return acc;
  }, {});

  if (!activeModal) return null;

  // 新規予約/予定ページ
  if (activeModal === 'booking') {
    return (
      <div className="booking-page">
        <div className="booking-page-content">
          {/* ヘッダー */}
          <div className="booking-page-header">
            <h2>新規登録</h2>
            <button onClick={onClose} className="booking-page-close">
              <X size={20} />
              閉じる
            </button>
          </div>

          {/* 予約タイプ選択 */}
          <div className="booking-type-selector">
            <button
              className={`booking-type-btn ${formData.bookingType === 'booking' ? 'booking-type-btn--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, bookingType: 'booking' }))}
            >
              <CalendarCheck size={20} />
              予約
            </button>
            <button
              className={`booking-type-btn ${formData.bookingType === 'schedule' ? 'booking-type-btn--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, bookingType: 'schedule' }))}
            >
              <CalendarPlus size={20} />
              予定
            </button>
          </div>

          {error && (
            <div className="booking-alert booking-alert--error">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}
          <div className="booking-page-grid">
            {/* 左側: 予約情報入力 */}
            <div className="booking-page-main">
              {/* 予約情報セクション */}
              <div className="booking-section">
                <div className="section-header">
                  <Calendar size={18} />
                  {formData.bookingType === 'booking' ? '予約情報' : '予定情報'}
                </div>
                <div className="section-content">
                  <div className="form-row">
                    <label className="form-label">
                      日時 <span className="required">●</span>
                    </label>
                    <div className="datetime-inputs">
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="form-input form-input--date"
                      />
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        className="form-input form-input--time"
                      />
                      <span className="time-separator">〜</span>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                        className="form-input form-input--time"
                        readOnly={formData.bookingType === 'booking'}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <label className="form-label">
                      担当スタッフ <span className="required">●</span>
                    </label>
                    <div className="staff-select-grid">
                      {staff.map(s => (
                        <div
                          key={s.staff_id}
                          className={`staff-select-card ${formData.staffId === s.staff_id ? 'selected' : ''}`}
                          onClick={() => handleInputChange('staffId', s.staff_id)}
                        >
                          <div
                            className="staff-select-color"
                            style={{ backgroundColor: s.color }}
                          />
                          <div className="staff-select-name">{s.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {formData.bookingType === 'booking' && (
                    <div className="form-row">
                      <label className="form-label">
                        ベッド <span className="required">●</span>
                      </label>
                      <div className="bed-select-grid">
                        {['1', '2'].map(bedId => (
                          <div
                            key={bedId}
                            className={`bed-select-card ${formData.bedId === bedId ? 'selected' : ''}`}
                            onClick={() => handleInputChange('bedId', bedId)}
                          >
                            ベッド{bedId}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.bookingType === 'schedule' && (
                    <div className="form-row">
                      <label className="form-label">
                        予定タイトル
                      </label>
                      <input
                        type="text"
                        value={formData.scheduleTitle}
                        onChange={(e) => handleInputChange('scheduleTitle', e.target.value)}
                        className="form-input"
                        placeholder="例: 休憩、会議、研修、外出など"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 施術メニューセクション - 予約モードのみ表示 */}
              {formData.bookingType === 'booking' && (
                <div className="booking-section">
                  <div className="section-header">
                    <Package size={18} />
                    施術メニュー
                  </div>
                  <div className="section-content">
                    {/* メニュータイプ選択タブ */}
                    <div className="menu-type-tabs">
                      <button
                        className={`menu-type-tab ${formData.serviceType === 'normal' ? 'active' : ''}`}
                        onClick={() => handleInputChange('serviceType', 'normal')}
                      >
                        通常メニュー
                      </button>
                      <button
                        className={`menu-type-tab ${formData.serviceType === 'ticket' ? 'active' : ''}`}
                        onClick={() => handleInputChange('serviceType', 'ticket')}
                      >
                        回数券
                      </button>
                      <button
                        className={`menu-type-tab ${formData.serviceType === 'coupon' ? 'active' : ''}`}
                        onClick={() => handleInputChange('serviceType', 'coupon')}
                      >
                        クーポン
                      </button>
                      <button
                        className={`menu-type-tab ${formData.serviceType === 'limited' ? 'active' : ''}`}
                        onClick={() => handleInputChange('serviceType', 'limited')}
                      >
                        期間限定
                      </button>
                    </div>

                    {/* 通常メニューリスト */}
                    {formData.serviceType === 'normal' && (
                      <div className="menu-select-list">
                        {Object.entries(groupedServices).map(([category, categoryServices]) => (
                          <div key={category} className="menu-category-group">
                            <div className="menu-category-header">{category}</div>
                            {categoryServices.map(service => (
                              <div
                                key={service.service_id}
                                className={`menu-select-item ${formData.serviceId === service.service_id ? 'selected' : ''}`}
                                onClick={() => handleInputChange('serviceId', service.service_id)}
                              >
                                <input
                                  type="radio"
                                  name="service"
                                  checked={formData.serviceId === service.service_id}
                                  onChange={() => { }}
                                  className="menu-radio"
                                />
                                <div className="menu-info">
                                  <div className="menu-name">{service.name}</div>
                                  <div className="menu-details">
                                    <Clock size={14} />
                                    {service.duration_minutes}分
                                    {service.description && ` - ${service.description}`}
                                  </div>
                                </div>
                                <div className="menu-price">
                                  ¥{service.price.toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 回数券リスト */}
                    {formData.serviceType === 'ticket' && (
                      <div className="menu-select-list">
                        {customerTickets.length > 0 ? (
                          customerTickets.map(ticket => (
                            <div
                              key={ticket.customer_ticket_id}
                              className={`menu-select-item ${formData.ticketId === ticket.customer_ticket_id ? 'selected' : ''}`}
                              onClick={() => handleInputChange('ticketId', ticket.customer_ticket_id)}
                            >
                              <input
                                type="radio"
                                name="ticket"
                                checked={formData.ticketId === ticket.customer_ticket_id}
                                onChange={() => { }}
                                className="menu-radio"
                              />
                              <div className="menu-info">
                                <div className="menu-name">{ticket.plan_name}</div>
                                <div className="menu-details">
                                  残り{ticket.sessions_remaining}回 / 有効期限: {ticket.expiry_date}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-items-message">
                            顧客情報を入力すると、保有回数券が表示されます
                          </div>
                        )}
                      </div>
                    )}

                    {/* クーポンリスト */}
                    {formData.serviceType === 'coupon' && (
                      <div className="menu-select-list">
                        {coupons.filter(c => c.is_active).map(coupon => (
                          <div
                            key={coupon.coupon_id}
                            className={`menu-select-item ${formData.couponId === coupon.coupon_id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('couponId', coupon.coupon_id)}
                          >
                            <input
                              type="radio"
                              name="coupon"
                              checked={formData.couponId === coupon.coupon_id}
                              onChange={() => { }}
                              className="menu-radio"
                            />
                            <div className="menu-info">
                              <div className="menu-name">
                                <Tag size={14} />
                                {coupon.name}
                              </div>
                              <div className="menu-details">{coupon.description}</div>
                            </div>
                            <div className="menu-price">
                              ¥{coupon.total_price.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 期間限定リスト */}
                    {formData.serviceType === 'limited' && (
                      <div className="menu-select-list">
                        {limitedOffers.filter(o => o.is_active).map(offer => (
                          <div
                            key={offer.offer_id}
                            className={`menu-select-item ${formData.limitedOfferId === offer.offer_id ? 'selected' : ''}`}
                            onClick={() => handleInputChange('limitedOfferId', offer.offer_id)}
                          >
                            <input
                              type="radio"
                              name="limited"
                              checked={formData.limitedOfferId === offer.offer_id}
                              onChange={() => { }}
                              className="menu-radio"
                            />
                            <div className="menu-info">
                              <div className="menu-name">
                                <Timer size={14} />
                                {offer.name}
                              </div>
                              <div className="menu-details">
                                {offer.total_sessions}回券 / 販売終了: {offer.sale_end_date || '無期限'}
                              </div>
                            </div>
                            <div className="menu-price">
                              ¥{offer.special_price.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* オプションセクション - 予約モードのみ表示 */}
              {formData.bookingType === 'booking' && (
                <div className="booking-section">
                  <div className="section-header">
                    <Settings2 size={18} />
                    オプション（複数選択可）
                  </div>
                  <div className="section-content">
                    {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                      <div key={category} className="option-category-group">
                        <div className="option-category-label">{category}</div>
                        <div className="option-checkbox-list">
                          {categoryOptions.map(option => (
                            <label key={option.option_id} className="option-checkbox-item">
                              <input
                                type="checkbox"
                                checked={formData.optionIds.includes(option.option_id)}
                                onChange={() => handleOptionToggle(option.option_id)}
                                className="option-checkbox"
                              />
                              <span className="option-name">{option.name}</span>
                              {option.duration_minutes > 0 && (
                                <span className="option-duration">+{option.duration_minutes}分</span>
                              )}
                              <span className="option-price">+¥{option.price.toLocaleString()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 右側: 顧客情報とアクション */}
            <div className="booking-page-side">
              {/* 予約モード：お客様情報セクション */}
              {formData.bookingType === 'booking' ? (
                <>
                  <div className="booking-section">
                    <div className="section-header">
                      <User size={18} />
                      お客様情報
                    </div>
                    <div className="section-content">
                      {/* 顧客検索 */}
                      <div className="form-row">
                        <label className="form-label">お客様検索（名前）</label>
                        <div className="customer-search-box">
                          <input
                            type="text"
                            placeholder="姓名を入力（例: 田中、田中花）"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
                            className="form-input"
                          />
                          <button onClick={searchCustomers} className="search-btn">
                            <Search size={18} />
                            検索
                          </button>
                        </div>

                        {/* 検索結果 */}
                        {searchResults.length > 0 && (
                          <div className="search-results">
                            {searchResults.map(customer => (
                              <div
                                key={customer.customer_id}
                                className="search-result-item"
                                onClick={() => selectCustomer(customer)}
                              >
                                <div className="result-name">
                                  {customer.last_name} {customer.first_name}
                                  （{customer.last_name_kana} {customer.first_name_kana}）
                                </div>
                                <div className="result-info">
                                  <Phone size={14} />
                                  {customer.phone_number}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 顧客情報入力 */}
                      <div className="form-row">
                        <label className="form-label">
                          氏名（カナ） <span className="required">●</span>
                        </label>
                        <div className="name-input-group">
                          <input
                            type="text"
                            placeholder="セイ"
                            value={formData.lastNameKana}
                            onChange={(e) => handleInputChange('lastNameKana', e.target.value)}
                            className="form-input"
                          />
                          <input
                            type="text"
                            placeholder="メイ"
                            value={formData.firstNameKana}
                            onChange={(e) => handleInputChange('firstNameKana', e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <label className="form-label">
                          氏名（漢字） <span className="required">●</span>
                        </label>
                        <div className="name-input-group">
                          <input
                            type="text"
                            placeholder="姓"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="form-input"
                          />
                          <input
                            type="text"
                            placeholder="名"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <label className="form-label">
                          電話番号 <span className="required">●</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="090-0000-0000"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className="form-input"
                        />
                      </div>

                      <div className="form-row">
                        <label className="form-label">メールアドレス</label>
                        <input
                          type="email"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="form-input"
                        />
                      </div>

                      <div className="form-row">
                        <label className="form-label">お客様番号</label>
                        <input
                          type="text"
                          value={formData.customerId || '（新規顧客）'}
                          disabled
                          className="form-input form-input--disabled"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 備考セクション */}
                  <div className="booking-section">
                    <div className="section-header">
                      <Mail size={18} />
                      備考
                    </div>
                    <div className="section-content">
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="form-textarea"
                        rows="5"
                        placeholder="特記事項があれば入力してください"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* 予定モード：簡略情報セクション */
                <div className="booking-section">
                  <div className="section-header">
                    <CalendarPlus size={18} />
                    予定の詳細
                  </div>
                  <div className="section-content">
                    <div className="schedule-info-box">
                      <div className="schedule-info-item">
                        <span className="schedule-info-label">スタッフ:</span>
                        <span className="schedule-info-value">
                          {staff.find(s => s.staff_id === formData.staffId)?.name || '未選択'}
                        </span>
                      </div>
                      <div className="schedule-info-item">
                        <span className="schedule-info-label">日付:</span>
                        <span className="schedule-info-value">{formData.date || '未選択'}</span>
                      </div>
                      <div className="schedule-info-item">
                        <span className="schedule-info-label">時間:</span>
                        <span className="schedule-info-value">
                          {formData.startTime} 〜 {formData.endTime || '未設定'}
                        </span>
                      </div>
                      <div className="schedule-info-item">
                        <span className="schedule-info-label">予定内容:</span>
                        <span className="schedule-info-value">
                          {formData.scheduleTitle || '未入力'}
                        </span>
                      </div>
                    </div>

                    <div className="schedule-note">
                      <AlertCircle size={16} />
                      <span>この時間帯は予約を受け付けません</span>
                    </div>

                    <div className="form-row">
                      <label className="form-label">メモ</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="form-textarea"
                        rows="4"
                        placeholder="詳細情報があれば入力してください"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="booking-actions-section">
                <button
                  onClick={onClose}
                  className="action-btn action-btn--cancel"
                  disabled={isLoading}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  className="action-btn action-btn--primary"
                  disabled={isLoading}
                >
                  {isLoading ? '登録中...' : formData.bookingType === 'booking' ? '予約を登録' : '予定を登録'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BookingModal;