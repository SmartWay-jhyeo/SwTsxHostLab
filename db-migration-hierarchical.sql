-- 새로운 계층적 데이터베이스 구조 생성

-- 1. cities 테이블 (시/도)
CREATE TABLE IF NOT EXISTS cities (
  city_id SERIAL PRIMARY KEY,
  city_name VARCHAR(50) NOT NULL UNIQUE,
  city_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. districts 테이블 (구/군)
CREATE TABLE IF NOT EXISTS districts (
  district_id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(city_id) ON DELETE CASCADE,
  district_name VARCHAR(50) NOT NULL,
  district_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(city_id, district_name)
);

-- 3. neighborhoods 테이블 (동/읍/면)
CREATE TABLE IF NOT EXISTS neighborhoods (
  neighborhood_id SERIAL PRIMARY KEY,
  district_id INTEGER NOT NULL REFERENCES districts(district_id) ON DELETE CASCADE,
  neighborhood_name VARCHAR(50) NOT NULL,
  source_file VARCHAR(255),
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  property_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(district_id, neighborhood_name)
);

-- 4. properties 테이블 (부동산 기본 정보)
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  neighborhood_id INTEGER NOT NULL REFERENCES neighborhoods(neighborhood_id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL UNIQUE, -- JSON의 원본 ID
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  building_type VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  crawled_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. property_details 테이블 (물리적 특성)
CREATE TABLE IF NOT EXISTS property_details (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_count INTEGER DEFAULT 0,
  bathroom_count INTEGER DEFAULT 0,
  kitchen_count INTEGER DEFAULT 0,
  living_room_count INTEGER DEFAULT 0,
  size_pyeong DECIMAL(5, 2),
  has_elevator BOOLEAN DEFAULT false,
  parking_info TEXT,
  is_super_host BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. property_pricing 테이블 (가격 정보)
CREATE TABLE IF NOT EXISTS property_pricing (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  weekly_price INTEGER DEFAULT 0,
  weekly_maintenance INTEGER DEFAULT 0,
  cleaning_fee INTEGER DEFAULT 0,
  discount_2weeks DECIMAL(5, 2) DEFAULT 0,
  discount_3weeks DECIMAL(5, 2) DEFAULT 0,
  discount_4weeks DECIMAL(5, 2) DEFAULT 0,
  discount_5weeks DECIMAL(5, 2) DEFAULT 0,
  discount_6weeks DECIMAL(5, 2) DEFAULT 0,
  discount_7weeks DECIMAL(5, 2) DEFAULT 0,
  discount_8weeks DECIMAL(5, 2) DEFAULT 0,
  discount_9weeks DECIMAL(5, 2) DEFAULT 0,
  discount_10weeks DECIMAL(5, 2) DEFAULT 0,
  discount_11weeks DECIMAL(5, 2) DEFAULT 0,
  discount_12weeks DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. property_occupancy 테이블 (예약율)
CREATE TABLE IF NOT EXISTS property_occupancy (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  occupancy_rate DECIMAL(5, 2) DEFAULT 0,
  occupancy_2rate DECIMAL(5, 2) DEFAULT 0,
  occupancy_3rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. property_images 테이블 (이미지)
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. property_reviews 테이블 (개별 리뷰)
CREATE TABLE IF NOT EXISTS property_reviews (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_name VARCHAR(100),
  review_date VARCHAR(20),
  score DECIMAL(2, 1),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. property_review_summary 테이블 (리뷰 통계)
CREATE TABLE IF NOT EXISTS property_review_summary (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  review_count INTEGER DEFAULT 0,
  average_score DECIMAL(3, 2) DEFAULT 0,
  latest_review_date VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_districts_city_id ON districts(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_district_id ON neighborhoods(district_id);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_id ON properties(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_id ON properties(property_id);
CREATE INDEX IF NOT EXISTS idx_property_details_property_id ON property_details(property_id);
CREATE INDEX IF NOT EXISTS idx_property_pricing_property_id ON property_pricing(property_id);
CREATE INDEX IF NOT EXISTS idx_property_occupancy_property_id ON property_occupancy(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_property_id ON property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_review_summary_property_id ON property_review_summary(property_id);

-- 기본 데이터 삽입 (인천광역시 연수구 옥련동)
INSERT INTO cities (city_name) VALUES ('인천광역시') ON CONFLICT (city_name) DO NOTHING;

INSERT INTO districts (city_id, district_name) 
SELECT city_id, '연수구' 
FROM cities 
WHERE city_name = '인천광역시' 
ON CONFLICT (city_id, district_name) DO NOTHING;

INSERT INTO neighborhoods (district_id, neighborhood_name)
SELECT district_id, '옥련동'
FROM districts d
JOIN cities c ON d.city_id = c.city_id
WHERE c.city_name = '인천광역시' AND d.district_name = '연수구'
ON CONFLICT (district_id, neighborhood_name) DO NOTHING;
