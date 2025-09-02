-- property_pricing 테이블에 cleaning_cost 컬럼 추가
ALTER TABLE property_pricing 
ADD COLUMN IF NOT EXISTS cleaning_cost INTEGER DEFAULT 100000;

-- 기존 데이터의 cleaning_cost가 NULL이거나 0인 경우 기본값으로 설정
UPDATE property_pricing 
SET cleaning_cost = 100000 
WHERE cleaning_cost IS NULL OR cleaning_cost = 0;

-- 컬럼에 NOT NULL 제약조건 추가
ALTER TABLE property_pricing 
ALTER COLUMN cleaning_cost SET NOT NULL;

-- 인덱스 추가 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_property_pricing_cleaning_cost 
ON property_pricing(cleaning_cost);
