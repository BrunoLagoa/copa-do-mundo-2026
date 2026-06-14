import { Link } from 'react-router-dom';
import { Trophy, Radio, Goal, Clock, AlertTriangle } from 'lucide-react';
import { useTournamentLeaders, type Scorer, type GoalMoment } from '../hooks/useTournamentLeaders';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const RANK_RING: Record<number, string> = {
  1: 'ring-amber-400',
  2: 'ring-slate-300 dark:ring-slate-400',
  3: 'ring-orange-400',
};
const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface RankedScorer {
  scorer: Scorer;
  rank: number;
}

/** Ranking de competição (gols empatados compartilham posição: 1,2,2,4…). */
function withRanks(list: Scorer[]): RankedScorer[] {
  let rank = 0;
  let prev = -1;
  return list.map((scorer, i) => {
    if (scorer.goals !== prev) {
      rank = i + 1;
      prev = scorer.goals;
    }
    return { scorer, rank };
  });
}

/** Bandeira: emoji se houver, senão escudo da ESPN. */
function TeamCrest({ flag, logo, name, size = 'md' }: {
  flag: string | null;
  logo: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const img = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  if (flag) return <span className={`${cls} leading-none`}>{flag}</span>;
  if (logo) return <img src={logo} alt={name} className={`${img} object-contain`} loading="lazy" />;
  return <span className={`${cls} leading-none`}>🏳️</span>;
}

function relativeDay(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const day = (a: Date) => Math.floor((a.getTime() - 3 * 3600_000) / 86_400_000);
  const diff = day(now) - day(d);
  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 7) return `${diff} dias atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/* ── Podium (top 3) ──────────────────────────────────────────────────────── */

function PodiumCard({ scorer, rank }: { scorer: Scorer; rank: number }) {
  const featured = rank === 1;
  const body = (
    <div
      className={`relative flex flex-col items-center rounded-2xl border bg-white dark:bg-gray-800 px-2 pb-4 pt-6 text-center shadow-sm ring-2 ${RANK_RING[rank] ?? 'ring-gray-200'} ${
        featured ? 'border-amber-300 dark:border-amber-500/40' : 'border-gray-200 dark:border-gray-700'
      } ${scorer.teamSlug ? 'transition-transform hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl drop-shadow">{MEDAL[rank]}</span>
      <TeamCrest flag={scorer.teamFlag} logo={scorer.teamLogo} name={scorer.teamName} size="lg" />
      <p className="mt-2 line-clamp-2 text-sm font-bold leading-tight text-gray-900 dark:text-gray-100">
        {scorer.shortName}
      </p>
      <p className="mt-0.5 w-full truncate text-[11px] text-gray-400 dark:text-gray-500">{scorer.teamName}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`font-extrabold tabular-nums ${featured ? 'text-3xl text-amber-500' : 'text-2xl text-gray-800 dark:text-gray-100'}`}>
          {scorer.goals}
        </span>
        <span className="text-xs font-medium text-gray-400">{scorer.goals === 1 ? 'gol' : 'gols'}</span>
      </div>
      {scorer.penalties > 0 && (
        <span className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{scorer.penalties} de pênalti</span>
      )}
    </div>
  );

  const wrap = featured ? 'self-start' : 'self-end';
  return scorer.teamSlug ? (
    <Link to={`/team/${scorer.teamSlug}`} className={wrap}>{body}</Link>
  ) : (
    <div className={wrap}>{body}</div>
  );
}

function Podium({ top }: { top: RankedScorer[] }) {
  // Ordem visual: 2º · 1º · 3º (1º mais alto).
  const order = [top[1], top[0], top[2]].filter(Boolean) as RankedScorer[];
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
      {order.map(({ scorer, rank }) => (
        <PodiumCard key={scorer.athleteId} scorer={scorer} rank={rank} />
      ))}
    </div>
  );
}

/* ── Ranking compacto (4º+) ──────────────────────────────────────────────── */

