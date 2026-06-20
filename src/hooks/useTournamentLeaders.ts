/**
 * Destaques do torneio — artilharia e gols recentes, REAIS, direto da ESPN.
 *
 * Fonte: o mesmo `scoreboard` do `useLiveScores`, baixado para o range inteiro
 * do torneio (1 request). Cada partida traz `competitions[].details[]` com os
 * lances de gol (`scoringPlay`), o autor (`athletesInvolved`) e o time. A partir
 * disso agregamos:
 *   - Artilharia: gols por jogador (exclui gols-contra), com nº de pênaltis;
 *   - Gols recentes: a linha do tempo de gols do torneio, mais novos primeiro.
 *
 * Sem backend, sem chave: CORS aberto. Poll de 60s com a aba visível, igual aos
 * demais hooks. Cada gol é casado ao NOSSO time (nome PT-BR, bandeira, slug) pelo
 * código FIFA (`team.abbreviation`); sem match, cai no nome/escudo da ESPN.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FIXTURES } from '../data/matches';
import { slugForCode } from '../data/teamCodes';
import { TEAMS_BY_SLUG } from '../data/teams';

const SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
/** Range do torneio inteiro (11 jun – 19 jul 2026). */
const TOURNAMENT_RANGE = '20260611-20260719';
const POLL_MS = 60_000;

/** Mapas slug → bandeira emoji / nome PT-BR, derivados dos fixtures locais. */
const FLAG_BY_SLUG: Record<string, string> = {};
const NAME_BY_SLUG: Record<string, string> = {};
for (const f of FIXTURES) {
  if (f.homeFlag) FLAG_BY_SLUG[f.homeSlug] = f.homeFlag;
  if (f.awayFlag) FLAG_BY_SLUG[f.awaySlug] = f.awayFlag;
  if (f.homeTeam) NAME_BY_SLUG[f.homeSlug] = f.homeTeam;
  if (f.awayTeam) NAME_BY_SLUG[f.awaySlug] = f.awayTeam;
}

/** Um artilheiro agregado. */
export interface Scorer {
  athleteId: string;
  name: string;
  shortName: string;
  jersey: string | null;
  position: string | null;
  goals: number;
  penalties: number;
  teamCode: string | null;
  teamSlug: string | null;
  teamName: string;
  teamFlag: string | null;
  teamLogo: string | null;
  teamColor: string | null;
}

/** Um gol na linha do tempo do torneio. */
export interface GoalMoment {
  id: string;
  athleteName: string;
  shortName: string;
  clock: string;
  penalty: boolean;
  ownGoal: boolean;
  teamName: string;
  teamFlag: string | null;
  teamLogo: string | null;
  matchLabel: string;
  date: string;
  eventId: string | null;
}

export interface TournamentLeadersState {
  available: boolean;
  scorers: Scorer[];
  recentGoals: GoalMoment[];
  goalCount: number;
  lastUpdated: Date | null;
  loading: boolean;
  error: boolean;
}

