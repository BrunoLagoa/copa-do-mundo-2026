/**
 * Classificação dos grupos — oficial e ao vivo, direto da ESPN.
 *
 * Fonte: `…/apis/v2/sports/soccer/fifa.world/standings` (CORS aberto, sem chave).
 * 1 único fetch traz os 12 grupos (A–L) com P/J/V/E/D, gols pró/contra, saldo,
 * posição (rank) e flag `advanced` (classificado). Poll de 60s com aba visível.
 *
 * Cada time da ESPN é casado ao nosso por código FIFA (`team.abbreviation`),
 * para reaproveitar nome PT-BR, bandeira e link /team/:slug. Sem match → cai no
 * nome/sigla da própria ESPN, sem quebrar.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { slugForCode } from '../data/teamCodes';
import { TEAMS_BY_SLUG } from '../data/teams';

const STANDINGS_URL =
  'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';
const POLL_MS = 60_000;

/** Uma linha da tabela de um grupo. */
export interface StandingRow {
  code: string;        // código FIFA (MEX, BRA…)
  slug: string | null; // nosso slug, se mapeado
  name: string;        // nome PT-BR (ou displayName da ESPN)
  flag: string | null; // emoji bandeira, se mapeado
  rank: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  advanced: boolean;   // já classificado (flag oficial da ESPN)
}

export interface StandingsState {
  available: boolean;
  byGroup: Record<string, StandingRow[]>; // "A" → linhas ordenadas por rank
  lastUpdated: Date | null;
  loading: boolean;
  error: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Lê um stat (por nome) das entries da ESPN. */
function stat(stats: any[], name: string): number {
  const s = Array.isArray(stats) ? stats.find((x) => x?.name === name) : null;
  const v = s ? Number(s.value ?? s.displayValue) : 0;
  return Number.isFinite(v) ? v : 0;
}

function mapRow(entry: any): StandingRow {
  const code: string = entry?.team?.abbreviation ?? '';
  const slug = code ? slugForCode(code) : null;
  const local = slug ? TEAMS_BY_SLUG[slug] : null;
  const stats: any[] = entry?.stats ?? [];
  return {
    code,
    slug,
    name: local?.team.name ?? entry?.team?.displayName ?? code,
    flag: local?.team.flag ?? null,
    rank: stat(stats, 'rank'),
    points: stat(stats, 'points'),
    played: stat(stats, 'gamesPlayed'),
    wins: stat(stats, 'wins'),
    draws: stat(stats, 'ties'),
    losses: stat(stats, 'losses'),
    goalsFor: stat(stats, 'pointsFor'),
    goalsAgainst: stat(stats, 'pointsAgainst'),
    goalDiff: stat(stats, 'pointDifferential'),
    advanced: stat(stats, 'advanced') > 0,
  };
}

/** "Group A" → "A". */
function groupLetter(name: string): string {
  return (name || '').replace(/group/i, '').trim().toUpperCase();
}

function parseStandings(json: any): Record<string, StandingRow[]> {
  const groups: any[] = Array.isArray(json?.children) ? json.children : [];
  const out: Record<string, StandingRow[]> = {};
  for (const g of groups) {
    const letter = groupLetter(g?.name);
    const entries: any[] = g?.standings?.entries ?? [];
    if (!letter || entries.length === 0) continue;
    out[letter] = entries.map(mapRow).sort((a, b) => a.rank - b.rank);
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useStandings(): StandingsState {
  const [byGroup, setByGroup] = useState<Record<string, StandingRow[]>>({});
  const [available, setAvailable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStandings = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(STANDINGS_URL, { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = parseStandings(await res.json());
      setByGroup(parsed);
      setAvailable(true);
      setLastUpdated(new Date());
      setError(false);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void fetchStandings(), 0);
    const tick = () => {
      if (document.visibilityState === 'visible') void fetchStandings();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      abortRef.current?.abort();
    };
  }, [fetchStandings]);

  return useMemo(
    () => ({ available, byGroup, lastUpdated, loading, error }),
    [available, byGroup, lastUpdated, loading, error],
  );
}
