/**
 * Painel de detalhes de um jogo (ao vivo ou encerrado).
 *
 * Junta o que a ESPN entrega de graça:
 *   - linha do tempo de gols/cartões (endpoint summary, via useMatchDetails);
 *   - estatísticas comparativas (posse, finalizações, escanteios, faltas);
 *   - forma recente dos dois times;
 *   - estádio/cidade e emissoras;
 *   - link "Ver no ESPN".
 *
 * Só é montado quando o usuário expande o card, então o fetch extra (summary)
 * acontece sob demanda — nunca em massa.
 */

import { useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, MapPin, Newspaper, Play, PlayCircle, Tv } from 'lucide-react';
import type { LiveScore, TeamStats } from '../hooks/useLiveScores';
import {
  useMatchDetails,
  type CommentaryItem,
  type NewsItem,
  type PastGame,
  type TeamLineup,
  type TimelineEvent,
  type VideoItem,
} from '../hooks/useMatchDetails';

// ─── Forma recente: "DWDDW" → bolinhas coloridas ─────────────────────────────

function FormDots({ form }: { form: string | null }) {
  if (!form) return null;
  const color = (c: string) =>
    c === 'W' ? 'bg-green-500' : c === 'L' ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-500';
  const label = (c: string) => (c === 'W' ? 'Vitória' : c === 'L' ? 'Derrota' : 'Empate');
  return (
    <div className="flex items-center gap-0.5" aria-label={`Forma recente: ${form}`}>
      {form.split('').map((c, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${color(c)}`} title={label(c)} />
      ))}
    </div>
  );
}

// ─── Barra comparativa de uma estatística ────────────────────────────────────

function StatBar({ label, home, away, suffix = '' }: { label: string; home: number | null; away: number | null; suffix?: string }) {
  if (home === null && away === null) return null;
  const h = home ?? 0;
  const a = away ?? 0;
  const total = h + a;
  const homePct = total > 0 ? (h / total) * 100 : 50;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-semibold tabular-nums text-gray-700 dark:text-gray-200">
        <span>{home ?? '–'}{suffix}</span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
        <span>{away ?? '–'}{suffix}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className="bg-green-500" style={{ width: `${homePct}%` }} />
        <div className="bg-blue-500" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

function StatsBlock({ home, away }: { home: TeamStats; away: TeamStats }) {
  const hasAny =
    [home, away].some((s) => s.possession ?? s.shots ?? s.shotsOnTarget ?? s.corners ?? s.fouls);
  if (!hasAny) return null;
  return (
    <div className="space-y-2">
      <StatBar label="Posse" home={home.possession} away={away.possession} suffix="%" />
      <StatBar label="Finalizações" home={home.shots} away={away.shots} />
      <StatBar label="No gol" home={home.shotsOnTarget} away={away.shotsOnTarget} />
      <StatBar label="Escanteios" home={home.corners} away={away.corners} />
      <StatBar label="Faltas" home={home.fouls} away={away.fouls} />
    </div>
  );
}

// ─── Linha do tempo de gols/cartões ──────────────────────────────────────────

const KIND_ICON: Record<TimelineEvent['kind'], string> = {
  goal: '⚽',
  'own-goal': '⚽',
  penalty: '🎯',
  yellow: '🟨',
  red: '🟥',
  sub: '🔁',
};

const GOAL_KINDS: TimelineEvent['kind'][] = ['goal', 'own-goal', 'penalty'];

/**
 * Busca o replay do gol no YouTube. A ESPN não entrega o vídeo de cada gol
 * pela API, então abrimos uma busca já montada ("time x time jogador gol")
 * em vez de um link direto — cobre todo gol, sem custo nem backend.
 */
function youtubeGoalSearch(ev: TimelineEvent, homeName: string, awayName: string): string {
  const q = `${homeName} x ${awayName} ${ev.player ?? ''} gol`.replace(/\s+/g, ' ').trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

function TimelineRow({ ev, homeName, awayName }: { ev: TimelineEvent; homeName: string; awayName: string }) {
  const isHome = ev.side === 'home';
  const isAway = ev.side === 'away';
  const tag = ev.kind === 'own-goal' ? ' (contra)' : ev.kind === 'penalty' ? ' (pênalti)' : '';
  const isGoal = GOAL_KINDS.includes(ev.kind);
  const body = (
    <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-gray-700 dark:text-gray-200">
      <span>{KIND_ICON[ev.kind]}</span>
      <span className="font-semibold tabular-nums text-gray-500 dark:text-gray-400">{ev.clock}</span>
      <span className="truncate">{ev.player ?? ev.text}{tag}</span>
      {isGoal && (
        <a
          href={youtubeGoalSearch(ev, homeName, awayName)}
          target="_blank"
          rel="noopener noreferrer"
          title="Procurar o replay deste gol no YouTube"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 items-center gap-0.5 rounded bg-red-50 px-1 py-0.5 text-[9px] font-bold text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
        >
          <Play size={9} className="fill-current" />
          replay
        </a>
      )}
    </span>
  );
  return (
    <div className={`flex ${isHome ? 'justify-start' : isAway ? 'justify-end' : 'justify-center'}`}>
      {body}
    </div>
  );
}

function Timeline({ events, loading, homeName, awayName }: { events: TimelineEvent[]; loading: boolean; homeName: string; awayName: string }) {
  if (loading && events.length === 0) {
    return <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">Carregando lances…</p>;
  }
  if (events.length === 0) return null;
  return (
    <div className="space-y-1">
      {events.map((ev, i) => (
        <TimelineRow key={i} ev={ev} homeName={homeName} awayName={awayName} />
      ))}
    </div>
  );
}

// ─── Escalações ───────────────────────────────────────────────────────────────

function PlayerRow({ jersey, name, position, marker }: { jersey: string; name: string; position: string | null; marker: 'in' | 'out' | null }) {
  return (
    <li className="flex items-center gap-1 text-[10px] text-gray-700 dark:text-gray-200">
      <span className="w-4 shrink-0 text-right font-bold tabular-nums text-gray-400 dark:text-gray-500">{jersey}</span>
      <span className="truncate" title={name}>{name}</span>
      {position && <span className="ml-auto shrink-0 text-[8px] font-semibold uppercase text-gray-400 dark:text-gray-500">{position}</span>}
      {marker === 'out' && <ArrowDown size={9} className="shrink-0 text-red-500" />}
      {marker === 'in' && <ArrowUp size={9} className="shrink-0 text-green-500" />}
    </li>
  );
}

function LineupColumn({ name, lineup }: { name: string; lineup: TeamLineup | null }) {
  if (!lineup || lineup.starters.length === 0) {
    return (
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">{name}</p>
        <p className="text-[9px] text-gray-400 dark:text-gray-500">Escalação indisponível</p>
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-1">
        <p className="truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">{name}</p>
        {lineup.formation && (
          <span className="shrink-0 rounded bg-gray-200 px-1 text-[8px] font-bold tabular-nums text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {lineup.formation}
          </span>
        )}
      </div>
      <ul className="space-y-0.5">
        {lineup.starters.map((p, i) => (
          <PlayerRow key={i} jersey={p.jersey} name={p.name} position={p.position} marker={p.subbedOut ? 'out' : null} />
        ))}
      </ul>
      {lineup.bench.some((p) => p.subbedIn) && (
        <>
          <p className="mt-1.5 mb-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Entraram</p>
          <ul className="space-y-0.5">
            {lineup.bench.filter((p) => p.subbedIn).map((p, i) => (
              <PlayerRow key={i} jersey={p.jersey} name={p.name} position={p.position} marker="in" />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Lineups({ home, away, homeName, awayName }: { home: TeamLineup | null; away: TeamLineup | null; homeName: string; awayName: string }) {
  if (!home && !away) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <LineupColumn name={homeName} lineup={home} />
      <LineupColumn name={awayName} lineup={away} />
    </div>
  );
}

// ─── Narração minuto a minuto ─────────────────────────────────────────────────

function Commentary({ items }: { items: CommentaryItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((c, i) => (
        <li key={i} className="flex items-baseline gap-2.5 text-[11px] leading-snug text-gray-600 dark:text-gray-300">
          {c.clock && <span className="shrink-0 min-w-[3rem] text-right font-bold tabular-nums text-red-500">{c.clock}</span>}
          <span className="min-w-0 flex-1">{c.text}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Últimos jogos / confronto direto ─────────────────────────────────────────

function resultColor(r: PastGame['result']): string {
  return r === 'W' ? 'bg-green-500' : r === 'L' ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-500';
}

function PastGameRow({ g }: { g: PastGame }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-300">
      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ${resultColor(g.result)}`}>
        {g.result ?? '–'}
      </span>
      <span className="text-gray-400 dark:text-gray-500">{g.atVs}</span>
      {g.opponentLogo && <img src={g.opponentLogo} alt="" className="h-3 w-3 shrink-0 object-contain" loading="lazy" />}
      <span className="truncate" title={g.opponent}>{g.opponent}</span>
      <span className="ml-auto shrink-0 font-semibold tabular-nums">{g.score}</span>
    </div>
  );
}

function LastFive({ home, away, homeName, awayName }: { home: PastGame[]; away: PastGame[]; homeName: string; awayName: string }) {
  if (home.length === 0 && away.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">{homeName}</p>
        {home.map((g, i) => <PastGameRow key={i} g={g} />)}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">{awayName}</p>
        {away.map((g, i) => <PastGameRow key={i} g={g} />)}
      </div>
    </div>
  );
}

function HeadToHead({ games }: { games: PastGame[] }) {
  if (games.length === 0) return null;
  return (
    <div className="space-y-1">
      {games.map((g, i) => <PastGameRow key={i} g={g} />)}
    </div>
  );
}

// ─── Destaques (vídeos) e notícias ────────────────────────────────────────────

function formatDuration(s: number | null): string | null {
  if (!s || s <= 0) return null;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function VideoRow({ v }: { v: VideoItem }) {
  const [open, setOpen] = useState(false);
  const dur = formatDuration(v.duration);

  // Tem .mp4 público → toca dentro do app (já aberto). Bom estado final.
  if (open && v.mp4) {
    return (
      <div className="space-y-1">
        <video
          src={v.mp4}
          poster={v.thumbnail ?? undefined}
          controls
          autoPlay
          playsInline
          className="w-full rounded bg-black"
        />
        <p className="text-[11px] leading-snug text-gray-600 dark:text-gray-300">{v.headline}</p>
      </div>
    );
  }

  const thumb = (
    <span className="relative flex h-9 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
      {v.thumbnail ? (
        <img src={v.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <PlayCircle size={16} className="text-gray-400" />
      )}
      {v.mp4 && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <PlayCircle size={18} className="text-white drop-shadow" />
        </span>
      )}
      {dur && (
        <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 text-[8px] font-bold tabular-nums text-white">
          {dur}
        </span>
      )}
    </span>
  );
  const label = (
    <span className="min-w-0 text-[11px] leading-snug text-gray-700 group-hover:text-blue-600 dark:text-gray-200 dark:group-hover:text-blue-400">
      {v.headline}
    </span>
  );

  // Com mp4 → botão que abre o player inline. Sem mp4 → link p/ a página da ESPN.
  if (v.mp4) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="group flex w-full items-center gap-2 text-left"
      >
        {thumb}
        {label}
      </button>
    );
  }
  return (
    <a href={v.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="group flex items-center gap-2">
      {thumb}
      {label}
    </a>
  );
}

function Videos({ items }: { items: VideoItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {items.map((v, i) => (
        <VideoRow key={i} v={v} />
      ))}
    </div>
  );
}

function News({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((n, i) => (
        <li key={i}>
          <a href={n.href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-[11px] leading-snug text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400">
            <Newspaper size={11} className="mt-0.5 shrink-0 text-gray-400" />
            <span className="min-w-0">{n.headline}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// ─── Painel ──────────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export function MatchDetailsPanel({ live, homeName, awayName }: { live: LiveScore; homeName: string; awayName: string }) {
  const details = useMatchDetails(
    live.espnEventId,
    live.homeBrand?.id ?? null,
    live.awayBrand?.id ?? null,
    { enabled: true, live: live.isLive },
  );

  const hasForm = Boolean(live.homeForm || live.awayForm);
  const espnUrl = live.espnEventId
    ? `https://www.espn.com/soccer/match/_/gameId/${live.espnEventId}`
    : null;

  return (
    <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
      {/* Forma recente */}
      {hasForm && (
        <div className="flex items-center justify-between">
          <FormDots form={live.homeForm} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Forma</span>
          <FormDots form={live.awayForm} />
        </div>
      )}

      {/* Linha do tempo */}
      {(details.timeline.length > 0 || details.loading) && (
        <>
          <Divider label="Lances" />
          <Timeline events={details.timeline} loading={details.loading} homeName={homeName} awayName={awayName} />
        </>
      )}

      {/* Narração minuto a minuto */}
      {details.commentary.length > 0 && (
        <>
          <Divider label="Narração" />
          <Commentary items={details.commentary} />
        </>
      )}

      {/* Estatísticas */}
      {live.stats && (
        <>
          <Divider label="Estatísticas" />
          <StatsBlock home={live.stats.home} away={live.stats.away} />
        </>
      )}

      {/* Escalações */}
      {(details.lineups.home || details.lineups.away) && (
        <>
          <Divider label="Escalações" />
          <Lineups
            home={details.lineups.home}
            away={details.lineups.away}
            homeName={homeName}
            awayName={awayName}
          />
        </>
      )}

      {/* Últimos 5 jogos */}
      {(details.lastFive.home.length > 0 || details.lastFive.away.length > 0) && (
        <>
          <Divider label="Últimos 5 jogos" />
          <LastFive
            home={details.lastFive.home}
            away={details.lastFive.away}
            homeName={homeName}
            awayName={awayName}
          />
        </>
      )}

      {/* Confronto direto */}
      {details.headToHead.length > 0 && (
        <>
          <Divider label="Confronto direto" />
          <HeadToHead games={details.headToHead} />
        </>
      )}

      {/* Destaques (vídeos) */}
      {details.videos.length > 0 && (
        <>
          <Divider label="Destaques" />
          <Videos items={details.videos} />
        </>
      )}

      {/* Notícias */}
      {details.news.length > 0 && (
        <>
          <Divider label="Notícias" />
          <News items={details.news} />
        </>
      )}

      {/* Estádio + emissoras + link */}
      <div className="space-y-1 pt-1">
        {live.venue?.name && (
          <p className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">
              {live.venue.name}
              {live.venue.city ? ` · ${live.venue.city}` : ''}
              {live.venue.country ? `, ${live.venue.country}` : ''}
            </span>
          </p>
        )}
        {live.broadcasts.length > 0 && (
          <p className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            <Tv size={10} className="shrink-0" />
            <span className="truncate">{live.broadcasts.join(' · ')}</span>
          </p>
        )}
        {espnUrl && (
          <a
            href={espnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            <ExternalLink size={10} />
            Ver no ESPN
          </a>
        )}
      </div>
    </div>
  );
}
