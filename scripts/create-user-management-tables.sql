-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 지역 권한 테이블 생성
CREATE TABLE IF NOT EXISTS user_region_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_name VARCHAR(100),
  district_name VARCHAR(100),
  neighborhood_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, city_name, district_name, neighborhood_name)
);

-- 기본 관리자 사용자 추가 (개발용)
INSERT INTO users (id, email, username, is_admin) 
VALUES 
  ('admin-uuid-1', 'admin@example.com', 'admin', TRUE),
  ('user-uuid-1', 'user@example.com', 'user', FALSE)
ON CONFLICT (email) DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_region_permissions_user_id ON user_region_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_region_permissions_city ON user_region_permissions(city_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_region_permissions ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 데이터에 접근 가능
CREATE POLICY "관리자는 모든 사용자 데이터 접근 가능" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND users.is_admin = true
    )
  );

CREATE POLICY "관리자는 모든 권한 데이터 접근 가능" ON user_region_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND users.is_admin = true
    )
  );

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "사용자는 자신의 정보만 조회 가능" ON users
  FOR SELECT USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

CREATE POLICY "사용자는 자신의 권한만 조회 가능" ON user_region_permissions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );
