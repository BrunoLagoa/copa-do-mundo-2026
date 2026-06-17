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
import { translateCommentary } from '../utils/translateCommentary';

const SUMMARY_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const REFRESH_MS = 10_000;

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

/** Um lance da narração minuto a minuto. */
export interface CommentaryItem {
  clock: string; // "23'", "" (pré-jogo)
  text: string;
}

/** Um jogo recente (últimos 5 / confronto direto), na ótica de um time. */
export interface PastGame {
  date: string;                 // ISO
  opponent: string;
  opponentLogo: string | null;
  atVs: string;                 // "vs" | "@"
  score: string;                // placar na ótica do time, ex. "2-1"
  result: 'W' | 'D' | 'L' | null;
}

/** Notícia/artigo relacionado. */
export interface NewsItem {
  headline: string;
  href: string;
}

/** Vídeo de destaque. */
export interface VideoItem {
  headline: string;
  href: string;             // página da ESPN (fallback / "abrir no ESPN")
  mp4: string | null;       // .mp4 direto do CDN p/ tocar inline (quando houver)
  thumbnail: string | null;
  duration: number | null;  // segundos
  coverageType: string | null; // "Highlight" = clip do gol; "Analysis"/"News"/… = resto
}

/** Resultado de um chute (mapeado dos type.id da ESPN). */
export type ShotResult = 'goal' | 'saved' | 'off' | 'blocked';

/** Um chute para o mapa de chutes (vindo do `commentary` da ESPN). */
export interface Shot {
  result: ShotResult;
  x: number;            // 0–100, normalizado para o gol atacado
  y: number;            // 0–100, largura do campo
  side: 'home' | 'away';
  player: string | null;
  clock: string;        // "23'"
  period: number;       // 1, 2, 3 (prorrogação)…
  text: string;
}

