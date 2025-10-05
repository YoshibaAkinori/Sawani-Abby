"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Check, Sparkles, Tag, Clock, Package, Users } from 'lucide-react';
import './ServicesManagement.css';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [options, setOptions] = useState([]); // オプション一覧
  const [ticketPlans, setTicketPlans] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [limitedOffers, setLimitedOffers] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showLimitedForm, setShowLimitedForm] = useState(false);
  // 状態に編集用のIDと編集中のフォームを追加
  const [editingTicketId, setEditingTicketId] = useState(null);

  // サービスフォームデータ（自由選択オプション追加）
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: '',
    first_time_price: '',
    has_first_time_discount: false,
    free_option_choices: 0, // 自由選択オプション数
    category: 'フェイシャル',
    is_active: true
  });

  // 回数券フォームデータ
  const [ticketForm, setTicketForm] = useState({
    service_id: '',
    name: '',
    service_category: '新規', // ← 追加
    gender_restriction: 'all',
    total_sessions: 5,
    price: '',
    validity_days: 180
  });

  // クーポンフォームデータ（改良版）
  const [couponForm, setCouponForm] = useState({
    name: '',
    description: '',
    base_service_id: '',
    included_options: [], // [{ option_id, quantity }]
    free_option_count: 0,
    total_price: '',
    validity_days: 180,
    usage_limit: '',
    is_active: true
  });

  // 期間限定フォームデータ（簡略化）
  const [limitedForm, setLimitedForm] = useState({
    name: '',
    description: '',
    service_name: '',
    total_sessions: 5,
    special_price: '', // 販売価格のみ
    validity_days: 180,
    sale_end_date: '',
    max_sales: '',
    is_active: true
  });

  // カテゴリオプション
  const categories = ['フェイシャル', 'ボディトリート', 'その他'];

  // 初期データ読み込み
  useEffect(() => {
    fetchServices();
    fetchOptions(); // オプション一覧を取得
    fetchTicketPlans();
    fetchCoupons();
    fetchLimitedOffers();
  }, []);

  // オプション一覧取得
  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/options');
      if (response.ok) {
        const data = await response.json();
        setOptions(data.data || []);
      }
    } catch (err) {
      console.error('オプション取得エラー:', err);
      setOptions([]);
    }
  };

  // サービス一覧取得
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      }
    } catch (err) {
      console.error('サービス取得エラー:', err);
    }
  };

  // 回数券プラン取得
  const fetchTicketPlans = async () => {
    try {
      const response = await fetch('/api/ticket-plans');
      if (response.ok) {
        const data = await response.json();
        setTicketPlans(data.data || []);
      }
    } catch (err) {
      console.error('回数券プラン取得エラー:', err);
    }
  };

  // クーポン取得
  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.data || []);
      }
    } catch (err) {
      console.error('クーポン取得エラー:', err);
      setCoupons([]);
    }
  };

  // 期間限定オファー取得
  const fetchLimitedOffers = async () => {
    try {
      const response = await fetch('/api/limited-offers');
      if (response.ok) {
        const data = await response.json();
        setLimitedOffers(data.data || []);
      }
    } catch (err) {
      console.error('期間限定オファー取得エラー:', err);
      setLimitedOffers([]);
    }
  };

  // サービスフォーム入力処理
  const handleServiceInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServiceForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 回数券フォーム入力処理
  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'service_id') {
      const selectedService = services.find(s => s.service_id === value);
      if (selectedService) {
        const genderText = ticketForm.gender_restriction === 'male' ? '男性' :
          ticketForm.gender_restriction === 'female' ? '女性' : '';
        setTicketForm(prev => ({
          ...prev,
          service_id: value,
          // service_categoryはそのまま保持(ユーザーが選択した値を維持)
          name: `${selectedService.name}${prev.total_sessions}回券${genderText ? `(${genderText})` : ''}`
        }));
      }
    } else if (name === 'total_sessions' || name === 'gender_restriction') {
      const selectedService = services.find(s => s.service_id === ticketForm.service_id);
      const genderText = name === 'gender_restriction' ?
        (value === 'male' ? '男性' : value === 'female' ? '女性' : '') :
        (ticketForm.gender_restriction === 'male' ? '男性' : ticketForm.gender_restriction === 'female' ? '女性' : '');
      const sessions = name === 'total_sessions' ? value : ticketForm.total_sessions;

      setTicketForm(prev => ({
        ...prev,
        [name]: value,
        name: selectedService ? `${selectedService.name}${sessions}回券${genderText ? `(${genderText})` : ''}` : prev.name
      }));
    } else {
      // service_categoryを含む他のフィールドはそのまま更新
      setTicketForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // クーポンフォーム入力処理（改良版）
  const handleCouponInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCouponForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 指定オプション追加
  const addIncludedOption = (optionId) => {
    const option = options.find(o => o.option_id === optionId);
    if (!option) return;

    setCouponForm(prev => {
      const existing = prev.included_options.find(o => o.option_id === optionId);
      if (existing) {
        // 数量を増やす
        return {
          ...prev,
          included_options: prev.included_options.map(o =>
            o.option_id === optionId ? { ...o, quantity: o.quantity + 1 } : o
          )
        };
      } else {
        // 新規追加
        return {
          ...prev,
          included_options: [...prev.included_options, {
            option_id: optionId,
            option_name: option.name,
            quantity: 1
          }]
        };
      }
    });
  };

  // 指定オプション削除
  const removeIncludedOption = (optionId) => {
    setCouponForm(prev => ({
      ...prev,
      included_options: prev.included_options.filter(o => o.option_id !== optionId)
    }));
  };

  // 指定オプション数量変更
  const updateIncludedOptionQuantity = (optionId, quantity) => {
    if (quantity <= 0) {
      removeIncludedOption(optionId);
    } else {
      setCouponForm(prev => ({
        ...prev,
        included_options: prev.included_options.map(o =>
          o.option_id === optionId ? { ...o, quantity } : o
        )
      }));
    }
  };

  // 期間限定フォーム入力処理
  const handleLimitedInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLimitedForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // サービス新規追加
  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.price || !serviceForm.duration_minutes) {
      setError('必須項目を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm)
      });

      if (response.ok) {
        setSuccess('コースを登録しました');
        fetchServices();
        setShowAddForm(false);
        resetServiceForm();
      } else {
        throw new Error('登録に失敗しました');
      }
    } catch (err) {
      // デモモード
      const newService = {
        service_id: Date.now().toString(),
        ...serviceForm,
        price: Number(serviceForm.price),
        first_time_price: serviceForm.has_first_time_discount ? Number(serviceForm.first_time_price) : null
      };
      setServices(prev => [...prev, newService]);
      setSuccess('コースを登録しました（ローカル保存）');
      setShowAddForm(false);
      resetServiceForm();
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // サービス編集開始
  const startEditService = (service) => {
    setEditingId(service.service_id);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      first_time_price: service.first_time_price || '',
      has_first_time_discount: service.has_first_time_discount || false,
      free_option_choices: service.free_option_choices || 0,
      category: service.category,
      is_active: service.is_active
    });
  };

  // サービス更新
  const handleUpdateService = async (serviceId) => {
    if (!serviceForm.name || !serviceForm.price || !serviceForm.duration_minutes) {
      setError('必須項目を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          ...serviceForm
        })
      });

      if (response.ok) {
        setSuccess('更新しました');
        fetchServices();
        setEditingId(null);
      } else {
        throw new Error('更新に失敗しました');
      }
    } catch (err) {
      // デモモード
      setServices(prev => prev.map(s =>
        s.service_id === serviceId
          ? {
            ...s,
            ...serviceForm,
            price: Number(serviceForm.price),
            first_time_price: serviceForm.has_first_time_discount ? Number(serviceForm.first_time_price) : null
          }
          : s
      ));
      setSuccess('更新しました（ローカル保存）');
      setEditingId(null);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // サービス削除
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('このコースを削除してもよろしいですか？')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/services?id=${serviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        fetchServices();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (err) {
      // デモモード
      setServices(prev => prev.filter(s => s.service_id !== serviceId));
      setSuccess('削除しました（ローカル保存）');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // 回数券プラン追加
  const handleAddTicketPlan = async () => {
    if (!ticketForm.service_id || !ticketForm.name || !ticketForm.price) {
      setError('必須項目を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ticket-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm)
      });

      if (response.ok) {
        setSuccess('回数券プランを登録しました');
        fetchTicketPlans();
        setShowTicketForm(false);
        resetTicketForm();
      } else {
        throw new Error('登録に失敗しました');
      }
    } catch (err) {
      // デモモード
      const selectedService = services.find(s => s.service_id === ticketForm.service_id);
      const newPlan = {
        plan_id: Date.now().toString(),
        ...ticketForm,
        service_name: selectedService?.name,
        price: Number(ticketForm.price),
        price_per_session: Math.floor(Number(ticketForm.price) / ticketForm.total_sessions),
        discount_rate: Math.round((1 - (Number(ticketForm.price) / (selectedService?.price * ticketForm.total_sessions))) * 100)
      };
      setTicketPlans(prev => [...prev, newPlan]);
      setSuccess('回数券プランを登録しました（ローカル保存）');
      setShowTicketForm(false);
      resetTicketForm();
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // 回数券編集開始
  const startEditTicketPlan = (plan) => {
    setEditingTicketId(plan.plan_id);
    setTicketForm({
      service_id: plan.service_id,
      name: plan.name,
      service_category: plan.service_category,
      gender_restriction: plan.gender_restriction || 'all',
      total_sessions: plan.total_sessions,
      price: plan.price,
      validity_days: plan.validity_days
    });
  };

  // 回数券更新
  const handleUpdateTicketPlan = async (planId) => {
    if (!ticketForm.service_id || !ticketForm.name || !ticketForm.price) {
      setError('必須項目を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ticket-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          ...ticketForm
        })
      });

      if (response.ok) {
        setSuccess('更新しました');
        fetchTicketPlans();
        setEditingTicketId(null);
        resetTicketForm();
      } else {
        const data = await response.json();
        throw new Error(data.error || '更新に失敗しました');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 3000);
    }
  };

  // 回数券プラン削除
  const handleDeleteTicketPlan = async (planId) => {
    if (!window.confirm('この回数券プランを削除してもよろしいですか？')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ticket-plans?id=${planId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('削除しました');
        fetchTicketPlans();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (err) {
      // デモモード
      setTicketPlans(prev => prev.filter(p => p.plan_id !== planId));
      setSuccess('削除しました（ローカル保存）');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // クーポン追加（改良版）
  const handleAddCoupon = async () => {
    if (!couponForm.name || !couponForm.base_service_id || !couponForm.total_price) {
      setError('必須項目を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm)
      });

      if (response.ok) {
        setSuccess('クーポンを登録しました');
        fetchCoupons();
        setShowCouponForm(false);
        resetCouponForm();
      } else {
        const data = await response.json();
        throw new Error(data.error || '登録に失敗しました');
      }
    } catch (err) {
      // デモモード
      const selectedService = services.find(s => s.service_id === couponForm.base_service_id);
      const newCoupon = {
        coupon_id: Date.now().toString(),
        ...couponForm,
        service_name: selectedService?.name,
        total_price: Number(couponForm.total_price)
      };
      setCoupons(prev => [...prev, newCoupon]);
      setSuccess('クーポンを登録しました（ローカル保存）');
      setShowCouponForm(false);
      resetCouponForm();
    } finally {
      setIsLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 3000);
    }
  };

  // 期間限定オファー追加（簡略化版）
  const handleAddLimitedOffer = async () => {
    if (!limitedForm.name || !limitedForm.service_name || !limitedForm.special_price) {
      setError('必須項目を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/limited-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limitedForm)
      });

      if (response.ok) {
        setSuccess('期間限定オファーを登録しました');
        fetchLimitedOffers();
        setShowLimitedForm(false);
        resetLimitedForm();
      } else {
        const data = await response.json();
        throw new Error(data.error || '登録に失敗しました');
      }
    } catch (err) {
      // デモモード
      const newOffer = {
        offer_id: Date.now().toString(),
        ...limitedForm,
        special_price: Number(limitedForm.special_price),
        price_per_session: Math.floor(Number(limitedForm.special_price) / limitedForm.total_sessions)
      };
      setLimitedOffers(prev => [...prev, newOffer]);
      setSuccess('期間限定オファーを登録しました（ローカル保存）');
      setShowLimitedForm(false);
      resetLimitedForm();
    } finally {
      setIsLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 3000);
    }
  };

  // フォームリセット
  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      duration_minutes: 60,
      price: '',
      first_time_price: '',
      has_first_time_discount: false,
      free_option_choices: 0,
      category: 'フェイシャル',
      is_active: true
    });
  };


  // フォームリセット関数
  const resetTicketForm = () => {
    setTicketForm({
      service_id: '',
      name: '',
      service_category: '新規', // ← 追加
      gender_restriction: 'all',
      total_sessions: 5,
      price: '',
      validity_days: 180
    });
  };

  const resetCouponForm = () => {
    setCouponForm({
      name: '',
      description: '',
      base_service_id: '',
      included_options: [],
      free_option_count: 0,
      total_price: '',
      validity_days: 180,
      usage_limit: '',
      is_active: true
    });
  };

  const resetLimitedForm = () => {
    setLimitedForm({
      name: '',
      description: '',
      service_name: '',
      total_sessions: 5,
      special_price: '',
      validity_days: 180,
      sale_end_date: '',
      max_sales: '',
      is_active: true
    });
  };

  // キャンセル
  const handleCancel = () => {
    setEditingId(null);
    setEditingTicketId(null);
    setShowAddForm(false);
    setShowTicketForm(false);
    setShowCouponForm(false);
    setShowLimitedForm(false);
    resetServiceForm();
    resetTicketForm();
    resetCouponForm();
    resetLimitedForm();
    setError('');
  };

  // 価格の計算ヘルパー
  const calculateDiscountRate = (regularPrice, discountPrice) => {
    if (!regularPrice || !discountPrice) return 0;
    return Math.round((1 - (discountPrice / regularPrice)) * 100);
  };

  return (
    <div className="services-management">
      {/* アラート表示 */}
      {error && (
        <div className="services-alert services-alert--error">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="services-alert services-alert--success">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* タブ切り替え */}
      <div className="services-tabs">
        <button
          className={`services-tab ${activeTab === 'services' ? 'services-tab--active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Sparkles size={16} />
          施術コース
        </button>
        <button
          className={`services-tab ${activeTab === 'tickets' ? 'services-tab--active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <Package size={16} />
          回数券プラン
        </button>
        <button
          className={`services-tab ${activeTab === 'coupons' ? 'services-tab--active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          <Tag size={16} />
          クーポン
        </button>
        <button
          className={`services-tab ${activeTab === 'limited' ? 'services-tab--active' : ''}`}
          onClick={() => setActiveTab('limited')}
        >
          <Clock size={16} />
          期間限定
        </button>
      </div>

      {/* 施術コースタブ */}
      {activeTab === 'services' && (
        <div className="services-content">
          <div className="services-header">
            <h3 className="services-title">施術コース一覧</h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="services-btn services-btn--primary"
                disabled={isLoading}
              >
                <Plus size={16} />
                新規コース追加
              </button>
            )}
          </div>

          {/* 新規追加フォーム */}
          {showAddForm && (
            <div className="services-form-card">
              <h4>新規コース登録</h4>
              <div className="services-form-grid">
                <div className="services-form-group">
                  <label>コース名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={serviceForm.name}
                    onChange={handleServiceInputChange}
                    placeholder="例: フェイシャル60分"
                  />
                </div>

                <div className="services-form-group">
                  <label>カテゴリ *</label>
                  <select
                    name="category"
                    value={serviceForm.category}
                    onChange={handleServiceInputChange}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="services-form-group">
                  <label>施術時間（分） *</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={serviceForm.duration_minutes}
                    onChange={handleServiceInputChange}
                    min="15"
                    step="15"
                  />
                </div>

                <div className="services-form-group">
                  <label>通常料金（円） *</label>
                  <input
                    type="number"
                    name="price"
                    value={serviceForm.price}
                    onChange={handleServiceInputChange}
                    placeholder="8000"
                  />
                </div>

                <div className="services-form-group">
                  <label>自由選択オプション数</label>
                  <select
                    name="free_option_choices"
                    value={serviceForm.free_option_choices}
                    onChange={handleServiceInputChange}
                  >
                    <option value="0">なし</option>
                    <option value="1">1つ選択可</option>
                    <option value="2">2つ選択可</option>
                    <option value="3">3つ選択可</option>
                  </select>
                </div>

                <div className="services-form-group services-form-group--full">
                  <label className="services-checkbox-label">
                    <input
                      type="checkbox"
                      name="has_first_time_discount"
                      checked={serviceForm.has_first_time_discount}
                      onChange={handleServiceInputChange}
                    />
                    初回割引あり
                  </label>
                </div>

                {serviceForm.has_first_time_discount && (
                  <div className="services-form-group">
                    <label>初回料金（円）</label>
                    <input
                      type="number"
                      name="first_time_price"
                      value={serviceForm.first_time_price}
                      onChange={handleServiceInputChange}
                      placeholder="5000"
                    />
                    {serviceForm.price && serviceForm.first_time_price && (
                      <span className="services-discount-badge">
                        {calculateDiscountRate(serviceForm.price, serviceForm.first_time_price)}%OFF
                      </span>
                    )}
                  </div>
                )}

                <div className="services-form-group services-form-group--full">
                  <label>説明</label>
                  <textarea
                    name="description"
                    value={serviceForm.description}
                    onChange={handleServiceInputChange}
                    rows="3"
                    placeholder="コースの説明を入力"
                  />
                </div>
              </div>

              <div className="services-form-actions">
                <button
                  onClick={handleCancel}
                  className="services-btn services-btn--secondary"
                  disabled={isLoading}
                >
                  <X size={16} />
                  キャンセル
                </button>
                <button
                  onClick={handleAddService}
                  className="services-btn services-btn--primary"
                  disabled={isLoading}
                >
                  <Save size={16} />
                  登録
                </button>
              </div>
            </div>
          )}

          {/* コース一覧 */}
          <div className="services-list">
            {categories.map(category => {
              const categoryServices = services.filter(s => s.category === category);
              if (categoryServices.length === 0) return null;

              return (
                <div key={category} className="services-category-section">
                  <h4 className="services-category-title">{category}</h4>
                  <div className="services-table">
                    <table>
                      <thead>
                        <tr>
                          <th>コース名</th>
                          <th>時間</th>
                          <th>通常料金</th>
                          <th>初回料金</th>
                          <th>無料オプション</th>
                          <th>ステータス</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryServices.map(service => (
                          <tr key={service.service_id}>
                            {editingId === service.service_id ? (
                              <>
                                <td>
                                  <input
                                    type="text"
                                    name="name"
                                    value={serviceForm.name}
                                    onChange={handleServiceInputChange}
                                    className="services-input-inline"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    name="duration_minutes"
                                    value={serviceForm.duration_minutes}
                                    onChange={handleServiceInputChange}
                                    className="services-input-inline services-input-inline--small"
                                    min="15"
                                    step="15"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    name="price"
                                    value={serviceForm.price}
                                    onChange={handleServiceInputChange}
                                    className="services-input-inline services-input-inline--medium"
                                  />
                                </td>
                                <td>
                                  <div className="services-first-price-edit">
                                    <label className="services-checkbox-label-inline">
                                      <input
                                        type="checkbox"
                                        name="has_first_time_discount"
                                        checked={serviceForm.has_first_time_discount}
                                        onChange={handleServiceInputChange}
                                      />
                                    </label>
                                    {serviceForm.has_first_time_discount && (
                                      <input
                                        type="number"
                                        name="first_time_price"
                                        value={serviceForm.first_time_price}
                                        onChange={handleServiceInputChange}
                                        className="services-input-inline services-input-inline--medium"
                                      />
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <select
                                    name="free_option_choices"
                                    value={serviceForm.free_option_choices}
                                    onChange={handleServiceInputChange}
                                    className="services-input-inline services-input-inline--small"
                                  >
                                    <option value="0">なし</option>
                                    <option value="1">1個</option>
                                    <option value="2">2個</option>
                                    <option value="3">3個</option>
                                  </select>
                                </td>
                                <td>
                                  <label className="services-checkbox-label-inline">
                                    <input
                                      type="checkbox"
                                      name="is_active"
                                      checked={serviceForm.is_active}
                                      onChange={handleServiceInputChange}
                                    />
                                    有効
                                  </label>
                                </td>
                                <td>
                                  <div className="services-actions">
                                    <button
                                      onClick={() => handleUpdateService(service.service_id)}
                                      className="services-btn-icon services-btn-icon--success"
                                      disabled={isLoading}
                                    >
                                      <Save size={16} />
                                    </button>
                                    <button
                                      onClick={handleCancel}
                                      className="services-btn-icon services-btn-icon--secondary"
                                      disabled={isLoading}
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="services-table-name">
                                  {service.name}
                                  {service.description && (
                                    <span className="services-description">{service.description}</span>
                                  )}
                                </td>
                                <td>
                                  <Clock size={14} className="services-icon-inline" />
                                  {service.duration_minutes}分
                                </td>
                                <td>¥{service.price.toLocaleString()}</td>
                                <td>
                                  {service.has_first_time_discount && service.first_time_price ? (
                                    <div className="services-price-discount">
                                      <span>¥{service.first_time_price.toLocaleString()}</span>
                                      <span className="services-discount-badge">
                                        {calculateDiscountRate(service.price, service.first_time_price)}%OFF
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="services-text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {service.free_option_choices > 0 ? (
                                    <span>{service.free_option_choices}個選択可</span>
                                  ) : (
                                    <span className="services-text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`services-status-badge ${service.is_active ? 'services-status-badge--active' : 'services-status-badge--inactive'}`}>
                                    {service.is_active ? '有効' : '無効'}
                                  </span>
                                </td>
                                <td>
                                  <div className="services-actions">
                                    <button
                                      onClick={() => startEditService(service)}
                                      className="services-btn-icon services-btn-icon--primary"
                                      disabled={isLoading}
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteService(service.service_id)}
                                      className="services-btn-icon services-btn-icon--danger"
                                      disabled={isLoading}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 回数券プランタブ */}
      {activeTab === 'tickets' && (
        <div className="services-content">
          <div className="services-header">
            <h3 className="services-title">回数券プラン一覧</h3>
            {!showTicketForm && (
              <button
                onClick={() => setShowTicketForm(true)}
                className="services-btn services-btn--primary"
                disabled={isLoading || services.length === 0}
              >
                <Plus size={16} />
                新規プラン追加
              </button>
            )}
          </div>

          {/* 新規プラン追加フォーム */}
          {showTicketForm && (
            <div className="services-form-card">
              <h4>新規回数券プラン登録</h4>
              <div className="services-form-grid">
                <div className="services-form-group">
                  <label>対象コース *</label>
                  <select
                    name="service_id"
                    value={ticketForm.service_id}
                    onChange={handleTicketInputChange}
                  >
                    <option value="">選択してください</option>
                    {services.filter(s => s.is_active).map(service => (
                      <option key={service.service_id} value={service.service_id}>
                        {service.name} (¥{service.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="services-form-group">
                  <label>カテゴリ *</label>
                  <select
                    name="service_category"
                    value={ticketForm.service_category}
                    onChange={handleTicketInputChange}
                  >
                    <option value="新規">新規</option>
                    <option value="会員">会員</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div className="services-form-group">
                  <label>対象 *</label>
                  <select
                    name="gender_restriction"
                    value={ticketForm.gender_restriction}
                    onChange={handleTicketInputChange}
                  >
                    <option value="all">全員</option>
                    <option value="female">女性限定</option>
                    <option value="male">男性限定</option>
                  </select>
                </div>

                <div className="services-form-group">
                  <label>回数 *</label>
                  <select
                    name="total_sessions"
                    value={ticketForm.total_sessions}
                    onChange={handleTicketInputChange}
                  >
                    <option value="3">3回</option>
                    <option value="5">5回</option>
                    <option value="8">8回</option>
                    <option value="10">10回</option>
                  </select>
                </div>

                <div className="services-form-group">
                  <label>プラン名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={ticketForm.name}
                    onChange={handleTicketInputChange}
                    placeholder="例: フェイシャル10回券"
                  />
                </div>

                <div className="services-form-group">
                  <label>総額（円） *</label>
                  <input
                    type="number"
                    name="price"
                    value={ticketForm.price}
                    onChange={handleTicketInputChange}
                    placeholder="100000"
                  />
                  {ticketForm.service_id && ticketForm.price && (
                    <div className="services-price-info">
                      <span>1回あたり: ¥{Math.floor(ticketForm.price / ticketForm.total_sessions).toLocaleString()}</span>
                      {(() => {
                        const service = services.find(s => s.service_id === ticketForm.service_id);
                        if (service) {
                          const discount = calculateDiscountRate(
                            service.price * ticketForm.total_sessions,
                            ticketForm.price
                          );
                          return discount > 0 && (
                            <span className="services-discount-badge">{discount}%OFF</span>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                <div className="services-form-group">
                  <label>有効期限（日数） *</label>
                  <select
                    name="validity_days"
                    value={ticketForm.validity_days}
                    onChange={handleTicketInputChange}
                  >
                    <option value="90">3ヶ月</option>
                    <option value="180">6ヶ月</option>
                    <option value="365">1年</option>
                    <option value="730">2年</option>
                  </select>
                </div>
              </div>

              <div className="services-form-actions">
                <button
                  onClick={handleCancel}
                  className="services-btn services-btn--secondary"
                  disabled={isLoading}
                >
                  <X size={16} />
                  キャンセル
                </button>
                <button
                  onClick={handleAddTicketPlan}
                  className="services-btn services-btn--primary"
                  disabled={isLoading}
                >
                  <Save size={16} />
                  登録
                </button>
              </div>
            </div>
          )}

          {/* 回数券プラン一覧 */}
          <div className="services-table">
            {(() => {
              const uniqueCategories = [...new Set(ticketPlans.map(plan => plan.service_category || 'その他'))];

              return (
                <>
                  {uniqueCategories.map(category => {
                    const categoryPlans = ticketPlans.filter(plan => (plan.service_category || 'その他') === category);

                    return (
                      <div key={`ticket-category-${category}`} className="ticket-category-section">
                        <h3 className="ticket-category-title">{category}</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>対象コース</th>
                              <th>プラン名</th>
                              <th>対象</th>
                              <th>回数</th>
                              <th>総額</th>
                              <th>1回あたり</th>
                              <th>割引率</th>
                              <th>有効期限</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryPlans.map(plan => (
                              <tr key={plan.plan_id}>
                                {editingTicketId === plan.plan_id ? (
                                  <>
                                    <td>
                                      <select
                                        name="service_id"
                                        value={ticketForm.service_id}
                                        onChange={handleTicketInputChange}
                                        className="services-input-inline"
                                      >
                                        {services.filter(s => s.is_active).map(service => (
                                          <option key={service.service_id} value={service.service_id}>
                                            {service.name}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        name="name"
                                        value={ticketForm.name}
                                        onChange={handleTicketInputChange}
                                        className="services-input-inline"
                                      />
                                    </td>
                                    <td>
                                      <select
                                        name="gender_restriction"
                                        value={ticketForm.gender_restriction}
                                        onChange={handleTicketInputChange}
                                        className="services-input-inline services-input-inline--small"
                                      >
                                        <option value="all">全員</option>
                                        <option value="female">女性</option>
                                        <option value="male">男性</option>
                                      </select>
                                    </td>
                                    <td>
                                      <select
                                        name="total_sessions"
                                        value={ticketForm.total_sessions}
                                        onChange={handleTicketInputChange}
                                        className="services-input-inline services-input-inline--small"
                                      >
                                        <option value="5">5回</option>
                                        <option value="10">10回</option>
                                        <option value="15">15回</option>
                                        <option value="20">20回</option>
                                      </select>
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        name="price"
                                        value={ticketForm.price}
                                        onChange={handleTicketInputChange}
                                        className="services-input-inline services-input-inline--medium"
                                      />
                                    </td>
                                    <td>¥{Math.floor(ticketForm.price / ticketForm.total_sessions).toLocaleString()}</td>
                                    <td>-</td>
                                    <td>
                                      <select
                                        name="validity_days"
                                        value={ticketForm.validity_days}
                                        onChange={handleTicketInputChange}
                                        className="services-input-inline services-input-inline--small"
                                      >
                                        <option value="90">90日</option>
                                        <option value="180">180日</option>
                                        <option value="365">365日</option>
                                        <option value="730">730日</option>
                                      </select>
                                    </td>
                                    <td>
                                      <div className="services-actions">
                                        <button
                                          onClick={() => handleUpdateTicketPlan(plan.plan_id)}
                                          className="services-btn-icon services-btn-icon--success"
                                          disabled={isLoading}
                                        >
                                          <Save size={16} />
                                        </button>
                                        <button
                                          onClick={handleCancel}
                                          className="services-btn-icon services-btn-icon--secondary"
                                          disabled={isLoading}
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td>{plan.service_name}</td>
                                    <td className="services-table-name">{plan.name}</td>
                                    <td>
                                      {plan.gender_restriction === 'female' && (
                                        <span className="services-gender-badge services-gender-badge--female">
                                          <Users size={14} /> 女性
                                        </span>
                                      )}
                                      {plan.gender_restriction === 'male' && (
                                        <span className="services-gender-badge services-gender-badge--male">
                                          <Users size={14} /> 男性
                                        </span>
                                      )}
                                      {(!plan.gender_restriction || plan.gender_restriction === 'all') && (
                                        <span className="services-text-muted">全員</span>
                                      )}
                                    </td>
                                    <td>{plan.total_sessions}回</td>
                                    <td>¥{Number(plan.price || 0).toLocaleString()}</td>
                                    <td>¥{Number(plan.price_per_session || 0).toLocaleString()}</td>
                                    <td>
                                      {plan.discount_rate > 0 ? (
                                        <span className="services-discount-badge">
                                          {plan.discount_rate}%OFF
                                        </span>
                                      ) : (
                                        <span className="services-text-muted">-</span>
                                      )}
                                    </td>
                                    <td>{plan.validity_days}日</td>
                                    <td>
                                      <div className="services-actions">
                                        <button
                                          onClick={() => startEditTicketPlan(plan)}
                                          className="services-btn-icon services-btn-icon--primary"
                                          disabled={isLoading}
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTicketPlan(plan.plan_id)}
                                          className="services-btn-icon services-btn-icon--danger"
                                          disabled={isLoading}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </>
              );
            })()}

            {ticketPlans.length === 0 && (
              <div className="services-empty-state">
                <Package size={48} />
                <p>回数券プランが登録されていません</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* クーポンタブ */}
      {activeTab === 'coupons' && (
        <div className="services-content">
          <div className="services-header">
            <h3 className="services-title">クーポン一覧</h3>
            {!showCouponForm && (
              <button
                onClick={() => setShowCouponForm(true)}
                className="services-btn services-btn--primary"
                disabled={isLoading}
              >
                <Plus size={16} />
                新規クーポン追加
              </button>
            )}
          </div>

          {/* 新規クーポン追加フォーム */}
          {showCouponForm && (
            <div className="services-form-card">
              <h4>新規クーポン登録</h4>
              <div className="services-form-grid">
                <div className="services-form-group services-form-group--full">
                  <label>クーポン名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={couponForm.name}
                    onChange={handleCouponInputChange}
                    placeholder="例: 【男女共通人気NO.1】上半身ケア+小顔コルギ+背中コルギ80分"
                  />
                </div>

                <div className="services-form-group">
                  <label>ベース施術 *</label>
                  <select
                    name="base_service_id"
                    value={couponForm.base_service_id}
                    onChange={handleCouponInputChange}
                  >
                    <option value="">選択してください</option>
                    {services.filter(s => s.is_active).map(service => (
                      <option key={service.service_id} value={service.service_id}>
                        {service.name} ({service.duration_minutes}分) - ¥{service.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="services-form-group">
                  <label>パック価格（円） *</label>
                  <input
                    type="number"
                    name="total_price"
                    value={couponForm.total_price}
                    onChange={handleCouponInputChange}
                    placeholder="6000"
                  />
                </div>

                {/* 指定オプション選択セクション */}
                <div className="services-form-group services-form-group--full">
                  <label>含まれる指定オプション</label>
                  <div className="services-option-selector">
                    <select
                      onChange={(e) => e.target.value && addIncludedOption(e.target.value)}
                      value=""
                      className="services-option-dropdown"
                    >
                      <option value="">オプションを選択して追加...</option>
                      {options.filter(o => o.is_active &&
                        !couponForm.included_options.find(io => io.option_id === o.option_id)
                      ).map(option => (
                        <option key={option.option_id} value={option.option_id}>
                          {option.name} ({option.duration_minutes}分) - ¥{option.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 選択済みオプションリスト */}
                  {couponForm.included_options.length > 0 && (
                    <div className="services-selected-options">
                      {couponForm.included_options.map(opt => (
                        <div key={opt.option_id} className="services-option-item">
                          <span>{opt.option_name}</span>
                          <div className="services-option-controls">
                            <button
                              type="button"
                              onClick={() => updateIncludedOptionQuantity(opt.option_id, opt.quantity - 1)}
                              className="services-option-qty-btn"
                            >
                              -
                            </button>
                            <span className="services-option-qty">{opt.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateIncludedOptionQuantity(opt.option_id, opt.quantity + 1)}
                              className="services-option-qty-btn"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeIncludedOption(opt.option_id)}
                              className="services-option-remove"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="services-form-group">
                  <label>自由選択オプション数</label>
                  <select
                    name="free_option_count"
                    value={couponForm.free_option_count}
                    onChange={handleCouponInputChange}
                  >
                    <option value="0">なし</option>
                    <option value="1">1つ選択可</option>
                    <option value="2">2つ選択可</option>
                    <option value="3">3つ選択可</option>
                  </select>
                </div>

                <div className="services-form-group">
                  <label>有効期限（日数）</label>
                  <select
                    name="validity_days"
                    value={couponForm.validity_days}
                    onChange={handleCouponInputChange}
                  >
                    <option value="30">1ヶ月</option>
                    <option value="90">3ヶ月</option>
                    <option value="180">6ヶ月</option>
                    <option value="365">1年</option>
                  </select>
                </div>

                <div className="services-form-group">
                  <label>使用回数上限</label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={couponForm.usage_limit}
                    onChange={handleCouponInputChange}
                    placeholder="無制限の場合は空欄"
                  />
                </div>

                <div className="services-form-group services-form-group--full">
                  <label>説明</label>
                  <textarea
                    name="description"
                    value={couponForm.description}
                    onChange={handleCouponInputChange}
                    rows="3"
                    placeholder="クーポンの説明・利用条件"
                  />
                </div>
              </div>

              <div className="services-form-actions">
                <button
                  onClick={handleCancel}
                  className="services-btn services-btn--secondary"
                  disabled={isLoading}
                >
                  <X size={16} />
                  キャンセル
                </button>
                <button
                  onClick={handleAddCoupon}
                  className="services-btn services-btn--primary"
                  disabled={isLoading}
                >
                  <Save size={16} />
                  登録
                </button>
              </div>
            </div>
          )}


          {/* クーポン一覧テーブル */}
          <div className="services-table">
            <table>
              <thead>
                <tr>
                  <th>クーポン名</th>
                  <th>ベース施術</th>
                  <th>指定オプション</th>
                  <th>自由オプション</th>
                  <th>パック価格</th>
                  <th>有効期限</th>
                  <th>使用状況</th>
                  <th>ステータス</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.coupon_id}>
                    <td className="services-table-name">
                      <Tag size={14} />
                      {coupon.name}
                    </td>
                    <td>{coupon.service_name}</td>
                    <td>
                      {coupon.included_options && coupon.included_options.length > 0 ? (
                        <div className="services-option-list">
                          {coupon.included_options.map((opt, idx) => (
                            <span key={idx} className="services-option-tag">
                              {opt.option_name} x{opt.quantity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="services-text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {coupon.free_option_count > 0 ? (
                        <span>{coupon.free_option_count}個選択可</span>
                      ) : (
                        <span className="services-text-muted">-</span>
                      )}
                    </td>
                    <td>¥{coupon.total_price.toLocaleString()}</td>
                    <td>{coupon.validity_days}日</td>
                    <td>
                      {coupon.used_count || 0} / {coupon.usage_limit || '∞'}
                    </td>
                    <td>
                      <span className={`services-status-badge ${coupon.is_active ? 'services-status-badge--active' : 'services-status-badge--inactive'}`}>
                        {coupon.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => console.log('編集:', coupon.coupon_id)}
                        className="services-btn-icon services-btn-icon--primary"
                        disabled={isLoading}
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {coupons.length === 0 && !isLoading && (
              <div className="services-empty-state">
                <Tag size={48} />
                <p>クーポンが登録されていません</p>
                <button
                  onClick={() => setShowCouponForm(true)}
                  className="services-btn services-btn--primary"
                >
                  <Plus size={16} />
                  最初のクーポンを追加
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 期間限定タブ */}
      {activeTab === 'limited' && (
        <div className="services-content">
          <div className="services-header">
            <h3 className="services-title">期間限定オファー一覧</h3>
            {!showLimitedForm && (
              <button
                onClick={() => setShowLimitedForm(true)}
                className="services-btn services-btn--primary"
                disabled={isLoading}
              >
                <Plus size={16} />
                新規オファー追加
              </button>
            )}
          </div>

          {/* 新規期間限定追加フォーム */}
          {showLimitedForm && (
            <div className="services-form-card">
              <h4>新規期間限定オファー登録</h4>
              <div className="services-form-grid">
                <div className="services-form-group services-form-group--full">
                  <label>オファー名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={limitedForm.name}
                    onChange={handleLimitedInputChange}
                    placeholder="例: 【朝割/女性限定】上半身ケア+小顔コルギ50分"
                  />
                </div>

                <div className="services-form-group">
                  <label>サービス名 *</label>
                  <input
                    type="text"
                    name="service_name"
                    value={limitedForm.service_name}
                    onChange={handleLimitedInputChange}
                    placeholder="例: 上半身ケア+小顔コルギ50分"
                  />
                </div>

                <div className="services-form-group">
                  <label>回数 *</label>
                  <select
                    name="total_sessions"
                    value={limitedForm.total_sessions}
                    onChange={handleLimitedInputChange}
                  >
                    <option value="5">5回</option>
                    <option value="10">10回</option>
                    <option value="15">15回</option>
                    <option value="20">20回</option>
                  </select>
                </div>

                <div className="services-form-group">
                  <label>販売価格 *</label>
                  <input
                    type="number"
                    name="special_price"
                    value={limitedForm.special_price}
                    onChange={handleLimitedInputChange}
                    placeholder="30000"
                  />
                  {limitedForm.special_price && limitedForm.total_sessions && (
                    <div className="services-price-info">
                      <span>1回あたり: ¥{Math.floor(limitedForm.special_price / limitedForm.total_sessions).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="services-form-group">
                  <label>有効期限（日数） *</label>
                  <select
                    name="validity_days"
                    value={limitedForm.validity_days}
                    onChange={handleLimitedInputChange}
                  >
                    <option value="90">3ヶ月</option>
                    <option value="180">6ヶ月</option>
                    <option value="365">1年</option>
                  </select>
                </div>

                <div className="services-form-group">
                  <label>販売終了日</label>
                  <input
                    type="date"
                    name="sale_end_date"
                    value={limitedForm.sale_end_date}
                    onChange={handleLimitedInputChange}
                  />
                </div>

                <div className="services-form-group">
                  <label>最大販売数</label>
                  <input
                    type="number"
                    name="max_sales"
                    value={limitedForm.max_sales}
                    onChange={handleLimitedInputChange}
                    placeholder="無制限の場合は空欄"
                  />
                </div>

                <div className="services-form-group services-form-group--full">
                  <label>説明</label>
                  <textarea
                    name="description"
                    value={limitedForm.description}
                    onChange={handleLimitedInputChange}
                    rows="3"
                    placeholder="期間限定オファーの説明"
                  />
                </div>
              </div>

              <div className="services-form-actions">
                <button
                  onClick={handleCancel}
                  className="services-btn services-btn--secondary"
                  disabled={isLoading}
                >
                  <X size={16} />
                  キャンセル
                </button>
                <button
                  onClick={handleAddLimitedOffer}
                  className="services-btn services-btn--primary"
                  disabled={isLoading}
                >
                  <Save size={16} />
                  登録
                </button>
              </div>
            </div>
          )}

          {/* 期間限定一覧テーブル */}
          <div className="services-table">
            <table>
              <thead>
                <tr>
                  <th>オファー名</th>
                  <th>サービス</th>
                  <th>回数</th>
                  <th>販売価格</th>
                  <th>1回あたり</th>
                  <th>販売終了</th>
                  <th>販売状況</th>
                  <th>ステータス</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {limitedOffers.map(offer => (
                  <tr key={offer.offer_id}>
                    <td className="services-table-name">
                      <Clock size={14} />
                      {offer.name}
                    </td>
                    <td>{offer.service_name}</td>
                    <td>{offer.total_sessions}回</td>
                    <td>¥{offer.special_price.toLocaleString()}</td>
                    <td>¥{offer.price_per_session ? offer.price_per_session.toLocaleString() : Math.floor(offer.special_price / offer.total_sessions).toLocaleString()}</td>
                    <td>
                      {offer.sale_end_date ? new Date(offer.sale_end_date).toLocaleDateString('ja-JP') : '無期限'}
                    </td>
                    <td>
                      {offer.current_sales || 0} / {offer.max_sales || '∞'}
                    </td>
                    <td>
                      <span className={`services-status-badge ${offer.is_active ? 'services-status-badge--active' : 'services-status-badge--inactive'}`}>
                        {offer.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => console.log('編集:', offer.offer_id)}
                        className="services-btn-icon services-btn-icon--primary"
                        disabled={isLoading}
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {limitedOffers.length === 0 && !isLoading && (
              <div className="services-empty-state">
                <Clock size={48} />
                <p>期間限定オファーが登録されていません</p>
                <button
                  onClick={() => setShowLimitedForm(true)}
                  className="services-btn services-btn--primary"
                >
                  <Plus size={16} />
                  最初のオファーを追加
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;