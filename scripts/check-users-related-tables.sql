-- 사용자 관련 테이블들 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%'
ORDER BY table_name, ordinal_position;
