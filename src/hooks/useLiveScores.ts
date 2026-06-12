/**
 * Placares ao vivo via proxy (Cloudflare Worker → football-data.org).
 *
 * Liga apenas se VITE_LIVE_SCORES_URL estiver definido. Sem ela, o hook devolve
 * `enabled: false` e o app segue com o comportamento normal (placar manual no
 * localStorage) — degradação graciosa, zero quebra.
 *
 * O casamento jogo-da-API ↔ fixture local (M1…M104) é feito por
 * par de códigos {casa, fora} + data BRT. Ver src/data/teamCodes.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FIXTURES } from '../data/matches';
import { codeForSlug } from '../data/teamCodes';

const LIVE_URL = import.meta.env.VITE_LIVE_SCORES_URL as string | undefined;
const POLL_MS = 60_000;

/** Status normalizado vindo do Worker. */
type UpstreamStatus =
  | 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED'
  | 'FINISHED' | 'AWARDED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED';

interface UpstreamMatch {
  utcDate: string;
  status: UpstreamStatus;
  homeCode: string | null;
  awayCode: string | null;
  home: number | null;
  away: number | null;
  minute: number | null;
}

interface LivePayload {
  updatedAt: string;
  matches: UpstreamMatch[];
}

/** Placar ao vivo resolvido para um fixture local. */
export interface LiveScore {
  home: number;
  away: number;
  minute: number | null;
  isLive: boolean;      // jogo rolando (IN_PLAY/PAUSED)
  isFinished: boolean;  // encerrado (FINISHED/AWARDED)
}

export interface LiveScoresState {
  enabled: boolean;
  getLive: (matchId: string) => LiveScore | null;
  lastUpdated: Date | null;
  liveCount: number;    // quantos jogos rolando agora
  loading: boolean;
  error: boolean;
}

const pairKey = (a: string, b: string) => [a, b].sort().join('-');

/** Índice: par-de-códigos → fixtures (id + data BRT) que têm esse confronto. */
function buildPairIndex() {
  const idx = new Map<string, { id: string; date: string }[]>();
  for (const f of FIXTURES) {
    const home = codeForSlug(f.homeSlug);
    const away = codeForSlug(f.awaySlug);
    if (!home || !away) continue; // mata-mata com 'tbd' fica de fora até definir
    const key = pairKey(home, away);
    const list = idx.get(key) ?? [];
    list.push({ id: f.id, date: f.date });
    idx.set(key, list);
  }
  return idx;
}

/** utcDate (UTC) → data ISO no fuso BRT (UTC-3), ex. "2026-06-12". */
function brtDate(utcISO: string): string {
  const t = new Date(utcISO).getTime();
  return new Date(t - 3 * 3600_000).toISOString().slice(0, 10);
}

export function useLiveScores(): LiveScoresState {
  const enabled = Boolean(LIVE_URL);
  const pairIndex = useMemo(() => buildPairIndex(), []);

  const [scores, setScores] = useState<Record<string, LiveScore>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchOnce = useCallback(async () => {
    if (!LIVE_URL) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(LIVE_URL, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as LivePayload;

      const next: Record<string, LiveScore> = {};
      for (const m of data.matches) {
        if (m.home == null || m.away == null) continue; // ainda não começou
        if (!m.homeCode || !m.awayCode) continue;
        const candidates = pairIndex.get(pairKey(m.homeCode, m.awayCode));
        if (!candidates?.length) continue;
        // se o mesmo par jogar mais de uma vez, escolhe o fixture na data BRT certa
        const day = brtDate(m.utcDate);
        const fixture =
          candidates.find((c) => c.date === day) ?? (candidates.length === 1 ? candidates[0] : null);
        if (!fixture) continue;

        next[fixture.id] = {
          home: m.home,
          away: m.away,
          minute: m.minute,
          isLive: m.status === 'IN_PLAY' || m.status === 'PAUSED',
          isFinished: m.status === 'FINISHED' || m.status === 'AWARDED',
        };
      }

      setScores(next);
      setLastUpdated(data.updatedAt ? new Date(data.updatedAt) : new Date());
      setError(false);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(true);
    } finally {
      setLoading(false);
    }
  }, [pairIndex]);

  // Busca ao montar + polling enquanto a aba estiver visível.
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      void fetchOnce();
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void fetchOnce();
      }, POLL_MS);
    };
    start();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void fetchOnce();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      abortRef.current?.abort();
    };
  }, [enabled, fetchOnce]);

  const getLive = useCallback(
    (matchId: string): LiveScore | null => scores[matchId] ?? null,
    [scores],
  );

  const liveCount = useMemo(
    () => Object.values(scores).filter((s) => s.isLive).length,
    [scores],
  );

  return { enabled, getLive, lastUpdated, liveCount, loading, error };
}
