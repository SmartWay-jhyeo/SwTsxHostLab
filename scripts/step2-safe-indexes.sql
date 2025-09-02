-- 2단계: districts 테이블 인덱스
-- 1단계 완료 후 안정성 확인 후 실행

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_districts_city_id ON districts(city_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_districts_name ON districts(district_name);
