// contexts/ScheduleContext.tsx
"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useStaff } from './StaffContext';

interface Booking {
  id: string;
  staffId: string;
  staffName: string;
  bed: string;
  date: string;
  startTime: string;
  endTime: string;
  service: string;
  client: string;
  serviceType: string;
  status: string;
  type: string;
}

interface StaffShift {
  staff_id: string;
  name: string;
  color: string;
  role: string;
  hourly_wage: number;
  transport_allowance: number;
  is_active: boolean;
  shift: any;
  hasShift: boolean;
}

interface ScheduleCache {
  [date: string]: {
    bookings: Booking[];
    staffShifts: StaffShift[];
    timestamp: number;
  };
}

interface ScheduleContextType {
  getScheduleForDate: (date: string) => Promise<{ bookings: Booking[]; staffShifts: StaffShift[] }>;
  clearCache: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const { activeStaff } = useStaff();
  const [cache, setCache] = useState<ScheduleCache>({});
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5分

  const getScheduleForDate = useCallback(async (date: string) => {
    const now = Date.now();
    
    // キャッシュチェック
    if (cache[date] && (now - cache[date].timestamp) < CACHE_DURATION) {
      console.log(`ScheduleContext: ${date}のキャッシュを使用`);
      return {
        bookings: cache[date].bookings,
        staffShifts: cache[date].staffShifts
      };
    }

    console.log(`ScheduleContext: ${date}のデータを取得`);
    
    // シフトデータを取得
    const [year, month] = date.split('-');
    const shiftsPromises = activeStaff.map(async (staff) => {
      const shiftResponse = await fetch(`/api/shifts?staffId=${staff.staff_id}&year=${year}&month=${month}`);
      const shiftData = await shiftResponse.json();
      const dayShift = shiftData.data?.shifts?.find((s: any) => s.date.startsWith(date));
      return { ...staff, shift: dayShift || null, hasShift: !!dayShift };
    });
    const staffShifts = await Promise.all(shiftsPromises);

    // 予約データを取得
    const response = await fetch(`/api/bookings?date=${date}`);
    const data = await response.json();
    
    let bookings: Booking[] = [];
    if (data.success) {
      bookings = data.data.map((b: any) => ({
        id: b.booking_id,
        staffId: b.staff_id,
        staffName: b.staff_name,
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
    }

    // キャッシュに保存
    setCache(prev => ({
      ...prev,
      [date]: {
        bookings,
        staffShifts,
        timestamp: now
      }
    }));

    return { bookings, staffShifts };
  }, [activeStaff, cache]);

  const clearCache = useCallback(() => {
    console.log('ScheduleContext: キャッシュをクリア');
    setCache({});
  }, []);

  return (
    <ScheduleContext.Provider value={{ getScheduleForDate, clearCache }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}