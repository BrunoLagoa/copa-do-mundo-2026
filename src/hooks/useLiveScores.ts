/**
 * Placares ao vivo — 100% client-side, direto da API pública da ESPN.
 *
 * Por que ESPN: é a única fonte que junta os 3 requisitos para um site estático
 * (GitHub Pages, sem backend):
 *   1. CORS aberto (`access-control-allow-origin: *`) → o browser chama direto;
 *   2. Sem chave/secret → nada exposto, nada pra configurar;
 *   3. Jogo ao vivo de verdade (`state: in` + minuto via `displayClock`).
 *
 * Sem Worker, sem GitHub Action, sem variável de ambiente. Funciona sozinho.
 *
 * Estratégia de rede:
 *   - 1 fetch do range do torneio inteiro no mount → preenche TODOS os
 *     resultados reais (inclusive "Resultados anteriores").
 *   - polling adaptativo só do dia de hoje (payload pequeno): 5s com jogo ao
 *     vivo, 60s sem → atualiza o ao vivo sem martelar a API à toa.
 *
 * Casamento jogo-da-ESPN ↔ fixture local (M1…M104): por par de códigos FIFA
 * {casa,fora}. As siglas da ESPN coincidem com os códigos de src/data/teamCodes.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FIXTURES } from '../data/matches';
import { codeForSlug } from '../data/teamCodes';

const ESPN_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
/** Range do torneio inteiro (11 jun – 19 jul 2026). */
const TOURNAMENT_RANGE = '20260611-20260719';
const POLL_LIVE_MS = 5_000;   // com jogo ao vivo
const POLL_IDLE_MS = 60_000;  // sem jogo ao vivo

/** Estatísticas de um time num jogo (vindas da ESPN, podem faltar). */
export interface TeamStats {
  possession: number | null;   // % posse de bola
  shots: number | null;        // finalizações totais
  shotsOnTarget: number | null;// finalizações no gol
  corners: number | null;      // escanteios
  fouls: number | null;        // faltas cometidas
}

/** Identidade visual de um time vinda da ESPN. */
export interface TeamBrand {
  id: string | null;       // id do time na ESPN (orienta a timeline)
  logo: string | null;     // URL do escudo/bandeira (CDN ESPN)
  color: string | null;    // cor primária (hex sem #)
  altColor: string | null; // cor alternativa (hex sem #) — usada quando a primária é clara demais
}

/** Placar ao vivo resolvido para um fixture local. */
export interface LiveScore {
  home: number;
  away: number;
  clock: string | null; // ex. "67'", "90'+8'" — só quando ao vivo
  isLive: boolean;       // state === 'in'
  isFinished: boolean;   // state === 'post'
  isPre: boolean;        // state === 'pre' (ainda não começou)
  /** Rótulo pt-BR do momento do jogo: "1º tempo", "Intervalo", "2º tempo", "Encerrado". */
  statusDetail: string;
  period: number;        // 1, 2, 3 (prorrogação)…
  /** Local do jogo segundo a ESPN (pode complementar o fixture local). */
  venue: { name: string | null; city: string | null; country: string | null } | null;
  /** Forma recente — string tipo "DWDDW" (mais recente à direita). */
  homeForm: string | null;
  awayForm: string | null;
  /** Estatísticas ao vivo (já vêm no scoreboard, sem fetch extra). */
  stats: { home: TeamStats; away: TeamStats } | null;
  /** Emissoras (grade dos EUA: FOX, Telemundo, Peacock…). */
  broadcasts: string[];
  /** ID do evento na ESPN — usado para deep link e para buscar detalhes. */
  espnEventId: string | null;
  homeBrand: TeamBrand | null;
  awayBrand: TeamBrand | null;
}

export interface LiveScoresState {
  /** true assim que a ESPN responde válido ao menos uma vez → mostra a barra */
  available: boolean;
  /** Placar autoritativo — só jogos ao vivo/encerrados (futuros retornam null). */
  getLive: (matchId: string) => LiveScore | null;
  /** Entrada da ESPN em qualquer estado (inclui futuros) — p/ painel de detalhes. */
  getEntry: (matchId: string) => LiveScore | null;
  lastUpdated: Date | null;
  liveCount: number;
  loading: boolean;
  error: boolean;
}

interface FixtureRef {
  id: string;
  date: string;     // ISO BRT "2026-06-12"
  homeCode: string; // código FIFA do mandante no NOSSO fixture
  awayCode: string;
}

