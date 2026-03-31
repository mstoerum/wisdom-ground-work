

# Fix & Test: Generate Narrative Report v2

## Bugs Found

1. **Line 126**: `supabase.rpc('', {}).then(() => null).catch(() => null)` returns `null`, and destructuring `{ data: opinionUnitStats }` from `null` crashes with "Cannot read properties of null (reading 'data')"
2. **Line 111**: `survey_themes!discovered_clusters_related_theme_id_fkey(name)` — no FK exists on `discovered_clusters.related_theme_id`, so this join will fail silently or error

## Fix

### Modify `supabase/functions/generate-narrative-report/index.ts`

1. Remove the broken placeholder RPC call (line 126) and its destructured variable
2. Replace the FK join on `discovered_clusters` with a separate `survey_themes` query, then manually map theme names onto clusters
3. Adjust the Promise.all destructuring to match (6 items instead of 7)

After fixing, invoke the function for the pilot survey (`f92618e1`) and verify:
- `report_summary` is populated
- Each insight has `is_k_anonymous` flag
- `cluster_id` references match real `discovered_clusters` IDs
- `evidence_ids` are populated from cluster opinion units

## Files

| Action | File |
|--------|------|
| Modify | `supabase/functions/generate-narrative-report/index.ts` — fix 2 bugs |

