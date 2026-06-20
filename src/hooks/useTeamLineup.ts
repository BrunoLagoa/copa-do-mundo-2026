/**
 * Escalação REAL da seleção — o XI titular e a formação do último jogo disputado,
 * direto da ESPN (sem backend/chave, CORS aberto).
 *
 * Fluxo (2 chamadas encadeadas):
 *   1. `/teams/{id}/schedule`   → acha o ID do último jogo encerrado.
 *   2. `/summary?event={id}`    → `rosters[]` traz, para cada time, a `formation`
 *                                 (ex. "4-2-3-1") e o elenco com `starter`, número,
 *                                 `position.abbreviation` (CD-L, AM-R, LB…) e foto.
 *
 * O código de posição vira coordenadas: `vertical` define a linha (defesa→ataque)
 * e `horizontal` o lado (esquerda↔direita), reproduzindo a escalação real no campo.
 * Qualquer falha → `lineup: null` e a tela cai na escalação heurística por elenco.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withEspnLang } from '../utils/espn';
import { espnIdForSlug } from '../data/espnTeams';
import type { PosGroup } from './useTeamProfile';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

export interface LineupStarter {
  id: string;
  name: string;
  shortName: string;
  number: number | null;
  posGroup: PosGroup;
  posCode: string;
  vertical: number;    // 0 (gol) → 5 (ataque) — define a linha
  horizontal: number;  // -2 (esquerda) → +2 (direita) — define o lado
  photo: string | null;
}

export interface TeamLineup {
  formation: string;
  starters: LineupStarter[];
  opponentCode: string | null;
  opponentName: string | null;
  date: string;
}

export interface TeamLineupState {
  available: boolean;
  loading: boolean;
  lineup: TeamLineup | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Código de posição da ESPN → profundidade no campo (gol 0 … ataque 5). */
function verticalOf(code: string): number {
  const c = code.toUpperCase();
  if (c === 'G' || c === 'GK') return 0;
  if (/^(F|CF|ST|SS)/.test(c)) return 5;
  if (/^(RW|LW|W)/.test(c)) return 4.5;
  if (/^AM/.test(c)) return 4;
  if (/^(CM|LM|RM|M)/.test(c)) return 3;
  if (/^DM/.test(c)) return 2;
  if (/^(RWB|LWB|WB)/.test(c)) return 1.6;
  if (/^(RB|LB|FB)/.test(c)) return 1.2;
  if (/^(CD|CB|SW|D)/.test(c)) return 1;
  return 3;
}

/** Código de posição → lado (-2 ponta-esquerda … +2 ponta-direita). */
function horizontalOf(code: string): number {
  const c = code.toUpperCase();
  if (/^(LB|LWB|LW|LM)$/.test(c)) return -2;
  if (/^(RB|RWB|RW|RM)$/.test(c)) return 2;
  if (c.includes('L')) return -1;
  if (c.includes('R')) return 1;
  return 0;
}

function groupOf(vertical: number): PosGroup {
  if (vertical === 0) return 'GK';
  if (vertical < 2) return 'DEF';
  if (vertical < 5) return 'MID';
  return 'FWD';
}

function parseLineup(json: any, espnId: string): TeamLineup | null {
  const rosters: any[] = Array.isArray(json?.rosters) ? json.rosters : [];
  const mine = rosters.find((r) => String(r?.team?.id) === espnId);
  if (!mine) return null;
  const formation: string = mine?.formation ?? '';
  const starters: LineupStarter[] = (mine?.roster ?? [])
    .filter((p: any) => p?.starter)
    .map((p: any): LineupStarter => {
      const code: string = p?.position?.abbreviation ?? '';
      const jersey = p?.jersey != null ? parseInt(String(p.jersey), 10) : NaN;
      const vertical = verticalOf(code);
      return {
        id: String(p?.athlete?.id ?? ''),
        name: p?.athlete?.displayName ?? '—',
        shortName: p?.athlete?.shortName ?? p?.athlete?.displayName ?? '—',
        number: Number.isFinite(jersey) ? jersey : null,
        posGroup: groupOf(vertical),
        posCode: code,
        vertical,
        horizontal: horizontalOf(code),
        photo: p?.athlete?.headshot?.href ?? null,
      };
    });
  if (!formation || starters.length < 11) return null;

  const opp = rosters.find((r) => String(r?.team?.id) !== espnId);
  return {
    formation,
    starters,
    opponentCode: opp?.team?.abbreviation ?? null,
    opponentName: opp?.team?.displayName ?? null,
    date: json?.header?.competitions?.[0]?.date ?? '',
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export function useTeamLineup(slug: string | undefined): TeamLineupState {
  const id = slug ? espnIdForSlug(slug) : null;

  const [lineup, setLineup] = useState<TeamLineup | null>(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [trackedId, setTrackedId] = useState(id);
  if (trackedId !== id) {
    setTrackedId(id);
    setLineup(null);
    setAvailable(false);
  }

  const fetchLineup = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const schedRes = await fetch(withEspnLang(`${BASE}/teams/${id}/schedule`), { signal: ctrl.signal, cache: 'no-store' });
      if (!schedRes.ok) throw new Error(`HTTP ${schedRes.status}`);
      const sched = await schedRes.json();
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const done: any[] = (sched?.events ?? []).filter((e: any) => e?.competitions?.[0]?.status?.type?.completed);
      const last = done[done.length - 1];
      const eventId = last?.id;
      if (!eventId) {
        setAvailable(true);
        return;
      }
      const sumRes = await fetch(withEspnLang(`${BASE}/summary?event=${eventId}`), { signal: ctrl.signal, cache: 'no-store' });
      if (!sumRes.ok) throw new Error(`HTTP ${sumRes.status}`);
      setLineup(parseLineup(await sumRes.json(), id));
      setAvailable(true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setAvailable(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const initial = setTimeout(() => void fetchLineup(), 0);
    const onVis = () => {
      if (document.visibilityState === 'visible') void fetchLineup();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(initial);
      document.removeEventListener('visibilitychange', onVis);
      abortRef.current?.abort();
    };
  }, [id, fetchLineup]);

  return useMemo(() => ({ available, loading, lineup }), [available, loading, lineup]);
}