const pairKey = (a: string, b: string) => [a, b].sort().join('-');

/** Índice: par-de-códigos → fixtures que têm esse confronto. */
function buildPairIndex(): Map<string, FixtureRef[]> {
  const idx = new Map<string, FixtureRef[]>();
  for (const f of FIXTURES) {
    const homeCode = codeForSlug(f.homeSlug);
    const awayCode = codeForSlug(f.awaySlug);
    if (!homeCode || !awayCode) continue; // placeholders de mata-mata ficam de fora
    const key = pairKey(homeCode, awayCode);
    const list = idx.get(key) ?? [];
    list.push({ id: f.id, date: f.date, homeCode, awayCode });
    idx.set(key, list);
  }
  return idx;
}

/** Data UTC ISO → data no fuso BRT (UTC-3), ex. "2026-06-12". */
function brtDate(utcISO: string): string {
  const t = new Date(utcISO).getTime();
  return new Date(t - 3 * 3600_000).toISOString().slice(0, 10);
}

/** "20260612" para hoje em BRT (usado no polling do dia). */
function todayBRTParam(): string {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '');
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Lê uma estatística (por nome) do array competitor.statistics da ESPN. */
function statValue(stats: any[], name: string): number | null {
  const s = Array.isArray(stats) ? stats.find((x) => x?.name === name) : null;
  if (!s) return null;
  const v = parseFloat(s.displayValue ?? s.value);
  return Number.isFinite(v) ? v : null;
}

export function teamStats(competitor: any): TeamStats {
  const st: any[] = competitor?.statistics ?? [];
  return {
    possession: statValue(st, 'possessionPct'),
    shots: statValue(st, 'totalShots'),
    shotsOnTarget: statValue(st, 'shotsOnTarget'),
    corners: statValue(st, 'wonCorners'),
    fouls: statValue(st, 'foulsCommitted'),
  };
}

export function teamBrand(competitor: any): TeamBrand {
  return {
    id: competitor?.team?.id != null ? String(competitor.team.id) : null,
    logo: competitor?.team?.logo ?? null,
    color: competitor?.team?.color ?? null,
    altColor: competitor?.team?.alternateColor ?? null,
  };
}

/** Monta o rótulo pt-BR do momento do jogo a partir de state/period/status. */
export function statusLabel(state: string, period: number, status: any, clock: string | null): string {
  if (state === 'post') return 'Encerrado';
  if (state !== 'in') return '';
  const name: string = status?.type?.name ?? '';
  if (name.includes('HALFTIME')) return 'Intervalo';
  const suffix = clock ? ` · ${clock}` : '';
  if (period >= 3) return `Prorrogação${suffix}`;
  if (period === 2) return `2º tempo${suffix}`;
  return `1º tempo${suffix}`;
}

/**
 * Monta um LiveScore a partir de dois competitors JÁ orientados ao nosso
 * mandante/visitante (a ESPN pode inverter a ordem). Compartilhado entre o
 * scoreboard de grupos (este hook) e o do mata-mata (useKnockoutBracket), que
 * batem no mesmo endpoint e têm a mesma estrutura de evento.
 */
export function buildLiveScore(ourHome: any, ourAway: any, comp: any, e: any): LiveScore {
  const state: string = e?.status?.type?.state; // 'pre' | 'in' | 'post'
  const homeScore = parseInt(ourHome?.score, 10) || 0;
  const awayScore = parseInt(ourAway?.score, 10) || 0;
  const clock = state === 'in' ? (e?.status?.displayClock ?? null) : null;
  const period: number = Number(e?.status?.period) || 1;
  const v = comp?.venue;
  const broadcasts: string[] = Array.isArray(comp?.broadcasts)
    ? comp.broadcasts.flatMap((b: any) => (Array.isArray(b?.names) ? b.names : [])).filter(Boolean)
    : [];
  return {
    home: homeScore,
    away: awayScore,
    clock,
    isLive: state === 'in',
    isFinished: state === 'post',
    isPre: state === 'pre',
    statusDetail: statusLabel(state, period, e?.status, clock),
    period,
    venue: v
      ? { name: v?.fullName ?? null, city: v?.address?.city ?? null, country: v?.address?.country ?? null }
      : null,
    homeForm: ourHome?.form ?? null,
    awayForm: ourAway?.form ?? null,
    stats: { home: teamStats(ourHome), away: teamStats(ourAway) },
    broadcasts,
    espnEventId: e?.id != null ? String(e.id) : null,
    homeBrand: teamBrand(ourHome),
    awayBrand: teamBrand(ourAway),
  };
}

