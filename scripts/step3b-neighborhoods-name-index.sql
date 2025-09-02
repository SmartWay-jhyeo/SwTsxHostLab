-- neighborhoods 테이블에 이름 인덱스 생성
-- 읍/면/동 이름으로 빠르게 검색할 수 있게 함

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_neighborhoods_name ON neighborhoods(neighborhood_name);
