-- RPC 함수: 테이블 존재 여부 확인 후 삭제
CREATE OR REPLACE FUNCTION drop_table_if_exists(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 함수: SQL 쿼리 실행
CREATE OR REPLACE FUNCTION run_sql(sql_query text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 상담일지 테이블 생성 스크립트
DROP TABLE IF EXISTS public.consultation_notes;

CREATE TABLE public.consultation_notes (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consultation_notes_user_id ON public.consultation_notes(user_id);
CREATE INDEX idx_consultation_notes_created_at ON public.consultation_notes(created_at);
