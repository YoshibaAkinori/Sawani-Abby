// app/settings/set_component/ServicesManagement.js
"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Check, Sparkles, Tag, Clock, DollarSign, Package, Users } from 'lucide-react';
import './ServicesManagement.css';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
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
  
  // サービスフォームデータ
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: '',
    first_time_price: '',
    has_first_time_discount: false,
    category: 'フェイシャル',
    is_active: true
  });

  // 回数券フォームデータ
  const [ticketForm, setTicketForm] = useState({
    service_id: '',
    name: '',
    gender: 'all', // all/male/female
    total_sessions: 5,
    price: '',
    validity_days: 180
  });

  // クーポンフォームデータ
  const [couponForm, setCouponForm] = useState({
    name: '',
    description: '',
    discount_type: 'percentage', // percentage/amount
    discount_value: '',
    valid_until: '',
    usage_limit: '',
    is_active: true
  });

  // 期間限定フォームデータ
  const [limitedForm, setLimitedForm] = useState({
    name: '',
    description: '',
    original_price: '',
    special_price: '',
    start_date: '',
    end_date: '',
    max_bookings: '',
    is_active: true
  });

  // カテゴリオプション
  const categories = ['新規', '既存', 'その他'];

  // 初期データ読み込み
  useEffect(() => {
    fetchServices();
    fetchTicketPlans();
  }, []);

  // サービス一覧取得
  const fetchServices = async () => {
  const response = await fetch('/api/services');
  if (response.ok) {
    const data = await response.json();
    setServices(data.data || []);
  }
};

