// app/components/settings/ShiftManagement.js
"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Save, Edit2, Download, Upload, AlertCircle } from 'lucide-react';
import './ShiftManagement.css';

const ShiftManagement = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState('');
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState({});
  const [editingDay, setEditingDay] = useState(null);
  const [hourlyWage, setHourlyWage] = useState(1500);
  const [transportAllowance, setTransportAllowance] = useState(900);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedShifts, setSavedShifts] = useState({}); // DBに保存されているデータ
  const [message, setMessage] = useState({ type: '', text: '' });

  // フォームデータ
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    transportCost: 0
  });

  // 初期データ読み込み
  useEffect(() => {
    fetchStaff();
  }, []);

  // スタッフが選択されたらシフトを読み込み
  useEffect(() => {
    if (selectedStaff) {
      fetchShifts();
      // staffテーブルから時給・交通費を取得
      const selectedStaffData = staff.find(s => s.staff_id === selectedStaff);
      if (selectedStaffData) {
        setHourlyWage(selectedStaffData.hourly_wage || 1500);
        setTransportAllowance(selectedStaffData.transport_allowance || 900);
      }
    }
  }, [selectedStaff, selectedMonth, staff]);

  // 変更があるかチェック
  useEffect(() => {
    const hasChanges = JSON.stringify(shifts) !== JSON.stringify(savedShifts);
    setHasUnsavedChanges(hasChanges);
  }, [shifts, savedShifts]);

  // 給与設定を取得
  const fetchWageSettings = async () => {
    try {
      const response = await fetch(`/api/staff-wages?staffId=${selectedStaff}`);
      if (response.ok) {
        const data = await response.json();
        setHourlyWage(data.data.hourly_wage || 1500);
        setTransportAllowance(data.data.transport_allowance || 900);
        setTempHourlyWage(data.data.hourly_wage || 1500);
        setTempTransportAllowance(data.data.transport_allowance || 900);
      }
    } catch (err) {
      console.error('給与設定取得エラー:', err);
      // デフォルト値を使用
      setHourlyWage(1500);
      setTransportAllowance(900);
    }
  };

  // シフトデータを取得
  const fetchShifts = async () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    try {
      const response = await fetch(`/api/shifts?staffId=${selectedStaff}&year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();

        console.log('取得したシフトデータ:', data);
        console.log('shifts配列:', data.data.shifts);

        // APIデータをコンポーネントの形式に変換
        const shiftData = {};
        data.data.shifts.forEach(record => {
          console.log('処理中のレコード:', record);

          // 日付を文字列として使用（タイムゾーン変換なし）
          const dateKey = record.date; // すでにYYYY-MM-DD形式の文字列

          console.log('dateKey:', dateKey);

          shiftData[dateKey] = {
            startTime: record.start_time || '',
            endTime: record.end_time || '',
            breakMinutes: record.break_minutes || 0,
            transportCost: record.transport_cost || transportAllowance
          };

          console.log('変換後:', shiftData[dateKey]);
        });

        console.log('最終的なshiftData:', shiftData);

        setShifts(shiftData);
        setSavedShifts(JSON.parse(JSON.stringify(shiftData))); // 深いコピーを保存
      }
    } catch (err) {
      console.error('シフト取得エラー:', err);
      setShifts({});
      setSavedShifts({});
    }
  };

  // スタッフ一覧取得
  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        const activeStaff = (data.data || []).filter(s => s.is_active);
        setStaff(activeStaff);
        if (activeStaff.length > 0 && !selectedStaff) {
          setSelectedStaff(activeStaff[0].staff_id);
        }
      }
    } catch (err) {
      console.error('スタッフ取得エラー:', err);
    }
  };

  // 月の日数を取得
  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  // 曜日を取得
  const getDayOfWeek = (day) => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const date = new Date(year, month, day);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  // 曜日のクラスを取得
  const getDayClass = (day) => {
    const dayOfWeek = getDayOfWeek(day);
    if (dayOfWeek === '日') return 'sunday';
    if (dayOfWeek === '土') return 'saturday';
    return '';
  };

  // 日付キーを生成（タイムゾーン考慮）
  const getDateKey = (day) => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth(); // 0-indexed
    const date = new Date(year, month, day);

    // ローカル日付をYYYY-MM-DD形式で取得
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  };

  // 勤務時間を計算（休憩時間を考慮）
  const calculateWorkHours = (startTime, endTime, breakMinutes = 0) => {
    if (!startTime || !endTime) return 0;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return ((endMinutes - startMinutes) - breakMinutes) / 60;
  };

  // 分を時:分形式に変換
  const formatMinutesToHHMM = (minutes) => {
    if (!minutes || minutes <= 0) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}`;
    }
    return `0:${String(m).padStart(2, '0')}`;
  };

  // 時:分形式を分に変換
  const parseHHMMToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // 時間を時:分形式に変換
  const formatHoursToHHMM = (hours) => {
    if (hours <= 0) return '0:00';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  // 時給を計算（休憩時間を考慮）
  const calculateDailyWage = (hours) => {
    return Math.floor(hours * hourlyWage);
  };

  // 月の合計を計算
  const calculateMonthlyTotals = () => {
    const daysInMonth = getDaysInMonth();
    let totalHours = 0;
    let totalTransport = 0;
    let totalWages = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(day);
      const shift = shifts[dateKey];
      if (shift) {
        const hours = calculateWorkHours(shift.startTime, shift.endTime, shift.breakMinutes || 0);
        const wage = calculateDailyWage(hours);
        totalHours += hours;
        totalTransport += shift.transportCost || 0;
        totalWages += wage;
      }
    }

    return {
      totalHours,
      totalTransport,
      totalWages,
      grandTotal: totalWages + totalTransport
    };
  };

  // 給与設定を保存
  const saveWageSettings = async () => {
    try {
      const response = await fetch('/api/staff-wages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: selectedStaff,
          hourly_wage: tempHourlyWage,
          transport_allowance: tempTransportAllowance
        })
      });

      if (response.ok) {
        setHourlyWage(tempHourlyWage);
        setTransportAllowance(tempTransportAllowance);
        setIsEditingSettings(false);
        showMessage('success', '給与設定を更新しました');
      }
    } catch (err) {
      console.error('給与設定保存エラー:', err);
      // エラーでもローカルで更新
      setHourlyWage(tempHourlyWage);
      setTransportAllowance(tempTransportAllowance);
      setIsEditingSettings(false);
    }
  };

  // 給与設定のキャンセル
  const cancelWageSettings = () => {
    setTempHourlyWage(hourlyWage);
    setTempTransportAllowance(transportAllowance);
    setIsEditingSettings(false);
  };

  // 編集開始
  const startEdit = (day) => {
    const dateKey = getDateKey(day);
    const shift = shifts[dateKey] || {};
    setEditingDay(day);
    setFormData({
      startTime: shift.startTime || '',
      endTime: shift.endTime || '',
      transportCost: shift.transportCost || transportAllowance
    });
  };

  // 一時保存（ローカルステートに保存）
  const handleTempSave = () => {
    const dateKey = getDateKey(editingDay);

    if (formData.startTime && formData.endTime) {
      setShifts(prev => ({
        ...prev,
        [dateKey]: {
          startTime: formData.startTime,
          endTime: formData.endTime,
          transportCost: formData.transportCost || 0
        }
      }));
    } else {
      setShifts(prev => {
        const newShifts = { ...prev };
        delete newShifts[dateKey];
        return newShifts;
      });
    }

    setEditingDay(null);
    setFormData({ startTime: '', endTime: '', transportCost: 0 });
  };

  // シフト変更処理
  const handleShiftChange = (day, field, value) => {
    const dateKey = getDateKey(day);
    const currentShift = shifts[dateKey] || {};

    let newShiftData = { ...currentShift, [field]: value };

    // 時間が入力された際、交通費が未入力ならデフォルト値を自動セット
    if ((field === 'startTime' || field === 'endTime') && value && newShiftData.transportCost === undefined) {
      newShiftData.transportCost = transportAllowance;
    }

    // transportCostを数値に変換（breakMinutesは既に数値として渡される）
    if (field === 'transportCost') {
      newShiftData.transportCost = value === '' ? 0 : Number(value);
    }

    // 開始時間と終了時間の両方が空になったら、その日のシフトデータを削除
    if (!newShiftData.startTime && !newShiftData.endTime) {
      setShifts(prev => {
        const newShifts = { ...prev };
        delete newShifts[dateKey];
        return newShifts;
      });
    } else {
      setShifts(prev => ({
        ...prev,
        [dateKey]: newShiftData
      }));
    }
  };

  // 一括保存
  const handleBulkSave = async () => {
    setIsSaving(true);
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    // APIに送信するため、現在のシフトデータをオブジェクト形式に変換
    const shiftsPayload = {};
    Object.entries(shifts).forEach(([date, shift]) => {
      shiftsPayload[date] = {
        start_time: shift.startTime,
        end_time: shift.endTime,
        break_minutes: shift.breakMinutes || 0,
        transport_cost: shift.transportCost || 0,
        type: 'work'
      };
    });

    try {
      console.log('送信データ:', {
        staff_id: selectedStaff,
        year: year,
        month: month,
        shifts: shiftsPayload
      });

      // /api/shifts の PUT メソッドを使用（月次一括登録）
      const response = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: selectedStaff,
          year: year,
          month: month,
          shifts: shiftsPayload
        })
      });

      const data = await response.json();
      console.log('APIレスポンス:', data);

      if (!response.ok) {
        throw new Error(data.error || 'サーバーでの保存に失敗しました。');
      }

      // 保存が成功したら、ローカルの保存済みデータを現在のシフト状態で更新
      setSavedShifts(shifts);
      setHasUnsavedChanges(false);
      showMessage('success', '1ヶ月分のシフトをまとめて保存しました');

      // 保存後、データを再取得して最新状態を反映
      await fetchShifts();

    } catch (err) {
      console.error('一括保存エラー:', err);
      showMessage('error', `保存中にエラーが発生しました: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 変更を破棄
  const handleDiscardChanges = () => {
    if (window.confirm('未保存の変更を破棄しますか？')) {
      setShifts(savedShifts);
      setHasUnsavedChanges(false);
      showMessage('info', '変更を破棄しました');
    }
  };

  // メッセージ表示
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // キャンセル
  const handleCancel = () => {
    setEditingDay(null);
    setFormData({ startTime: '', endTime: '', transportCost: 0 });
  };

  // 月変更
  const changeMonth = (delta) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('未保存の変更があります。月を変更しますか？')) {
        return;
      }
    }
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
    // 月変更後、データを再取得
    setHasUnsavedChanges(false);
  };

  const monthlyTotals = calculateMonthlyTotals();
  const daysInMonth = getDaysInMonth();

  return (
    <div className="shift-management">
      {/* メッセージ表示 */}
      {message.text && (
        <div className={`shift-message shift-message--${message.type}`}>
          <AlertCircle size={16} />
          {message.text}
        </div>
      )}

      {/* ヘッダー */}
      <div className="shift-header">
        <div className="shift-controls">
          <div className="shift-staff-selector">
            <label>スタッフ：</label>
            <select
              value={selectedStaff}
              onChange={(e) => {
                if (hasUnsavedChanges && !window.confirm('未保存の変更があります。スタッフを変更しますか？')) {
                  return;
                }
                setSelectedStaff(e.target.value);
                setHasUnsavedChanges(false);
                // スタッフ変更時、useEffectが自動的にfetchShifts()を呼び出すのでリセット不要
              }}
              className="shift-select"
            >
              {staff.map(s => (
                <option key={s.staff_id} value={s.staff_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="shift-month-nav">
            <button onClick={() => changeMonth(-1)} className="shift-nav-btn">
              <ChevronLeft size={20} />
            </button>
            <span className="shift-month-display">
              {selectedMonth.getFullYear()}年{selectedMonth.getMonth() + 1}月
            </span>
            <button onClick={() => changeMonth(1)} className="shift-nav-btn">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="shift-actions">
          {hasUnsavedChanges && (
            <>
              <button onClick={handleDiscardChanges} className="shift-btn shift-btn-secondary">変更を破棄</button>
              <button onClick={handleBulkSave} disabled={isSaving} className="shift-btn shift-btn-primary shift-btn-bulk-save">
                <Save size={16} /> {isSaving ? '保存中...' : '一括保存'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* シフト表 */}
      <div className="shift-table-container">
        <table className="shift-table">
          <thead>
            <tr>
              <th className="shift-th-day">日付</th>
              <th className="shift-th-weekday">曜日</th>
              <th className="shift-th-time">出勤</th>
              <th className="shift-th-time">退勤</th>
              <th className="shift-th-hours">休憩</th>
              <th className="shift-th-hours">時間</th>
              <th className="shift-th-transport">交通費</th>
              <th className="shift-th-wage">日当 (時給{hourlyWage}円)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateKey = getDateKey(day);
              const shift = shifts[dateKey];
              const isChanged = JSON.stringify(shift) !== JSON.stringify(savedShifts[dateKey]);
              const workHours = calculateWorkHours(shift?.startTime, shift?.endTime, shift?.breakMinutes || 0);
              const dailyWage = calculateDailyWage(workHours);

              return (
                <tr key={day} className={`shift-row ${getDayClass(day)} ${isChanged ? 'shift-row--changed' : ''}`}>
                  <td className="shift-td-day">{day}日</td>
                  <td className={`shift-td-weekday ${getDayClass(day)}`}>{getDayOfWeek(day)}</td>
                  <td>
                    <input type="time" value={shift?.startTime || ''} onChange={(e) => handleShiftChange(day, 'startTime', e.target.value)} className="shift-input-time" />
                  </td>
                  <td>
                    <input type="time" value={shift?.endTime || ''} onChange={(e) => handleShiftChange(day, 'endTime', e.target.value)} className="shift-input-time" />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={formatMinutesToHHMM(shift?.breakMinutes || 0)}
                      onChange={(e) => {
                        const minutes = parseHHMMToMinutes(e.target.value);
                        handleShiftChange(day, 'breakMinutes', minutes);
                      }}
                      className="shift-input-time"
                    />
                  </td>
                  <td>{workHours > 0 ? formatHoursToHHMM(workHours) : '0:00'}</td>
                  <td>
                    <input type="number" value={shift?.transportCost ?? ''} onChange={(e) => handleShiftChange(day, 'transportCost', e.target.value)} className="shift-input-transport" placeholder={transportAllowance} />
                  </td>
                  <td>¥ {dailyWage > 0 ? dailyWage.toLocaleString() : '-'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="shift-total-row">
              <td colSpan="5" className="shift-total-label">合計時間</td>
              <td>{formatHoursToHHMM(monthlyTotals.totalHours)}</td>
              <td className="shift-total-label">交通費</td>
              <td>¥ {monthlyTotals.totalTransport.toLocaleString()}</td>
            </tr>
            <tr className="shift-total-row">
              <td colSpan="7" className="shift-total-label">合計金額 (交通費込)</td>
              <td className="shift-total-final">¥ {monthlyTotals.grandTotal.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ShiftManagement;