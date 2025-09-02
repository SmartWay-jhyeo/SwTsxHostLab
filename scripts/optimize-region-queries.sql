-- 지역 데이터 조회 성능 최적화를 위한 인덱스 생성

-- cities 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(city_name);

-- districts 테이블 인덱스  
CREATE INDEX IF NOT EXISTS idx_districts_city_id ON districts(city_id);
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts(district_name);
CREATE INDEX IF NOT EXISTS idx_districts_city_name ON districts(city_id, district_name);

-- neighborhoods 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_neighborhoods_district_id ON neighborhoods(district_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_name ON neighborhoods(neighborhood_name);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_district_name ON neighborhoods(district_id, neighborhood_name);

-- properties 테이블 인덱스 (지역별 조회용)
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_id ON properties(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_active ON properties(neighborhood_id, is_active) WHERE is_active = true;

-- 복합 인덱스로 JOIN 성능 향상
CREATE INDEX IF NOT EXISTS idx_districts_cities_join ON districts(city_id) INCLUDE (district_name);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_districts_join ON neighborhoods(district_id) INCLUDE (neighborhood_name);

-- 권한 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_user_region_permissions_user_id ON user_region_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_region_permissions_city ON user_region_permissions(city_name);
CREATE INDEX IF NOT EXISTS idx_user_region_permissions_district ON user_region_permissions(city_name, district_name);
CREATE INDEX IF NOT EXISTS idx_user_region_permissions_neighborhood ON user_region_permissions(city_name, district_name, neighborhood_name);

-- 통계 업데이트
ANALYZE cities;
ANALYZE districts; 
ANALYZE neighborhoods;
ANALYZE properties;
ANALYZE user_region_permissions;
