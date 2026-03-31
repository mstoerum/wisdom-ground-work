

# Export Pilot Survey Transcripts as CSV

## What This Does

Query the pilot survey's conversation sessions and responses, then export a CSV with one row per message showing the chronological conversation flow (survey welcome → user answer → AI follow-up → user answer → …).

## Steps

1. **Query data**: Use `psql` to join `conversation_sessions` and `responses` for survey `f92618e1-...`, ordered by session then timestamp
2. **Include metadata**: Session ID, timestamp, speaker (Bot/User), message content, sentiment, mood scores
3. **Prepend first_message**: Include the survey's welcome message as the opening Bot row for each session
4. **Export**: Write to `/mnt/documents/pilot_transcripts.csv`

## Output Columns

| Column | Description |
|--------|-------------|
| `session_id` | Conversation session UUID |
| `turn_number` | Sequential message number within session |
| `speaker` | "Bot" or "User" |
| `message` | The message text |
| `sentiment` | Sentiment label (if user message) |
| `sentiment_score` | Numeric sentiment score |
| `timestamp` | Message timestamp |
| `initial_mood` | Session opening mood (1-5) |
| `final_mood` | Session closing mood (1-5) |

## Files

No codebase changes — this is a direct data export via `psql` to `/mnt/documents/`.