function ScorerRow({ scorer, rank }: { scorer: Scorer; rank: number }) {
  const inner = (
    <div className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
      <span className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-gray-400 dark:text-gray-500">
        {rank}º
      </span>
      <TeamCrest flag={scorer.teamFlag} logo={scorer.teamLogo} name={scorer.teamName} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {scorer.shortName}
        </p>
        <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
          {scorer.teamName}
          {scorer.penalties > 0 && <span className="ml-1.5">· {scorer.penalties} pen</span>}
        </p>
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <span className="text-base font-extrabold text-gray-800 dark:text-gray-100">{scorer.goals}</span>
        <span className="ml-0.5 text-[10px] font-medium text-gray-400">G</span>
      </div>
    </div>
  );
  return scorer.teamSlug ? (
    <Link to={`/team/${scorer.teamSlug}`} className="block group">{inner}</Link>
  ) : (
    <div className="group">{inner}</div>
  );
}

/* ── Gols recentes ───────────────────────────────────────────────────────── */

function GoalItem({ goal }: { goal: GoalMoment }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex w-9 shrink-0 flex-col items-center">
        <TeamCrest flag={goal.teamFlag} logo={goal.teamLogo} name={goal.teamName} size="sm" />
        <span className="mt-0.5 text-[10px] font-bold tabular-nums text-green-600 dark:text-green-400">
          {goal.clock || '—'}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {goal.shortName}
          {goal.penalty && <span className="ml-1.5 text-[10px] font-medium text-gray-400">(pênalti)</span>}
          {goal.ownGoal && <span className="ml-1.5 text-[10px] font-medium text-red-400">(contra)</span>}
        </p>
        <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
          <span className="font-mono">{goal.matchLabel}</span>
          {goal.matchLabel && ' · '}
          {relativeDay(goal.date)}
        </p>
      </div>
      <Goal size={15} className="shrink-0 text-gray-300 dark:text-gray-600" />
    </div>
  );
}

/* ── Section + states ────────────────────────────────────────────────────── */

function SectionTitle({ icon, children, count }: { icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {icon}
      {children}
      {count != null && (
        <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 normal-case tracking-normal">
          {count}
        </span>
      )}
    </h2>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700/60">
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-12 text-center">
      <Goal size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
      <p className="mt-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Ainda não há gols no torneio</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        A artilharia aparece aqui automaticamente assim que a bola rolar.
      </p>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export function RankingsView() {
  const { scorers, recentGoals, lastUpdated, loading, error, available } = useTournamentLeaders();

  const ranked = withRanks(scorers);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 50);
  const hasData = scorers.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            <Trophy size={20} className="text-amber-500" />
            Destaques
          </h1>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Artilharia e gols do torneio · dados ao vivo da ESPN
          </p>
        </div>
        {lastUpdated && (
          <span className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-[11px] font-medium text-green-700 dark:text-green-400">
            <Radio size={11} className="animate-pulse" />
            {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Loading (primeira carga) */}
      {loading && !available && (
        <div className="flex items-center justify-center py-24">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      )}

      {/* Erro sem dados */}
      {error && !hasData && !loading && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle size={16} className="shrink-0" />
          Não foi possível carregar os dados agora. Tentando novamente…
        </div>
      )}

      {/* Sem gols ainda */}
      {available && !hasData && !loading && <EmptyState />}

      {/* Conteúdo */}
      {hasData && (
        <div className="space-y-8">
          <section>
            <SectionTitle icon={<Trophy size={15} className="text-amber-500" />} count={scorers.length}>
              Artilharia
            </SectionTitle>
            {top3.length > 0 && <Podium top={top3} />}
            {rest.length > 0 && (
              <div className="mt-4">
                <Panel>
                  {rest.map(({ scorer, rank }) => (
                    <ScorerRow key={scorer.athleteId} scorer={scorer} rank={rank} />
                  ))}
                </Panel>
              </div>
            )}
          </section>

          {recentGoals.length > 0 && (
            <section>
              <SectionTitle icon={<Clock size={15} className="text-green-500" />}>Gols recentes</SectionTitle>
              <Panel>
                {recentGoals.slice(0, 12).map((g) => (
                  <GoalItem key={g.id} goal={g} />
                ))}
              </Panel>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
