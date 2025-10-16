// contexts/StaffContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface Staff {
  staff_id: string;
  name: string;
  color: string;
  role: string;
  hourly_wage: number;
  transport_allowance: number;
  is_active: boolean;
  created_at: string;
}

interface StaffContextType {
  activeStaff: Staff[];
  loading: boolean;
  error: string | null;
  refreshStaff: (force?: boolean) => Promise<void>;
  lastFetched: number | null;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [activeStaff, setActiveStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const CACHE_DURATION = 5 * 60 * 1000; // 5分

  const fetchStaff = useCallback(async (force: boolean = false) => {
    const now = Date.now();

    // 強制更新でない場合、キャッシュ期限をチェック
    if (!force && lastFetched && (now - lastFetched) < CACHE_DURATION) {
      console.log('StaffContext: キャッシュを使用');
      return;
    }

    console.log('StaffContext: APIからスタッフデータを取得');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/staff');
      
      if (!response.ok) {
        throw new Error('スタッフデータの取得に失敗しました');
      }

      const data = await response.json();
      
      if (data.success) {
        // 有効なスタッフのみをフィルタ
        const active = data.data.filter((s: Staff) => s.is_active);
        setActiveStaff(active);
        setLastFetched(now);
      } else {
        throw new Error(data.error || 'データ取得エラー');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(errorMessage);
      console.error('StaffContext エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);

  // 初回マウント時に取得
  useEffect(() => {
    fetchStaff();
  }, []);

  const refreshStaff = useCallback(async (force: boolean = false) => {
    await fetchStaff(force);
  }, [fetchStaff]);

  return (
    <StaffContext.Provider 
      value={{ 
        activeStaff, 
        loading, 
        error, 
        refreshStaff,
        lastFetched 
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

// カスタムフック
export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}