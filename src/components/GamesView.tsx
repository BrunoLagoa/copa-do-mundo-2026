import { Link } from 'react-router-dom';
import { Clock, MapPin, Trophy } from 'lucide-react';
import {
  buildMatchList,
  getFixturesByPhase,
  isDateFuture,
  isDateToday,
  type MatchEntry,
} from '../utils/matchDate';
import type { Fixture, MatchPhase } from '../types';

function PhaseBadge({ phase }: { phase: MatchPhase }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${PHASE_BADGE[phase].classes}`}
    >
      {PHASE_BADGE[phase].label}
    </span>
  );
}

const ALL_MATCHES = buildMatchList();

const PHASE_BADGE: Record<MatchPhase, { label: string; classes: string }> = {
  group: { label: 'Grupos', classes: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' },
  'round-of-32': { label: '32-avos', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  'round-of-16': { label: 'Oitavas', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' },
  quarter: { label: 'Quartas', classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200' },
  semi: { label: 'Semifinal', classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200' },
  third: { label: '3º lugar', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200' },
  final: { label: 'Final', classes: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200' },
};

const KO_PHASES: MatchPhase[] = ['round-of-32', 'round-of-16', 'quarter', 'semi', 'third', 'final'];

// ─── Card de jogo ───────────────────────────────────────────────────────────

function MatchCard({ match }: { match: MatchEntry }) {
  const future = isDateFuture(match.parsedDate);
  const today = isDateToday(match.parsedDate);
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${match.isPlaceholder ? 'opacity-80' : ''}`}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <PhaseBadge phase={match.phase} />
          {match.phase === 'group' && match.group && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Grupo {match.group}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
          <MapPin size={10} />
          {match.city}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <TeamCell slug={match.homeSlug} name={match.homeTeam} flag={match.homeFlag} side="home" />
        <div className="flex flex-col items-center gap-0.5 px-2 shrink-0">
          <span
            className={`text-lg font-bold tabular-nums ${
              today
                ? 'text-green-600 dark:text-green-400'
                : future
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {match.time}
          </span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">BRT</span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{match.date}</span>
        </div>
        <TeamCell slug={match.awaySlug} name={match.awayTeam} flag={match.awayFlag} side="away" />
      </div>

      <div className="px-4 py-1.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-1.5">
        <Clock size={10} className="text-gray-400" />
        <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">{match.venue}</p>
      </div>
    </div>
  );
}

function TeamCell({ slug, name, flag, side }: { slug: string; name: string; flag: string; side: 'home' | 'away' }) {
  if (slug === 'tbd') {
    return (
      <div className={`flex flex-col items-center gap-1 min-w-0 flex-1 ${side === 'home' ? 'text-right' : 'text-left'}`}>
        <span className="text-2xl leading-none opacity-60">{flag}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 italic leading-tight text-center">
          {name}
        </span>
      </div>
    );
  }
  return (
    <Link
      to={`/team/${slug}`}
      className={`flex flex-col items-center gap-1 min-w-0 flex-1 group ${side === 'home' ? 'text-right' : 'text-left'}`}
    >
      <span className="text-2xl leading-none">{flag}</span>
      <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-100 text-center truncate w-full group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-tight">
        {name}
      </span>
    </Link>
  );
}

// ─── Agrupa partidas por data (string "DD MMM") ─────────────────────────────

function groupByShortDate(matches: MatchEntry[]): { date: string; games: MatchEntry[] }[] {
  const map = new Map<string, MatchEntry[]>();
  for (const m of matches) {
    const list = map.get(m.date) ?? [];
    list.push(m);
    map.set(m.date, list);
  }
  return Array.from(map.entries()).map(([date, games]) => ({ date, games }));
}

// ─── View principal ─────────────────────────────────────────────────────────

export function GamesView() {
  const phases = getFixturesByPhase();
  const koPhases = phases.filter((p) => KO_PHASES.includes(p.phase));

  const todayGames = ALL_MATCHES.filter((m) => isDateToday(m.parsedDate));
  const upcomingGames = ALL_MATCHES.filter((m) => isDateFuture(m.parsedDate));
  const upcomingGroups = groupByShortDate(upcomingGames);
  const hasAnyContent = ALL_MATCHES.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">
      {/* Jogos de hoje */}
      {todayGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Jogos de Hoje</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">({todayGames.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayGames.map((m) => (
              <MatchCard key={m.key} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Próximos jogos — todos, por data */}
      {upcomingGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={16} className="text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Próximos jogos</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">({upcomingGames.length})</span>
          </div>
          <div className="space-y-8">
            {upcomingGroups.map(({ date, games }) => (
              <DateGroup key={date} date={date} games={games} />
            ))}
          </div>
        </section>
      )}

      {/* Mata-mata — por fase */}
      {koPhases.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">Mata-mata</h2>
          <div className="space-y-8">
            {koPhases.map((p) => (
              <PhaseSection key={p.phase} label={p.label} phase={p.phase} fixtures={p.fixtures} />
            ))}
          </div>
        </section>
      )}

      {/* Vazio */}
      {!hasAnyContent && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">⚽</span>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nenhum jogo programado no momento.
          </p>
        </div>
      )}
    </div>
  );
}

function DateGroup({ date, games }: { date: string; games: MatchEntry[] }) {
  return (
    <section>
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
        {date}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {games.map((m) => (
          <MatchCard key={m.key} match={m} />
        ))}
      </div>
    </section>
  );
}

function PhaseSection({ label, phase, fixtures }: { label: string; phase: MatchPhase; fixtures: Fixture[] }) {
  const matches = buildMatchList().filter((m) => m.phase === phase);
  const byDate = groupByShortDate(matches);
  if (byDate.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${PHASE_BADGE[phase].classes}`}>
          {label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">({fixtures.length} jogos)</span>
      </div>
      <div className="space-y-6">
        {byDate.map(({ date, games }) => (
          <div key={date}>
            <h4 className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
              {date}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {games.map((m) => (
                <MatchCard key={m.key} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
