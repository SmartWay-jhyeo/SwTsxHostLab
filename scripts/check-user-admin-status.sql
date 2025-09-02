-- 현재 사용자들의 관리자 상태 확인
SELECT id, email, is_admin, created_at 
FROM auth_users 
ORDER BY created_at DESC;
