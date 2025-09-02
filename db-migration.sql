-- 분석 결과 테이블 생성
CREATE TABLE IF NOT EXISTS analysis_results (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  client_name TEXT,
  room_count INTEGER,
  password TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 상담일지 테이블 생성
CREATE TABLE IF NOT EXISTS consultation_notes (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  location TEXT,
  analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
  room_ids JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_analysis_id ON consultation_notes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_user_id ON consultation_notes(user_id);
