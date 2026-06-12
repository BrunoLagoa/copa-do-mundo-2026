/**
 * Detalhes de uma partida — gols, cartões e estatísticas completas.
 *
 * Fonte: endpoint `summary` da ESPN (1 request por jogo, sob demanda).
 * Diferente do `useLiveScores` (que baixa o scoreboard inteiro), este hook só
 * dispara quando o usuário ABRE os detalhes de um card (`enabled`), evitando
 * 100+ requests. Enquanto o jogo está ao vivo e aberto, refaz a cada 30s.
 *
 * Casamento de lado (casa/fora) é feito pelo id ESPN dos times, passado pelo
 * chamador a partir do LiveScore (homeBrand.id / awayBrand.id).
 */

import { useEffect, useRef, useState } from 'react';

const SUMMARY_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const REFRESH_MS = 30_000;

export type TimelineKind = 'goal' | 'own-goal' | 'penalty' | 'yellow' | 'red' | 'sub';

/** Um lance relevante na linha do tempo do jogo. */
export interface TimelineEvent {
  kind: TimelineKind;
  clock: string;          // "23'", "90'+2'"
  player: string | null;  // autor / jogador envolvido
  side: 'home' | 'away' | null; // orientado ao NOSSO mandante/visitante
  text: string;           // descrição completa da ESPN
}

/** Um jogador na escalação. */
export interface LineupPlayer {
  jersey: string;
  name: string;
  position: string | null; // abreviação (G, CD-L, LB…)
  subbedIn: boolean;
  subbedOut: boolean;
}

/** Escalação de um time. */
export interface TeamLineup {
  side: 'home' | 'away' | null;
  formation: string | null; // ex. "4-4-2"
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface MatchDetails {
  timeline: TimelineEvent[];
  lineups: { home: TeamLineup | null; away: TeamLineup | null };
  loading: boolean;
  error: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Classifica o keyEvent da ESPN num tipo da nossa timeline (ou descarta). */
function classify(ev: any): TimelineKind | null {
  const slug: string = ev?.type?.type ?? '';
  const text: string = (ev?.type?.text ?? '').toLowerCase();
  if (ev?.scoringPlay || slug.includes('goal') || text.includes('goal')) {
    if (slug.includes('own') || text.includes('own goal')) return 'own-goal';
    if (slug.includes('penalty') || text.includes('penalty')) return 'penalty';
    return 'goal';
  }
  if (slug.includes('red') || text.includes('red card')) return 'red';
  if (slug.includes('yellow') || text.includes('yellow card')) return 'yellow';
  if (slug.includes('substitution') || text.includes('substitution')) return 'sub';
  return null;
}

function parseSummary(
  json: any,
  homeId: string | null,
  awayId: string | null,
): TimelineEvent[] {
  const raw: any[] = Array.isArray(json?.keyEvents) ? json.keyEvents : [];
  const out: TimelineEvent[] = [];
  for (const ev of raw) {
    const kind = classify(ev);
    if (!kind) continue;
    const teamId = ev?.team?.id != null ? String(ev.team.id) : null;
    const side: 'home' | 'away' | null =
      teamId && teamId === homeId ? 'home' : teamId && teamId === awayId ? 'away' : null;
    out.push({
      kind,
      clock: ev?.clock?.displayValue ?? '',
      player: ev?.participants?.[0]?.athlete?.displayName ?? null,
      side,
      text: ev?.text ?? ev?.shortText ?? '',
    });
  }
  return out;
}

function mapPlayer(p: any): LineupPlayer {
  return {
    jersey: p?.jersey != null ? String(p.jersey) : '',
    name: p?.athlete?.shortName ?? p?.athlete?.displayName ?? '—',
    position: p?.position?.abbreviation ?? null,
    subbedIn: Boolean(p?.subbedIn),
    subbedOut: Boolean(p?.subbedOut),
  };
}

function parseLineups(
  json: any,
  homeId: string | null,
  awayId: string | null,
): { home: TeamLineup | null; away: TeamLineup | null } {
  const rosters: any[] = Array.isArray(json?.rosters) ? json.rosters : [];
  const result: { home: TeamLineup | null; away: TeamLineup | null } = { home: null, away: null };
  for (const r of rosters) {
    const teamId = r?.team?.id != null ? String(r.team.id) : null;
    const side: 'home' | 'away' | null =
      teamId && teamId === homeId ? 'home' : teamId && teamId === awayId ? 'away' : null;
    const players: any[] = Array.isArray(r?.roster) ? r.roster : [];
    if (players.length === 0) continue;
    const lineup: TeamLineup = {
      side,
      formation: r?.formation ?? null,
      starters: players.filter((p) => p?.starter).map(mapPlayer),
      bench: players.filter((p) => !p?.starter).map(mapPlayer),
    };
    if (side === 'home') result.home = lineup;
    else if (side === 'away') result.away = lineup;
  }
  return result;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useMatchDetails(
  eventId: string | null,
  homeId: string | null,
  awayId: string | null,
  opts: { enabled: boolean; live: boolean },
): MatchDetails {
  const { enabled, live } = opts;
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [lineups, setLineups] = useState<MatchDetails['lineups']>({ home: null, away: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !eventId) return;

    let cancelled = false;
    const load = async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`${SUMMARY_BASE}?event=${eventId}`, {
          signal: ctrl.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setTimeline(parseSummary(json, homeId, awayId));
          setLineups(parseLineups(json, homeId, awayId));
          setError(false);
        }
      } catch (err) {
        if (!cancelled && (err as Error).name !== 'AbortError') setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Deferida em macrotask p/ não rodar setState síncrono dentro do effect.
    const initial = setTimeout(() => void load(), 0);
    const timer = live ? setInterval(() => void load(), REFRESH_MS) : null;
    return () => {
      cancelled = true;
      clearTimeout(initial);
      if (timer) clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [eventId, homeId, awayId, enabled, live]);

  return { timeline, lineups, loading, error };
}
