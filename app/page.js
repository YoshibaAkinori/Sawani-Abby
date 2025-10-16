"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Settings, User, Clock, Users, BarChart3, CreditCard } from 'lucide-react';
import BookingModal from './components/BookingModal';
import CalendarModal from './components/CalendarModal';
import './global.css';

const SalonBoard = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // 本日の日付を初期値に
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // データとローディング状態
  const [staffShifts, setStaffShifts] = useState([]);
  const [bookings, setBookings] = useState([]); // ★★★ APIから取得した予約データを保持するState
  const [isLoading, setIsLoading] = useState(true);

  // ★★★ 日付が変更されたらシフトと予約の両方を取得する ★★★
  useEffect(() => {
    fetchDataForDate();
  }, [selectedDate]);

  const fetchDataForDate = async () => {
    setIsLoading(true);
    try {
      // 2つのAPI呼び出しを並列で実行
      const [shiftsPromise, bookingsPromise] = [
        fetchShifts(selectedDate),
        fetchBookings(selectedDate)
      ];

      // 両方の完了を待つ
      await Promise.all([shiftsPromise, bookingsPromise]);

    } catch (err) {
      console.error('データ取得エラー:', err);
      setStaffShifts([]);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // シフトデータを取得する関数
  const fetchShifts = async (date) => {
    const [year, month] = date.split('-');
    const staffResponse = await fetch('/api/staff');
    const staffData = await staffResponse.json();
    const allStaff = staffData.data?.filter(s => s.is_active) || [];

    const shiftsPromises = allStaff.map(async (staff) => {
      const shiftResponse = await fetch(`/api/shifts?staffId=${staff.staff_id}&year=${year}&month=${month}`);
      const shiftData = await shiftResponse.json();
      const dayShift = shiftData.data?.shifts?.find(s => s.date.startsWith(date));
      return { ...staff, shift: dayShift || null, hasShift: !!dayShift };
    });

    const staffWithShifts = await Promise.all(shiftsPromises);
    setStaffShifts(staffWithShifts);
  };

  // ★★★ 予約データを取得する新しい関数 ★★★
  const fetchBookings = async (date) => {
    const response = await fetch(`/api/bookings?date=${date}`);
    const data = await response.json();
    if (data.success) {
      // APIのキー(snake_case)をコンポーネントで使う(camelCase)に変換
      const formattedBookings = data.data.map(b => ({
        id: b.booking_id,
        staffId: b.staff_id,
        bed: b.bed_id ? `ベッド${b.bed_id}` : '',
        date: b.date.split('T')[0],
        startTime: b.start_time,
        endTime: b.end_time,
        service: b.service_name || b.notes || '予定', // サービス名がなければメモを表示
        client: `${b.last_name || ''} ${b.first_name || ''}`,
        serviceType: b.service_category || '予定', // カテゴリがなければ「予定」
        status: b.status,
        type: b.type // 'booking' or 'schedule'
      }));
      setBookings(formattedBookings);
    } else {
      setBookings([]);
    }
  };

  const bedCount = 2;
  const beds = Array.from({ length: bedCount }, (_, i) => `ベッド${i + 1}`);

  const timeSlots = [];
  // 10:00から23:30まで30分刻みで生成（計14時間、28スロット）
  for (let hour = 9; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }


  // 時間ヘッダー用の無記名スタッフデータ
  const headerRowData = {
    id: 'HEADER_ROW',
    staff_id: 'HEADER_ROW',
    name: '',
    color: 'transparent'
  };

  const displayStaff = [headerRowData, ...staffShifts.filter(s => s.is_active)];

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculateBookingPosition = (startTime, endTime) => {
    // タイムライン全体の時間（分）を定義
    const timelineStartMinutes = 9 * 60; // 10:00
    // 10:00から24:00までの14時間 = 840分
    const totalTimelineMinutes = (24 - 9) * 60;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;

    // 位置と幅をパーセンテージで計算
    const leftPercent = ((startMinutes - timelineStartMinutes) / totalTimelineMinutes) * 100;
    const widthPercent = (duration / totalTimelineMinutes) * 100;

    // CSSで使えるように文字列で返す
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getServiceColorClass = (serviceType) => {
    switch (serviceType) {
      case 'フェイシャル': return 'salon-board__booking--facial';
      case 'ボディトリート': return 'salon-board__booking--body-treatment';
      case 'クーポン': return 'salon-board__booking--coupon';
      case '期間限定': return 'salon-board__booking--limited';
      default: return 'salon-board__booking--other';
    }
  };

  const changeDate = (days) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // スロットがシフト時間内かチェック（マネージャーは常にtrue）
  const isSlotInShiftTime = (staff, timeSlot) => {
    // マネージャーは常に予約可能
    if (staff.role === 'マネージャー') return true;

    if (!staff.shift || !staff.shift.start_time || !staff.shift.end_time) return false;

    const slotMinutes = timeToMinutes(timeSlot);
    const startMinutes = timeToMinutes(staff.shift.start_time);
    const endMinutes = timeToMinutes(staff.shift.end_time);

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  // 空きスロットの判定
  const isSlotAvailable = (staffId, timeSlot) => {
    const slotMinutes = timeToMinutes(timeSlot);
    return !bookings.some(booking => {
      if (booking.staffId !== staffId) return false;
      const startMinutes = timeToMinutes(booking.startTime);
      const endMinutes = timeToMinutes(booking.endTime);
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
  };

  // 空きスロットクリック処理
  const handleSlotClick = (staffId, timeSlot, slotIndex) => {
    const staff = staffShifts.find(s => s.staff_id === staffId);
    if (!staff) return;

    setSelectedSlot({
      staffId,
      staffName: staff.name,
      timeSlot,
      slotIndex,
      date: selectedDate
    });
    setActiveModal('booking');
  };
  // 予約カードクリック処理を追加
  const handleBookingClick = async (bookingId) => {
    try {
      // 予約詳細を取得
      const response = await fetch(`/api/bookings?id=${bookingId}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const booking = data.data[0];

        setSelectedSlot({
          bookingId: booking.booking_id,
          isEdit: true, // 編集モードフラグ
          staffId: booking.staff_id,
          staffName: booking.staff_name,
          date: booking.date.split('T')[0],
          timeSlot: booking.start_time,
          // 予約の全データを渡す
          bookingData: booking
        });
        setActiveModal('booking');
      }
    } catch (err) {
      console.error('予約詳細取得エラー:', err);
      alert('予約情報の取得に失敗しました');
    }
  };

  // モーダルを閉じる
  const closeModal = () => {
    setActiveModal(null);
    setSelectedSlot(null);
  };

  // 設定サイドバーの開閉
  const toggleSettings = () => {
    router.push('/settings');
  };

  // カレンダーモーダルを開く
  const openCalendarModal = () => {
    setActiveModal('calendar');
  };

  // カレンダーから日付を選択
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setActiveModal(null);
  };

  // ページ遷移ハンドラー
  const handlePageChange = (page) => {
    router.push(`/${page}`);
    setActiveModal(null);
  };

  return (
    <div className="salon-board">
      <header className="salon-board__header">
        <div className="salon-board__header-content">
          <div className="salon-board__header-title">
            <h1>ABBY 予約一覧</h1>
          </div>

          <div className="salon-board__header-controls">
            <button
              className="salon-board__header-logo salon-board__calendar-btn"
              onClick={openCalendarModal}
            >
              <Calendar />
            </button>
            <div className="salon-board__date-navigation">
              <button onClick={() => changeDate(-1)} className="salon-board__date-nav-btn">
                <ChevronLeft />
              </button>
              <span className="salon-board__date-display">
                {new Date(selectedDate).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                })}
              </span>
              <button onClick={() => changeDate(1)} className="salon-board__date-nav-btn">
                <ChevronRight />
              </button>
            </div>
            <button className="salon-board__settings-btn" onClick={toggleSettings}>
              <Settings />
            </button>
          </div>
        </div>
      </header>

      <div className="salon-board__content">
        <div className="salon-board__db-info">
          <div className="salon-board__db-info-content">
            <div className="salon-board__db-info-item">
              <User />
              <span>スタッフ: {staffShifts.length}名</span>
            </div>
            <div className="salon-board__db-info-item">
              <Clock />
              <span>本日の予約: {bookings.length}件</span>
            </div>
          </div>
        </div>

        {/* --- 共通の横スクロールコンテナ --- */}
        <div className="shared-horizontal-scroller">
          {/* --- スクロールする中身全体（幅1800px） --- */}
          <div className="wide-content-wrapper">

            {/* スタッフ別スケジュール */}
            <div className="salon-board__section">
              <h3 className="salon-board__section-title"><User />スタッフ別スケジュール</h3>
              <div className="salon-board__rows">
                {displayStaff.map(staff => {
                  const isHeader = staff.id === 'HEADER_ROW';
                  const isHoliday = !isHeader && staff.role !== 'マネージャー' && !staff.hasShift;
                  const rowClassName = `salon-board__row ${isHeader ? 'salon-board__row--is-header' : ''} ${isHoliday ? 'salon-board__row--holiday' : ''}`;

                  return (
                    <div key={staff.staff_id || staff.id} className={rowClassName}>
                      <div className="salon-board__row-content">
                        <div className="salon-board__row-label">
                          {!isHeader && (
                            <div className="salon-board__label-content">
                              <div className="salon-board__label-main">
                                <div className="salon-board__color-indicator" style={{ backgroundColor: staff.color }}></div>
                                <span className="salon-board__label-text">{staff.name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="salon-board__timeline">
                          <div className="salon-board__grid-lines">
                            {timeSlots.map(time => {
                              const isInShiftTime = !isHeader && !isHoliday && isSlotInShiftTime(staff, time);
                              const isAvailable = isInShiftTime && isSlotAvailable(staff.staff_id, time);
                              const isOutOfShift = !isHeader && !isHoliday && !isInShiftTime;
                              return (
                                <div
                                  key={`${staff.staff_id}-${time}`}
                                  className={`salon-board__grid-line ${isAvailable ? 'salon-board__clickable-slot' : ''}`}
                                  onClick={() => isAvailable && handleSlotClick(staff.staff_id, time)}
                                  style={{ backgroundColor: isOutOfShift ? '#f8f9fa' : 'transparent' }}
                                />
                              );
                            })}
                          </div>

                          {isHeader ? (
                            <div className="time-header-content">
                              <div className="time-header__top-row">
                                {timeSlots.map((time, index) => (
                                  <div key={`top-${time}`} className="time-header__cell time-header__cell--hour">
                                    {index % 2 === 0 ? time : ''}
                                  </div>
                                ))}
                              </div>
                              <div className="time-header__bottom-row">
                                {timeSlots.map(time => (
                                  <div key={`bottom-${time}`} className="time-header__cell time-header__cell--minute">
                                    {time.split(':')[1]}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            !isHoliday && bookings
                              .filter(booking => booking.staffId === staff.staff_id)
                              .map(booking => {
                                const { left, width } = calculateBookingPosition(booking.startTime, booking.endTime);
                                const serviceColorClass = getServiceColorClass(booking.serviceType);
                                return (
                                  // スタッフ別スケジュールの予約カード
                                  <div
                                    key={booking.id}
                                    className={`salon-board__booking ${serviceColorClass}`}
                                    onClick={() => handleBookingClick(booking.id)} // 追加
                                    style={{ left, width, cursor: 'pointer' }} // cursor追加
                                  >
                                    <div className="salon-board__booking-content">
                                      {booking.type === 'schedule' ? (
                                        <div className="salon-board__booking-client">{booking.service}</div>
                                      ) : (
                                        <>
                                          <div className="salon-board__booking-client">{`${booking.client} 様`}</div>
                                          <div className="salon-board__booking-service">{booking.service} / {booking.bed}</div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* モーダル非表示時のみベッドスケジュールを表示 */}
            {!activeModal && (
              <div className="salon-board__section">
                <h3 className="salon-board__section-title">ベッド別スケジュール</h3>
                <div className="salon-board__rows">
                  {['ベッド1', 'ベッド2'].map(bed => (
                    <div key={bed} className="salon-board__row">
                      <div className="salon-board__row-content">
                        <div className="salon-board__row-label">
                          <div className="salon-board__label-content">
                            <div className="salon-board__label-main">
                              <span className="salon-board__label-text">{bed}</span>
                            </div>
                          </div>
                        </div>
                        <div className="salon-board__timeline">
                          <div className="salon-board__grid-lines">
                            {timeSlots.map((time, index) => (
                              <div
                                key={time}
                                className={`salon-board__grid-line ${index % 2 === 0
                                  ? 'salon-board__grid-line--even'
                                  : 'salon-board__grid-line--odd'
                                  }`}
                              ></div>
                            ))}
                          </div>
                          {bookings
                            .filter(booking => booking.bed === bed)
                            .map(booking => {
                              const { left, width } = calculateBookingPosition(booking.startTime, booking.endTime);
                              const serviceColorClass = getServiceColorClass(booking.serviceType);
                              const staff = staffShifts.find(s => s.staff_id === booking.staffId);
                              return (
                                <div key={booking.id} className={`salon-board__booking ${serviceColorClass}`} style={{ left, width }}>
                                  <div className="salon-board__booking-content">
                                    <div className="salon-board__booking-client">
                                      {booking.type === 'schedule'
                                        ? booking.service
                                        : `${booking.client} 様`
                                      }
                                    </div>
                                    <div className="salon-board__booking-service salon-board__booking-service--with-icon">
                                      {staff && <div className="salon-board__small-color-indicator" style={{ backgroundColor: staff.color }} />}
                                      {booking.type === 'schedule'
                                        ? staff?.name
                                        : `${staff?.name} / ${booking.service}`
                                      }
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- スクロールしない下半分のエリア --- */}
        <div className="salon-board__lower-area">
          {activeModal === 'booking' ? (
            <BookingModal
              activeModal={activeModal}
              selectedSlot={selectedSlot}
              onClose={closeModal}
              onModalChange={setActiveModal}
            />
          ) : (
            <div className="salon-board__db-panel">
              <div className="salon-board__db-section">
                <h3 className="salon-board__db-section-title">スタッフ業務</h3>
                <div className="salon-board__card-grid">
                  <button
                    className="salon-board__action-card salon-board__action-card--customers"
                    onClick={() => handlePageChange('customers')}
                  >
                    <Users className="salon-board__card-icon" />
                    <div className="salon-board__card-content">
                      <h4>顧客情報</h4>
                      <p>顧客一覧・詳細情報</p>
                    </div>
                  </button>
                  <button
                    className="salon-board__action-card salon-board__action-card--register"
                    onClick={() => handlePageChange('register')}
                  >
                    <CreditCard className="salon-board__card-icon" />
                    <div className="salon-board__card-content">
                      <h4>レジ/お会計</h4>
                      <p>お会計処理・決済</p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="salon-board__db-section">
                <h3 className="salon-board__db-section-title">売上分析</h3>
                <div className="salon-board__card-grid">
                  <button
                    className="salon-board__action-card salon-board__action-card--analytics"
                    onClick={() => handlePageChange('analytics')}
                  >
                    <BarChart3 className="salon-board__card-icon" />
                    <div className="salon-board__card-content">
                      <h4>売上分析</h4>
                      <p>売上レポート・統計</p>
                    </div>
                  </button>
                  <div className="salon-board__stats-card">
                    <div className="salon-board__stats-list">
                      <div className="salon-board__stat-item">
                        <span className="salon-board__stat-label">本日の予約</span>
                        <span className="salon-board__stat-value">{bookings.filter(b => b.type === 'booking').length}件</span>
                      </div>
                      <div className="salon-board__stat-item">
                        <span className="salon-board__stat-label">
                          <span className="salon-board__stat-label-with-icon">
                            <span className="salon-board__stat-category-indicator salon-board__stat-category-indicator--facial"></span>
                            フェイシャル
                          </span>
                        </span>
                        <span className="salon-board__stat-value">
                          {bookings.filter(b => b.serviceType === 'フェイシャル').length}件
                        </span>
                      </div>
                      <div className="salon-board__stat-item">
                        <span className="salon-board__stat-label">
                          <span className="salon-board__stat-label-with-icon">
                            <span className="salon-board__stat-category-indicator salon-board__stat-category-indicator--body"></span>
                            ボディトリート
                          </span>
                        </span>
                        <span className="salon-board__stat-value">
                          {bookings.filter(b => b.serviceType === 'ボディトリート').length}件
                        </span>
                      </div>
                      <div className="salon-board__stat-item">
                        <span className="salon-board__stat-label">
                          <span className="salon-board__stat-label-with-icon">
                            <span className="salon-board__stat-category-indicator salon-board__stat-category-indicator--coupon"></span>
                            クーポン
                          </span>
                        </span>
                        <span className="salon-board__stat-value">
                          {bookings.filter(b => b.serviceType === 'クーポン').length}件
                        </span>
                      </div>
                      <div className="salon-board__stat-item">
                        <span className="salon-board__stat-label">
                          <span className="salon-board__stat-label-with-icon">
                            <span className="salon-board__stat-category-indicator salon-board__stat-category-indicator--limited"></span>
                            期間限定
                          </span>
                        </span>
                        <span className="salon-board__stat-value">
                          {bookings.filter(b => b.serviceType === '期間限定').length}件
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CalendarModal
        isOpen={activeModal === 'calendar'}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onClose={closeModal}
      />
    </div>
  );
};
export default SalonBoard;