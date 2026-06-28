/**
 * Chaveamento da fase eliminatória — oficial e ao vivo, direto da ESPN.
 *
 * Por que ESPN: o mesmo scoreboard público que já alimenta os placares ao vivo
 * (CORS aberto, sem chave) JÁ traz os 32 jogos do mata-mata com `season.slug`
 * (round-of-32 … final), as seleções conforme vão sendo definidas, placar,
 * vencedor e pênaltis. Assim o quadro se preenche sozinho — sem edição manual.
 *
 * Casamento evento-da-ESPN ↔ confronto local (ro32-1 … final-1): por
 * RODADA + SEDE. A sede é a chave mais estável que a ESPN expõe (não muda
 * conforme as seleções são decididas). Duas sedes se repetem dentro dos 32-avos
 * (Los Angeles, Dallas) → desempata pela data. Times só são considerados
 * "definidos" quando o código FIFA da ESPN casa com uma das 48 seleções; os
 * rótulos provisórios ("2I", "3RD", "RD32"…) caem fora e mantêm o placeholder
 * descritivo do nosso `bracket.ts`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BracketTeam } from '../types';
import { ROUNDS } from '../data/bracket';
import { slugForCode } from '../data/teamCodes';
import { getTeamDetail } from '../data/teams';

const ESPN_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
/** Range que cobre todo o mata-mata (28 jun – 19 jul 2026), 1 fetch. */
const KNOCKOUT_RANGE = '20260628-20260719';
const POLL_LIVE_MS = 15_000; // com jogo ao vivo
const POLL_IDLE_MS = 90_000; // sem jogo ao vivo

/** ESPN `season.slug` → id da rodada no nosso `bracket.ts`. */
const ROUND_BY_SLUG: Record<string, string> = {
  'round-of-32': 'ro32',
  'round-of-16': 'ro16',
  quarterfinals: 'qf',
  semifinals: 'sf',
  final: 'final',
  // 'third-place-match' não existe no nosso quadro → ignorado.
};

/** Cidade da ESPN (parte antes da vírgula) → cidade PT-BR do `bracket.ts`. */
const CITY_TO_PT: Record<string, string> = {
  Inglewood: 'Los Angeles',
  Houston: 'Houston',
  Foxborough: 'Foxborough',
  Guadalupe: 'Monterrey',
  Arlington: 'Dallas',
  'East Rutherford': 'Nova York',
  'Mexico City': 'Cidade do México',
  Atlanta: 'Atlanta',
  Seattle: 'Seattle',
  'Santa Clara': 'San Francisco',
  Toronto: 'Toronto',
  Vancouver: 'Vancouver',
  'Miami Gardens': 'Miami',
  'Kansas City': 'Kansas City',
  Philadelphia: 'Filadélfia',
};

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

/** "28 Jun" → 628 (mês*100+dia); usado só para desempatar sede repetida. */
function bracketDateNum(date: string): number {
  const [d, mon] = date.split(' ');
  return (MONTHS[mon] ?? 0) * 100 + (parseInt(d, 10) || 0);
}

/** ISO UTC da ESPN → número mês*100+dia no fuso BRT (UTC-3). */
function espnDateNum(iso: string): number {
  const t = new Date(iso).getTime() - 3 * 3600_000;
  const dt = new Date(t);
  return (dt.getUTCMonth() + 1) * 100 + dt.getUTCDate();
}

export type KnockoutState = 'pre' | 'in' | 'post';

/** Dados de um confronto do mata-mata resolvidos para um slot do bracket. */
export interface KnockoutMatchData {
  teamA: BracketTeam | null; // seleção definida (senão null → mantém placeholder)
  teamB: BracketTeam | null;
  slugA: string | null;     // slug PT-BR do time A (para link /team/:slug)
  slugB: string | null;
  scoreA: number | null; // gols (ao vivo ou final)
  scoreB: number | null;
  winnerSlot: 'A' | 'B' | null; // só quando encerrado
  state: KnockoutState;
  isLive: boolean;
  isPenalty: boolean; // empate no tempo normal decidido nos pênaltis
  clock: string | null; // ex. "67'" — só ao vivo
  espnEventId: string | null;
}

