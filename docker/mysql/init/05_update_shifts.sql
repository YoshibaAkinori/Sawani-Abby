-- docker/mysql/init/05_update_shifts.sql
-- 既存のshiftsテーブルに給与関連のカラムを追加

-- 交通費カラムを追加
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS transport_cost INT DEFAULT 0 
COMMENT '交通費' AFTER end_time;

-- 時給カラムを追加（その時点での時給を記録）
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS hourly_wage INT DEFAULT 900 
COMMENT '時給' AFTER transport_cost;

-- 日給カラムを追加（計算値を保存）
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS daily_wage INT DEFAULT 0 
COMMENT '日給' AFTER hourly_wage;

-- 休憩時間カラムを追加
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS break_minutes INT DEFAULT 0 
COMMENT '休憩時間（分）' AFTER end_time;

-- 備考カラムを追加
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS notes TEXT 
COMMENT '備考' AFTER daily_wage;

-- タイムスタンプカラムを追加
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- インデックスを追加（パフォーマンス向上）
ALTER TABLE shifts 
ADD INDEX IF NOT EXISTS idx_staff_month (staff_id, date);

-- 既存データがある場合のデフォルト値設定
UPDATE shifts 
SET transport_cost = 313,
    hourly_wage = 900,
    daily_wage = CASE 
        WHEN start_time IS NOT NULL AND end_time IS NOT NULL 
        THEN FLOOR((TIME_TO_SEC(TIMEDIFF(end_time, start_time)) / 3600) * 900)
        ELSE 0
    END
WHERE transport_cost IS NULL;