/** Converte a resposta da ESPN num mapa fixtureId → LiveScore. */
function parseEspn(json: any, pairIndex: Map<string, FixtureRef[]>): Record<string, LiveScore> {
  const out: Record<string, LiveScore> = {};
  const events: any[] = Array.isArray(json?.events) ? json.events : [];

  for (const e of events) {
    const comp = e?.competitions?.[0];
    const cs: any[] = comp?.competitors ?? [];
    if (cs.length < 2) continue;

    const [a, b] = cs;
    const ca: string | undefined = a?.team?.abbreviation;
    const cb: string | undefined = b?.team?.abbreviation;
    if (!ca || !cb) continue;

    const candidates = pairIndex.get(pairKey(ca, cb));
    if (!candidates?.length) continue;

    const day = brtDate(e.date);
    const fx =
      candidates.find((c) => c.date === day) ?? (candidates.length === 1 ? candidates[0] : null);
    if (!fx) continue;

    // Orienta tudo para o NOSSO mandante/visitante (a ESPN pode inverter).
    const aIsOurHome = ca === fx.homeCode;
    const ourHome = aIsOurHome ? a : b;
    const ourAway = aIsOurHome ? b : a;

    out[fx.id] = buildLiveScore(ourHome, ourAway, comp, e);
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useLiveScores(): LiveScoresState {
  const pairIndex = useMemo(() => buildPairIndex(), []);

  const [scores, setScores] = useState<Record<string, LiveScore>>({});
  const [available, setAvailable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRange = useCallback(
    async (datesParam: string, merge: boolean): Promise<boolean> => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        // SEM lang=pt: a ESPN localiza `team.abbreviation` (NED→HOL, GER→ALE) e
        // quebraria o casamento por código FIFA. O texto exibido é todo local.
        const res = await fetch(`${ESPN_BASE}?dates=${datesParam}`, {
          signal: ctrl.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const parsed = parseEspn(await res.json(), pairIndex);

        setScores((prev) => (merge ? { ...prev, ...parsed } : parsed));
        setAvailable(true);
        setLastUpdated(new Date());
        setError(false);
        return Object.values(parsed).some((s) => s.isLive);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError(true);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [pairIndex],
  );

  useEffect(() => {
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;  // após o cleanup, não reagenda nada
    let running = false;  // evita ticks concorrentes (refocus durante um fetch)

    // Reprograma o próximo tick. Sempre limpa o anterior, então nunca há dois
    // timers vivos — é o que prendia o ciclo no intervalo lento.
    const schedulePoll = (hasLive: boolean) => {
      if (stopped) return;
      if (pollTimer) clearTimeout(pollTimer);
      pollTimer = setTimeout(() => void tick(), hasLive ? POLL_LIVE_MS : POLL_IDLE_MS);
    };

    const tick = async () => {
      if (running) return;
      // aba oculta: não busca, só reagenda devagar até voltar a ficar visível.
      if (document.visibilityState !== 'visible') {
        schedulePoll(false);
        return;
      }
      running = true;
      let hasLive = false;
      try {
        hasLive = await fetchRange(todayBRTParam(), true);
      } finally {
        running = false;
        schedulePoll(hasLive);
      }
    };

    // Carga inicial: torneio inteiro (preenche todos os resultados) e JÁ decide a
    // cadência do polling pelo resultado — sem esperar um ciclo ocioso de 60s.
    void (async () => {
      const hasLive = await fetchRange(TOURNAMENT_RANGE, false);
      schedulePoll(hasLive);
    })();

    // Ao voltar para a aba, atualiza na hora (o tick já reagenda na cadência certa).
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
  }, [fetchRange]);

  const getLive = useCallback(
    (matchId: string): LiveScore | null => {
      const e = scores[matchId];
      return e && !e.isPre ? e : null; // futuros não exibem placar
    },
    [scores],
  );

  const getEntry = useCallback(
    (matchId: string): LiveScore | null => scores[matchId] ?? null,
    [scores],
  );

  const liveCount = useMemo(
    () => Object.values(scores).filter((s) => s.isLive).length,
    [scores],
  );

  return { available, getLive, getEntry, lastUpdated, liveCount, loading, error };
}
