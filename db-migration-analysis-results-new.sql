-- 새로운 분석 결과 테이블 생성 (정규화된 구조)
CREATE TABLE IF NOT EXISTS analysis_results_new (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  client_name TEXT,
  room_count INTEGER,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 분석 결과에 포함된 매물 정보 테이블
CREATE TABLE IF NOT EXISTS analysis_properties (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results_new(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  building_type TEXT,
  room_count INTEGER,
  weekly_price INTEGER,
  weekly_maintenance INTEGER,
  cleaning_fee INTEGER,
  size_pyeong NUMERIC(10,2),
  occupancy_rate NUMERIC(5,2),
  images JSONB,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 분석 결과에 포함된 비용 정보 테이블
CREATE TABLE IF NOT EXISTS analysis_costs (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results_new(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL,
  monthly_rent INTEGER,
  maintenance_fee INTEGER,
  cleaning_cost INTEGER,
  setup_cost INTEGER,
  deposit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 상담 일지 테이블 (정규화된 구조)
CREATE TABLE IF NOT EXISTS consultation_notes_new (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  location TEXT,
  analysis_id INTEGER REFERENCES analysis_results_new(id) ON DELETE CASCADE,
  property_ids INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_analysis_results_new_user_id ON analysis_results_new(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_properties_analysis_id ON analysis_properties(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_costs_analysis_id ON analysis_costs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_new_analysis_id ON consultation_notes_new(analysis_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_new_user_id ON consultation_notes_new(user_id);

-- 기존 데이터 마이그레이션 함수
CREATE OR REPLACE FUNCTION migrate_analysis_data()
RETURNS INTEGER AS $$
DECLARE
  old_record RECORD;
  new_analysis_id INTEGER;
  property_record JSONB;
  property_count INTEGER := 0;
  total_migrated INTEGER := 0;
BEGIN
  -- 기존 테이블이 존재하는지 확인
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analysis_results') THEN
    RETURN 0;
  END IF;

  -- 기존 데이터를 순회하며 새 테이블로 마이그레이션
  FOR old_record IN SELECT * FROM analysis_results LOOP
    -- 새 분석 결과 테이블에 기본 정보 삽입
    INSERT INTO analysis_results_new (
      title, description, location, client_name, room_count, password, created_at, updated_at, user_id
    ) VALUES (
      old_record.title, 
      old_record.description, 
      old_record.location, 
      old_record.client_name, 
      old_record.room_count, 
      old_record.password, 
      old_record.created_at, 
      old_record.updated_at, 
      old_record.user_id
    ) RETURNING id INTO new_analysis_id;
    
    -- 매물 데이터가 배열인 경우 각 매물을 개별 레코드로 삽입
    IF jsonb_typeof(old_record.data) = 'array' THEN
      property_count := jsonb_array_length(old_record.data);
      
      FOR i IN 0..(property_count-1) LOOP
        property_record := old_record.data->i;
        
        -- 매물 정보 삽입
        INSERT INTO analysis_properties (
          analysis_id, property_id, name, address, building_type, room_count, 
          weekly_price, weekly_maintenance, cleaning_fee, size_pyeong, 
          occupancy_rate, images, latitude, longitude
        ) VALUES (
          new_analysis_id,
          (property_record->>'id')::INTEGER,
          property_record->>'name',
          property_record->>'address',
          property_record->>'building_type',
          COALESCE((property_record->>'room_count')::INTEGER, 1),
          COALESCE((property_record->>'weekly_price')::INTEGER, 0),
          COALESCE((property_record->>'weekly_maintenance')::INTEGER, 0),
          COALESCE((property_record->>'cleaning_fee')::INTEGER, 0),
          COALESCE((property_record->>'size_pyeong')::NUMERIC, 0),
          COALESCE((property_record->>'occupancy_rate')::NUMERIC, 0),
          COALESCE(property_record->'images', '[]'::JSONB),
          COALESCE((property_record->>'latitude')::NUMERIC, NULL),
          COALESCE((property_record->>'longitude')::NUMERIC, NULL)
        );
      END LOOP;
    END IF;
    
    total_migrated := total_migrated + 1;
  END LOOP;

  -- 상담 일지 마이그레이션
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consultation_notes') THEN
    INSERT INTO consultation_notes_new (
      title, content, location, analysis_id, property_ids, created_at, updated_at, user_id
    )
    SELECT 
      COALESCE(title, '제목 없음'),
      content,
      location,
      analysis_id,
      COALESCE(room_ids, '[]'::JSONB)::INTEGER[],
      created_at,
      updated_at,
      user_id
    FROM consultation_notes;
  END IF;

  RETURN total_migrated;
END;
$$ LANGUAGE plpgsql;

-- 마이그레이션 함수 실행
-- SELECT migrate_analysis_data();
