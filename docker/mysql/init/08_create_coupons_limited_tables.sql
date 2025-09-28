-- docker/mysql/init/08_create_coupons_limited_tables.sql
-- クーポン・期間限定メニュー用テーブル作成

USE salon_db;

-- クーポンテーブル
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    coupon_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'クーポンコード',
    name VARCHAR(100) NOT NULL COMMENT 'クーポン名',
    description TEXT COMMENT '説明',
    discount_type ENUM('percentage', 'amount') NOT NULL COMMENT '割引タイプ',
    discount_value INT NOT NULL COMMENT '割引値',
    valid_from DATE COMMENT '有効期限開始',
    valid_until DATE COMMENT '有効期限終了',
    usage_limit INT DEFAULT NULL COMMENT '使用回数上限',
    used_count INT DEFAULT 0 COMMENT '使用済み回数',
    is_active BOOLEAN DEFAULT TRUE COMMENT '有効フラグ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (coupon_code),
    INDEX idx_valid_dates (valid_from, valid_until),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 期間限定メニューテーブル
CREATE TABLE IF NOT EXISTS limited_offers (
    offer_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL COMMENT 'メニュー名',
    description TEXT COMMENT '説明',
    category VARCHAR(50) COMMENT 'カテゴリ',
    duration_minutes INT DEFAULT 60 COMMENT '施術時間',
    original_price INT NOT NULL COMMENT '通常価格',
    special_price INT NOT NULL COMMENT '特別価格',
    start_date DATE NOT NULL COMMENT '開始日',
    end_date DATE NOT NULL COMMENT '終了日',
    max_bookings INT DEFAULT NULL COMMENT '最大予約数',
    current_bookings INT DEFAULT 0 COMMENT '現在の予約数',
    is_active BOOLEAN DEFAULT TRUE COMMENT '有効フラグ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dates (start_date, end_date),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- クーポン使用履歴テーブル
CREATE TABLE IF NOT EXISTS coupon_usage (
    usage_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    coupon_id CHAR(36) NOT NULL,
    customer_id CHAR(36) NOT NULL,
    booking_id CHAR(36) DEFAULT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discount_amount INT NOT NULL COMMENT '割引額',
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    INDEX idx_coupon (coupon_id),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 回数券テーブルに性別カラムを追加
SET @exist_gender := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'salon_db' AND TABLE_NAME = 'ticket_plans' AND COLUMN_NAME = 'gender_restriction');
SET @sqlstmt := IF(@exist_gender = 0, 
    'ALTER TABLE ticket_plans ADD COLUMN gender_restriction ENUM(''all'', ''male'', ''female'') DEFAULT ''all'' COMMENT ''性別制限'' AFTER name', 
    'SELECT ''gender_restriction already exists'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- サンプルデータ挿入
INSERT INTO coupons (coupon_code, name, description, discount_type, discount_value, valid_from, valid_until)
VALUES 
    ('NEWUSER20', '新規限定20%OFF', '初回ご利用のお客様限定', 'percentage', 20, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 MONTH)),
    ('SUMMER2025', '夏季限定クーポン', '夏の特別キャンペーン', 'amount', 1000, '2025-07-01', '2025-08-31')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO limited_offers (name, description, category, duration_minutes, original_price, special_price, start_date, end_date)
VALUES 
    ('夏季限定クールダウンコース', '暑い夏を乗り切る特別コース', 'ボディトリート', 90, 15000, 10000, '2025-07-01', '2025-08-31'),
    ('新春特別フェイシャル', '新年の特別フェイシャルコース', 'フェイシャル', 60, 10000, 7000, '2025-01-01', '2025-01-31');

-- 確認用
SELECT 'クーポンテーブル作成完了' as message;
DESCRIBE coupons;

SELECT '期間限定メニューテーブル作成完了' as message;
DESCRIBE limited_offers;

SELECT '回数券テーブル更新完了' as message;
DESCRIBE ticket_plans;