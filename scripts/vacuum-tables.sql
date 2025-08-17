-- Vacuum script - must be run separately outside transaction blocks
-- Run this after cleanup-unused-files.sql
-- Note: Each VACUUM command must be executed individually

-- Split VACUUM commands to run individually to avoid transaction block issues
VACUUM ANALYZE menu_items;
