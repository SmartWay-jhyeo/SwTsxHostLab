-- 현재 데이터베이스의 모든 테이블 확인
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 지역 관련 데이터가 있는 테이블 찾기
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%region%' OR table_name LIKE '%location%' OR table_name LIKE '%area%' OR table_name LIKE '%city%' OR table_name LIKE '%district%');

-- analysis_results 테이블의 구조 확인 (지역 정보가 있을 수 있음)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'analysis_results'
ORDER BY ordinal_position;
