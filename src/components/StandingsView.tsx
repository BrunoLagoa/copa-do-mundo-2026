/**
 * Classificação dos grupos (oficial e ao vivo, via ESPN).
 *
 * 12 tabelas (A–L) com J/V/E/D, saldo e pontos. Cores indicam a zona:
 *   - 1º/2º: classificação direta (verde);
 *   - 3º: possível vaga (8 melhores terceiros — âmbar);
 *   - 4º: eliminado.
 */

import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useStandings, type StandingRow } from '../hooks/useStandings';
import { groupScenarios, type QualStatus } from '../utils/qualification';

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function timeAgo(date: Date): string {
  const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m}min`;
  return `há ${Math.round(m / 60)}h`;
}

/** Faixa de cor da linha conforme a posição (zona de classificação). */
function zoneAccent(rank: number): string {
  if (rank <= 2) return 'border-l-2 border-green-500';
  if (rank === 3) return 'border-l-2 border-amber-400';
  return 'border-l-2 border-transparent';
}

// ─── Linha de um time ─────────────────────────────────────────────────────────

function Row({ row }: { row: StandingRow }) {
  const name = (
    <span className="flex items-center gap-1.5 min-w-0">
      <span className="text-base leading-none shrink-0">{row.flag ?? '🏳️'}</span>
      <span className="truncate text-gray-800 dark:text-gray-100">{row.name}</span>
      {row.advanced && <span title="Classificado" className="shrink-0 text-[9px]">✅</span>}
    </span>
  );
  return (
    <tr className={`${zoneAccent(row.rank)} border-b border-gray-100 dark:border-gray-700 last:border-b-0`}>
      <td className="py-1.5 pl-2 pr-1 text-center text-[11px] font-bold tabular-nums text-gray-400 dark:text-gray-500">{row.rank || '–'}</td>
      <td className="py-1.5 pr-2 text-[11px] font-semibold max-w-0 w-full">
        {row.slug ? (
          <Link to={`/team/${row.slug}`} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
            {name}
          </Link>
        ) : (
          name
        )}
      </td>
      <td className="px-1 py-1.5 text-center text-[11px] tabular-nums text-gray-500 dark:text-gray-400">{row.played}</td>
      <td className="px-1 py-1.5 text-center text-[11px] tabular-nums text-gray-500 dark:text-gray-400">{row.wins}</td>
      <td className="px-1 py-1.5 text-center text-[11px] tabular-nums text-gray-500 dark:text-gray-400">{row.draws}</td>
      <td className="px-1 py-1.5 text-center text-[11px] tabular-nums text-gray-500 dark:text-gray-400">{row.losses}</td>
      <td className="px-1 py-1.5 text-center text-[11px] tabular-nums text-gray-500 dark:text-gray-400">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
      <td className="px-1 py-1.5 pr-2 text-center text-[11px] font-bold tabular-nums text-gray-900 dark:text-gray-100">{row.points}</td>
    </tr>
  );
}

// ─── Cenário de classificação (top 2) ────────────────────────────────────────

function ScenarioFooter({ rows }: { rows: StandingRow[] }) {
  const sc = groupScenarios(rows);
  const anyPlayed = rows.some((r) => r.played > 0);
  const anyLeft = rows.some((r) => r.played < 3);
  if (!anyPlayed || !anyLeft) return null; // só faz sentido com o grupo em andamento

  const named = (s: QualStatus) => rows.filter((r) => sc[r.code]?.status === s);
  const qualified = named('qualified');
  const contention = named('contention');
  const eliminated = named('eliminated');

  return (
    <div className="space-y-0.5 border-t border-gray-100 px-3 py-2 dark:border-gray-700">
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Cenário · top 2</p>
      {qualified.length > 0 && (
        <p className="flex items-start gap-1 text-[10px] text-green-700 dark:text-green-400">
          <span>🟢</span>
          <span><span className="font-bold">Classificado:</span> {qualified.map((r) => r.name).join(', ')}</span>
        </p>
      )}
      {contention.length > 0 && (
        <p className="flex items-start gap-1 text-[10px] text-amber-700 dark:text-amber-500">
          <span>🟡</span>
          <span>
            <span className="font-bold">Em disputa:</span>{' '}
            {contention.map((r) => `${r.name} (máx ${sc[r.code]!.maxPoints})`).join(', ')}
          </span>
        </p>
      )}
      {eliminated.length > 0 && (
        <p className="flex items-start gap-1 text-[10px] text-red-600 dark:text-red-400">
          <span>🔴</span>
          <span><span className="font-bold">Sem chances:</span> {eliminated.map((r) => r.name).join(', ')}</span>
        </p>
      )}
    </div>
  );
}

// ─── Tabela de um grupo ───────────────────────────────────────────────────────

function GroupTable({ letter, rows }: { letter: string; rows: StandingRow[] | undefined }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/60 border-b border-gray-100 dark:border-gray-600">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Grupo {letter}</h3>
      </div>
      {rows && rows.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <th className="py-1 pl-2 pr-1 font-bold">#</th>
              <th className="py-1 pr-2 text-left font-bold">Time</th>
              <th className="px-1 py-1 font-bold" title="Jogos">J</th>
              <th className="px-1 py-1 font-bold" title="Vitórias">V</th>
              <th className="px-1 py-1 font-bold" title="Empates">E</th>
              <th className="px-1 py-1 font-bold" title="Derrotas">D</th>
              <th className="px-1 py-1 font-bold" title="Saldo de gols">SG</th>
              <th className="px-1 py-1 pr-2 font-bold" title="Pontos">P</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Row key={r.code || r.name} row={r} />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-3 py-6 text-center text-xs text-gray-400 dark:text-gray-500">Carregando…</p>
      )}
      {rows && rows.length > 0 && <ScenarioFooter rows={rows} />}
    </div>
  );
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function StandingsView() {
  const { available, byGroup, lastUpdated, loading, error } = useStandings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Cabeçalho + status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Classificação</h2>
        {available && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            <Radio size={11} className={loading ? 'animate-pulse text-green-500' : ''} />
            <span className="tabular-nums">
              {error ? 'fonte indisponível' : lastUpdated ? `atualizado ${timeAgo(lastUpdated)}` : 'atualizando…'}
            </span>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-green-500" /> 1º e 2º — classificação direta</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" /> 3º — vaga aos 8 melhores terceiros</span>
        <span className="flex items-center gap-1">✅ classificado</span>
      </div>

      {/* Erro sem dados */}
      {error && !available ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">📊</span>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Classificação indisponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GROUP_LETTERS.map((letter) => (
            <GroupTable key={letter} letter={letter} rows={byGroup[letter]} />
          ))}
        </div>
      )}
    </div>
  );
}
