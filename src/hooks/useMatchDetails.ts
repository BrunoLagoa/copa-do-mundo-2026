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
import { withEspnLang } from '../utils/espn';
import { translateCommentary } from '../utils/translateCommentary';
import { slugForCode } from '../data/teamCodes';
import { ESPN_ID_BY_CODE } from '../data/espnTeams';
import { TEAMS_BY_SLUG } from '../data/teams';

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

/** Dados de bastidor do jogo (público e arbitragem) — só a ESPN tem. */
export interface GameInfo {
  attendance: number | null;
  referee: string | null;
}

/** Uma linha da classificação do grupo (já localizada em pt-BR). */
export interface StandingRow {
  name: string;        // nome pt-BR (ou inglês da ESPN como fallback)
  flag: string | null; // emoji bandeira
  current: boolean;    // é um dos dois times deste jogo (p/ destacar)
  played: number;      // J
  wins: number;        // V
  draws: number;       // E
  losses: number;      // D
  goalDiff: number;    // SG
  points: number;      // PTS
}

/** Classificação do grupo dos dois times + link da tabela completa. */
export interface GroupStandings {
  rows: StandingRow[];
  fullViewLink: string | null;
}

/** Pressão acumulada de um minuto do jogo (base da cronologia/dinâmica). */
export interface MomentumBar {
  minute: number; // minuto absoluto do jogo (1…90+)
  home: number;   // peso ofensivo do mandante naquele minuto
  away: number;   // peso ofensivo do visitante
}

/** Curva de momentum derivada do `commentary` (chutes, escanteios, dribles…). */
export interface MatchMomentum {
  bars: MomentumBar[];
  maxMinute: number; // último minuto com dados (≥90) → escala do eixo
  halftime: number;  // minuto do fim do 1º tempo (marcador "INT")
}

/** Líder de uma categoria (ex.: "Finalizações — Harry Kane, 7"). */
export interface MatchLeader {
  category: string;             // rótulo pt-BR (ex. "Finalizações")
  player: string;               // nome do jogador
  value: string;                // valor exibido (ex. "7")
  side: 'home' | 'away' | null; // lado, p/ colorir
}

/** Uma linha da comparação de estatísticas detalhadas (boxscore). */
export interface TeamStatRow {
  label: string;
  home: number | null;
  away: number | null;
  suffix: string; // "%" ou ""
}

export interface MatchDetails {
  timeline: TimelineEvent[];
  shots: Shot[];
  momentum: MatchMomentum;
  leaders: MatchLeader[];
  boxStats: TeamStatRow[];
  gameInfo: GameInfo;
  standings: GroupStandings | null;
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

/** Público e árbitro, do `gameInfo` da ESPN. */
function parseGameInfo(json: any): GameInfo {
  const gi = json?.gameInfo ?? {};
  const officials: any[] = Array.isArray(gi?.officials) ? gi.officials : [];
  const ref = officials.find((o) =>
    /referee|[áa]rbitro/i.test(o?.position?.displayName ?? o?.position?.name ?? ''),
  );
  return {
    attendance: typeof gi?.attendance === 'number' ? gi.attendance : null,
    referee: ref?.displayName ?? officials[0]?.displayName ?? null,
  };
}

/** ESPN id → código FIFA (reverso de ESPN_ID_BY_CODE) p/ localizar nomes. */
const CODE_BY_ESPN_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ESPN_ID_BY_CODE).map(([code, id]) => [id, code]),
);

function standingStat(stats: any[], name: string): number {
  const s = Array.isArray(stats) ? stats.find((x) => x?.name === name) : null;
  const v = s ? Number(s.value ?? s.displayValue) : 0;
  return Number.isFinite(v) ? v : 0;
}

/**
 * Classificação do grupo deste jogo — já vem no payload `summary` (sem fetch
 * extra), com 1 grupo (os 4 times do confronto). Nome localizado pelo id ESPN
 * → código FIFA → slug → nome pt-BR (mesma cadeia do useStandings).
 */
