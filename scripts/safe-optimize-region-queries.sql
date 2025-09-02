-- 안전한 지역 데이터 조회 성능 최적화
-- CONCURRENTLY 옵션으로 락 없이 인덱스 생성

-- 1단계: 중요도 높은 인덱스부터 생성 (락 시간 최소화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_name ON cities(city_name);

-- 2단계: districts 테이블 인덱스 (순차적으로)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_districts_city_id ON districts(city_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_districts_name ON districts(district_name);

-- 3단계: neighborhoods 테이블 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_neighborhoods_district_id ON neighborhoods(district_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_neighborhoods_name ON neighborhoods(neighborhood_name);

-- 4단계: 복합 인덱스 (선택적 적용)
-- 주의: 복합 인덱스는 더 많은 공간을 사용하므로 필요시에만 적용
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_districts_city_name ON districts(city_id, district_name);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_neighborhoods_district_name ON neighborhoods(district_id, neighborhood_name);

-- 통계 업데이트는 별도로 실행 (선택사항)
-- ANALYZE cities;
-- ANALYZE districts; 
-- ANALYZE neighborhoods;
