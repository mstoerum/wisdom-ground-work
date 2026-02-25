

# Fix Typewriter Text Jumping in AIResponseDisplay

## Problem

The `AIResponseDisplay` component uses `text-center` and `justify-center` on a flex container. As the typewriter reveals characters, the text block grows in width and height, causing the entire paragraph to reflow and shift on every character. This makes it impossible to read because:

1. The container is centered (`flex items-center justify-center text-center`) — as text wraps to new lines, everything re-centers vertically and horizontally
2. The text size is large (`text-xl md:text-2xl`) so line breaks happen frequently
3. Each new character can cause a line break, shifting all previous text

## Solution

Reserve the full space for the text upfront so it doesn't reflow during typing. Two changes:

### `src/components/employee/AIResponseDisplay.tsx`

1. **Render the full text invisibly** to reserve the correct height and width, then overlay the visible typewriter text on top. This prevents layout shifts as characters are revealed.

   The approach: wrap the text area in a `relative` container. Render the full final text with `visibility: hidden` (takes up space but isn't seen), and position the typewriter text absolutely on top of it with `text-left` alignment.

2. **Change from `text-center` to `text-left`** — left-aligned text doesn't reflow when new characters are added (new characters only appear at the end of the last line). Center-aligned text causes every line to re-center when wrapping changes.

### Specific changes

**Line 68-70** — the motion.div wrapper:
- Change `className` from `"flex items-center justify-center text-center px-4 max-w-2xl"` to `"flex items-center justify-center px-4 max-w-2xl w-full"`

**Lines 76-93** — the `<p>` element:
- Wrap in a `relative` div
- Add a hidden copy of the full text (empathy + question) to reserve space
- Position the typewriter text absolutely over it with `text-left`
- This ensures the container never changes size during typing

### Result

The text area reserves its final dimensions immediately. As characters type in, they fill the space left-to-right without causing any layout reflow. The reading experience becomes smooth and stable.

### Files changed

| File | What changes |
|------|-------------|
| `src/components/employee/AIResponseDisplay.tsx` | Add invisible space-reserving text, overlay typewriter text with absolute positioning, switch to left-aligned text |

