import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronDown, Clock, MapPin, Pencil, Radio, Trophy, X } from 'lucide-react';
import {
  buildMatchList,
  getFixturesByPhase,
  type MatchEntry,
} from '../utils/matchDate';
import { useGroupScores } from '../hooks/useGroupScores';
import { useLiveScores, type LiveScore } from '../hooks/useLiveScores';
import { MatchDetailsPanel } from './MatchDetailsPanel';
import type { Fixture, MatchPhase } from '../types';

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

// ─── PhaseBadge ─────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: MatchPhase }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${PHASE_BADGE[phase].classes}`}>
      {PHASE_BADGE[phase].label}
    </span>
  );
}

// ─── TeamCell ────────────────────────────────────────────────────────────────

function TeamCell({ slug, name, flag, side }: { slug: string; name: string; flag: string; side: 'home' | 'away' }) {
  if (slug === 'tbd') {
    return (
      <div className={`flex flex-col items-center gap-1 min-w-0 flex-1 ${side === 'home' ? 'text-right' : 'text-left'}`}>
        <span className="text-2xl leading-none opacity-60">{flag}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 italic leading-tight text-center">{name}</span>
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

// ─── ScoreCenter ─────────────────────────────────────────────────────────────

interface ScoreCenterProps {
  match: MatchEntry;
  /** Placar efetivo a exibir (localStorage tem prioridade sobre matches.ts) */
  displayHome: number | null;
  displayAway: number | null;
  /** Apenas para jogos de hoje — inputs editáveis contínuos */
  onChangeHome: (v: number) => void;
  onChangeAway: (v: number) => void;
  /** Placar ao vivo (proxy). Quando presente, é autoritativo e read-only. */
  live?: LiveScore | null;
}

function ScoreCenter({ match, displayHome, displayAway, onChangeHome, onChangeAway, live }: ScoreCenterProps) {
  const { status, time, date } = match;

  // Placar ao vivo (real) — autoritativo: sobrepõe inputs/placar manual.
  if (live) {
    const isHalftime = live.statusDetail === 'Intervalo';
    const half = live.period >= 3 ? 'Prorrogação' : live.period === 2 ? '2º tempo' : '1º tempo';
    const liveScoreColor = live.isFinished
      ? 'text-gray-900 dark:text-gray-100'
      : 'text-red-600 dark:text-red-400';
    return (
      <div className="flex flex-col items-center gap-1 px-2 shrink-0">
        {/* Placar — vermelho enquanto ao vivo para chamar atenção */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xl font-bold tabular-nums ${liveScoreColor}`}>{live.home}</span>
          <span className="text-sm text-gray-400 dark:text-gray-600 font-bold">×</span>
          <span className={`text-xl font-bold tabular-nums ${liveScoreColor}`}>{live.away}</span>
        </div>

        {live.isFinished ? (
          <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Encerrado</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {/* "AO VIVO" com bolinha pulsando */}
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Ao vivo
            </span>
            {/* Tempo de jogo logo ABAIXO — com contexto do período */}
            {isHalftime ? (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                Intervalo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-300">
                <Clock size={9} className="shrink-0" />
                <span>{half}</span>
                {live.clock && <span className="tabular-nums font-bold">· {live.clock}</span>}
              </span>
            )}
          </div>
        )}
        <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{date}</span>
      </div>
    );
  }

  // Jogos passados — exibe placar efetivo (nunca inputs contínuos)
  if (status === 'past') {
    const hasScore = displayHome !== null && displayAway !== null;
    return (
      <div className="flex flex-col items-center gap-0.5 px-2 shrink-0">
        {hasScore ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tabular-nums text-gray-500 dark:text-gray-400">{displayHome}</span>
            <span className="text-sm text-gray-400 dark:text-gray-600 font-bold">×</span>
            <span className="text-xl font-bold tabular-nums text-gray-500 dark:text-gray-400">{displayAway}</span>
          </div>
        ) : (
          <span className="text-base font-bold text-gray-400 dark:text-gray-600">— × —</span>
        )}
        <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Encerrado</span>
        <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{date}</span>
      </div>
    );
  }

  // Jogo de hoje — inputs editáveis contínuos
  if (status === 'today') {
    return (
      <div className="flex flex-col items-center gap-1 px-1 shrink-0">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={99}
            value={displayHome ?? ''}
            onChange={(e) => onChangeHome(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-9 text-center text-base font-bold tabular-nums rounded border border-green-400 dark:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 py-0.5"
            aria-label="Gols mandante"
          />
          <span className="text-sm text-gray-400 dark:text-gray-500 font-bold">×</span>
          <input
            type="number"
            min={0}
            max={99}
            value={displayAway ?? ''}
            onChange={(e) => onChangeAway(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-9 text-center text-base font-bold tabular-nums rounded border border-green-400 dark:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 py-0.5"
            aria-label="Gols visitante"
          />
        </div>
        <span className="text-[9px] text-green-600 dark:text-green-400 uppercase tracking-wider font-semibold">Hoje · {time} BRT</span>
        <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{date}</span>
      </div>
    );
  }

  // Jogo futuro
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 shrink-0">
      <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">{time}</span>
      <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">BRT</span>
      <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 mt-0.5">— × —</span>
      <span className="text-[9px] text-gray-400 dark:text-gray-500">{date}</span>
    </div>
  );
}

// ─── ScoreEditInline — edição inline para jogos encerrados ──────────────────

interface ScoreEditInlineProps {
  match: MatchEntry;
  initialHome: number;
  initialAway: number;
  onSave: (home: number, away: number) => void;
  onCancel: () => void;
}

function ScoreEditInline({ match, initialHome, initialAway, onSave, onCancel }: ScoreEditInlineProps) {
  const [home, setHome] = useState(initialHome);
  const [away, setAway] = useState(initialAway);

  return (
    <div className="px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
      <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mb-2 font-medium uppercase tracking-wider">
        Corrigir placar
      </p>
      <div className="flex items-center justify-center gap-2 mb-3">
        {/* Time mandante */}
        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <span className="text-base leading-none">{match.homeFlag}</span>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-full text-center">{match.homeTeam}</span>
        </div>
        {/* Inputs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            min={0}
            max={99}
            value={home}
            onChange={(e) => setHome(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-10 text-center text-lg font-bold tabular-nums rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 py-0.5"
            aria-label={`Gols ${match.homeTeam}`}
            autoFocus
          />
          <span className="text-sm text-gray-400 dark:text-gray-500 font-bold">×</span>
          <input
            type="number"
            min={0}
            max={99}
            value={away}
            onChange={(e) => setAway(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-10 text-center text-lg font-bold tabular-nums rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 py-0.5"
            aria-label={`Gols ${match.awayTeam}`}
          />
        </div>
        {/* Time visitante */}
        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <span className="text-base leading-none">{match.awayFlag}</span>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-full text-center">{match.awayTeam}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(home, away)}
          className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs transition-colors"
          aria-label="Cancelar edição"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── MatchCard ───────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: MatchEntry;
  displayHome: number | null;
  displayAway: number | null;
  onChangeHome: (v: number) => void;
  onChangeAway: (v: number) => void;
  onSaveScore: (home: number, away: number) => void;
  live?: LiveScore | null;
}

function MatchCard({ match, displayHome, displayAway, onChangeHome, onChangeAway, onSaveScore, live }: MatchCardProps) {
  const [editing, setEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const isPast = match.status === 'past';
  const isLiveNow = Boolean(live?.isLive);
  // Detalhes da ESPN existem sempre que há jogo ao vivo ou encerrado com event id.
  const canShowDetails = Boolean(live?.espnEventId);

  function handleSave(home: number, away: number) {
    onSaveScore(home, away);
    setEditing(false);
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-shadow ${isLiveNow ? 'border-2 border-red-400 live-card-pulse' : 'border-gray-200 dark:border-gray-700'} ${match.isPlaceholder ? 'opacity-80' : ''} ${isPast && !editing && !live ? 'opacity-75 hover:opacity-100' : ''} ${editing ? 'ring-2 ring-blue-400 dark:ring-blue-500 shadow-md' : 'hover:shadow-md'}`}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <PhaseBadge phase={match.phase} />
          {match.phase === 'group' && match.group && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Grupo {match.group}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Botão editar — apenas em jogos encerrados, fora do modo de edição */}
          {isPast && !editing && !live && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              aria-label="Editar placar"
              title="Editar placar"
            >
              <Pencil size={10} />
              <span>editar</span>
            </button>
          )}
          <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
            <MapPin size={10} />
            {match.city}
          </span>
        </div>
      </div>

      {/* Placar central */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <TeamCell slug={match.homeSlug} name={match.homeTeam} flag={match.homeFlag} side="home" />
        <ScoreCenter
          match={match}
          displayHome={displayHome}
          displayAway={displayAway}
          onChangeHome={onChangeHome}
          onChangeAway={onChangeAway}
          live={live}
        />
        <TeamCell slug={match.awaySlug} name={match.awayTeam} flag={match.awayFlag} side="away" />
      </div>

      {/* Rodapé */}
      <div className="px-4 py-1.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-1.5">
        <Clock size={10} className="text-gray-400" />
        <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">{match.venue}</p>
      </div>

      {/* Toggle de detalhes ESPN — gols, cartões, estatísticas */}
      {canShowDetails && (
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-gray-100 dark:border-gray-700 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          aria-expanded={showDetails}
        >
          {showDetails ? 'Ocultar detalhes' : 'Detalhes'}
          <ChevronDown size={12} className={`transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Painel de detalhes ESPN */}
      {canShowDetails && showDetails && live && (
        <MatchDetailsPanel live={live} homeName={match.homeTeam} awayName={match.awayTeam} />
      )}

      {/* Painel de edição inline — apenas jogos encerrados em modo edição */}
      {isPast && editing && (
        <ScoreEditInline
          match={match}
          initialHome={displayHome ?? 0}
          initialAway={displayAway ?? 0}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ─── Agrupa partidas por data ─────────────────────────────────────────────────

function groupByShortDate(matches: MatchEntry[]): { date: string; games: MatchEntry[] }[] {
  const map = new Map<string, MatchEntry[]>();
  for (const m of matches) {
    const list = map.get(m.date) ?? [];
    list.push(m);
    map.set(m.date, list);
  }
  return Array.from(map.entries()).map(([date, games]) => ({ date, games }));
}

// ─── Tipos compartilhados ─────────────────────────────────────────────────────

type CardPropsGetter = (m: MatchEntry) => {
  displayHome: number | null;
  displayAway: number | null;
  onChangeHome: (v: number) => void;
  onChangeAway: (v: number) => void;
  onSaveScore: (home: number, away: number) => void;
  live: LiveScore | null;
};

// ─── DateGroup ────────────────────────────────────────────────────────────────

function DateGroup({ date, games, cardProps }: { date: string; games: MatchEntry[]; cardProps: CardPropsGetter }) {
  return (
    <section>
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
        {date}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {games.map((m) => (
          <MatchCard key={m.key} match={m} {...cardProps(m)} />
        ))}
      </div>
    </section>
  );
}

// ─── PhaseSection ─────────────────────────────────────────────────────────────

function PhaseSection({ label, phase, fixtures, cardProps }: { label: string; phase: MatchPhase; fixtures: Fixture[]; cardProps: CardPropsGetter }) {
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
                <MatchCard key={m.key} match={m} {...cardProps(m)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── GamesView — View principal ──────────────────────────────────────────────

const PAST_DATES_INITIAL = 3;
const PAST_DATES_STEP = 3;

// ─── Barra de status ao vivo ─────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m}min`;
  return `há ${Math.round(m / 60)}h`;
}

function LiveStatusBar({ state }: { state: ReturnType<typeof useLiveScores> }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  if (!state.available) return null; // ESPN ainda não respondeu → barra some

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {state.error ? (
          <>
            <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Placares ao vivo indisponíveis no momento
            </span>
          </>
        ) : (
          <>
            <span className={`inline-flex h-2 w-2 rounded-full shrink-0 ${state.liveCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
              {state.liveCount > 0 ? `${state.liveCount} jogo${state.liveCount > 1 ? 's' : ''} ao vivo agora` : 'Placares ao vivo ligados'}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
        <Radio size={11} className={state.loading ? 'animate-pulse text-green-500' : ''} />
        <span className="tabular-nums">
          {state.lastUpdated ? `atualizado ${timeAgo(state.lastUpdated)}` : 'atualizando…'}
        </span>
      </div>
    </div>
  );
}

export function GamesView() {
  const { getScore, setScore } = useGroupScores();
  const live = useLiveScores();
  const phases = getFixturesByPhase();
  const koPhases = phases.filter((p) => KO_PHASES.includes(p.phase));

  const pastGames = ALL_MATCHES.filter((m) => m.status === 'past');
  const todayGames = ALL_MATCHES.filter((m) => m.status === 'today');
  const upcomingGames = ALL_MATCHES.filter((m) => m.status === 'future');
  const upcomingGroups = groupByShortDate(upcomingGames);
  const pastGroups = groupByShortDate([...pastGames].reverse());
  const hasAnyContent = ALL_MATCHES.length > 0;

  const [visiblePastDates, setVisiblePastDates] = useState(PAST_DATES_INITIAL);
  const visiblePastGroups = pastGroups.slice(0, visiblePastDates);
  const hasMorePast = visiblePastDates < pastGroups.length;

  /**
   * Monta as props de cada card.
   * Para jogos passados: localStorage tem PRIORIDADE sobre o placar fixo do matches.ts.
   * Para jogos de hoje: localStorage é a fonte (inputs contínuos).
   * Para futuros: sem score.
   */
  function cardProps(m: MatchEntry): ReturnType<CardPropsGetter> {
    const saved = getScore(m.key);

    // Placar efetivo: localStorage primeiro, fallback para matches.ts (apenas past)
    let displayHome: number | null = saved?.home ?? null;
    let displayAway: number | null = saved?.away ?? null;
    if (m.status === 'past' && displayHome === null && m.homeScore !== undefined) {
      displayHome = m.homeScore;
    }
    if (m.status === 'past' && displayAway === null && m.awayScore !== undefined) {
      displayAway = m.awayScore;
    }

    // Placar ao vivo (real, vindo do proxy) é injetado apenas no display —
    // NÃO é gravado no localStorage, para não sobrescrever o chute do usuário.
    const liveScore = live.getLive(m.key);

    return {
      displayHome,
      displayAway,
      onChangeHome: (v: number) => setScore(m.key, v, saved?.away ?? 0),
      onChangeAway: (v: number) => setScore(m.key, saved?.home ?? 0, v),
      onSaveScore: (home: number, away: number) => setScore(m.key, home, away),
      live: liveScore,
    };
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">
      {/* Barra de status ao vivo — só aparece se o proxy estiver configurado */}
      <LiveStatusBar state={live} />

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
              <MatchCard key={m.key} match={m} {...cardProps(m)} />
            ))}
          </div>
        </section>
      )}

      {/* Resultados anteriores — logo após "Hoje", antes dos próximos */}
      {pastGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle size={16} className="text-gray-400 dark:text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Resultados anteriores</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">({pastGames.length})</span>
          </div>
          <div className="space-y-8">
            {visiblePastGroups.map(({ date, games }) => (
              <DateGroup key={date} date={date} games={games} cardProps={cardProps} />
            ))}
          </div>
          {hasMorePast && (
            <div className="mt-6 flex flex-col items-center gap-1">
              <button
                onClick={() => setVisiblePastDates((n) => n + PAST_DATES_STEP)}
                className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Ver mais resultados
              </button>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {visiblePastDates} de {pastGroups.length} datas
              </span>
            </div>
          )}
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
              <DateGroup key={date} date={date} games={games} cardProps={cardProps} />
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
              <PhaseSection key={p.phase} label={p.label} phase={p.phase} fixtures={p.fixtures} cardProps={cardProps} />
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
