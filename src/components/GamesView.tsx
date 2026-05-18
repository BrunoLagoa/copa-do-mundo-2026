import { Link } from 'react-router-dom';
import { MapPin, Trophy } from 'lucide-react';
import { buildMatchList, isToday, isFuture, type MatchEntry } from '../utils/matchDate';

// ─── Derivação dos dados (estáticos — sem efeito colateral) ──────────────────

const ALL_MATCHES = buildMatchList();

// ─── Utilitário de agrupamento por data ──────────────────────────────────────

function groupByDate(matches: MatchEntry[]): { date: string; games: MatchEntry[] }[] {
  const map = new Map<string, MatchEntry[]>();
  for (const m of matches) {
    const list = map.get(m.date) ?? [];
    list.push(m);
    map.set(m.date, list);
  }
  return Array.from(map.entries()).map(([date, games]) => ({ date, games }));
}

// ─── Card individual de jogo ──────────────────────────────────────────────────

function MatchCard({ match }: { match: MatchEntry }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* rodada + local */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
        <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
          <Trophy size={11} />
          {match.round}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <MapPin size={11} />
          {match.city}
        </span>
      </div>

      {/* times */}
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        {/* time casa */}
        <Link
          to={`/team/${match.homeSlug}`}
          className="flex flex-col items-center gap-1.5 min-w-0 flex-1 group"
        >
          <span className="text-3xl leading-none">{match.homeFlag}</span>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 text-center truncate w-full group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {match.homeTeam}
          </span>
        </Link>

        {/* placar / vs */}
        <div className="flex flex-col items-center gap-0.5 px-3 shrink-0">
          {match.score ? (
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {match.score}
            </span>
          ) : (
            <span className="text-sm font-bold text-gray-400 dark:text-gray-500 tracking-widest">
              vs
            </span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{match.date}</span>
        </div>

        {/* time visitante */}
        <Link
          to={`/team/${match.awaySlug}`}
          className="flex flex-col items-center gap-1.5 min-w-0 flex-1 group"
        >
          <span className="text-3xl leading-none">{match.awayFlag}</span>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 text-center truncate w-full group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {match.awayTeam}
          </span>
        </Link>
      </div>

      {/* estádio */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">{match.venue}</p>
      </div>
    </div>
  );
}

// ─── Grupo de data ────────────────────────────────────────────────────────────

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

// ─── View principal ───────────────────────────────────────────────────────────

export function GamesView() {
  const todayGames = ALL_MATCHES.filter((m) => isToday(m.parsedDate));
  const upcomingGames = ALL_MATCHES.filter((m) => isFuture(m.parsedDate));
  const upcomingGroups = groupByDate(upcomingGames);
  const hasContent = todayGames.length > 0 || upcomingGames.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">
      {/* Jogos de Hoje */}
      {todayGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Jogos de Hoje
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayGames.map((m) => (
              <MatchCard key={m.key} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Próximos jogos */}
      {upcomingGames.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">
            Próximos jogos
          </h2>
          <div className="space-y-8">
            {upcomingGroups.map(({ date, games }) => (
              <DateGroup key={date} date={date} games={games} />
            ))}
          </div>
        </section>
      )}

      {/* Vazio */}
      {!hasContent && (
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