export interface KnockoutBracketState {
  available: boolean;
  byMatchId: Record<string, KnockoutMatchData>;
  liveCount: number;
  lastUpdated: Date | null;
  loading: boolean;
  error: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Código FIFA da ESPN → {team, slug}. null se for rótulo provisório. */
function teamFromCode(code: string | undefined): { team: BracketTeam; slug: string } | null {
  if (!code) return null;
  const slug = slugForCode(code);
  if (!slug) return null;
  const d = getTeamDetail(slug);
  if (!d) return null;
  return { team: { name: d.team.name, flag: d.team.flag, isHost: d.team.isHost }, slug };
}

/** Índice rodada+cidade → confrontos locais (lista, p/ desempate por data). */
function buildSlotIndex(): Map<string, { id: string; dateNum: number }[]> {
  const idx = new Map<string, { id: string; dateNum: number }[]>();
  for (const round of ROUNDS) {
    for (const m of round.matches) {
      const key = `${round.id}|${m.city}`;
      const list = idx.get(key) ?? [];
      list.push({ id: m.id, dateNum: bracketDateNum(m.date) });
      idx.set(key, list);
    }
  }
  return idx;
}

/** Resolve qual slot do bracket corresponde a um evento da ESPN. */
function matchSlot(
  slotIndex: Map<string, { id: string; dateNum: number }[]>,
  roundId: string,
  ptCity: string,
  espnNum: number,
): string | null {
  const candidates = slotIndex.get(`${roundId}|${ptCity}`);
  if (!candidates?.length) return null;
  if (candidates.length === 1) return candidates[0].id;
  // sede repetida na rodada (LA/Dallas nos 32-avos) → mais próxima pela data.
  return candidates.reduce((best, c) =>
    Math.abs(c.dateNum - espnNum) < Math.abs(best.dateNum - espnNum) ? c : best,
  ).id;
}

function parseEspn(
  json: any,
  slotIndex: Map<string, { id: string; dateNum: number }[]>,
): Record<string, KnockoutMatchData> {
  const out: Record<string, KnockoutMatchData> = {};
  const events: any[] = Array.isArray(json?.events) ? json.events : [];

  for (const e of events) {
    const roundId = ROUND_BY_SLUG[e?.season?.slug];
    if (!roundId) continue;

    const comp = e?.competitions?.[0];
    const cs: any[] = comp?.competitors ?? [];
    if (cs.length < 2) continue;

    const espnCity: string = comp?.venue?.address?.city ?? '';
    const ptCity = CITY_TO_PT[espnCity.split(',')[0].trim()];
    if (!ptCity) continue;

    const slotId = matchSlot(slotIndex, roundId, ptCity, espnDateNum(e.date));
    if (!slotId) continue;

    const home = cs.find((c) => c?.homeAway === 'home') ?? cs[0];
    const away = cs.find((c) => c?.homeAway === 'away') ?? cs[1];

    const state: KnockoutState = e?.status?.type?.state ?? 'pre';
    const hasScore = state === 'in' || state === 'post';
    const scoreA = hasScore ? parseInt(home?.score, 10) || 0 : null;
    const scoreB = hasScore ? parseInt(away?.score, 10) || 0 : null;

    let winnerSlot: 'A' | 'B' | null = null;
    if (state === 'post') winnerSlot = home?.winner ? 'A' : away?.winner ? 'B' : null;

    const resolvedA = teamFromCode(home?.team?.abbreviation);
    const resolvedB = teamFromCode(away?.team?.abbreviation);
    out[slotId] = {
      teamA: resolvedA?.team ?? null,
      slugA: resolvedA?.slug ?? null,
      teamB: resolvedB?.team ?? null,
      slugB: resolvedB?.slug ?? null,
      scoreA,
      scoreB,
      winnerSlot,
      state,
      isLive: state === 'in',
      isPenalty: state === 'post' && scoreA != null && scoreA === scoreB,
      clock: state === 'in' ? e?.status?.displayClock ?? null : null,
      espnEventId: e?.id != null ? String(e.id) : null,
    };
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useKnockoutBracket(): KnockoutBracketState {
  const slotIndex = useMemo(() => buildSlotIndex(), []);

  const [byMatchId, setByMatchId] = useState<Record<string, KnockoutMatchData>>({});
  const [available, setAvailable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchBracket = useCallback(async (): Promise<boolean> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      // SEM lang=pt: a ESPN localizaria `team.abbreviation` (NED→HOL…) e
      // quebraria o casamento por código FIFA. Nome/bandeira vêm do data local.
      const res = await fetch(`${ESPN_BASE}?dates=${KNOCKOUT_RANGE}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = parseEspn(await res.json(), slotIndex);
      setByMatchId(parsed);
      setAvailable(true);
      setLastUpdated(new Date());
      setError(false);
      return Object.values(parsed).some((m) => m.isLive);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [slotIndex]);

  useEffect(() => {
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let running = false;

    const schedulePoll = (hasLive: boolean) => {
      if (stopped) return;
      if (pollTimer) clearTimeout(pollTimer);
      pollTimer = setTimeout(() => void tick(), hasLive ? POLL_LIVE_MS : POLL_IDLE_MS);
    };

    const tick = async () => {
      if (running) return;
      if (document.visibilityState !== 'visible') {
        schedulePoll(false);
        return;
      }
      running = true;
      let hasLive = false;
      try {
        hasLive = await fetchBracket();
      } finally {
        running = false;
        schedulePoll(hasLive);
      }
    };

    void (async () => {
      const hasLive = await fetchBracket();
      schedulePoll(hasLive);
    })();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      if (pollTimer) clearTimeout(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
      abortRef.current?.abort();
    };
  }, [fetchBracket]);

  const liveCount = useMemo(
    () => Object.values(byMatchId).filter((m) => m.isLive).length,
    [byMatchId],
  );

  return useMemo(
    () => ({ available, byMatchId, liveCount, lastUpdated, loading, error }),
    [available, byMatchId, liveCount, lastUpdated, loading, error],
  );
}
