-- 이 SQL 스크립트를 Supabase SQL Editor에서 한번 실행해주세요.
CREATE OR REPLACE FUNCTION get_or_create_region_ids(
    p_city_name TEXT,
    p_district_name TEXT,
    p_neighborhood_name TEXT
)
RETURNS TABLE (city_id INT, district_id INT, neighborhood_id INT) AS $$
DECLARE
    v_city_id INT;
    v_district_id INT;
    v_neighborhood_id INT;
BEGIN
    -- 1. Find or create city
    SELECT c.city_id INTO v_city_id FROM cities c WHERE c.city_name = p_city_name;
    IF v_city_id IS NULL THEN
        INSERT INTO cities (city_name) VALUES (p_city_name) RETURNING cities.city_id INTO v_city_id;
    END IF;

    -- 2. Find or create district
    SELECT d.district_id INTO v_district_id FROM districts d WHERE d.district_name = p_district_name AND d.city_id = v_city_id;
    IF v_district_id IS NULL THEN
        INSERT INTO districts (city_id, district_name) VALUES (v_city_id, p_district_name) RETURNING districts.district_id INTO v_district_id;
    END IF;

    -- 3. Find or create neighborhood
    SELECT n.neighborhood_id INTO v_neighborhood_id FROM neighborhoods n WHERE n.neighborhood_name = p_neighborhood_name AND n.district_id = v_district_id;
    IF v_neighborhood_id IS NULL THEN
        INSERT INTO neighborhoods (district_id, neighborhood_name, last_crawled_at, property_count) VALUES (v_district_id, p_neighborhood_name, NOW(), 0) RETURNING neighborhoods.neighborhood_id INTO v_neighborhood_id;
    END IF;

    RETURN QUERY SELECT v_city_id, v_district_id, v_neighborhood_id;
END;
$$ LANGUAGE plpgsql;
