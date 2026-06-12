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
 *   - polling só do dia de hoje (payload pequeno) a cada 60s → atualiza o ao vivo.
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
const POLL_MS = 60_000;

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
  id: string | null;     // id do time na ESPN (orienta a timeline)
  logo: string | null;   // URL do escudo/bandeira (CDN ESPN)
  color: string | null;  // cor primária (hex sem #)
}

/** Placar ao vivo resolvido para um fixture local. */
export interface LiveScore {
  home: number;
  away: number;
  clock: string | null; // ex. "67'", "90'+8'" — só quando ao vivo
  isLive: boolean;       // state === 'in'
  isFinished: boolean;   // state === 'post'
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
  getLive: (matchId: string) => LiveScore | null;
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

function teamStats(competitor: any): TeamStats {
  const st: any[] = competitor?.statistics ?? [];
  return {
    possession: statValue(st, 'possessionPct'),
    shots: statValue(st, 'totalShots'),
    shotsOnTarget: statValue(st, 'shotsOnTarget'),
    corners: statValue(st, 'wonCorners'),
    fouls: statValue(st, 'foulsCommitted'),
  };
}

function teamBrand(competitor: any): TeamBrand {
  return {
    id: competitor?.team?.id != null ? String(competitor.team.id) : null,
    logo: competitor?.team?.logo ?? null,
    color: competitor?.team?.color ?? null,
  };
}

/** Monta o rótulo pt-BR do momento do jogo a partir de state/period/status. */
function statusLabel(state: string, period: number, status: any, clock: string | null): string {
  if (state === 'post') return 'Encerrado';
  if (state !== 'in') return '';
  const name: string = status?.type?.name ?? '';
  if (name.includes('HALFTIME')) return 'Intervalo';
  const suffix = clock ? ` · ${clock}` : '';
  if (period >= 3) return `Prorrogação${suffix}`;
  if (period === 2) return `2º tempo${suffix}`;
  return `1º tempo${suffix}`;
}

/** Converte a resposta da ESPN num mapa fixtureId → LiveScore. */
function parseEspn(json: any, pairIndex: Map<string, FixtureRef[]>): Record<string, LiveScore> {
  const out: Record<string, LiveScore> = {};
  const events: any[] = Array.isArray(json?.events) ? json.events : [];

  for (const e of events) {
    const comp = e?.competitions?.[0];
    const cs: any[] = comp?.competitors ?? [];
    if (cs.length < 2) continue;

    const state: string = e?.status?.type?.state; // 'pre' | 'in' | 'post'
    if (state === 'pre') continue; // ainda não começou → sem placar

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
    const scoreA = parseInt(a?.score, 10) || 0;
    const scoreB = parseInt(b?.score, 10) || 0;
    const aIsOurHome = ca === fx.homeCode;
    const ourHome = aIsOurHome ? a : b;
    const ourAway = aIsOurHome ? b : a;
    const home = aIsOurHome ? scoreA : scoreB;
    const away = aIsOurHome ? scoreB : scoreA;

    const clock = state === 'in' ? (e?.status?.displayClock ?? null) : null;
    const period: number = Number(e?.status?.period) || 1;
    const v = comp?.venue;
    const broadcasts: string[] = Array.isArray(comp?.broadcasts)
      ? comp.broadcasts.flatMap((b: any) => (Array.isArray(b?.names) ? b.names : [])).filter(Boolean)
      : [];

    out[fx.id] = {
      home,
      away,
      clock,
      isLive: state === 'in',
      isFinished: state === 'post',
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
    async (datesParam: string, merge: boolean) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
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
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError(true);
      } finally {
        setLoading(false);
      }
    },
    [pairIndex],
  );

  useEffect(() => {
    // 1) carga inicial: torneio inteiro (preenche todos os resultados).
    //    Deferida em macrotask p/ não rodar setState síncrono dentro do effect.
    const initial = setTimeout(() => void fetchRange(TOURNAMENT_RANGE, false), 0);

    // 2) polling: só o dia de hoje, mesclando sobre a carga inicial.
    const tick = () => {
      if (document.visibilityState === 'visible') void fetchRange(todayBRTParam(), true);
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      abortRef.current?.abort();
    };
  }, [fetchRange]);

  const getLive = useCallback(
    (matchId: string): LiveScore | null => scores[matchId] ?? null,
    [scores],
  );

  const liveCount = useMemo(
    () => Object.values(scores).filter((s) => s.isLive).length,
    [scores],
  );

  return { available, getLive, lastUpdated, liveCount, loading, error };
}