function parseStandings(json: any, homeId: string | null, awayId: string | null): GroupStandings | null {
  const entries: any[] = json?.standings?.groups?.[0]?.standings?.entries ?? [];
  if (entries.length === 0) return null;
  const rows = entries
    .map((e) => {
      const espnId = e?.id != null ? String(e.id) : null;
      const code = espnId ? CODE_BY_ESPN_ID[espnId] : null;
      const slug = code ? slugForCode(code) : null;
      const local = slug ? TEAMS_BY_SLUG[slug] : null;
      const stats: any[] = e?.stats ?? [];
      const espnName = typeof e?.team === 'string' ? e.team : e?.team?.displayName;
      const row: StandingRow = {
        name: local?.team.name ?? espnName ?? code ?? '?',
        flag: local?.team.flag ?? null,
        current: Boolean(espnId && (espnId === homeId || espnId === awayId)),
        played: standingStat(stats, 'gamesPlayed'),
        wins: standingStat(stats, 'wins'),
        draws: standingStat(stats, 'ties'),
        losses: standingStat(stats, 'losses'),
        goalDiff: standingStat(stats, 'pointDifferential'),
        points: standingStat(stats, 'points'),
      };
      return { rank: standingStat(stats, 'rank'), row };
    })
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.row);
  return { rows, fullViewLink: json?.standings?.fullViewLink?.href ?? null };
}

// ─── Cronologia / dinâmica (momentum) ────────────────────────────────────────

/** Minuto absoluto (inteiro) a partir do displayValue da ESPN ("45'+2'" → 45). */
function clockMinute(displayValue: string): number {
  const m = /^(\d+)/.exec(displayValue || '');
  return m ? parseInt(m[1], 10) : 0;
}

/** Peso ofensivo de um lance do commentary (0 = não conta para o momentum). */
function playWeight(p: any): number {
  const id = String(p?.type?.id ?? '');
  if (id === '70') return 6;                       // gol
  if (id === '106') return 3;                      // chute no gol (defendido)
  if (id === '117' || id === '135') return 1.8;    // chute fora / bloqueado
  const slug = String(p?.type?.type ?? '');
  const text = String(p?.type?.text ?? '').toLowerCase();
  if (slug.includes('corner') || text.includes('escanteio')) return 1;
  if (slug.includes('dribble') || text.includes('drible')) return 0.6;
  if (slug.includes('offside') || text.includes('impedimento')) return 0.5;
  return 0;
}

/**
 * Curva de momentum por minuto, derivada do `commentary`. Cada lance ofensivo
 * soma peso ao seu time no minuto correspondente (acima = mandante, abaixo =
 * visitante). O lado vem pelo nome do time (commentary não traz id), igual ao
 * mapa de chutes.
 */
function parseMomentum(json: any, homeId: string | null, awayId: string | null): MatchMomentum {
  const { home: homeName, away: awayName } = teamNamesBySide(json, homeId, awayId);
  const raw: any[] = Array.isArray(json?.commentary) ? json.commentary : [];
  const byMin = new Map<number, { home: number; away: number }>();
  let maxMinute = 90;
  let halftime = 45;
  for (const c of raw) {
    const p = c?.play;
    if (!p) continue;
    const w = playWeight(p);
    if (w <= 0) continue;
    const min = clockMinute(p?.clock?.displayValue ?? '');
    if (!min) continue;
    const name: string | null = p?.team?.displayName ?? null;
    const side: 'home' | 'away' | null =
      name && name === homeName ? 'home' : name && name === awayName ? 'away' : null;
    if (!side) continue;
    const slot = byMin.get(min) ?? { home: 0, away: 0 };
    slot[side] += w;
    byMin.set(min, slot);
    if (min > maxMinute) maxMinute = min;
    if (Number(p?.period?.number) === 1 && min > halftime && min <= 50) halftime = min;
  }
  const bars = Array.from(byMin.entries())
    .map(([minute, v]) => ({ minute, home: v.home, away: v.away }))
    .sort((a, b) => a.minute - b.minute);
  return { bars, maxMinute, halftime };
}

// ─── Destaques individuais (leaders) ─────────────────────────────────────────

const LEADER_LABELS: Record<string, string> = {
  totalShots: 'Finalizações',
  accuratePasses: 'Passes certos',
  defensiveInterventions: 'Ações defensivas',
  saves: 'Defesas',
  goals: 'Gols',
  goalAssists: 'Assistências',
};