export interface MatchDetails {
  timeline: TimelineEvent[];
  shots: Shot[];
  lineups: { home: TeamLineup | null; away: TeamLineup | null };
  commentary: CommentaryItem[];
  lastFive: { home: PastGame[]; away: PastGame[] };
  headToHead: PastGame[];
  news: NewsItem[];
  videos: VideoItem[];
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

/** Narração minuto a minuto, mais recente primeiro (máx. 12 lances). */
function parseCommentary(json: any): CommentaryItem[] {
  const raw: any[] = Array.isArray(json?.commentary) ? json.commentary : [];
  return raw
    .filter((c) => c?.text)
    .map((c) => ({ clock: c?.time?.displayValue ?? '', text: translateCommentary(String(c.text)) }))
    .reverse()
    .slice(0, 12);
}

/** Mapeia um jogo recente para a ótica do `teamId` informado. */
function mapPastGame(ev: any, teamId: string | null): PastGame {
  const teamIsHome = teamId != null && String(ev?.homeTeamId) === teamId;
  const gf = parseInt(teamIsHome ? ev?.homeTeamScore : ev?.awayTeamScore, 10);
  const ga = parseInt(teamIsHome ? ev?.awayTeamScore : ev?.homeTeamScore, 10);
  const valid = Number.isFinite(gf) && Number.isFinite(ga);
  return {
    date: ev?.gameDate ?? '',
    opponent: ev?.opponent?.displayName ?? '—',
    opponentLogo: ev?.opponent?.logo ?? null,
    atVs: ev?.atVs ?? 'vs',
    score: valid ? `${gf}-${ga}` : (ev?.score ?? ''),
    result: !valid ? null : gf > ga ? 'W' : gf < ga ? 'L' : 'D',
  };
}

/** Bloco {team, events}[] → jogos por lado (orientado pelo team.id). */
function parseLastFive(json: any, homeId: string | null, awayId: string | null): { home: PastGame[]; away: PastGame[] } {
  const blocks: any[] = Array.isArray(json?.lastFiveGames) ? json.lastFiveGames : [];
  const out: { home: PastGame[]; away: PastGame[] } = { home: [], away: [] };
  for (const b of blocks) {
    const teamId = b?.team?.id != null ? String(b.team.id) : null;
    const games = (Array.isArray(b?.events) ? b.events : []).map((ev: any) => mapPastGame(ev, teamId));
    if (teamId === homeId) out.home = games;
    else if (teamId === awayId) out.away = games;
  }
  return out;
}

/** Confrontos diretos (na ótica do mandante). */
function parseHeadToHead(json: any, homeId: string | null): PastGame[] {
  const blocks: any[] = Array.isArray(json?.headToHeadGames) ? json.headToHeadGames : [];
  const block = blocks.find((b) => String(b?.team?.id) === homeId) ?? blocks[0];
  const teamId = block?.team?.id != null ? String(block.team.id) : homeId;
  return (Array.isArray(block?.events) ? block.events : []).map((ev: any) => mapPastGame(ev, teamId));
}

function parseNews(json: any): NewsItem[] {
  const arts: any[] = Array.isArray(json?.news?.articles) ? json.news.articles : [];
  return arts
    .map((a) => ({ headline: a?.headline ?? '', href: a?.links?.web?.href ?? '' }))
    .filter((a) => a.headline && a.href)
    .slice(0, 5);
}

function parseVideos(json: any): VideoItem[] {
  const vids: any[] = Array.isArray(json?.videos) ? json.videos : [];
  return vids
    .map((v) => {
      const source: string = v?.links?.source?.href ?? '';
      const web: string = v?.links?.web?.href ?? '';
      // O .mp4 do CDN da ESPN é público (CORS *, sem auth) e toca inline.
      // Os demais links (auth/brightcove) só funcionam abrindo a página.
      const mp4 = source.endsWith('.mp4') ? source : null;
      return {
        headline: v?.headline ?? '',
        href: web || source,
        mp4,
        thumbnail: v?.thumbnail ?? null,
        duration: typeof v?.duration === 'number' ? v.duration : null,
        coverageType: v?.tracking?.coverageType ?? null,
      };
    })
    .filter((v) => v.headline && (v.mp4 || v.href))
    // Clips de gol ("Highlight") na frente: assim não são cortados pelo slice e
    // ficam disponíveis para casar com os gols da linha do tempo.
    .sort(
      (a, b) =>
        Number(b.coverageType === 'Highlight') - Number(a.coverageType === 'Highlight'),
    )
    .slice(0, 4);
}
/** type.id da ESPN → resultado do chute (os demais lances são ignorados). */
const SHOT_TYPES: Record<string, ShotResult> = {
  '70': 'goal',     // Goal
  '106': 'saved',   // Shot On Target (no gol, sem ser gol = defendido)
  '117': 'off',     // Shot Off Target
  '135': 'blocked', // Shot Blocked
};

/** Nome do time de cada lado, casado pelos ids ESPN do mandante/visitante. */
function teamNamesBySide(
  json: any,
  homeId: string | null,
  awayId: string | null,
): { home: string | null; away: string | null } {
  const comps: any[] = json?.header?.competitions?.[0]?.competitors ?? [];
  let home: string | null = null;
  let away: string | null = null;
  for (const c of comps) {
    const id = c?.team?.id != null ? String(c.team.id) : null;
    const name: string | null = c?.team?.displayName ?? null;
    if (id && id === homeId) home = name;
    else if (id && id === awayId) away = name;
  }
  return { home, away };
}

/**
 * Extrai os chutes do `commentary` para o mapa de chutes. A ESPN dá, por lance,
 * a posição em campo (`fieldPositionX/Y`, 0–100, normalizada para o gol atacado)
 * e o tipo. No commentary o `play.team` só traz `displayName` (sem id), então o
 * lado é casado pelo nome do time. O array repete entradas → dedup por `play.id`.
 */
function parseShots(json: any, homeId: string | null, awayId: string | null): Shot[] {
  const { home: homeName, away: awayName } = teamNamesBySide(json, homeId, awayId);
  const raw: any[] = Array.isArray(json?.commentary) ? json.commentary : [];
  const seen = new Set<string>();
  const out: Shot[] = [];
  for (const c of raw) {
    const p = c?.play;
    const result = p ? SHOT_TYPES[String(p?.type?.id)] : undefined;
    if (!result) continue;
    const x = p?.fieldPositionX;
    const y = p?.fieldPositionY;
    if (typeof x !== 'number' || typeof y !== 'number') continue; // chute sem coordenada
    const id = p?.id != null ? String(p.id) : `${x},${y},${p?.clock?.displayValue ?? ''}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const teamName: string | null = p?.team?.displayName ?? null;
    const side: 'home' | 'away' | null =
      teamName && teamName === homeName ? 'home' : teamName && teamName === awayName ? 'away' : null;
    if (!side) continue;
    out.push({
      result,
      x,
      y,
      side,
      player: p?.participants?.[0]?.athlete?.displayName ?? null,
      clock: p?.clock?.displayValue ?? '',
      period: Number(p?.period?.number) || 1,
      text: p?.text ?? '',
    });
  }
  return out;
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
  const [shots, setShots] = useState<Shot[]>([]);
  const [lineups, setLineups] = useState<MatchDetails['lineups']>({ home: null, away: null });
  const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
  const [lastFive, setLastFive] = useState<MatchDetails['lastFive']>({ home: [], away: [] });
  const [headToHead, setHeadToHead] = useState<PastGame[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
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
          setShots(parseShots(json, homeId, awayId));
          setLineups(parseLineups(json, homeId, awayId));
          setCommentary(parseCommentary(json));
          setLastFive(parseLastFive(json, homeId, awayId));
          setHeadToHead(parseHeadToHead(json, homeId));
          setNews(parseNews(json));
          setVideos(parseVideos(json));
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

  return { timeline, shots, lineups, commentary, lastFive, headToHead, news, videos, loading, error };
}
