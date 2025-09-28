"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Settings, User, Clock, Users, BarChart3, CreditCard } from 'lucide-react';
import BookingModal from './components/BookingModal';
import CalendarModal from './components/CalendarModal';
import './global.css';

const SalonBoard = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('2025-09-20');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // シフトとスタッフのデータ
  const [staffShifts, setStaffShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  // シフトデータを取得
  useEffect(() => {
    fetchShifts();
  }, [selectedDate]);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedDate.split('-');
      
      // 全スタッフを取得
      const staffResponse = await fetch('/api/staff');
      const staffData = await staffResponse.json();
      const allStaff = staffData.data || [];
      
      // 各スタッフのシフトを取得
      const shiftsPromises = allStaff.map(async (staff) => {
        const shiftResponse = await fetch(`/api/shifts?staffId=${staff.staff_id}&year=${year}&month=${month}`);
        const shiftData = await shiftResponse.json();
        
        // その日のシフトを探す
        const dayShift = shiftData.data?.shifts?.find(s => s.date === selectedDate);
        
        return {
          ...staff,
          shift: dayShift || null,
          hasShift: !!dayShift
        };
      });
      
      const staffWithShifts = await Promise.all(shiftsPromises);
      setStaffShifts(staffWithShifts);
    } catch (err) {
      console.error('シフト取得エラー:', err);
      // エラー時はデモデータを使用
      setStaffShifts(staffDatabase.map(s => ({
        ...s,
        shift: null,
        hasShift: false
      })));
    } finally {
      setIsLoading(false);
    }
  };

  // 予約DB（予約マスタ）
  const [bookingsDatabase] = useState([
    { id: 1, staffId: '0001', bed: 'ベッド2', date: '2025-09-20', startTime: '11:00', endTime: '13:00', service: 'フェイシャル', client: '田中 花子', serviceType: 'フェイシャル', status: 'confirmed' },
    { id: 2, staffId: '0001', bed: 'ベッド2', date: '2025-09-20', startTime: '14:00', endTime: '16:00', service: 'ボディトリート', client: '山田 太郎', serviceType: 'ボディトリート', status: 'confirmed' },
    { id: 3, staffId: '0002', bed: 'ベッド1', date: '2025-09-20', startTime: '10:00', endTime: '12:00', service: 'フェイシャル', client: '鈴木 美香', serviceType: 'フェイシャル', status: 'confirmed' },
    { id: 4, staffId: '0002', bed: 'ベッド1', date: '2025-09-20', startTime: '15:00', endTime: '17:30', service: 'ボディトリート', client: '佐藤 恵子', serviceType: 'ボディトリート', status: 'confirmed' },
    { id: 5, staffId: '0003', bed: 'ベッド2', date: '2025-09-20', startTime: '18:30', endTime: '19:30', service: 'フェイシャル', client: '高橋 さくら', serviceType: 'フェイシャル', status: 'confirmed' },
  ]);

  const bedCount = 2;
  const beds = Array.from({ length: bedCount }, (_, i) => `ベッド${i + 1}`);

  const timeSlots = [];
  for (let hour = 10; hour <= 23; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 23) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  const getBookingsByDate = (date) => bookingsDatabase.filter(booking => booking.date === date);

  // 時間ヘッダー用の無記名スタッフデータ
  const headerRowData = {
    id: 'HEADER_ROW',
    staff_id: 'HEADER_ROW',
    name: '',
    color: 'transparent'
  };
  
  const displayStaff = [headerRowData, ...staffShifts.filter(s => s.is_active)];
  const bookings = getBookingsByDate(selectedDate);

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculateBookingPosition = (startTime, endTime) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    const startHour = 10 * 60;
    const left = ((startMinutes - startHour) / 30) * 60;
    const width = (duration / 30) * 60;
    return { left, width };
  };

  const getServiceColorClass = (serviceType) => {
    switch (serviceType) {
      case 'フェイシャル': return 'salon-board__booking--facial';
      case 'ボディトリート': return 'salon-board__booking--body-treatment';
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
    setSidebarOpen(false);
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
              <span>スタッフ: {staffShifts.filter(s => s.is_active).length}名</span>
            </div>
            <div className="salon-board__db-info-item">
              <Clock />
              <span>本日の予約: {bookings.length}件</span>
            </div>
          </div>
        </div>

        {/* スケジュール表示エリア */}
        <div className="salon-board__schedule-area">
          {activeModal && (
            <>
              <div className="salon-board__staff-schedule-container">
                <div className="salon-board__main-scroll-container">
                  <div className="salon-board__scrollable-content">
                    <div className="salon-board__section">
                      <h3 className="salon-board__section-title">
                        <User />
                        スタッフ別スケジュール
                      </h3>
                      <div className="salon-board__rows">
                        {displayStaff.map(staff => {
                          const isHeader = staff.id === 'HEADER_ROW';
                          // マネージャーは常に勤務扱い
                          const isHoliday = !isHeader && staff.role !== 'マネージャー' && !staff.hasShift;
                          
                          const rowClassName = `salon-board__row ${
                            isHeader ? 'salon-board__row--is-header' : ''
                          } ${isHoliday ? 'salon-board__row--holiday' : ''}`;

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
                                    {timeSlots.map((time, slotIndex) => {
                                      const isInShiftTime = !isHeader && !isHoliday && isSlotInShiftTime(staff, time);
                                      const isAvailable = isInShiftTime && isSlotAvailable(staff.staff_id, time);
                                      const isOutOfShift = !isHeader && !isHoliday && !isInShiftTime;
                                      
                                      return (
                                        <div 
                                          key={time} 
                                          className={`salon-board__grid-line ${
                                            isAvailable ? 'salon-board__clickable-slot' : ''
                                          }`}
                                          onClick={() => isAvailable && handleSlotClick(staff.staff_id, time, slotIndex)}
                                          style={{ 
                                            cursor: isAvailable ? 'pointer' : 'default',
                                            backgroundColor: isOutOfShift ? '#f5f5f5' : 'transparent'
                                          }}
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
                                          <div key={booking.id} className={`salon-board__booking ${serviceColorClass}`} style={{ left: `${left}px`, width: `${width}px` }}>
                                            <div className="salon-board__booking-content">
                                              <div className="salon-board__booking-client">{booking.serviceType} {booking.client + " 様"}</div>
                                              <div className="salon-board__booking-service">{booking.bed}</div>
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
                  </div>
                </div>
              </div>

              <div className="salon-board__modal-area">
                <BookingModal 
                  activeModal={activeModal}
                  selectedSlot={selectedSlot}
                  onClose={closeModal}
                  onModalChange={setActiveModal}
                />
              </div>
            </>
          )}

          {!activeModal && (
            <div className="salon-board__unified-schedule-container">
              <div className="salon-board__main-scroll-container">
                <div className="salon-board__scrollable-content">
                  <div className="salon-board__schedule-grids">
                    <div className="salon-board__section">
                      <h3 className="salon-board__section-title">
                        <User />
                        スタッフ別スケジュール
                      </h3>
                      <div className="salon-board__rows">
                        {displayStaff.map(staff => {
                          const isHeader = staff.id === 'HEADER_ROW';
                          // マネージャーは常に勤務扱い
                          const isHoliday = !isHeader && staff.role !== 'マネージャー' && !staff.hasShift;
                          
                          const rowClassName = `salon-board__row ${
                            isHeader ? 'salon-board__row--is-header' : ''
                          } ${isHoliday ? 'salon-board__row--holiday' : ''}`;

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
                                    {timeSlots.map((time, slotIndex) => {
                                      const isInShiftTime = !isHeader && !isHoliday && isSlotInShiftTime(staff, time);
                                      const isAvailable = isInShiftTime && isSlotAvailable(staff.staff_id, time);
                                      const isOutOfShift = !isHeader && !isHoliday && !isInShiftTime;
                                      
                                      return (
                                        <div 
                                          key={time} 
                                          className={`salon-board__grid-line ${
                                            isAvailable ? 'salon-board__clickable-slot' : ''
                                          }`}
                                          onClick={() => isAvailable && handleSlotClick(staff.staff_id, time, slotIndex)}
                                          style={{ 
                                            cursor: isAvailable ? 'pointer' : 'default',
                                            backgroundColor: isOutOfShift ? '#f5f5f5' : 'transparent'
                                          }}
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
                                          <div key={booking.id} className={`salon-board__booking ${serviceColorClass}`} style={{ left: `${left}px`, width: `${width}px` }}>
                                            <div className="salon-board__booking-content">
                                              <div className="salon-board__booking-client">{booking.serviceType} {booking.client + " 様"}</div>
                                              <div className="salon-board__booking-service">{booking.bed}</div>
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

                    <div className="salon-board__section">
                      <h3 className="salon-board__section-title">
                        ベッド別スケジュール
                      </h3>
                      <div className="salon-board__rows">
                        {beds.map(bed => (
                          <div key={`bed-${bed}`} className="salon-board__row">
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
                                      className={`salon-board__grid-line ${
                                        index % 2 === 0 
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
                                      <div
                                        key={booking.id}
                                        className={`salon-board__booking ${serviceColorClass}`}
                                        style={{
                                          left: `${left}px`,
                                          width: `${width}px`,
                                        }}
                                      >
                                        <div className="salon-board__booking-content">
                                          <div className="salon-board__booking-client">
                                            {booking.serviceType} {booking.client + " 様"}
                                          </div>
                                          <div className="salon-board__booking-service salon-board__booking-service--with-icon">
                                            {staff && (
                                              <div 
                                                className="salon-board__small-color-indicator"
                                                style={{ backgroundColor: staff.color }}
                                              ></div>
                                            )}
                                            {staff?.name}
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
                    <span className="salon-board__stat-label">総予約数</span>
                    <span className="salon-board__stat-value">{bookingsDatabase.length}件</span>
                  </div>
                  <div className="salon-board__stat-item">
                    <span className="salon-board__stat-label">本日の予約</span>
                    <span className="salon-board__stat-value">{bookings.length}件</span>
                  </div>
                  <div className="salon-board__stat-item">
                    <span className="salon-board__stat-label">フェイシャル</span>
                    <span className="salon-board__stat-value">
                      {bookings.filter(b => b.serviceType === 'フェイシャル').length}件
                    </span>
                  </div>
                  <div className="salon-board__stat-item">
                    <span className="salon-board__stat-label">ボディトリート</span>
                    <span className="salon-board__stat-value">
                      {bookings.filter(b => b.serviceType === 'ボディトリート').length}件
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CalendarModal 
          isOpen={activeModal === 'calendar'}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onClose={closeModal}
        />
      </div>
    </div>
  );
};

export default SalonBoard;