"use client";
import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Settings, User, Clock } from 'lucide-react';
import './global.css';

const SalonBoard = () => {
  const [selectedDate, setSelectedDate] = useState('2024-09-20');

  // 設定DB（担当者マスタ）
  const [staffDatabase, setStaffDatabase] = useState([
    { id: '0001', name: '佐野 智里', color: '#FF69B4', isActive: true, holidays: [] },
    { id: '0002', name: '星野 加奈恵', color: '#9370DB', isActive: true, holidays: [] },
    { id: '0003', name: '吉羽 顕功', color: '#4169E1', isActive: true, holidays: [] },
    { id: '0004', name: '吉羽 皓紀', color: '#32CD32', isActive: true, holidays: ['2024-09-20', '2024-09-21'] },
  ]);

  // 予約DB（予約マスタ）
  const [bookingsDatabase, setBookingsDatabase] = useState([
    { id: 1, staffId: '0001', bed: 'ベッド2', date: '2024-09-20', startTime: '11:00', endTime: '13:00', service: 'フェイシャル', client: '田中 花子', serviceType: 'フェイシャル', status: 'confirmed', phoneNumber: '090-1234-5678', note: '初回のお客様' },
    { id: 2, staffId: '0001', bed: 'ベッド2', date: '2024-09-20', startTime: '14:00', endTime: '16:00', service: 'ボディトリート', client: '山田 太郎', serviceType: 'ボディトリート', status: 'confirmed', phoneNumber: '080-9876-5432', note: 'リピーター' },
    { id: 3, staffId: '0002', bed: 'ベッド1', date: '2024-09-20', startTime: '10:00', endTime: '12:00', service: 'フェイシャル', client: '鈴木 美香', serviceType: 'フェイシャル', status: 'confirmed', phoneNumber: '070-2468-1357', note: '' },
    { id: 4, staffId: '0002', bed: 'ベッド1', date: '2024-09-20', startTime: '15:00', endTime: '17:30', service: 'ボディトリート', client: '佐藤 恵子', serviceType: 'ボディトリート', status: 'confirmed', phoneNumber: '090-3691-2584', note: '肩こりがひどいとのこと' },
    { id: 5, staffId: '0003', bed: 'ベッド2', date: '2024-09-20', startTime: '18:30', endTime: '19:30', service: 'フェイシャル', client: '高橋 さくら', serviceType: 'フェイシャル', status: 'confirmed', phoneNumber: '080-7531-9642', note: '敏感肌' },
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
  const getActiveStaff = () => staffDatabase.filter(staff => staff.isActive);

  // 時間ヘッダー用の無記名スタッフデータ
  const headerRowData = {
    id: 'HEADER_ROW',
    name: '', // 空欄
    color: 'transparent',
    holidays: [],
  };
  
  const displayStaff = [headerRowData, ...getActiveStaff()];
  const bookings = getBookingsByDate(selectedDate);
  const activeStaff = getActiveStaff();

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

  return (
    <div className="salon-board">
      <header className="salon-board__header">
        <div className="salon-board__header-content">
          <div className="salon-board__header-title">
            <div className="salon-board__header-logo">
              <Calendar />
            </div>
            <h1>ABBY 予約一覧</h1>
          </div>
          
          <div className="salon-board__header-controls">
            <div className="salon-board__date-navigation">
              <button
                onClick={() => changeDate(-1)}
                className="salon-board__date-nav-btn"
              >
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
              <button
                onClick={() => changeDate(1)}
                className="salon-board__date-nav-btn"
              >
                <ChevronRight />
              </button>
            </div>
            <button className="salon-board__settings-btn">
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
              <span>スタッフ: {activeStaff.length}名</span>
            </div>
            <div className="salon-board__db-info-item">
              <Clock />
              <span>本日の予約: {bookings.length}件</span>
            </div>
          </div>
        </div>

        {/* 横スクロール対応のメインコンテナ */}
        <div className="salon-board__main-scroll-container">
          <div className="salon-board__scrollable-content">
            <div className="salon-board__schedule-grids">
              
              {/* スタッフ別セクション */}
              <div className="salon-board__section">
                <h3 className="salon-board__section-title">
                  <User />
                  スタッフ別スケジュール
                </h3>
                <div className="salon-board__rows">

                  {/* ヘッダーとスタッフを一度に描画（元の方式） */}
                  {displayStaff.map(staff => {
                    const isHeader = staff.id === 'HEADER_ROW';
                    const isHoliday = !isHeader && staff.holidays?.includes(selectedDate);
                    
                    const rowClassName = `salon-board__row ${
                      isHeader ? 'salon-board__row--is-header' : ''
                    } ${isHoliday ? 'salon-board__row--holiday' : ''}`;

                    return (
                      <div key={staff.id} className={rowClassName}>
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
                              {timeSlots.map(time => (
                                <div key={time} className="salon-board__grid-line" />
                              ))}
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
                                    <div key={`bottom-${time}`} className="time-header__cell time-header__cell--minute" >
                                      {time.split(':')[1]}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              !isHoliday && bookings
                                .filter(booking => booking.staffId === staff.id)
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
              
              {/* ベッド別セクション */}
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
                              const staff = activeStaff.find(s => s.id === booking.staffId);
                              
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

        {/* データベース管理パネル */}
        <div className="salon-board__db-panel">
          <div className="salon-board__db-section">
            <h3 className="salon-board__db-section-title">スタッフDB</h3>
            <div className="salon-board__staff-list">
              {staffDatabase.map(staff => (
                <div key={staff.id} className="salon-board__staff-item">
                  <div className="salon-board__staff-info">
                    <div 
                      className="salon-board__color-indicator"
                      style={{ backgroundColor: staff.color }}
                    ></div>
                    <span className="salon-board__staff-name">{staff.name}</span>
                  </div>
                  <span 
                    className={`salon-board__staff-status ${
                      staff.isActive 
                        ? 'salon-board__staff-status--active' 
                        : 'salon-board__staff-status--inactive'
                    }`}
                  >
                    {staff.isActive ? '有効' : '無効'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="salon-board__db-section">
            <h3 className="salon-board__db-section-title">予約DB統計</h3>
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
  );
};

export default SalonBoard;