interface TeamRef {
  code: string | null;
  slug: string | null;
  name: string;
  flag: string | null;
  logo: string | null;
  color: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Resolve a identidade PT-BR/ESPN de um time a partir do competitor da ESPN. */
function teamRef(team: any): TeamRef {
  const code: string | null = team?.abbreviation ?? null;
  const slug = code ? slugForCode(code) : null;
  const local = slug ? TEAMS_BY_SLUG[slug] : null;
  return {
    code,
    // Nome PT-BR: 1) elenco local, 2) fixtures locais, 3) ESPN (inglês), 4) sigla.
    slug,
    name: local?.team.name ?? (slug ? NAME_BY_SLUG[slug] : null) ?? team?.displayName ?? code ?? '—',
    flag: local?.team.flag ?? (slug ? FLAG_BY_SLUG[slug] : null) ?? null,
    logo: team?.logo ?? null,
    color: team?.color ?? null,
  };
}

/** Rótulo curto do placar, ex. "MEX 3 x 0 RSA". */
function matchLabel(comp: any): string {
  const cs: any[] = comp?.competitors ?? [];
  const home = cs.find((c) => c?.homeAway === 'home') ?? cs[0];
  const away = cs.find((c) => c?.homeAway === 'away') ?? cs[1];
  if (!home || !away) return '';
  const hc = home?.team?.abbreviation ?? '';
  const ac = away?.team?.abbreviation ?? '';
  const hs = parseInt(home?.score, 10);
  const as = parseInt(away?.score, 10);
  const score = Number.isFinite(hs) && Number.isFinite(as) ? `${hs} x ${as}` : 'x';
  return `${hc} ${score} ${ac}`.trim();
}

function parse(json: any): { scorers: Scorer[]; recentGoals: GoalMoment[] } {
  const events: any[] = Array.isArray(json?.events) ? json.events : [];
  const byAthlete = new Map<string, Scorer>();
  const goals: GoalMoment[] = [];

  for (const e of events) {
    const comp = e?.competitions?.[0];
    const details: any[] = Array.isArray(comp?.details) ? comp.details : [];
    if (details.length === 0) continue;

    // teamId (ESPN numérico) → identidade resolvida
    const teamById = new Map<string, TeamRef>();
    for (const c of comp?.competitors ?? []) {
      const id = c?.team?.id != null ? String(c.team.id) : null;
      if (id) teamById.set(id, teamRef(c.team));
    }

    const label = matchLabel(comp);
    const date: string = e?.date ?? '';

    for (const dt of details) {
      if (!dt?.scoringPlay) continue;
      const ath = (dt?.athletesInvolved ?? [])[0];
      if (!ath?.id) continue;

      const teamId = dt?.team?.id != null ? String(dt.team.id) : null;
      const team = (teamId && teamById.get(teamId)) || teamRef(ath?.team ?? {});
      const ownGoal = Boolean(dt?.ownGoal);
      const penalty = Boolean(dt?.penaltyKick);
      const clock: string = dt?.clock?.displayValue ?? '';

      goals.push({
        id: `${e?.id}-${ath.id}-${dt?.clock?.value ?? Math.round(Math.abs(Number(dt?.scoreValue ?? 0)))}-${clock}`,
        athleteName: ath?.displayName ?? '—',
        shortName: ath?.shortName ?? ath?.displayName ?? '—',
        clock,
        penalty,
        ownGoal,
        teamName: team.name,
        teamFlag: team.flag,
        teamLogo: team.logo,
        matchLabel: label,
        date,
        eventId: e?.id != null ? String(e.id) : null,
      });

      // Gol-contra não pontua para a artilharia do autor.
      if (ownGoal) continue;

      const key = String(ath.id);
      const existing = byAthlete.get(key);
      if (existing) {
        existing.goals += 1;
        if (penalty) existing.penalties += 1;
      } else {
        byAthlete.set(key, {
          athleteId: key,
          name: ath?.displayName ?? '—',
          shortName: ath?.shortName ?? ath?.displayName ?? '—',
          jersey: ath?.jersey != null ? String(ath.jersey) : null,
          position: ath?.position ?? null,
          goals: 1,
          penalties: penalty ? 1 : 0,
          teamCode: team.code,
          teamSlug: team.slug,
          teamName: team.name,
          teamFlag: team.flag,
          teamLogo: team.logo,
          teamColor: team.color,
        });
      }
    }
  }

  const scorers = [...byAthlete.values()].sort(
    (a, b) => b.goals - a.goals || a.name.localeCompare(b.name),
  );

  // Gols mais recentes primeiro (por data do jogo; dentro do jogo, minuto desc).
  const recentGoals = goals.sort((a, b) => {
    const d = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (d !== 0) return d;
    return clockMinutes(b.clock) - clockMinutes(a.clock);
  });

  return { scorers, recentGoals };
}

/** "90'+2'" → 92 (para ordenar lances dentro do mesmo jogo). */
function clockMinutes(clock: string): number {
  const m = /(\d+)(?:'\+(\d+))?/.exec(clock || '');
  if (!m) return 0;
  return Number(m[1]) + (m[2] ? Number(m[2]) : 0);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useTournamentLeaders(): TournamentLeadersState {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [recentGoals, setRecentGoals] = useState<GoalMoment[]>([]);
  const [available, setAvailable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLeaders = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      // SEM lang=pt: localizaria `team.abbreviation` e quebraria o casamento por
      // código FIFA. Nomes/escudos vêm do nosso data local.
      const res = await fetch(`${SCOREBOARD_URL}?dates=${TOURNAMENT_RANGE}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { scorers, recentGoals } = parse(await res.json());
      setScorers(scorers);
      setRecentGoals(recentGoals);
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
    const initial = setTimeout(() => void fetchLeaders(), 0);
    const tick = () => {
      if (document.visibilityState === 'visible') void fetchLeaders();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      abortRef.current?.abort();
    };
  }, [fetchLeaders]);

  return useMemo(
    () => ({
      available,
      scorers,
      recentGoals,
      goalCount: recentGoals.length,
      lastUpdated,
      loading,
      error,
    }),
    [available, scorers, recentGoals, lastUpdated, loading, error],
  );
}
