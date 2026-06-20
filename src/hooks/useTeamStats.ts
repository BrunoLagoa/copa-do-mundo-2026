/**
 * Estatísticas agregadas da seleção no torneio, REAIS, direto da ESPN.
 *
 * A ESPN não expõe um agregado pronto para a Copa (`/teams/{id}/statistics` vem
 * vazio), mas cada `/summary?event=ID` traz `boxscore.teams[].statistics` com ~28
 * métricas por jogo (posse, finalizações, passes, desarmes, faltas, cartões…).
 * Aqui somamos/medianizamos essas métricas ao longo dos jogos JÁ DISPUTADOS —
 * para a seleção E para os adversários — permitindo um comparativo "nós × eles".
 *
 * Fluxo: `/schedule` (acha os jogos encerrados) → 1 `/summary` por jogo. Sem
 * jogos disputados, `stats` é null e a seção some. Sem backend/chave (CORS aberto).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withEspnLang } from '../utils/espn';
import { espnIdForSlug } from '../data/espnTeams';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

export interface TeamStatsAgg {
  games: number;
  possession: number;        // % médio
  oppPossession: number;
  shots: number;             // por jogo
  oppShots: number;
  shotsOnTarget: number;     // por jogo
  oppShotsOnTarget: number;
  corners: number;           // por jogo
  oppCorners: number;
  fouls: number;             // por jogo
  oppFouls: number;
  passAccuracy: number;      // % (passes certos / passes)
  passesPerGame: number;
  tacklesPerGame: number;
  interceptionsPerGame: number;
  savesPerGame: number;
  offsidesPerGame: number;
  accurateCrossesPerGame: number;
  yellow: number;            // total
  red: number;               // total
}

export interface TeamStatsState {
  available: boolean;
  loading: boolean;
  stats: TeamStatsAgg | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function toMap(team: any): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of team?.statistics ?? []) {
    const v = parseFloat(s?.displayValue ?? s?.value);
    if (Number.isFinite(v)) m[s.name] = v;
  }
  return m;
}

function aggregate(summaries: any[], espnId: string): TeamStatsAgg | null {
  const acc = {
    games: 0,
    possession: 0, oppPossession: 0,
    totalShots: 0, oppTotalShots: 0,
    shotsOnTarget: 0, oppShotsOnTarget: 0,
    wonCorners: 0, oppWonCorners: 0,
    foulsCommitted: 0, oppFoulsCommitted: 0,
    accuratePasses: 0, totalPasses: 0,
    totalTackles: 0, interceptions: 0, saves: 0, offsides: 0, accurateCrosses: 0,
    yellowCards: 0, redCards: 0,
  };

  for (const j of summaries) {
    const teams: any[] = j?.boxscore?.teams ?? [];
    const mine = teams.find((t) => String(t?.team?.id) === espnId);
    const opp = teams.find((t) => String(t?.team?.id) !== espnId);
    if (!mine || !opp) continue;
    const m = toMap(mine);
    const o = toMap(opp);
    if (m.possessionPct == null && m.totalShots == null) continue; // jogo sem estatística
    acc.games++;
    acc.possession += m.possessionPct ?? 0;
    acc.oppPossession += o.possessionPct ?? 0;
    acc.totalShots += m.totalShots ?? 0;
    acc.oppTotalShots += o.totalShots ?? 0;
    acc.shotsOnTarget += m.shotsOnTarget ?? 0;
    acc.oppShotsOnTarget += o.shotsOnTarget ?? 0;
    acc.wonCorners += m.wonCorners ?? 0;
    acc.oppWonCorners += o.wonCorners ?? 0;
    acc.foulsCommitted += m.foulsCommitted ?? 0;
    acc.oppFoulsCommitted += o.foulsCommitted ?? 0;
    acc.accuratePasses += m.accuratePasses ?? 0;
    acc.totalPasses += m.totalPasses ?? 0;
    acc.totalTackles += m.totalTackles ?? 0;
    acc.interceptions += m.interceptions ?? 0;
    acc.saves += m.saves ?? 0;
    acc.offsides += m.offsides ?? 0;
    acc.accurateCrosses += m.accurateCrosses ?? 0;
    acc.yellowCards += m.yellowCards ?? 0;
    acc.redCards += m.redCards ?? 0;
  }

  if (acc.games === 0) return null;
  const g = acc.games;
  return {
    games: g,
    possession: acc.possession / g,
    oppPossession: acc.oppPossession / g,
    shots: acc.totalShots / g,
    oppShots: acc.oppTotalShots / g,
    shotsOnTarget: acc.shotsOnTarget / g,
    oppShotsOnTarget: acc.oppShotsOnTarget / g,
    corners: acc.wonCorners / g,
    oppCorners: acc.oppWonCorners / g,
    fouls: acc.foulsCommitted / g,
    oppFouls: acc.oppFoulsCommitted / g,
    passAccuracy: acc.totalPasses > 0 ? (acc.accuratePasses / acc.totalPasses) * 100 : 0,
    passesPerGame: acc.totalPasses / g,
    tacklesPerGame: acc.totalTackles / g,
    interceptionsPerGame: acc.interceptions / g,
    savesPerGame: acc.saves / g,
    offsidesPerGame: acc.offsides / g,
    accurateCrossesPerGame: acc.accurateCrosses / g,
    yellow: acc.yellowCards,
    red: acc.redCards,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export function useTeamStats(slug: string | undefined): TeamStatsState {
  const id = slug ? espnIdForSlug(slug) : null;

  const [stats, setStats] = useState<TeamStatsAgg | null>(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [trackedId, setTrackedId] = useState(id);
  if (trackedId !== id) {
    setTrackedId(id);
    setStats(null);
    setAvailable(false);
  }

  const fetchStats = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const schedRes = await fetch(withEspnLang(`${BASE}/teams/${id}/schedule`), { signal: ctrl.signal, cache: 'no-store' });
      if (!schedRes.ok) throw new Error(`HTTP ${schedRes.status}`);
      const sched = await schedRes.json();
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const ids: string[] = (sched?.events ?? [])
        .filter((e: any) => e?.competitions?.[0]?.status?.type?.completed)
        .map((e: any) => String(e?.id))
        .filter(Boolean);
      /* eslint-enable @typescript-eslint/no-explicit-any */
      if (ids.length === 0) {
        setAvailable(true);
        return;
      }
      const summaries = await Promise.all(
        ids.map((eid) =>
          fetch(withEspnLang(`${BASE}/summary?event=${eid}`), { signal: ctrl.signal, cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );
      setStats(aggregate(summaries.filter(Boolean), id));
      setAvailable(true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setAvailable(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => void fetchStats(), 0);
    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [id, fetchStats]);

  return useMemo(() => ({ available, loading, stats }), [available, loading, stats]);
}
