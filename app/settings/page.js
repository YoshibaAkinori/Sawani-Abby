"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Settings, User, Clock, Users, BarChart3, CreditCard } from 'lucide-react';
import { useStaff } from '../contexts/StaffContext';
import BookingModal from './components/BookingModal';
import CalendarModal from './components/CalendarModal';
import './global.css';

const SalonBoard = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // ★ StaffContextから有効なスタッフを取得
  const { activeStaff, loading: staffLoading } = useStaff();

  // データとローディング状態
  const [staffShifts, setStaffShifts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ★ 日付が変更されたらシフトと予約の両方を取得する
  useEffect(() => {
    if (!staffLoading && activeStaff.length > 0) {
      fetchDataForDate();
    }
  }, [selectedDate, activeStaff, staffLoading]);

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

  // ★ シフトデータを取得する関数（Contextのスタッフを使用）
  const fetchShifts = async (date) => {
    const [year, month] = date.split('-');

    const shiftsPromises = activeStaff.map(async (staff) => {
      const shiftResponse = await fetch(`/api/shifts?staffId=${staff.staff_id}&year=${year}&month=${month}`);
      const shiftData = await shiftResponse.json();
      const dayShift = shiftData.data?.shifts?.find(s => s.date.startsWith(date));
      return { ...staff, shift: dayShift || null, hasShift: !!dayShift };
    });

    const staffWithShifts = await Promise.all(shiftsPromises);
    setStaffShifts(staffWithShifts);
  };

  // ★ 予約データを取得する関数
  const fetchBookings = async (date) => {
    const response = await fetch(`/api/bookings?date=${date}`);
    const data = await response.json();
    if (data.success) {
      const formattedBookings = data.data.map(b => ({
        id: b.booking_id,
        staffId: b.staff_id,
        staffName: b.staff_name, // ★ 予約データにスタッフ名を保持
        bed: b.bed_id ? `ベッド${b.bed_id}` : '',
        date: b.date.split('T')[0],
        startTime: b.start_time,
        endTime: b.end_time,
        service: b.service_name || b.notes || '予定',
        client: `${b.last_name || ''} ${b.first_name || ''}`,
        serviceType: b.service_category || '予定',
        status: b.status,
        type: b.type
      }));
      setBookings(formattedBookings);
    } else {
      setBookings([]);
    }
  };

  const bedCount = 2;
  const beds = Array.from({ length: bedCount }, (_, i) => `ベッド${i + 1}`);

  const timeSlots = [];
  for (let hour = 9; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

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
    const timelineStartMinutes = 9 * 60;
    const totalTimelineMinutes = (24 - 9) * 60;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    const leftPercent = ((startMinutes - timelineStartMinutes) / totalTimelineMinutes) * 100;
    const widthPercent = (duration / totalTimelineMinutes) * 100;
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getServiceColorClass = (serviceType) => {
    const typeMap = {
      '新規': 'salon-board__booking--new',
      '会員': 'salon-board__booking--member',
      '体験': 'salon-board__booking--trial',
      '予定': 'salon-board__booking--schedule'
    };
    return typeMap[serviceType] || 'salon-board__booking--default';
  };

  const changeDate = (days) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // スロットがシフト時間内かチェック（マネージャーは常にtrue）
  const isSlotInShiftTime = (staff, timeSlot) => {
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

  // 予約カードクリック処理
  const handleBookingClick = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const booking = data.data[0];
        setSelectedSlot({
          bookingId: booking.booking_id,
          isEdit: true,
          staffId: booking.staff_id,
          staffName: booking.staff_name,
          date: booking.date.split('T')[0],
          timeSlot: booking.start_time,
          bookingData: booking
        });
        setActiveModal('booking');
      }
    } catch (err) {
      console.error('予約詳細取得エラー:', err);
      alert('予約情報の取得に失敗しました');
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedSlot(null);
  };

  const toggleSettings = () => {
    router.push('/settings');
  };

  const openCalendarModal = () => {
    setActiveModal('calendar');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setActiveModal(null);
  };

  const handlePageChange = (page) => {
    router.push(`/${page}`);
    setActiveModal(null);
  };

  if (staffLoading || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div className="salon-board">
      <header className="salon-board__header">
        <div className="salon-board__header-container">
          <div className="salon-board__logo">
            <span className="salon-board__logo-text">SAWANI ABBY</span>
            <span className="salon-board__logo-subtitle">スタッフスケジュール管理</span>
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

        <div className="shared-horizontal-scroller">
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
                                  <div
                                    key={booking.id}
                                    className={`salon-board__booking ${serviceColorClass}`}
                                    onClick={() => handleBookingClick(booking.id)}
                                    style={{ left, width, cursor: 'pointer' }}
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

            {/* ベッド別スケジュール */}
            <div className="salon-board__section">
              <h3 className="salon-board__section-title">ベッド別スケジュール</h3>
              <div className="salon-board__rows">
                {[headerRowData, ...beds.map(bed => ({ id: bed, name: bed }))].map((bed, bedIndex) => {
                  const isHeader = bedIndex === 0;
                  return (
                    <div
                      key={bed.id}
                      className={`salon-board__row ${isHeader ? 'salon-board__row--is-header' : ''}`}
                    >
                      <div className="salon-board__staff-info">
                        {!isHeader && (
                          <>
                            <div className="salon-board__staff-color" style={{ backgroundColor: '#6B7280' }} />
                            <div className="salon-board__staff-details">
                              <span className="salon-board__staff-name">{bed.name}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="salon-board__timeline">
                        <div className="salon-board__grid">
                          {timeSlots.map((time, index) => {
                            const isHourMark = index % 2 === 0;
                            return (
                              <div
                                key={time}
                                className={`salon-board__grid-line ${isHourMark ? 'salon-board__grid-line--hour' : ''}`}
                                style={{ backgroundColor: isHourMark ? '#f8f9fa' : 'transparent' }}
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
                          bookings
                            .filter(booking => booking.bed === bed.name)
                            .map(booking => {
                              const { left, width } = calculateBookingPosition(booking.startTime, booking.endTime);
                              const serviceColorClass = getServiceColorClass(booking.serviceType);
                              return (
                                <div
                                  key={booking.id}
                                  className={`salon-board__booking ${serviceColorClass}`}
                                  onClick={() => handleBookingClick(booking.id)}
                                  style={{ left, width, cursor: 'pointer' }}
                                >
                                  <div className="salon-board__booking-content">
                                    {booking.type === 'schedule' ? (
                                      <>
                                        <div className="salon-board__booking-service">{booking.service}</div>
                                        <div className="salon-board__booking-time">{booking.startTime} - {booking.endTime}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="salon-board__booking-client">{booking.client}</div>
                                        <div className="salon-board__booking-service">{booking.service}</div>
                                        <div className="salon-board__booking-time">{booking.startTime} - {booking.endTime}</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeModal === 'booking' && (
        <BookingModal
          isOpen={true}
          onClose={closeModal}
          selectedSlot={selectedSlot}
          staff={displayStaff}
        />
      )}

      {activeModal === 'calendar' && (
        <CalendarModal
          isOpen={true}
          onClose={closeModal}
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default SalonBoard;