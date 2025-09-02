-- 실제 사용자 관련 테이블들 확인
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name LIKE '%user%' OR table_name LIKE '%auth%'
ORDER BY table_schema, table_name;
