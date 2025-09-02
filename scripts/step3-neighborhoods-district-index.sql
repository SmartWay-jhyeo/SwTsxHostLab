-- 3단계: neighborhoods 테이블에 district_id 인덱스 생성
-- 특정 시/군/구의 읍/면/동을 빠르게 찾을 수 있게 함

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_neighborhoods_district_id ON neighborhoods(district_id);
