-- 현재 데이터베이스의 모든 테이블 확인
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
