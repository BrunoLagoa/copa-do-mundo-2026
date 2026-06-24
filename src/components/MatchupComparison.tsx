/**
 * Comparativo entre a seleção atual e o adversário do jogo em destaque
 * (ao vivo ou próximo). Accordion recolhido por padrão; fetch pesado só ao abrir.
 */

import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ExternalLink, Radio, Swords } from 'lucide-react';
import type { Fixture } from '../types';
import type { LiveScore } from '../hooks/useLiveScores';
import type { TeamRecord } from '../hooks/useTeamProfile';
import type { TeamStatsAgg } from '../hooks/useTeamStats';
import { useTeamProfile } from '../hooks/useTeamProfile';
import { useTeamStats } from '../hooks/useTeamStats';
import { useMatchDetails, type PastGame, type TeamStatRow } from '../hooks/useMatchDetails';
import { espnIdForSlug } from '../data/espnTeams';

/* ── Helpers visuais ─────────────────────────────────────────────────────── */

function hexColor(raw: string | null | undefined, fallback = '#16a34a'): string {
  if (!raw) return fallback;
  return raw.startsWith('#') ? raw : `#${raw}`;
}

function FormDots({ form }: { form: string | null }) {
  if (!form) return <span className="text-[10px] text-gray-400">—</span>;
  const color = (c: string) =>
    c === 'W' ? 'bg-green-500' : c === 'L' ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-500';
  const label = (c: string) => (c === 'W' ? 'Vitória' : c === 'L' ? 'Derrota' : 'Empate');
  return (
    <div className="flex items-center gap-0.5" aria-label={`Forma: ${form}`}>
      {form.split('').map((c, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${color(c)}`} title={label(c)} />
      ))}
    </div>
  );
}

function colorsTooSimilar(a: string, b: string): boolean {
  const parse = (h: string): [number, number, number] | null => {
    const hex = h.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  };
  const ca = parse(a);
  const cb = parse(b);
  if (!ca || !cb) return false;
  const dist = Math.abs(ca[0] - cb[0]) + Math.abs(ca[1] - cb[1]) + Math.abs(ca[2] - cb[2]);
  return dist < 90;
}

const OPP_SLATE = '#64748b';

function stripePattern(fill: string): string {
  return `repeating-linear-gradient(-45deg, ${fill}, ${fill} 3px, rgba(255,255,255,0.32) 3px, rgba(255,255,255,0.32) 6px)`;
}

/** Cor do segmento direito (adversário) — sempre listrado para padronizar todas as métricas. */
function opponentBarFill(
  leftColor: string,
  rightColor: string,
  rightAltColor: string | null | undefined,
): string {
  const alt = rightAltColor ? hexColor(rightAltColor) : null;
  if (alt && !colorsTooSimilar(leftColor, alt)) return alt;
  if (!colorsTooSimilar(leftColor, rightColor)) return rightColor;
  return OPP_SLATE;
}

function DualCompareBar({
  label,
  left,
  right,
  leftColor,
  rightColor,
  rightAltColor,
  fmt,
}: {
  label: string;
  left: number;
  right: number;
  leftColor: string;
  rightColor: string;
  rightAltColor?: string | null;
  fmt: (n: number) => string;
}) {
  const isTie = fmt(left) === fmt(right);
  const total = left + right || 1;
  const leftPct = isTie ? 50 : Math.round((left / total) * 100);
  const leftLeads = !isTie && left > right;
  const rightLeads = !isTie && right > left;

  const oppFill = opponentBarFill(leftColor, rightColor, rightAltColor);
  const rightBarStyle: CSSProperties = {
    backgroundColor: oppFill,
    backgroundImage: stripePattern(oppFill),
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span
          className={`font-extrabold tabular-nums ${leftLeads || isTie ? '' : 'opacity-60'}`}
          style={{ color: leftColor }}
        >
          {fmt(left)}
        </span>
        <span className="font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span
          className={`font-extrabold tabular-nums ${rightLeads || isTie ? '' : 'opacity-60'}`}
          style={{ color: oppFill }}
        >
          {fmt(right)}
        </span>
      </div>
      <div className="flex h-2 gap-px overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className="transition-all" style={{ width: `${leftPct}%`, backgroundColor: leftColor }} />
        <div className="transition-all" style={{ width: `${100 - leftPct}%`, ...rightBarStyle }} />
      </div>
    </div>
  );
}

function resultColor(r: PastGame['result']): string {
  if (r === 'W') return 'bg-green-500';
  if (r === 'L') return 'bg-red-500';
  return 'bg-gray-400 dark:bg-gray-500';
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
      {children}
    </p>
  );
}

function RecordPill({ record }: { record: TeamRecord }) {
  const gd = record.goalDiff > 0 ? `+${record.goalDiff}` : String(record.goalDiff);
  return (
    <span className="text-[11px] tabular-nums text-gray-600 dark:text-gray-300">
      {record.played}J · {record.wins}V · {record.points} pts · SG {gd}
    </span>
  );
}

function LiveStatBars({
  rows,
  leftColor,
  rightColor,
  rightAltColor,
}: {
  rows: TeamStatRow[];
  leftColor: string;
  rightColor: string;
  rightAltColor?: string | null;
}) {
  if (rows.length === 0) return null;
  const shown = rows.slice(0, 6);
  return (
    <div className="space-y-2">
      {shown.map((r) => (
        <DualCompareBar
          key={r.label}
          label={r.label}
          left={r.home ?? 0}
          right={r.away ?? 0}
          leftColor={leftColor}
          rightColor={rightColor}
          rightAltColor={rightAltColor}
          fmt={(n) => `${n}${r.suffix}`}
        />
      ))}
    </div>
  );
}

/* ── Props ───────────────────────────────────────────────────────────────── */

export interface MatchupComparisonProps {
  fixture: Fixture;
  teamSlug: string;
  teamName: string;
  teamFlag: string;
  teamColor: string | null;
  ourRecord: TeamRecord | null;
  ourStats: TeamStatsAgg | null;
  liveEntry: LiveScore | null;
  isLive: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function MatchupComparison({
  fixture,
  teamSlug,
  teamName,
  teamFlag,
  teamColor,
  ourRecord,
  ourStats,
  liveEntry,
  isLive,
  expanded,
  onToggle,
}: MatchupComparisonProps) {
  const isHome = fixture.homeSlug === teamSlug;
  const opponentSlug = isHome ? fixture.awaySlug : fixture.homeSlug;
  const opponentName = isHome ? fixture.awayTeam : fixture.homeTeam;
  const opponentFlag = isHome ? fixture.awayFlag : fixture.homeFlag;

  const { info: oppInfo, loading: oppProfileLoading } = useTeamProfile(opponentSlug);
  const { stats: oppStats, loading: oppStatsLoading } = useTeamStats(expanded ? opponentSlug : undefined);

  const homeEspnId = espnIdForSlug(fixture.homeSlug);
  const awayEspnId = espnIdForSlug(fixture.awaySlug);
  const espnEventId = liveEntry?.espnEventId ?? null;

  const details = useMatchDetails(
    expanded && espnEventId ? espnEventId : null,
    homeEspnId,
    awayEspnId,
    { enabled: expanded && Boolean(espnEventId), live: isLive },
  );

  const ourColor = hexColor(teamColor);
  const oppColor = hexColor(oppInfo?.color, '#3b82f6');
  const oppBrand = isHome ? liveEntry?.awayBrand : liveEntry?.homeBrand;
  const oppAltColor = oppBrand?.altColor ?? oppInfo?.altColor ?? null;
  const oppRecord = oppInfo?.record ?? null;

  const ourForm = isHome ? liveEntry?.homeForm ?? null : liveEntry?.awayForm ?? null;
  const oppForm = isHome ? liveEntry?.awayForm ?? null : liveEntry?.homeForm ?? null;

  const ourLastFive = isHome ? details.lastFive.home : details.lastFive.away;
  const oppLastFive = isHome ? details.lastFive.away : details.lastFive.home;

  const liveBoxStats = useMemo(() => {
    if (!details.boxStats.length) return null;
    return details.boxStats.map((r) => ({
      ...r,
      home: isHome ? r.home : r.away,
      away: isHome ? r.away : r.home,
    }));
  }, [details.boxStats, isHome]);

  const scoreboardStats = useMemo(() => {
    if (!liveEntry?.stats || !isLive) return null;
    const s = liveEntry.stats;
    const ours = isHome ? s.home : s.away;
    const theirs = isHome ? s.away : s.home;
    const rows: { label: string; left: number | null; right: number | null; suffix: string }[] = [
      { label: 'Posse', left: ours.possession, right: theirs.possession, suffix: '%' },
      { label: 'Finalizações', left: ours.shots, right: theirs.shots, suffix: '' },
      { label: 'No gol', left: ours.shotsOnTarget, right: theirs.shotsOnTarget, suffix: '' },
      { label: 'Escanteios', left: ours.corners, right: theirs.corners, suffix: '' },
      { label: 'Faltas', left: ours.fouls, right: theirs.fouls, suffix: '' },
    ];
    return rows.filter((r) => r.left != null || r.right != null);
  }, [liveEntry, isHome, isLive]);

  const loadingDetails = expanded && (oppStatsLoading || details.loading || oppProfileLoading);
  const hasStyleStats = ourStats && oppStats && ourStats.games > 0 && oppStats.games > 0;

  const teaserPts = (rec: TeamRecord | null) => (rec != null ? `${rec.points} pts` : '—');

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
      >
        <Swords size={16} className="shrink-0 text-green-600 dark:text-green-400" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
              Análise do confronto
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                <Radio size={9} className="animate-pulse" />
                Ao vivo
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
            <span>{teamFlag} {teamName}</span>
            <span className="mx-1.5 font-medium text-gray-400">·</span>
            <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-300">{teaserPts(ourRecord)}</span>
            <span className="mx-1.5 text-gray-300 dark:text-gray-600">vs</span>
            <span>{opponentFlag} {opponentName}</span>
            <span className="mx-1.5 font-medium text-gray-400">·</span>
            <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-300">{teaserPts(oppRecord)}</span>
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-gray-100 px-4 py-4 dark:border-gray-700">
          {/* Recorde + forma */}
          <div>
            <SectionLabel>Recorde no torneio</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-900/50">
                <p className="mb-1 truncate text-xs font-bold" style={{ color: ourColor }}>
                  {teamFlag} {teamName}
                </p>
                {ourRecord ? <RecordPill record={ourRecord} /> : (
                  <span className="text-[11px] text-gray-400">Sem dados</span>
                )}
                <div className="mt-2">
                  <FormDots form={ourForm} />
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-900/50">
                <p className="mb-1 truncate text-xs font-bold" style={{ color: oppColor }}>
                  {opponentFlag} {opponentName}
                </p>
                {oppRecord ? <RecordPill record={oppRecord} /> : oppProfileLoading ? (
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                ) : (
                  <span className="text-[11px] text-gray-400">Sem dados</span>
                )}
                <div className="mt-2">
                  <FormDots form={oppForm} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats ao vivo */}
          {isLive && scoreboardStats && scoreboardStats.length > 0 && (
            <div>
              <SectionLabel>Estatísticas ao vivo</SectionLabel>
              <div className="space-y-2">
                {scoreboardStats.map((r) => (
                  <DualCompareBar
                    key={r.label}
                    label={r.label}
                    left={r.left ?? 0}
                    right={r.right ?? 0}
                    leftColor={ourColor}
                    rightColor={oppColor}
                    rightAltColor={oppAltColor}
                    fmt={(n) => `${n}${r.suffix}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Estilo de jogo */}
          {hasStyleStats && (
            <div>
              <SectionLabel>Estilo de jogo · médias por jogo no torneio</SectionLabel>
              <div className="space-y-3">
                <DualCompareBar label="Posse de bola" left={ourStats.possession} right={oppStats.possession} leftColor={ourColor} rightColor={oppColor} rightAltColor={oppAltColor} fmt={(n) => `${n.toFixed(0)}%`} />
                <DualCompareBar label="Finalizações" left={ourStats.shots} right={oppStats.shots} leftColor={ourColor} rightColor={oppColor} rightAltColor={oppAltColor} fmt={(n) => n.toFixed(1)} />
                <DualCompareBar label="Finalizações no gol" left={ourStats.shotsOnTarget} right={oppStats.shotsOnTarget} leftColor={ourColor} rightColor={oppColor} rightAltColor={oppAltColor} fmt={(n) => n.toFixed(1)} />
                <DualCompareBar label="Escanteios" left={ourStats.corners} right={oppStats.corners} leftColor={ourColor} rightColor={oppColor} rightAltColor={oppAltColor} fmt={(n) => n.toFixed(1)} />
                <DualCompareBar label="Precisão de passe" left={ourStats.passAccuracy} right={oppStats.passAccuracy} leftColor={ourColor} rightColor={oppColor} rightAltColor={oppAltColor} fmt={(n) => `${n.toFixed(0)}%`} />
                <DualCompareBar label="Faltas" left={ourStats.fouls} right={oppStats.fouls} leftColor={ourColor} rightColor={oppColor} rightAltColor={oppAltColor} fmt={(n) => n.toFixed(1)} />
              </div>
            </div>
          )}

          {expanded && !hasStyleStats && !oppStatsLoading && ourStats && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Médias do torneio indisponíveis para um dos times.
            </p>
          )}

          {oppStatsLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
          )}

          {/* H2H */}
          {details.headToHead.length > 0 && (
            <div>
              <SectionLabel>Confronto direto</SectionLabel>
              <div className="space-y-1">
                {details.headToHead.slice(0, 5).map((g, i) => (
                  <PastGameRow key={i} g={g} />
                ))}
              </div>
            </div>
          )}

          {/* Últimos 5 */}
          {(ourLastFive.length > 0 || oppLastFive.length > 0) && (
            <div>
              <SectionLabel>Últimos jogos</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">{teamName}</p>
                  {ourLastFive.map((g, i) => <PastGameRow key={i} g={g} />)}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">{opponentName}</p>
                  {oppLastFive.map((g, i) => <PastGameRow key={i} g={g} />)}
                </div>
              </div>
            </div>
          )}

          {/* Classificação do grupo */}
          {details.standings && details.standings.rows.length > 0 && (
            <div>
              <SectionLabel>Classificação do grupo</SectionLabel>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-gray-400 dark:text-gray-500">
                    <th className="py-0.5 text-left font-semibold">Time</th>
                    <th className="px-0.5 text-center font-semibold">J</th>
                    <th className="px-0.5 text-center font-semibold">V</th>
                    <th className="px-0.5 text-center font-semibold">E</th>
                    <th className="px-0.5 text-center font-semibold">D</th>
                    <th className="px-0.5 text-center font-semibold">SG</th>
                    <th className="px-0.5 text-center font-semibold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {details.standings.rows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-t border-gray-100 dark:border-gray-700 ${
                        r.current ? 'font-bold text-gray-900 dark:text-gray-50' : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <td className="py-1 pr-1">
                        <span className="flex items-center gap-1">
                          {r.flag && <span className="shrink-0">{r.flag}</span>}
                          <span className="truncate" title={r.name}>{r.name}</span>
                        </span>
                      </td>
                      <td className="px-0.5 text-center tabular-nums">{r.played}</td>
                      <td className="px-0.5 text-center tabular-nums">{r.wins}</td>
                      <td className="px-0.5 text-center tabular-nums">{r.draws}</td>
                      <td className="px-0.5 text-center tabular-nums">{r.losses}</td>
                      <td className="px-0.5 text-center tabular-nums">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
                      <td className="px-0.5 text-center tabular-nums">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {liveBoxStats && liveBoxStats.length > 0 && !isLive && (
            <div>
              <SectionLabel>Estatísticas da partida</SectionLabel>
              <LiveStatBars rows={liveBoxStats} leftColor={ourColor} rightColor={oppColor} rightAltColor={oppAltColor} />
            </div>
          )}

          {loadingDetails && !hasStyleStats && details.headToHead.length === 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">Carregando análise…</p>
          )}

          {espnEventId && (
            <Link
              to="/jogos"
              className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-green-600 hover:underline dark:text-green-400"
            >
              Ver lances completos
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
