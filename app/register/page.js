"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Users, Package, Calculator as CalcIcon, Check, AlertCircle, Sparkles, X, UserPlus, Ticket } from 'lucide-react';
import './register.css';

const RegisterPage = () => {
  // 顧客選択
  const [customerTab, setCustomerTab] = useState('today');
  const [todayBookings, setTodayBookings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // 新規顧客登録フォーム
  const [newCustomer, setNewCustomer] = useState({
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    phoneNumber: '',
    email: ''
  });

  // 施術・メニュー
  const [menuTab, setMenuTab] = useState('normal');
  const [services, setServices] = useState([]);
  const [ownedTickets, setOwnedTickets] = useState([]); // 保有回数券
  const [availableTicketPlans, setAvailableTicketPlans] = useState([]); // 購入可能な回数券プラン
  const [coupons, setCoupons] = useState([]);
  const [limitedOffers, setLimitedOffers] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedMenuType, setSelectedMenuType] = useState('normal');

  // 回数券購入モーダル
  const [showTicketPurchaseModal, setShowTicketPurchaseModal] = useState(false);
  const [selectedTicketPlan, setSelectedTicketPlan] = useState(null);
  const [ticketPaymentMethod, setTicketPaymentMethod] = useState('cash');
  const [ticketCashAmount, setTicketCashAmount] = useState('');
  const [ticketCardAmount, setTicketCardAmount] = useState('');

  // オプション
  const [options, setOptions] = useState([]);
  const [selectedFreeOptions, setSelectedFreeOptions] = useState([]);
  const [selectedPaidOptions, setSelectedPaidOptions] = useState([]);

  // 支払い
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');

  // 電卓
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState(null);
  const [calcOperator, setCalcOperator] = useState(null);

  // UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 初期データ読み込み
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [todayRes, servicesRes, optionsRes, ticketPlansRes, couponsRes, limitedOffersRes] = await Promise.all([
        fetch('/api/customers/today-bookings'),
        fetch('/api/services'),
        fetch('/api/options'),
        fetch('/api/ticket-plans'),
        fetch('/api/coupons'),
        fetch('/api/limited-offers')
      ]);

      const todayData = await todayRes.json();
      const servicesData = await servicesRes.json();
      const optionsData = await optionsRes.json();
      const ticketPlansData = await ticketPlansRes.json();
      const couponsData = await couponsRes.json();
      const limitedOffersData = await limitedOffersRes.json();

      setTodayBookings(todayData.data || []);
      setServices(servicesData.data || []);
      setOptions(optionsData.data || []);
      setAvailableTicketPlans(ticketPlansData.data || []);
      setCoupons(couponsData.data || []);
      setLimitedOffers(limitedOffersData.data || []);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 顧客検索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`/api/customers/search?name=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (err) {
      console.error('検索エラー:', err);
      setError('検索に失敗しました');
    }
  };

  // 予約から顧客選択
  const handleSelectFromBooking = async (booking) => {
    setSelectedCustomer({
      customer_id: booking.customer_id,
      last_name: booking.last_name,
      first_name: booking.first_name
    });

    if (booking.service_id) {
      const service = services.find(s => s.service_id === booking.service_id);
      if (service) {
        setSelectedMenu(service);
        setSelectedMenuType('normal');
      }
    }

    await fetchCustomerTickets(booking.customer_id);
  };

  // 検索結果から顧客選択
  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerTickets(customer.customer_id);
  };

  // 顧客の回数券を取得
  const fetchCustomerTickets = async (customerId) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/tickets`);
      const data = await response.json();
      if (data.success) {
        const activeTickets = (data.data || []).filter(t => t.status === 'active').map(ticket => {
          const service = services.find(s => s.name === ticket.service_name);
          return {
            ...ticket,
            service_free_option_choices: service?.free_option_choices || 0
          };
        });
        setOwnedTickets(activeTickets);
      }
    } catch (err) {
      console.error('回数券取得エラー:', err);
    }
  };

  // 新規顧客登録
  const handleNewCustomerSubmit = async () => {
    if (!newCustomer.lastName || !newCustomer.firstName || !newCustomer.phoneNumber) {
      setError('姓名と電話番号は必須です');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_name: newCustomer.lastName,
          first_name: newCustomer.firstName,
          last_name_kana: newCustomer.lastNameKana,
          first_name_kana: newCustomer.firstNameKana,
          phone_number: newCustomer.phoneNumber,
          email: newCustomer.email
        })
      });

      const result = await response.json();
      if (result.success) {
        setSelectedCustomer({
          customer_id: result.data.customer_id,
          last_name: newCustomer.lastName,
          first_name: newCustomer.firstName
        });
        setShowNewCustomerModal(false);
        setNewCustomer({
          lastName: '',
          firstName: '',
          lastNameKana: '',
          firstNameKana: '',
          phoneNumber: '',
          email: ''
        });
        setSuccess('新規顧客を登録しました');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('顧客登録エラー:', err);
      setError('顧客登録に失敗しました');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 回数券購入モーダルを開く
  const handleOpenTicketPurchase = (plan) => {
    if (!selectedCustomer) {
      setError('お客様を先に選択してください');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSelectedTicketPlan(plan);
    setTicketPaymentMethod('cash');
    setTicketCashAmount('');
    setTicketCardAmount('');
    setShowTicketPurchaseModal(true);
  };

  // 回数券購入処理
  const handlePurchaseTicket = async () => {
    if (!selectedCustomer) {
      setError('お客様を選択してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!selectedTicketPlan) {
      setError('回数券プランを選択してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const purchaseResponse = await fetch('/api/ticket-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.customer_id,
          plan_id: selectedTicketPlan.plan_id,
          payment_method: ticketPaymentMethod,
          cash_amount: ticketPaymentMethod === 'mixed' ? parseInt(ticketCashAmount) || 0 : (ticketPaymentMethod === 'cash' ? selectedTicketPlan.price : 0),
          card_amount: ticketPaymentMethod === 'mixed' ? parseInt(ticketCardAmount) || 0 : (ticketPaymentMethod === 'card' ? selectedTicketPlan.price : 0)
        })
      });

      const result = await purchaseResponse.json();
      
      if (result.success) {
        setSuccess('回数券を購入しました！');
        setShowTicketPurchaseModal(false);
        setSelectedTicketPlan(null);
        
        await fetchCustomerTickets(selectedCustomer.customer_id);
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('回数券購入エラー:', err);
      setError(err.message || '回数券購入に失敗しました');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // メニュー選択
  const handleSelectMenu = (menu, type) => {
    setSelectedMenu(menu);
    setSelectedMenuType(type);
    setSelectedFreeOptions([]);
    setSelectedPaidOptions([]);
  };

  // オプション選択（自由選択）
  const handleToggleFreeOption = (optionId) => {
    let maxFree = 0;
    if (selectedMenuType === 'normal' && selectedMenu?.free_option_choices) {
      maxFree = selectedMenu.free_option_choices;
    } else if (selectedMenuType === 'ticket' && selectedMenu?.service_free_option_choices) {
      maxFree = selectedMenu.service_free_option_choices;
    } else if (selectedMenuType === 'coupon' && selectedMenu?.free_option_count) {
      maxFree = selectedMenu.free_option_count;
    }
    
    if (selectedFreeOptions.includes(optionId)) {
      setSelectedFreeOptions(prev => prev.filter(id => id !== optionId));
    } else {
      if (selectedFreeOptions.length < maxFree) {
        setSelectedFreeOptions(prev => [...prev, optionId]);
      } else {
        setError(`自由選択オプションは${maxFree}個までです`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // オプション選択（追加）
  const handleTogglePaidOption = (optionId) => {
    if (selectedPaidOptions.includes(optionId)) {
      setSelectedPaidOptions(prev => prev.filter(id => id !== optionId));
    } else {
      setSelectedPaidOptions(prev => [...prev, optionId]);
    }
  };

  // 合計金額計算
  const calculateTotal = () => {
    let total = 0;

    if (selectedMenu) {
      if (selectedMenuType === 'normal') {
        total += selectedMenu.price || 0;
      } else if (selectedMenuType === 'ticket') {
        total = 0;
      } else if (selectedMenuType === 'coupon') {
        total += selectedMenu.total_price || 0;
      } else if (selectedMenuType === 'limited') {
        total = 0;
      }
    }

    selectedPaidOptions.forEach(optionId => {
      const option = options.find(o => o.option_id === optionId);
      if (option) {
        total += option.price;
      }
    });

    return total;
  };

  // 電卓機能
  const handleCalcInput = (value) => {
    if (value === 'C') {
      setCalcDisplay('0');
      setCalcMemory(null);
      setCalcOperator(null);
    } else if (value === '=') {
      if (calcMemory !== null && calcOperator) {
        const current = parseFloat(calcDisplay);
        let result = 0;
        switch (calcOperator) {
          case '+': result = calcMemory + current; break;
          case '-': result = calcMemory - current; break;
          case '×': result = calcMemory * current; break;
          case '÷': result = calcMemory / current; break;
        }
        setCalcDisplay(result.toString());
        setCalcMemory(null);
        setCalcOperator(null);
      }
    } else if (['+', '-', '×', '÷'].includes(value)) {
      setCalcMemory(parseFloat(calcDisplay));
      setCalcOperator(value);
      setCalcDisplay('0');
    } else {
      setCalcDisplay(prev => prev === '0' ? value : prev + value);
    }
  };

  // お会計処理
  const handleCheckout = async () => {
    if (!selectedCustomer) {
      setError('お客様を選択してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!selectedMenu) {
      setError('施術メニューを選択してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const paymentData = {
        customer_id: selectedCustomer.customer_id,
        staff_id: '550e8400-e29b-41d4-a716-446655440001',
        service_id: selectedMenu.service_id || null,
        payment_type: selectedMenuType,
        ticket_id: selectedMenuType === 'ticket' ? selectedMenu.customer_ticket_id : null,
        coupon_id: selectedMenuType === 'coupon' ? selectedMenu.coupon_id : null,
        limited_offer_id: selectedMenuType === 'limited' ? selectedMenu.offer_id : null,
        options: [
          ...selectedPaidOptions.map(id => ({ option_id: id, is_free: false })),
          ...selectedFreeOptions.map(id => ({ option_id: id, is_free: true }))
        ],
        discount_amount: 0,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === 'mixed' ? parseInt(cashAmount) || 0 : (paymentMethod === 'cash' ? calculateTotal() : 0),
        card_amount: paymentMethod === 'mixed' ? parseInt(cardAmount) || 0 : (paymentMethod === 'card' ? calculateTotal() : 0)
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('お会計が完了しました！');
        setTimeout(() => {
          setSuccess('');
          setSelectedCustomer(null);
          setSelectedMenu(null);
          setSelectedFreeOptions([]);
          setSelectedPaidOptions([]);
          setPaymentMethod('cash');
          setCashAmount('');
          setCardAmount('');
          setOwnedTickets([]);
          fetchInitialData();
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('お会計エラー:', err);
      setError(err.message || 'お会計処理に失敗しました');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const total = calculateTotal();
  
  let maxFreeOptions = 0;
  if (selectedMenuType === 'normal' && selectedMenu?.free_option_choices) {
    maxFreeOptions = selectedMenu.free_option_choices;
  } else if (selectedMenuType === 'ticket' && selectedMenu?.service_free_option_choices) {
    maxFreeOptions = selectedMenu.service_free_option_choices;
  } else if (selectedMenuType === 'coupon' && selectedMenu?.free_option_count) {
    maxFreeOptions = selectedMenu.free_option_count;
  }

  return (
    <div className="register-page">
      {/* ヘッダー */}
      <header className="register-page__header">
        <div className="register-page__header-container">
          <Link href="/" className="register-page__back-link">
            <ArrowLeft size={20} />
            <span>ダッシュボードに戻る</span>
          </Link>
          <div className="register-page__header-title">
            <CreditCard size={24} />
            <h1>ABBY レジ・お会計</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="register-page__main">
        {error && (
          <div className="alert alert--error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert--success">
            <Check size={20} />
            {success}
          </div>
        )}

        <div className="register-page__grid">
          {/* 左側: 顧客・メニュー選択 */}
          <div className="register-page__left">
            {/* 顧客選択 */}
            <div className="register-section">
              <div className="register-section__header">
                <Users size={18} />
                <h3 className="register-section__title">お客様選択</h3>
                <button className="new-customer-btn" onClick={() => setShowNewCustomerModal(true)}>
                  <UserPlus size={16} />
                  新規登録
                </button>
              </div>
              <div className="register-section__content">
                <div className="register-tabs">
                  <button
                    className={`register-tab ${customerTab === 'today' ? 'register-tab--active' : ''}`}
                    onClick={() => setCustomerTab('today')}
                  >
                    今日の予約者
                  </button>
                  <button
                    className={`register-tab ${customerTab === 'search' ? 'register-tab--active' : ''}`}
                    onClick={() => setCustomerTab('search')}
                  >
                    顧客検索
                  </button>
                </div>

                {customerTab === 'today' ? (
                  <div className="customer-quick-list">
                    {todayBookings.map(booking => (
                      <div
                        key={booking.booking_id}
                        className={`customer-item ${selectedCustomer?.customer_id === booking.customer_id ? 'customer-item--selected' : ''}`}
                        onClick={() => handleSelectFromBooking(booking)}
                      >
                        <div className="customer-item__name">
                          {booking.last_name} {booking.first_name} 様
                        </div>
                        <div className="customer-item__info">
                          {booking.start_time?.substring(0, 5)} - {booking.service_name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="search-box">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="名前または電話番号で検索"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <button className="search-btn" onClick={handleSearch}>
                        検索
                      </button>
                    </div>
                    <div className="customer-quick-list">
                      {searchResults.map(customer => (
                        <div
                          key={customer.customer_id}
                          className={`customer-item ${selectedCustomer?.customer_id === customer.customer_id ? 'customer-item--selected' : ''}`}
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="customer-item__name">
                            {customer.last_name} {customer.first_name} 様
                          </div>
                          <div className="customer-item__info">
                            {customer.phone_number}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* メニュー・施術選択 */}
            <div className="register-section">
              <div className="register-section__header">
                <Package size={18} />
                <h3 className="register-section__title">メニュー選択</h3>
              </div>
              <div className="register-section__content">
                <div className="register-tabs">
                  <button
                    className={`register-tab ${menuTab === 'normal' ? 'register-tab--active' : ''}`}
                    onClick={() => setMenuTab('normal')}
                  >
                    通常メニュー
                  </button>
                  <button
                    className={`register-tab ${menuTab === 'ticket-use' ? 'register-tab--active' : ''}`}
                    onClick={() => setMenuTab('ticket-use')}
                  >
                    回数券使用
                  </button>
                  <button
                    className={`register-tab ${menuTab === 'ticket-buy' ? 'register-tab--active' : ''}`}
                    onClick={() => setMenuTab('ticket-buy')}
                  >
                    回数券購入
                  </button>
                  <button
                    className={`register-tab ${menuTab === 'coupon' ? 'register-tab--active' : ''}`}
                    onClick={() => setMenuTab('coupon')}
                  >
                    クーポン
                  </button>
                  <button
                    className={`register-tab ${menuTab === 'limited' ? 'register-tab--active' : ''}`}
                    onClick={() => setMenuTab('limited')}
                  >
                    期間限定
                  </button>
                </div>

                <div className="menu-grid">
                  {menuTab === 'normal' && services.map(service => (
                    <div
                      key={service.service_id}
                      className={`menu-card ${selectedMenu?.service_id === service.service_id && selectedMenuType === 'normal' ? 'menu-card--selected' : ''}`}
                      onClick={() => handleSelectMenu(service, 'normal')}
                    >
                      <div className="menu-card__name">{service.name}</div>
                      <div className="menu-card__time">{service.duration_minutes}分</div>
                      <div className="menu-card__price">¥{service.price?.toLocaleString()}</div>
                      {service.free_option_choices > 0 && (
                        <div className="menu-card__badge">オプション{service.free_option_choices}個無料</div>
                      )}
                    </div>
                  ))}

                  {menuTab === 'ticket-use' && !selectedCustomer && (
                    <div className="empty-message">
                      お客様を選択してください
                    </div>
                  )}

                  {menuTab === 'ticket-use' && selectedCustomer && ownedTickets.length === 0 && (
                    <div className="empty-message">
                      有効な回数券がありません
                    </div>
                  )}

                  {menuTab === 'ticket-use' && ownedTickets.map(ticket => (
                    <div
                      key={ticket.customer_ticket_id}
                      className={`menu-card ${selectedMenu?.customer_ticket_id === ticket.customer_ticket_id && selectedMenuType === 'ticket' ? 'menu-card--selected' : ''}`}
                      onClick={() => handleSelectMenu(ticket, 'ticket')}
                    >
                      <div className="menu-card__name">{ticket.plan_name}</div>
                      <div className="menu-card__info">残り{ticket.sessions_remaining}回</div>
                      <div className="menu-card__price">¥0（回数券使用）</div>
                    </div>
                  ))}

                  {menuTab === 'ticket-buy' && (() => {
                    // カテゴリーごとにグループ化
                    const groupedPlans = {};
                    availableTicketPlans.forEach(plan => {
                      const category = plan.service_category || 'その他';
                      if (!groupedPlans[category]) {
                        groupedPlans[category] = [];
                      }
                      groupedPlans[category].push(plan);
                    });

                    return Object.entries(groupedPlans).map(([category, plans]) => (
                      <div key={category} className="ticket-category-section">
                        <h5 className="ticket-category-title">{category}</h5>
                        <div className="menu-grid">
                          {plans.map(plan => (
                            <div
                              key={plan.plan_id}
                              className="menu-card menu-card--purchase"
                              onClick={() => handleOpenTicketPurchase(plan)}
                            >
                              <div className="menu-card__name">{plan.name}</div>
                              <div className="menu-card__info">{plan.service_name} × {plan.total_sessions}回</div>
                              <div className="menu-card__price">¥{plan.price?.toLocaleString()}</div>
                              <div className="menu-card__badge">
                                <Ticket size={14} />
                                購入
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}

                  {menuTab === 'coupon' && coupons.map(coupon => (
                    <div
                      key={coupon.coupon_id}
                      className={`menu-card ${selectedMenu?.coupon_id === coupon.coupon_id && selectedMenuType === 'coupon' ? 'menu-card--selected' : ''}`}
                      onClick={() => handleSelectMenu(coupon, 'coupon')}
                    >
                      <div className="menu-card__name">{coupon.name}</div>
                      <div className="menu-card__info">{coupon.description}</div>
                      <div className="menu-card__price">¥{coupon.total_price?.toLocaleString()}</div>
                    </div>
                  ))}

                  {menuTab === 'limited' && limitedOffers.map(offer => (
                    <div
                      key={offer.offer_id}
                      className={`menu-card ${selectedMenu?.offer_id === offer.offer_id && selectedMenuType === 'limited' ? 'menu-card--selected' : ''}`}
                      onClick={() => handleSelectMenu(offer, 'limited')}
                    >
                      <div className="menu-card__name">{offer.name}</div>
                      <div className="menu-card__info">
                        期限: {new Date(offer.sale_end_date).toLocaleDateString()}
                      </div>
                      <div className="menu-card__price">¥{offer.special_price?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* オプション選択 */}
            {selectedMenu && menuTab !== 'ticket-buy' && (
              <div className="register-section">
                <div className="register-section__header">
                  <Sparkles size={18} />
                  <h3 className="register-section__title">オプション選択</h3>
                </div>
                <div className="register-section__content">
                  {maxFreeOptions > 0 && (
                    <>
                      <div className="option-section-label">
                        自由選択オプション（{selectedFreeOptions.length}/{maxFreeOptions}個まで無料）
                      </div>
                      
                      {/* カテゴリごとに表示 */}
                      {['フェイシャル', 'ボディ', 'その他'].map(category => {
                        const categoryOptions = options.filter(opt => opt.is_active && opt.category === category);
                        if (categoryOptions.length === 0) return null;
                        
                        return (
                          <div key={category} className="option-category-section">
                            <h5 className="option-category-title">{category}</h5>
                            <div className="option-grid">
                              {categoryOptions.map(option => (
                                <div
                                  key={option.option_id}
                                  className={`option-card ${selectedFreeOptions.includes(option.option_id) ? 'option-card--selected' : ''}`}
                                  onClick={() => handleToggleFreeOption(option.option_id)}
                                >
                                  <div className="option-card__name">{option.name}</div>
                                  <div className="option-card__time">+{option.duration_minutes}分</div>
                                  <div className="option-card__price option-card__price--free">無料</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  <div className="option-section-label">追加オプション（有料）</div>
                  
                  {/* カテゴリごとに表示 */}
                  {['フェイシャル', 'ボディ', 'その他'].map(category => {
                    const categoryOptions = options.filter(opt => opt.is_active && opt.category === category);
                    if (categoryOptions.length === 0) return null;
                    
                    return (
                      <div key={category} className="option-category-section">
                        <h5 className="option-category-title">{category}</h5>
                        <div className="option-grid">
                          {categoryOptions.map(option => (
                            <div
                              key={option.option_id}
                              className={`option-card ${selectedPaidOptions.includes(option.option_id) ? 'option-card--selected' : ''}`}
                              onClick={() => handleTogglePaidOption(option.option_id)}
                            >
                              <div className="option-card__name">{option.name}</div>
                              <div className="option-card__time">+{option.duration_minutes}分</div>
                              <div className="option-card__price">+¥{option.price?.toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 右側: 支払い・電卓 */}
          <div className="register-page__right">
            {/* お会計明細 */}
            <div className="register-section">
              <div className="register-section__header">
                <CreditCard size={18} />
                <h3 className="register-section__title">お会計明細</h3>
              </div>
              <div className="register-section__content">
                {selectedCustomer && (
                  <div className="customer-info-box">
                    <div className="customer-info-box__name">
                      {selectedCustomer.last_name} {selectedCustomer.first_name} 様
                    </div>
                  </div>
                )}

                {selectedMenu && menuTab !== 'ticket-buy' && (
                  <div className="payment-summary">
                    <div className="payment-summary__item">
                      <span>メニュー</span>
                      <span>{selectedMenu.name || selectedMenu.plan_name}</span>
                    </div>
                    <div className="payment-summary__item payment-summary__item--sub">
                      <span>料金</span>
                      <span>¥{selectedMenuType === 'ticket' ? 0 : (selectedMenu.price || selectedMenu.total_price || 0).toLocaleString()}</span>
                    </div>

                    {selectedFreeOptions.length > 0 && (
                      <>
                        <div className="payment-summary__divider"></div>
                        <div className="payment-summary__item">
                          <span>自由選択オプション</span>
                          <span></span>
                        </div>
                        {selectedFreeOptions.map(optionId => {
                          const option = options.find(o => o.option_id === optionId);
                          return option ? (
                            <div key={optionId} className="payment-summary__item payment-summary__item--sub">
                              <span>　{option.name}</span>
                              <span>¥0</span>
                            </div>
                          ) : null;
                        })}
                      </>
                    )}

                    {selectedPaidOptions.length > 0 && (
                      <>
                        <div className="payment-summary__divider"></div>
                        <div className="payment-summary__item">
                          <span>追加オプション</span>
                          <span></span>
                        </div>
                        {selectedPaidOptions.map(optionId => {
                          const option = options.find(o => o.option_id === optionId);
                          return option ? (
                            <div key={optionId} className="payment-summary__item payment-summary__item--sub">
                              <span>　{option.name}</span>
                              <span>¥{option.price?.toLocaleString()}</span>
                            </div>
                          ) : null;
                        })}
                      </>
                    )}

                    <div className="payment-summary__total">
                      <span>合計金額</span>
                      <span>¥{total.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 支払い方法 */}
            {menuTab !== 'ticket-buy' && (
              <div className="register-section">
                <div className="register-section__header">
                  <CreditCard size={18} />
                  <h3 className="register-section__title">支払い方法</h3>
                </div>
                <div className="register-section__content">
                  <div className="payment-method-tabs">
                    <button
                      className={`payment-tab ${paymentMethod === 'cash' ? 'payment-tab--active' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      現金
                    </button>
                    <button
                      className={`payment-tab ${paymentMethod === 'card' ? 'payment-tab--active' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      カード
                    </button>
                    <button
                      className={`payment-tab ${paymentMethod === 'mixed' ? 'payment-tab--active' : ''}`}
                      onClick={() => setPaymentMethod('mixed')}
                    >
                      混合
                    </button>
                  </div>

                  {paymentMethod === 'mixed' && (
                    <div className="mixed-payment-inputs">
                      <div className="form-group">
                        <label>現金</label>
                        <input
                          type="number"
                          className="form-input"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="form-group">
                        <label>カード</label>
                        <input
                          type="number"
                          className="form-input"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 電卓 */}
            <div className="register-section">
              <div className="register-section__header">
                <CalcIcon size={18} />
                <h3 className="register-section__title">電卓</h3>
              </div>
              <div className="register-section__content">
                <div className="calculator">
                  <div className="calculator__display">{calcDisplay}</div>
                  <div className="calculator__buttons">
                    {['7', '8', '9', '÷'].map(btn => (
                      <button key={btn} className="calculator__btn" onClick={() => handleCalcInput(btn)}>
                        {btn}
                      </button>
                    ))}
                    {['4', '5', '6', '×'].map(btn => (
                      <button key={btn} className="calculator__btn" onClick={() => handleCalcInput(btn)}>
                        {btn}
                      </button>
                    ))}
                    {['1', '2', '3', '-'].map(btn => (
                      <button key={btn} className="calculator__btn" onClick={() => handleCalcInput(btn)}>
                        {btn}
                      </button>
                    ))}
                    {['0', '.', '=', '+'].map(btn => (
                      <button key={btn} className="calculator__btn" onClick={() => handleCalcInput(btn)}>
                        {btn}
                      </button>
                    ))}
                    <button className="calculator__btn calculator__btn--clear" onClick={() => handleCalcInput('C')}>
                      C
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* お会計ボタン */}
            {menuTab !== 'ticket-buy' && (
              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={!selectedCustomer || !selectedMenu || isLoading}
              >
                {isLoading ? '処理中...' : 'お会計を完了する'}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 新規顧客登録モーダル */}
      {showNewCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowNewCustomerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新規顧客登録</h3>
              <button className="modal-close" onClick={() => setShowNewCustomerModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>姓（カナ）<span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="タナカ"
                  value={newCustomer.lastNameKana}
                  onChange={(e) => setNewCustomer({...newCustomer, lastNameKana: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>名（カナ）<span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ハナコ"
                  value={newCustomer.firstNameKana}
                  onChange={(e) => setNewCustomer({...newCustomer, firstNameKana: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>姓<span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="田中"
                  value={newCustomer.lastName}
                  onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>名<span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="花子"
                  value={newCustomer.firstName}
                  onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>電話番号<span className="required">*</span></label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="090-0000-0000"
                  value={newCustomer.phoneNumber}
                  onChange={(e) => setNewCustomer({...newCustomer, phoneNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>メールアドレス</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="example@email.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn--cancel" onClick={() => setShowNewCustomerModal(false)}>
                キャンセル
              </button>
              <button className="modal-btn modal-btn--primary" onClick={handleNewCustomerSubmit}>
                登録する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回数券購入モーダル */}
      {showTicketPurchaseModal && selectedTicketPlan && (
        <div className="modal-overlay" onClick={() => setShowTicketPurchaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>回数券購入</h3>
              <button className="modal-close" onClick={() => setShowTicketPurchaseModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="ticket-purchase-info">
                <div className="ticket-purchase-info__item">
                  <span>お客様</span>
                  <span>{selectedCustomer?.last_name} {selectedCustomer?.first_name} 様</span>
                </div>
                <div className="ticket-purchase-info__item">
                  <span>回数券</span>
                  <span>{selectedTicketPlan.name}</span>
                </div>
                <div className="ticket-purchase-info__item">
                  <span>施術</span>
                  <span>{selectedTicketPlan.service_name}</span>
                </div>
                <div className="ticket-purchase-info__item">
                  <span>回数</span>
                  <span>{selectedTicketPlan.total_sessions}回</span>
                </div>
                <div className="ticket-purchase-info__item">
                  <span>有効期限</span>
                  <span>{selectedTicketPlan.validity_days}日間</span>
                </div>
                <div className="ticket-purchase-info__total">
                  <span>販売価格</span>
                  <span>¥{selectedTicketPlan.price?.toLocaleString()}</span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>支払い方法</label>
                <div className="payment-method-tabs">
                  <button
                    className={`payment-tab ${ticketPaymentMethod === 'cash' ? 'payment-tab--active' : ''}`}
                    onClick={() => setTicketPaymentMethod('cash')}
                  >
                    現金
                  </button>
                  <button
                    className={`payment-tab ${ticketPaymentMethod === 'card' ? 'payment-tab--active' : ''}`}
                    onClick={() => setTicketPaymentMethod('card')}
                  >
                    カード
                  </button>
                  <button
                    className={`payment-tab ${ticketPaymentMethod === 'mixed' ? 'payment-tab--active' : ''}`}
                    onClick={() => setTicketPaymentMethod('mixed')}
                  >
                    混合
                  </button>
                </div>
              </div>

              {ticketPaymentMethod === 'mixed' && (
                <div className="mixed-payment-inputs">
                  <div className="form-group">
                    <label>現金</label>
                    <input
                      type="number"
                      className="form-input"
                      value={ticketCashAmount}
                      onChange={(e) => setTicketCashAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>カード</label>
                    <input
                      type="number"
                      className="form-input"
                      value={ticketCardAmount}
                      onChange={(e) => setTicketCardAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn--cancel" onClick={() => setShowTicketPurchaseModal(false)}>
                キャンセル
              </button>
              <button 
                className="modal-btn modal-btn--primary" 
                onClick={handlePurchaseTicket}
                disabled={isLoading}
              >
                {isLoading ? '処理中...' : '購入する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;