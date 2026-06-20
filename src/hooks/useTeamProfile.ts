/**
 * Perfil da seleção, REAL e ao vivo, direto da ESPN (liga `fifa.world`).
 *
 * Duas chamadas, sem backend e sem chave (CORS aberto, igual aos demais hooks):
 *   - `/teams/{id}`        → recorde no torneio (J/V/E/D, GP/GC, saldo, pontos),
 *                            classificação (`standingSummary`), cores, logo e
 *                            próximo jogo.
 *   - `/teams/{id}/roster` → elenco atual: nº, posição, idade, altura, foto.
 *
 * O ID ESPN vem do slug PT-BR via `espnIdForSlug`. Detalhe (recorde/posição) é
 * "ao vivo" → poll de 60s com a aba visível; o elenco muda pouco → busca 1x por
 * seleção. Sem ID/sem rede o estado volta indisponível e a tela cai no elenco
 * projetado local.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withEspnLang } from '../utils/espn';
import { espnIdForSlug } from '../data/espnTeams';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams';
const POLL_MS = 60_000;

export type PosGroup = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface TeamRecord {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface EspnPlayer {
  id: string;
  name: string;
  shortName: string;
  fullName: string | null;
  number: number | null;
  posGroup: PosGroup;
  posName: string;
  age: number | null;
  dateOfBirth: string | null;
  height: string | null;
  weight: string | null;
  photo: string | null;
  flag: string | null;
  injured: boolean;
  injuryDetail: string | null;
  status: string | null;
  citizenship: string | null;
  birthCountry: string | null;
  birthCity: string | null;
}

export interface NextEvent {
  date: string;
  opponentCode: string | null;
  opponentName: string | null;
  home: boolean;
  venue: string | null;
}

export interface TeamInfo {
  id: string;
  color: string | null;
  altColor: string | null;
  logo: string | null;
  standingSummary: string | null;
  record: TeamRecord | null;
  next: NextEvent | null;
}

export interface TeamProfileState {
  loading: boolean;
  error: boolean;
  available: boolean;
  info: TeamInfo | null;
  players: EspnPlayer[];
  lastUpdated: Date | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const POS_GROUP: Record<string, PosGroup> = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD' };
const POS_ORDER: Record<PosGroup, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

function parseRecord(team: any): TeamRecord | null {
  const stats: any[] = team?.record?.items?.[0]?.stats;
  if (!Array.isArray(stats)) return null;
  const get = (n: string): number => Number(stats.find((s) => s?.name === n)?.value ?? 0);
  const played = get('gamesPlayed');
  const losses = get('losses');
  const draws = get('ties');
  const winsRaw = stats.find((s) => s?.name === 'wins')?.value;
  const wins = winsRaw != null ? Number(winsRaw) : Math.max(0, played - losses - draws);
  return {
    played,
    wins,
    draws,
    losses,
    goalsFor: get('pointsFor'),
    goalsAgainst: get('pointsAgainst'),
    goalDiff: get('pointDifferential'),
    points: get('points'),
  };
}

function parseNext(team: any): NextEvent | null {
  const e = team?.nextEvent?.[0];
  const comp = e?.competitions?.[0];
  if (!e || !comp) return null;
  const cs: any[] = comp?.competitors ?? [];
  const me = cs.find((c) => String(c?.team?.id) === String(team?.id));
  const opp = cs.find((c) => c !== me);
  return {
    date: e?.date ?? '',
    opponentCode: opp?.team?.abbreviation ?? null,
    opponentName: opp?.team?.displayName ?? null,
    home: me?.homeAway === 'home',
    venue: comp?.venue?.fullName ?? null,
  };
}

function parseTeam(team: any): TeamInfo {
  return {
    id: String(team?.id ?? ''),
    color: team?.color ?? null,
    altColor: team?.alternateColor ?? null,
    logo: team?.logos?.[0]?.href ?? null,
    standingSummary: team?.standingSummary ?? null,
    record: parseRecord(team),
    next: parseNext(team),
  };
}

function parseRoster(json: any): EspnPlayer[] {
  const athletes: any[] = Array.isArray(json?.athletes) ? json.athletes : [];
  const players: EspnPlayer[] = athletes.map((a) => {
    const abbr: string = a?.position?.abbreviation ?? '';
    const jersey = a?.jersey != null ? parseInt(String(a.jersey), 10) : NaN;
    const injury = Array.isArray(a?.injuries) && a.injuries.length > 0 ? a.injuries[0] : null;
    return {
      id: String(a?.id ?? ''),
      name: a?.displayName ?? a?.fullName ?? '—',
      shortName: a?.shortName ?? a?.displayName ?? '—',
      fullName: a?.fullName ?? null,
      number: Number.isFinite(jersey) ? jersey : null,
      posGroup: POS_GROUP[abbr] ?? 'MID',
      posName: a?.position?.name ?? '',
      age: a?.age != null ? Number(a.age) : null,
      dateOfBirth: a?.dateOfBirth ?? null,
      height: a?.displayHeight ?? null,
      weight: a?.displayWeight ?? null,
      photo: a?.headshot?.href ?? null,
      flag: a?.flag?.href ?? null,
      injured: Boolean(injury),
      injuryDetail: injury?.detail ?? injury?.type?.description ?? injury?.status ?? null,
      status: a?.status?.type ?? a?.status?.name ?? null,
      citizenship: a?.citizenship ?? a?.citizenshipCountry ?? null,
      birthCountry: a?.birthPlace?.country ?? a?.citizenship ?? null,
      birthCity: a?.birthPlace?.city ?? null,
    };
  });
  // Ordena por linha (GK→FWD) e, dentro da linha, por número da camisa.
  return players.sort(
    (x, y) =>
      POS_ORDER[x.posGroup] - POS_ORDER[y.posGroup] ||
      (x.number ?? 99) - (y.number ?? 99),
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export function useTeamProfile(slug: string | undefined): TeamProfileState {
  const id = slug ? espnIdForSlug(slug) : null;

  const [info, setInfo] = useState<TeamInfo | null>(null);
  const [players, setPlayers] = useState<EspnPlayer[]>([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset ao trocar de seleção (padrão React de "resetar estado quando a key muda",
  // feito na renderização — evita dados do time anterior piscarem).
  const [trackedId, setTrackedId] = useState(id);
  if (trackedId !== id) {
    setTrackedId(id);
    setInfo(null);
    setPlayers([]);
    setAvailable(false);
    setError(false);
    setLastUpdated(null);
  }

  // Recorde/posição mudam ao vivo; elenco quase nunca → busca só na 1ª vez.
  const fetchProfile = useCallback(
    async (withRoster: boolean) => {
      if (!id) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const reqs = [fetch(withEspnLang(`${BASE}/${id}`), { signal: ctrl.signal, cache: 'no-store' })];
        if (withRoster) reqs.push(fetch(withEspnLang(`${BASE}/${id}/roster`), { signal: ctrl.signal, cache: 'no-store' }));
        const [detailRes, rosterRes] = await Promise.all(reqs);
        if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);
        const detail = await detailRes.json();
        setInfo(parseTeam(detail?.team ?? {}));
        if (withRoster && rosterRes) {
          if (rosterRes.ok) setPlayers(parseRoster(await rosterRes.json()));
        }
        setAvailable(true);
        setError(false);
        setLastUpdated(new Date());
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError(true);
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;

    const initial = setTimeout(() => void fetchProfile(true), 0);
    const tick = () => {
      if (document.visibilityState === 'visible') void fetchProfile(false);
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      abortRef.current?.abort();
    };
  }, [id, fetchProfile]);

  return useMemo(
    () => ({ loading, error, available, info, players, lastUpdated }),
    [loading, error, available, info, players, lastUpdated],
  );
}
