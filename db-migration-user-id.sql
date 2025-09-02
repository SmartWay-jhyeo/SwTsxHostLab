-- analysis_results 테이블에 user_id 컬럼이 없는지 확인
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'analysis_results'
        AND column_name = 'user_id'
    ) THEN
        -- user_id 컬럼 추가
        ALTER TABLE analysis_results ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- profiles 테이블이 없는지 확인
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'profiles'
    ) THEN
        -- profiles 테이블 생성
        CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- RLS 정책 설정
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- 관리자는 모든 프로필을 볼 수 있음
        CREATE POLICY "Admins can view all profiles"
        ON profiles FOR SELECT
        USING (
            auth.uid() IN (
                SELECT id FROM profiles WHERE role = 'admin'
            )
        );
        
        -- 사용자는 자신의 프로필만 볼 수 있음
        CREATE POLICY "Users can view own profile"
        ON profiles FOR SELECT
        USING (auth.uid() = id);
        
        -- 사용자는 자신의 프로필만 업데이트할 수 있음
        CREATE POLICY "Users can update own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;
END $$;
