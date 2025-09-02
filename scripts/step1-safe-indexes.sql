-- 1단계: 가장 중요한 인덱스만 먼저 생성
-- 트래픽이 적은 시간대에 실행 권장

-- cities 테이블 인덱스 (가장 중요)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_name ON cities(city_name);

-- 실행 후 성능 모니터링 필요
-- 문제 없으면 다음 단계 진행
