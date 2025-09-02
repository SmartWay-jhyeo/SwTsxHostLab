-- 검색 성능 최적화를 위한 인덱스 생성

-- 1. 주소 검색을 위한 GIN 인덱스 (한국어 전문 검색)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_address_gin 
ON properties USING gin(to_tsvector('korean', address));

-- 2. 활성 상태와 주소 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_address 
ON properties(is_active, address) WHERE is_active = true;

-- 3. 지역명 검색을 위한 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_neighborhoods_name_gin 
ON neighborhoods USING gin(to_tsvector('korean', neighborhood_name));

-- 4. 외래키 관계 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_details_property_id 
ON property_details(property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_pricing_property_id 
ON property_pricing(property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_occupancy_property_id 
ON property_occupancy(property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_review_summary_property_id 
ON property_review_summary(property_id);

-- 5. 자주 사용되는 필터링 조건을 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_filters 
ON properties(is_active, building_type, size_pyeong) WHERE is_active = true;

-- 6. 예약률 기준 정렬을 위한 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_occupancy_rate 
ON properties(occupancy_rate DESC) WHERE is_active = true;

-- 7. 가격 기준 정렬을 위한 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_weekly_price 
ON properties(weekly_price ASC) WHERE is_active = true;

-- 8. 커버링 인덱스 (자주 조회되는 컬럼들을 포함)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_covering 
ON properties(id, name, address, latitude, longitude, building_type, weekly_price, occupancy_rate) 
WHERE is_active = true;

-- 9. 지역 기반 공간 인덱스 (위치 기반 검색 최적화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_gist 
ON properties USING gist(ll_to_earth(latitude, longitude)) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = true;

-- 10. 통계 정보 업데이트 (쿼리 플래너 최적화)
ANALYZE properties;
ANALYZE property_details;
ANALYZE property_pricing;
ANALYZE property_occupancy;
ANALYZE property_review_summary;
ANALYZE neighborhoods;

-- 11. 자동 VACUUM 설정 최적화
ALTER TABLE properties SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- 12. 검색 성능 모니터링을 위한 뷰 생성
CREATE OR REPLACE VIEW search_performance_stats AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename IN ('properties', 'neighborhoods', 'property_details', 'property_pricing')
  AND attname IN ('address', 'neighborhood_name', 'building_type', 'weekly_price', 'occupancy_rate');

-- 성능 최적화 완료 메시지
SELECT 'Search performance optimization completed successfully!' as status;
