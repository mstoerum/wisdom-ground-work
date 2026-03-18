

## Make "I'm all good" completion button more noticeable

### Changes to `WordCloudSelector.tsx` (lines 141-156)

**Text change**: Replace `{completionOption}` (which renders whatever the AI sends, e.g. "I'm all good") with a clearer, fixed label: **"I'm done — wrap up the interview"**. The original option text is still sent in the submission payload.

**Styling upgrades**:
- Increase text size from `text-sm` to `text-base`
- Add `hover:underline underline-offset-4` for a subtle hover underline
- Increase icon size from `h-4 w-4` to `h-5 w-5`
- Add more top padding (`pt-4` instead of `pt-2`) to visually separate from the topic chips
- Use a slightly warmer muted color on hover

No other files affected.

