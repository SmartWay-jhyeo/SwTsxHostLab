-- 데이터베이스의 모든 테이블 목록 조회
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 지역 관련 테이블 찾기 (이름에 region, area, location, city, district, neighborhood 등이 포함된 테이블)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%region%' OR 
  table_name LIKE '%area%' OR 
  table_name LIKE '%location%' OR
  table_name LIKE '%city%' OR
  table_name LIKE '%district%' OR
  table_name LIKE '%neighborhood%' OR
  table_name LIKE '%place%' OR
  table_name LIKE '%geo%'
)
ORDER BY table_name;
