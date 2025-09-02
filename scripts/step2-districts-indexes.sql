-- 2단계: districts 테이블에 city_id 인덱스 생성
-- 특정 시/도의 시/군/구를 빠르게 찾을 수 있게 함

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_districts_city_id ON districts(city_id);
