

# Fix: Chat Edge Function Not Deployed

## Problem
Messages fail to send because the `chat` edge function is returning a **404 Not Found** error. The function code exists in the codebase and is configured in `config.toml`, but it is not currently deployed to the backend.

## Root Cause
A direct test call to `/functions/v1/chat` returned: `{"code":"NOT_FOUND","message":"Requested function was not found"}`

This means the function needs to be redeployed. No code changes are required.

## Solution
1. **Redeploy the `chat` edge function** -- this is the only action needed
2. **Verify deployment** by making a test call to the function endpoint
3. **Confirm** the chat interface works end-to-end (introduction loads, messages send successfully)

## Technical Details
- The function code is at `supabase/functions/chat/index.ts` (1,996 lines, fully implemented)
- Configuration in `supabase/config.toml` has `verify_jwt = false` (correct, since public link users need anonymous access)
- CORS headers are present and the OPTIONS handler is implemented
- No code changes are needed -- just redeployment

