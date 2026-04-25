/**
 * Converts a team name to a URL-safe slug.
 * Used by TeamRow (Link) and src/data/teams/index.ts (key generation).
 * Must be kept in sync — single source of truth.
 *
 * Examples:
 *   "Brasil"            → "brasil"
 *   "EUA"               → "eua"
 *   "Bósnia-Herzegovina"→ "bosnia-herzegovina"
 *   "Rep. Dem. Congo"   → "rep-dem-congo"
 *   "Coreia do Sul"     → "coreia-do-sul"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s-]/g, '')   // remove non-word chars (except spaces and hyphens)
    .trim()
    .replace(/[\s_]+/g, '-')    // spaces/underscores → hyphens
    .replace(/-+/g, '-');       // collapse multiple hyphens
}
