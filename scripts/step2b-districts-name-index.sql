-- districts 테이블에 이름 인덱스 생성
-- 시/군/구 이름으로 빠르게 검색할 수 있게 함

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_districts_name ON districts(district_name);
