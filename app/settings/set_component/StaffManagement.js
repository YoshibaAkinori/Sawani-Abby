// app/settings/set_component/StaffManagement.js
"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Check, User } from 'lucide-react';
import { useStaff } from '../../../contexts/StaffContext';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // ★ StaffContextから取得
  const { refreshStaff } = useStaff();

  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    color: '#FF69B4',
    role: 'セラピスト',
    is_active: true,
    hourly_wage: 1500,
    transport_allowance: 900
  });

  // カラーパレット
  const colorOptions = [
    '#FF69B4', // ピンク
    '#9370DB', // 紫
    '#4169E1', // 青
    '#32CD32', // 緑
    '#FFD700', // 金
    '#FF6347', // トマト
    '#00CED1', // ダークターコイズ
    '#FF8C00', // ダークオレンジ
  ];

  // 初期データ読み込み
  useEffect(() => {
    fetchStaff();
  }, []);

  // スタッフ一覧取得
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaff(data.data || []);
      } else {
        throw new Error('API not available');
      }
    } catch (err) {
      console.error('スタッフデータの取得に失敗:', err);
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  };

  // フォーム入力処理
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 新規追加
  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError('スタッフ名を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('スタッフを登録しました');
        await fetchStaff();
        
        // ★ Contextを強制更新
        await refreshStaff(true);
        
        setShowAddForm(false);
        resetForm();
      } else {
        const data = await response.json();
        throw new Error(data.error || '登録に失敗しました');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // 編集開始
  const startEdit = (staffMember) => {
    setEditingId(staffMember.staff_id);
    setFormData({
      name: staffMember.name,
      color: staffMember.color,
      role: staffMember.role,
      is_active: staffMember.is_active,
      hourly_wage: staffMember.hourly_wage || 1500,
      transport_allowance: staffMember.transport_allowance || 900
    });
  };

  // 編集保存
  const handleUpdate = async (staffId) => {
    if (!formData.name.trim()) {
      setError('スタッフ名を入力してください');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/staff`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staffId,
          ...formData
        })
      });

      if (response.ok) {
        setSuccess('更新しました');
        await fetchStaff();
        
        // ★ Contextを強制更新
        await refreshStaff(true);
        
        setEditingId(null);
      } else {
        const data = await response.json();
        throw new Error(data.error || '更新に失敗しました');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // 削除
  const handleDelete = async (staffId) => {
    if (!confirm('本当に削除しますか？')) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/staff?id=${staffId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('削除しました');
        await fetchStaff();
        
        // ★ Contextを強制更新
        await refreshStaff(true);
      } else {
        const data = await response.json();
        throw new Error(data.error || '削除に失敗しました');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      color: '#FF69B4',
      role: 'セラピスト',
      is_active: true,
      hourly_wage: 1500,
      transport_allowance: 900
    });
  };

  return (
    <div className="staff-management">
      <div className="staff-management__header">
        <h2 className="staff-management__title">スタッフ管理</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="staff-management__add-btn"
          disabled={isLoading}
        >
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
          {showAddForm ? 'キャンセル' : '新規追加'}
        </button>
      </div>

      {/* メッセージ */}
      {error && (
        <div className="staff-management__alert staff-management__alert--error">
          {error}
        </div>
      )}
      {success && (
        <div className="staff-management__alert staff-management__alert--success">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* 新規追加フォーム */}
      {showAddForm && (
        <div className="staff-management__form-card">
          <h3 className="staff-management__form-title">新規スタッフ登録</h3>
          <div className="staff-management__form-grid">
            <div className="staff-management__form-group">
              <label className="staff-management__label">
                スタッフ名 <span className="staff-management__required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="staff-management__input"
                placeholder="山田 太郎"
              />
            </div>

            <div className="staff-management__form-group">
              <label className="staff-management__label">役職</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="staff-management__select"
              >
                <option value="セラピスト">セラピスト</option>
                <option value="マネージャー">マネージャー</option>
                <option value="アシスタント">アシスタント</option>
              </select>
            </div>

            <div className="staff-management__form-group">
              <label className="staff-management__label">カラー</label>
              <div className="staff-management__color-grid">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`staff-management__color-option ${formData.color === color ? 'staff-management__color-option--selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <div className="staff-management__form-group">
              <label className="staff-management__label">時給（円）</label>
              <input
                type="number"
                name="hourly_wage"
                value={formData.hourly_wage}
                onChange={handleInputChange}
                className="staff-management__input"
                min="0"
              />
            </div>

            <div className="staff-management__form-group">
              <label className="staff-management__label">交通費（円）</label>
              <input
                type="number"
                name="transport_allowance"
                value={formData.transport_allowance}
                onChange={handleInputChange}
                className="staff-management__input"
                min="0"
              />
            </div>

            <div className="staff-management__form-group staff-management__form-group--full">
              <label className="staff-management__checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="staff-management__checkbox"
                />
                <span>有効</span>
              </label>
            </div>
          </div>

          <div className="staff-management__form-actions">
            <button
              onClick={handleAdd}
              className="staff-management__btn staff-management__btn--primary"
              disabled={isLoading}
            >
              {isLoading ? '登録中...' : '登録'}
            </button>
          </div>
        </div>
      )}

      {/* スタッフ一覧 */}
      <div className="staff-management__list">
        {staff.length === 0 ? (
          <div className="staff-management__empty">
            <User size={48} />
            <p>スタッフが登録されていません</p>
          </div>
        ) : (
          staff.map(staffMember => (
            <div key={staffMember.staff_id} className="staff-management__card">
              {editingId === staffMember.staff_id ? (
                // 編集モード
                <div className="staff-management__edit-form">
                  <div className="staff-management__form-grid">
                    <div className="staff-management__form-group">
                      <label className="staff-management__label">スタッフ名</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="staff-management__input"
                      />
                    </div>

                    <div className="staff-management__form-group">
                      <label className="staff-management__label">役職</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="staff-management__select"
                      >
                        <option value="セラピスト">セラピスト</option>
                        <option value="マネージャー">マネージャー</option>
                        <option value="アシスタント">アシスタント</option>
                      </select>
                    </div>

                    <div className="staff-management__form-group">
                      <label className="staff-management__label">カラー</label>
                      <div className="staff-management__color-grid">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`staff-management__color-option ${formData.color === color ? 'staff-management__color-option--selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="staff-management__form-group">
                      <label className="staff-management__label">時給（円）</label>
                      <input
                        type="number"
                        name="hourly_wage"
                        value={formData.hourly_wage}
                        onChange={handleInputChange}
                        className="staff-management__input"
                        min="0"
                      />
                    </div>

                    <div className="staff-management__form-group">
                      <label className="staff-management__label">交通費（円）</label>
                      <input
                        type="number"
                        name="transport_allowance"
                        value={formData.transport_allowance}
                        onChange={handleInputChange}
                        className="staff-management__input"
                        min="0"
                      />
                    </div>

                    <div className="staff-management__form-group staff-management__form-group--full">
                      <label className="staff-management__checkbox-label">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="staff-management__checkbox"
                        />
                        <span>有効</span>
                      </label>
                    </div>
                  </div>

                  <div className="staff-management__form-actions">
                    <button
                      onClick={() => handleUpdate(staffMember.staff_id)}
                      className="staff-management__btn staff-management__btn--primary"
                      disabled={isLoading}
                    >
                      <Save size={16} />
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="staff-management__btn staff-management__btn--secondary"
                      disabled={isLoading}
                    >
                      <X size={16} />
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                // 表示モード
                <>
                  <div className="staff-management__card-header">
                    <div className="staff-management__card-info">
                      <div
                        className="staff-management__card-color"
                        style={{ backgroundColor: staffMember.color }}
                      />
                      <div>
                        <h3 className="staff-management__card-name">{staffMember.name}</h3>
                        <p className="staff-management__card-role">{staffMember.role}</p>
                      </div>
                    </div>
                    <div className="staff-management__card-actions">
                      <button
                        onClick={() => startEdit(staffMember)}
                        className="staff-management__icon-btn staff-management__icon-btn--edit"
                        disabled={isLoading}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember.staff_id)}
                        className="staff-management__icon-btn staff-management__icon-btn--delete"
                        disabled={isLoading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="staff-management__card-details">
                    <div className="staff-management__detail-item">
                      <span className="staff-management__detail-label">時給:</span>
                      <span className="staff-management__detail-value">¥{staffMember.hourly_wage?.toLocaleString() || '1,500'}</span>
                    </div>
                    <div className="staff-management__detail-item">
                      <span className="staff-management__detail-label">交通費:</span>
                      <span className="staff-management__detail-value">¥{staffMember.transport_allowance?.toLocaleString() || '900'}</span>
                    </div>
                    <div className="staff-management__detail-item">
                      <span className="staff-management__detail-label">ステータス:</span>
                      <span className={`staff-management__status ${staffMember.is_active ? 'staff-management__status--active' : 'staff-management__status--inactive'}`}>
                        {staffMember.is_active ? '有効' : '無効'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StaffManagement;