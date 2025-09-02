-- 생성된 인덱스들이 제대로 만들어졌는지 확인하는 스크립트

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('cities', 'districts', 'neighborhoods')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 인덱스 크기도 확인
SELECT 
    t.tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes s
JOIN pg_stat_user_tables t ON s.relid = t.relid
WHERE t.schemaname = 'public'
    AND t.tablename IN ('cities', 'districts', 'neighborhoods')
    AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;
