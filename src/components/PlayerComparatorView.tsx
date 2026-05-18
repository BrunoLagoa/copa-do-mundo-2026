import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TEAMS_BY_SLUG } from '../data/teams';
import { generateStats, playerAvatarUrl, positionGradient } from '../utils/playerStats';
import type { PlayerResult } from '../utils/playerSearch';

// ─── Dados derivados (estáticos) ─────────────────────────────────────────────

const ALL_TEAMS = Object.values(TEAMS_BY_SLUG).sort((a, b) =>
  a.team.name.localeCompare(b.team.name, 'pt-BR'),
);

// ─── Painel de seleção de um jogador ─────────────────────────────────────────

interface SlotSelectorProps {
  label: string;
  value: PlayerResult | null;
  onChange: (p: PlayerResult | null) => void;
}

function SlotSelector({ label, value, onChange }: SlotSelectorProps) {
  const [teamSlug, setTeamSlug] = useState('');

  const selectedTeam = teamSlug ? TEAMS_BY_SLUG[teamSlug] : null;

  function handleTeamChange(slug: string) {
    setTeamSlug(slug);
    onChange(null);
  }

  function handlePlayerChange(numberStr: string) {
    if (!selectedTeam || !numberStr) { onChange(null); return; }
    const num = parseInt(numberStr, 10);
    const player = selectedTeam.players.find((p) => p.number === num);
    if (!player) return;
    onChange({
      player,
      teamSlug: selectedTeam.slug,
      teamName: selectedTeam.team.name,
      teamFlag: selectedTeam.team.flag,
    });
  }

  const selectClass =
    'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition';

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="space-y-2">
        <select value={teamSlug} onChange={(e) => handleTeamChange(e.target.value)} className={selectClass}>
          <option value="">Selecione a seleção...</option>
          {ALL_TEAMS.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.team.flag} {t.team.name}
            </option>
          ))}
        </select>

        <select
          value={value?.player.number ?? ''}
          onChange={(e) => handlePlayerChange(e.target.value)}
          disabled={!selectedTeam}
          className={`${selectClass} disabled:opacity-40`}
        >
          <option value="">Selecione o jogador...</option>
          {selectedTeam?.players.map((p) => (
            <option key={p.number} value={p.number}>
              #{p.number} {p.name} — {p.position}
            </option>
          ))}
        </select>
      </div>

      {/* Preview do jogador selecionado */}
      {value && (
        <div className="mt-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${positionGradient(value.player.position)} overflow-hidden shrink-0`}>
            <img src={playerAvatarUrl(value.player.name)} alt={value.player.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{value.player.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{value.teamFlag} {value.teamName}</p>
          </div>
          <Link
            to={`/player/${value.teamSlug}/${value.player.number}`}
            state={{ player: value.player, teamSlug: value.teamSlug, teamFlag: value.teamFlag }}
            className="ml-auto text-[10px] text-green-600 dark:text-green-400 hover:underline shrink-0"
          >
            Ver perfil
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Tabela de comparação ─────────────────────────────────────────────────────

interface ComparisonTableProps {
  a: PlayerResult;
  b: PlayerResult;
}

function ComparisonTable({ a, b }: ComparisonTableProps) {
  const statsA = useMemo(() => generateStats(a.player), [a.player]);
  const statsB = useMemo(() => generateStats(b.player), [b.player]);

  // Usar o maior conjunto de stats (mesma posição → mesmos labels)
  const labels = statsA.map((s) => s.label);

  function StatRow({ label, statA, statB }: { label: string; statA: (typeof statsA)[0]; statB: (typeof statsB)[0] }) {
    const aWins = statA.value > statB.value;
    const bWins = statB.value > statA.value;
    const pctA = Math.round((statA.value / statA.max) * 100);
    const pctB = Math.round((statB.value / statB.max) * 100);

    return (
      <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">
          {statA.emoji} {label}
        </p>
        <div className="flex items-center gap-3">
          {/* Lado A */}
          <div className="flex-1 flex flex-col items-end gap-1">
            <span className={`text-sm font-bold tabular-nums ${aWins ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {statA.value}{statA.unit}
            </span>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${aWins ? 'bg-gradient-to-l from-green-400 to-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                style={{ width: `${pctA}%`, marginLeft: 'auto' }}
              />
            </div>
          </div>

          <div className="w-6 shrink-0" />

          {/* Lado B */}
          <div className="flex-1 flex flex-col items-start gap-1">
            <span className={`text-sm font-bold tabular-nums ${bWins ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {statB.value}{statB.unit}
            </span>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${bWins ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                style={{ width: `${pctB}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const differentPositions = a.player.position !== b.player.position;

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Cabeçalho com os jogadores */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
        {[{ pr: a, stats: statsA }, { pr: b, stats: statsB }].map(({ pr }) => (
          <div key={pr.teamSlug + pr.player.number} className="flex flex-col items-center gap-2 p-4">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${positionGradient(pr.player.position)} overflow-hidden shadow`}>
              <img src={playerAvatarUrl(pr.player.name)} alt={pr.player.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">{pr.player.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{pr.teamFlag} {pr.teamName}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-white bg-gray-500 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                {pr.player.position}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Aviso posições diferentes */}
      {differentPositions && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-y border-amber-200 dark:border-amber-700">
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
            ⚠️ Jogadores em posições diferentes — estatísticas podem não ser comparáveis
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="px-4">
        {labels.map((label, i) => (
          <StatRow
            key={label}
            label={label}
            statA={statsA[i]}
            statB={statsB[i] ?? statsA[i]}
          />
        ))}
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center px-4 py-3">
        Estatísticas ilustrativas — geradas para fins de demonstração
      </p>
    </div>
  );
}

// ─── View principal ───────────────────────────────────────────────────────────

export function PlayerComparatorView() {
  const [playerA, setPlayerA] = useState<PlayerResult | null>(null);
  const [playerB, setPlayerB] = useState<PlayerResult | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Comparar jogadores</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Selecione dois jogadores para comparar as estatísticas lado a lado
        </p>
      </div>

      {/* Seletores */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <SlotSelector label="Jogador A" value={playerA} onChange={setPlayerA} />
        <div className="hidden sm:flex items-center self-center text-2xl text-gray-300 dark:text-gray-600 font-black mt-8">
          vs
        </div>
        <SlotSelector label="Jogador B" value={playerB} onChange={setPlayerB} />
      </div>

      {/* Comparação */}
      {playerA && playerB && <ComparisonTable a={playerA} b={playerB} />}

      {/* Estado inicial */}
      {(!playerA || !playerB) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-3">⚔️</span>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Selecione os dois jogadores acima para ver a comparação
          </p>
        </div>
      )}
    </div>
  );
}