const fetchTicketPlans = async () => {
  const response = await fetch('/api/ticket-plans');
  if (response.ok) {
    const data = await response.json();
    setTicketPlans(data.data || []);
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
        const genderText = ticketForm.gender === 'male' ? '男性' : 
                          ticketForm.gender === 'female' ? '女性' : '';
        setTicketForm(prev => ({
          ...prev,
          service_id: value,
          name: `${selectedService.name}${prev.total_sessions}回券${genderText ? `（${genderText}）` : ''}`
        }));
      }
    } else if (name === 'total_sessions' || name === 'gender') {
      const selectedService = services.find(s => s.service_id === ticketForm.service_id);
      const genderText = name === 'gender' ? 
        (value === 'male' ? '男性' : value === 'female' ? '女性' : '') :
        (ticketForm.gender === 'male' ? '男性' : ticketForm.gender === 'female' ? '女性' : '');
      const sessions = name === 'total_sessions' ? value : ticketForm.total_sessions;
      
      setTicketForm(prev => ({
        ...prev,
        [name]: value,
        name: selectedService ? `${selectedService.name}${sessions}回券${genderText ? `（${genderText}）` : ''}` : prev.name
      }));
    } else {
      setTicketForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // クーポンフォーム入力処理
  const handleCouponInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCouponForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  // フォームリセット
  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      duration_minutes: 60,
      price: '',
      first_time_price: '',
      has_first_time_discount: false,
      category: 'フェイシャル',
      is_active: true
    });
  };

  const resetTicketForm = () => {
    setTicketForm({
      service_id: '',
      name: '',
      gender: 'all',
      total_sessions: 5,
      price: '',
      validity_days: 180
    });
  };

  const resetCouponForm = () => {
    setCouponForm({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      valid_from: '',
      valid_until: '',
      usage_limit: '',
      is_active: true
    });
  };

  const resetLimitedForm = () => {
    setLimitedForm({
      name: '',
      description: '',
      original_price: '',
      special_price: '',
      start_date: '',
      end_date: '',
      max_bookings: '',
      is_active: true
    });
  };

  // キャンセル
  const handleCancel = () => {
    setEditingId(null);
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
                  <label>対象 *</label>
                  <select
                    name="gender"
                    value={ticketForm.gender}
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
                    <option value="5">5回</option>
                    <option value="10">10回</option>
                    <option value="15">15回</option>
                    <option value="20">20回</option>
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
                {ticketPlans.map(plan => (
                  <tr key={plan.plan_id}>
                    <td>{plan.service_name}</td>
                    <td className="services-table-name">{plan.name}</td>
                    <td>
                      {plan.gender === 'female' && (
                        <span className="services-gender-badge services-gender-badge--female">
                          <Users size={14} /> 女性
                        </span>
                      )}
                      {plan.gender === 'male' && (
                        <span className="services-gender-badge services-gender-badge--male">
                          <Users size={14} /> 男性
                        </span>
                      )}
                      {(!plan.gender || plan.gender === 'all') && (
                        <span className="services-text-muted">全員</span>
                      )}
                    </td>
                    <td>{plan.total_sessions}回</td>
                    <td>
                        ¥{Number(plan.price || 0).toLocaleString()}
                    </td>
                    <td>
                        ¥{Number(plan.price_per_session || 0).toLocaleString()}
                    </td>
                    <td>
                      {plan.discount_rate > 0 && (
                        <span className="services-discount-badge">
                          {plan.discount_rate}%OFF
                        </span>
                      )}
                    </td>
                    <td>{plan.validity_days}日</td>
                    <td>
                      <button
                        onClick={() => handleDeleteTicketPlan(plan.plan_id)}
                        className="services-btn-icon services-btn-icon--danger"
                        disabled={isLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
                    placeholder="例: 新規限定20%OFFクーポン"
                  />
                </div>

                <div className="services-form-group">
                  <label>割引タイプ *</label>
                  <select
                    name="discount_type"
                    value={couponForm.discount_type}
                    onChange={handleCouponInputChange}
                  >
                    <option value="percentage">割引率（％）</option>
                    <option value="amount">割引額（円）</option>
                  </select>
                </div>

                <div className="services-form-group">
                  <label>割引値 *</label>
                  <input
                    type="number"
                    name="discount_value"
                    value={couponForm.discount_value}
                    onChange={handleCouponInputChange}
                    placeholder={couponForm.discount_type === 'percentage' ? "20" : "1000"}
                  />
                </div>

                <div className="services-form-group">
                  <label>有効期限終了</label>
                  <input
                    type="date"
                    name="valid_until"
                    value={couponForm.valid_until}
                    onChange={handleCouponInputChange}
                  />
                </div>

                <div className="services-form-group">
                  <label>使用回数上限</label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={couponForm.usage_limit}
                    onChange={handleCouponInputChange}
                    placeholder="100"
                  />
                </div>

                <div className="services-form-group services-form-group--full">
                  <label>説明</label>
                  <textarea
                    name="description"
                    value={couponForm.description}
                    onChange={handleCouponInputChange}
                    rows="2"
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
                  onClick={() => {
                    // クーポン保存処理
                    setSuccess('クーポンを登録しました');
                    setShowCouponForm(false);
                    resetCouponForm();
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  className="services-btn services-btn--primary"
                  disabled={isLoading}
                >
                  <Save size={16} />
                  登録
                </button>
              </div>
            </div>
          )}

          {/* クーポン一覧（仮） */}
          <div className="services-empty-state">
            <Tag size={48} />
            <p>クーポンが登録されていません</p>
          </div>
        </div>
      )}

      {/* 期間限定タブ */}
      {activeTab === 'limited' && (
        <div className="services-content">
          <div className="services-header">
            <h3 className="services-title">期間限定メニュー一覧</h3>
            {!showLimitedForm && (
              <button
                onClick={() => setShowLimitedForm(true)}
                className="services-btn services-btn--primary"
                disabled={isLoading}
              >
                <Plus size={16} />
                新規期間限定追加
              </button>
            )}
          </div>

          {/* 新規期間限定追加フォーム */}
          {showLimitedForm && (
            <div className="services-form-card">
              <h4>新規期間限定メニュー登録</h4>
              <div className="services-form-grid">
                <div className="services-form-group services-form-group--full">
                  <label>メニュー名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={limitedForm.name}
                    onChange={handleLimitedInputChange}
                    placeholder="例: 夏季限定クールダウンコース"
                  />
                </div>

                <div className="services-form-group">
                  <label>通常価格 *</label>
                  <input
                    type="number"
                    name="original_price"
                    value={limitedForm.original_price}
                    onChange={handleLimitedInputChange}
                    placeholder="10000"
                  />
                </div>

                <div className="services-form-group">
                  <label>特別価格 *</label>
                  <input
                    type="number"
                    name="special_price"
                    value={limitedForm.special_price}
                    onChange={handleLimitedInputChange}
                    placeholder="7000"
                  />
                  {limitedForm.original_price && limitedForm.special_price && (
                    <span className="services-discount-badge">
                      {calculateDiscountRate(limitedForm.original_price, limitedForm.special_price)}%OFF
                    </span>
                  )}
                </div>

                <div className="services-form-group">
                  <label>開始日 *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={limitedForm.start_date}
                    onChange={handleLimitedInputChange}
                  />
                </div>

                <div className="services-form-group">
                  <label>終了日 *</label>
                  <input
                    type="date"
                    name="end_date"
                    value={limitedForm.end_date}
                    onChange={handleLimitedInputChange}
                  />
                </div>

                <div className="services-form-group">
                  <label>最大予約数</label>
                  <input
                    type="number"
                    name="max_bookings"
                    value={limitedForm.max_bookings}
                    onChange={handleLimitedInputChange}
                    placeholder="50"
                  />
                </div>

                <div className="services-form-group services-form-group--full">
                  <label>説明</label>
                  <textarea
                    name="description"
                    value={limitedForm.description}
                    onChange={handleLimitedInputChange}
                    rows="3"
                    placeholder="期間限定メニューの説明"
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
                  onClick={() => {
                    // 期間限定メニュー保存処理
                    setSuccess('期間限定メニューを登録しました');
                    setShowLimitedForm(false);
                    resetLimitedForm();
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  className="services-btn services-btn--primary"
                  disabled={isLoading}
                >
                  <Save size={16} />
                  登録
                </button>
              </div>
            </div>
          )}

          {/* 期間限定一覧（仮） */}
          <div className="services-empty-state">
            <Clock size={48} />
            <p>期間限定メニューが登録されていません</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;