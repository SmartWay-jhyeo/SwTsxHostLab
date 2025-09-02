-- analysis_results 테이블에서 location 데이터 샘플 확인
SELECT DISTINCT location 
FROM analysis_results 
WHERE location IS NOT NULL 
LIMIT 10;

-- 다른 테이블들에서 지역 관련 컬럼 찾기
SELECT t.table_name, c.column_name, c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND (c.column_name LIKE '%city%' OR c.column_name LIKE '%district%' OR c.column_name LIKE '%location%' OR c.column_name LIKE '%region%')
ORDER BY t.table_name, c.column_name;
