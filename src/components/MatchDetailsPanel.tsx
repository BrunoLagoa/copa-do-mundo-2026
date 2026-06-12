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

import { ArrowDown, ArrowUp, ExternalLink, MapPin, Tv } from 'lucide-react';
import type { LiveScore, TeamStats } from '../hooks/useLiveScores';
import { useMatchDetails, type TeamLineup, type TimelineEvent } from '../hooks/useMatchDetails';

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

function TimelineRow({ ev }: { ev: TimelineEvent }) {
  const isHome = ev.side === 'home';
  const isAway = ev.side === 'away';
  const tag = ev.kind === 'own-goal' ? ' (contra)' : ev.kind === 'penalty' ? ' (pênalti)' : '';
  const body = (
    <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 dark:text-gray-200">
      <span>{KIND_ICON[ev.kind]}</span>
      <span className="font-semibold tabular-nums text-gray-500 dark:text-gray-400">{ev.clock}</span>
      <span className="truncate">{ev.player ?? ev.text}{tag}</span>
    </span>
  );
  return (
    <div className={`flex ${isHome ? 'justify-start' : isAway ? 'justify-end' : 'justify-center'}`}>
      {body}
    </div>
  );
}

function Timeline({ events, loading }: { events: TimelineEvent[]; loading: boolean }) {
  if (loading && events.length === 0) {
    return <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">Carregando lances…</p>;
  }
  if (events.length === 0) return null;
  return (
    <div className="space-y-1">
      {events.map((ev, i) => (
        <TimelineRow key={i} ev={ev} />
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
          <Timeline events={details.timeline} loading={details.loading} />
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
