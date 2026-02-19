-- Drop semantic signal model tables (response_signals and aggregated_signals)
-- These tables powered the 5-dimension analysis (expertise, autonomy, justice, social_connection, social_status)
-- which has been removed from the application.

DROP TABLE IF EXISTS aggregated_signals CASCADE;
DROP TABLE IF EXISTS response_signals CASCADE;
