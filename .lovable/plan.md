

# Export Pilot Survey Transcripts (Correct Survey)

## What Happened
The previous CSV export used the wrong survey ID. The correct "Pilot" survey is `26304bb2-5157-462d-b44f-b9373ae6e862` with 5 sessions and 54 responses.

## Steps

1. Query the `surveys` table for `first_message` (welcome prompt) for survey `26304bb2`
2. Query `conversation_sessions` + `responses` for this survey, ordered by session then timestamp
3. Build CSV with same format: `session_id, turn_number, speaker, message, sentiment, sentiment_score, timestamp, initial_mood, final_mood`
4. Prepend the survey's `first_message` as the opening Bot row per session
5. Write to `/mnt/documents/pilot_transcripts.csv` (overwrite the incorrect one)

## Files
No codebase changes — direct data export via `psql` to `/mnt/documents/`.

