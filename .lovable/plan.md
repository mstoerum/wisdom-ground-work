

## Add orange accent to the completion button

### Change in `src/components/employee/inputs/WordCloudSelector.tsx` (lines ~141-156)

Update the "I'm done — wrap up the interview" button styling to use the terracotta/orange accent color (matching the progress bar) instead of plain muted foreground:

- Icon color: `text-[hsl(var(--terracotta-primary))]` (always orange)
- Text: muted by default, transitions to `hover:text-[hsl(var(--terracotta-primary))]` on hover
- Keep `hover:underline underline-offset-4`

This ties the completion action visually to the progress bar's orange, making it feel like part of the "you're done" visual language.

