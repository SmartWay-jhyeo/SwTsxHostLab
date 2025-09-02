-- 기존 데이터에 user_id 컬럼이 없는 경우 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analysis_results' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE analysis_results ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 관리자 ID 확인 (첫 번째 관리자 사용자 찾기)
-- 실제 환경에서는 특정 관리자 ID를 직접 지정하는 것이 좋습니다
WITH admin_user AS (
  SELECT id FROM auth.users 
  WHERE id IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
  LIMIT 1
)
-- user_id가 NULL인 모든 레코드에 관리자 ID 할당
UPDATE analysis_results
SET user_id = (SELECT id FROM admin_user)
WHERE user_id IS NULL;
