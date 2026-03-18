

## Make completion button text orange by default

### Change in `src/components/employee/inputs/WordCloudSelector.tsx`

Update the button's class from `text-muted-foreground hover:text-[hsl(var(--terracotta-primary))]` to `text-[hsl(var(--terracotta-primary))]` so both icon and text are always orange. Keep `hover:underline underline-offset-4` for hover feedback.

Single line change — no other files affected.

