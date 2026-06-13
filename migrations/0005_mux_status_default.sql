ALTER TABLE workouts ALTER COLUMN mux_status DROP DEFAULT;
UPDATE workouts SET mux_status = NULL WHERE mux_asset_id IS NULL AND mux_status = 'pending';