/** Melhor jogador de cada categoria, somando os dois times (pega o maior valor). */
function parseLeaders(json: any, homeId: string | null, awayId: string | null): MatchLeader[] {
  const teams: any[] = Array.isArray(json?.leaders) ? json.leaders : [];
  const best = new Map<string, { leader: MatchLeader; num: number }>();
  for (const t of teams) {
    const teamId = t?.team?.id != null ? String(t.team.id) : null;
    const side: 'home' | 'away' | null =
      teamId && teamId === homeId ? 'home' : teamId && teamId === awayId ? 'away' : null;
    const cats: any[] = Array.isArray(t?.leaders) ? t.leaders : [];
    for (const cat of cats) {
      const name = String(cat?.name ?? '');
      const top = cat?.leaders?.[0];
      if (!top) continue;
      const num = Number(String(top?.value ?? top?.displayValue ?? '').replace('%', ''));
      if (!Number.isFinite(num) || num <= 0) continue;
      const leader: MatchLeader = {
        category: cat?.displayName || LEADER_LABELS[name] || name,
        player: top?.athlete?.displayName ?? top?.athlete?.shortName ?? '—',
        value: String(top?.displayValue ?? num),
        side,
      };
      const cur = best.get(name);
      if (!cur || num > cur.num) best.set(name, { leader, num });
    }
  }
  return Array.from(best.values()).map((b) => b.leader);
}

// ─── Estatísticas detalhadas (boxscore) ──────────────────────────────────────

const BOX_STATS: { key: string; label: string; suffix: string }[] = [
  { key: 'possessionPct', label: 'Posse de bola', suffix: '%' },
  { key: 'totalShots', label: 'Finalizações', suffix: '' },
  { key: 'shotsOnTarget', label: 'Finalizações no gol', suffix: '' },
  { key: 'wonCorners', label: 'Escanteios', suffix: '' },
  { key: 'offsides', label: 'Impedimentos', suffix: '' },
  { key: 'foulsCommitted', label: 'Faltas', suffix: '' },
  { key: 'yellowCards', label: 'Cartões amarelos', suffix: '' },
  { key: 'saves', label: 'Defesas', suffix: '' },
  { key: 'accuratePasses', label: 'Passes certos', suffix: '' },
  { key: 'totalTackles', label: 'Desarmes', suffix: '' },
  { key: 'interceptions', label: 'Interceptações', suffix: '' },
];

/** {name → valor numérico} das estatísticas de um time no boxscore. */
function statMap(team: any): Record<string, number> {
  const stats: any[] = Array.isArray(team?.statistics) ? team.statistics : [];
  const out: Record<string, number> = {};
  for (const s of stats) {
    const v = Number(String(s?.displayValue ?? s?.value ?? '').replace('%', ''));
    if (s?.name && Number.isFinite(v)) out[s.name] = v;
  }
  return out;
}

/** Comparação detalhada mandante × visitante a partir do boxscore. */
function parseBoxStats(json: any, homeId: string | null, awayId: string | null): TeamStatRow[] {
  const teams: any[] = Array.isArray(json?.boxscore?.teams) ? json.boxscore.teams : [];
  let home: any = null;
  let away: any = null;
  for (const t of teams) {
    const id = t?.team?.id != null ? String(t.team.id) : null;
    if (id === homeId) home = t;
    else if (id === awayId) away = t;
  }
  if (!home && !away) return [];
  const hm = statMap(home);
  const am = statMap(away);
  const rows: TeamStatRow[] = [];
  for (const def of BOX_STATS) {
    const h = def.key in hm ? hm[def.key] : null;
    const a = def.key in am ? am[def.key] : null;
    if (h === null && a === null) continue;
    rows.push({ label: def.label, home: h, away: a, suffix: def.suffix });
  }
  return rows;
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
  const [momentum, setMomentum] = useState<MatchMomentum>({ bars: [], maxMinute: 90, halftime: 45 });
  const [leaders, setLeaders] = useState<MatchLeader[]>([]);
  const [boxStats, setBoxStats] = useState<TeamStatRow[]>([]);
  const [gameInfo, setGameInfo] = useState<GameInfo>({ attendance: null, referee: null });
  const [standings, setStandings] = useState<GroupStandings | null>(null);
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
        const res = await fetch(withEspnLang(`${SUMMARY_BASE}?event=${eventId}`), {
          signal: ctrl.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setTimeline(parseSummary(json, homeId, awayId));
          setShots(parseShots(json, homeId, awayId));
          setMomentum(parseMomentum(json, homeId, awayId));
          setLeaders(parseLeaders(json, homeId, awayId));
          setBoxStats(parseBoxStats(json, homeId, awayId));
          setGameInfo(parseGameInfo(json));
          setStandings(parseStandings(json, homeId, awayId));
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

  return { timeline, shots, momentum, leaders, boxStats, gameInfo, standings, lineups, commentary, lastFive, headToHead, news, videos, loading, error };
}
