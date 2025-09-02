-- 지역 관련 테이블들의 구조와 데이터 조사

-- 1. 모든 테이블 목록 확인 (지역 관련)
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%city%' OR table_name LIKE '%district%' OR table_name LIKE '%neighborhood%' OR table_name LIKE '%region%' OR table_name LIKE '%hierarchical%')
ORDER BY table_name;
