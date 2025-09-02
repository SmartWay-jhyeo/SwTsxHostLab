-- 3단계: neighborhoods 테이블 인덱스
-- 2단계 완료 후 안정성 확인 후 실행

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_neighborhoods_district_id ON neighborhoods(district_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_neighborhoods_name ON neighborhoods(neighborhood_name);
