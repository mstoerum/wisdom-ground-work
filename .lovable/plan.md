

# Update Social Preview Image

## What This Does
Replace the current OpenGraph/Twitter social preview image with the uploaded Spradley logo PNG.

## Steps

1. Copy `user-uploads://social_previe.png` to `public/social-preview.png`
2. Update `index.html` meta tags to point to the new image using the published URL (`https://spradley.lovable.app/social-preview.png`)

## Files

| Action | File |
|--------|------|
| Copy | `social_previe.png` → `public/social-preview.png` |
| Modify | `index.html` — update `og:image` and `twitter:image` meta tags |

