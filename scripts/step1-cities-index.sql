-- 1단계: cities 테이블에 인덱스 생성
-- 시/도 이름으로 빠르게 검색할 수 있게 함

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_name ON cities(city_name);
