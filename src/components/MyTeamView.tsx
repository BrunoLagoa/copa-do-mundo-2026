import { useState, useMemo, useCallback } from 'react';
import { TEAMS_BY_SLUG } from '../data/teams';
import { ALL_FORMATIONS } from '../types';
import { loadMyTeam, saveMyTeam, formationPositions } from '../utils/myTeamStorage';
import { playerAvatarUrl, positionGradient } from '../utils/playerStats';
import type { PlayerResult } from '../utils/playerSearch';
import type { Formation, Player } from '../types';

const ALL_TEAMS = Object.values(TEAMS_BY_SLUG).sort((a, b) =>
  a.team.name.localeCompare(b.team.name, 'pt-BR'),
);

// ─── Slot modal ───────────────────────────────────────────────────────────────

interface SlotModalProps {
  slotIndex: number;
  expectedPosition: Player['position'];
  current: PlayerResult | null;
  onSelect: (p: PlayerResult | null) => void;
  onClose: () => void;
}

function SlotModal({ slotIndex, expectedPosition, current, onSelect, onClose }: SlotModalProps) {
  const [teamSlug, setTeamSlug] = useState(current?.teamSlug ?? '');
  const [playerNumber, setPlayerNumber] = useState(current?.player.number ?? '');

  const selectedTeam = teamSlug ? TEAMS_BY_SLUG[teamSlug] : null;

  const selectClass =
    'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition';

  function handleConfirm() {
    if (!selectedTeam || !playerNumber) { onSelect(null); onClose(); return; }
    const num = Number(playerNumber);
    const player = selectedTeam.players.find((p) => p.number === num);
    if (!player) return;
    onSelect({ player, teamSlug: selectedTeam.slug, teamName: selectedTeam.team.name, teamFlag: selectedTeam.team.flag });
    onClose();
  }

  const positionLabel: Record<Player['position'], string> = {
    'Goleiro': 'Goleiro',
    'Defensor': 'Defensor',
    'Meio-campista': 'Meio-campista',
    'Atacante': 'Atacante',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">Posição #{slotIndex + 1}</p>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{positionLabel[expectedPosition]}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-3">
          <select value={teamSlug} onChange={(e) => { setTeamSlug(e.target.value); setPlayerNumber(''); }} className={selectClass}>
            <option value="">Selecione a seleção...</option>
            {ALL_TEAMS.map((t) => (
              <option key={t.slug} value={t.slug}>{t.team.flag} {t.team.name}</option>
            ))}
          </select>

          <select value={playerNumber} onChange={(e) => setPlayerNumber(e.target.value)} disabled={!selectedTeam} className={`${selectClass} disabled:opacity-40`}>
            <option value="">Selecione o jogador...</option>
            {selectedTeam?.players.map((p) => (
              <option key={p.number} value={p.number}>
                #{p.number} {p.name} — {p.position}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mt-5">
          {current && (
            <button
              onClick={() => { onSelect(null); onClose(); }}
              className="flex-1 py-2 rounded-lg border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              Remover
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!selectedTeam || !playerNumber}
            className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pitch view ───────────────────────────────────────────────────────────────

interface PitchSlotProps {
  index: number;
  position: Player['position'];
  player: PlayerResult | null;
  onClick: () => void;
}

function PitchSlot({ position, player, onClick }: PitchSlotProps) {
  const gradient = positionGradient(position);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group focus:outline-none"
      title={player?.player.name ?? `Selecionar ${position}`}
    >
      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} overflow-hidden shadow-md border-2 ${player ? 'border-white dark:border-gray-200' : 'border-dashed border-white/50 dark:border-gray-400/50'} transition group-hover:scale-110 group-hover:shadow-lg`}>
        {player ? (
          <img src={playerAvatarUrl(player.player.name)} alt={player.player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/70 text-xl font-light">+</div>
        )}
      </div>
      <span className="text-[10px] font-semibold leading-tight text-white drop-shadow text-center max-w-[64px] truncate">
        {player ? player.player.name.split(' ').slice(-1)[0] : position.slice(0, 3)}
      </span>
      {player && (
        <span className="text-[9px] leading-none text-white/80 drop-shadow">{player.teamFlag}</span>
      )}
    </button>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function MyTeamView() {
  const [state, setState] = useState(() => loadMyTeam());
  const [openSlot, setOpenSlot] = useState<number | null>(null);

  const positions = useMemo(() => formationPositions(state.formation), [state.formation]);

  const update = useCallback((next: typeof state) => {
    setState(next);
    saveMyTeam(next);
  }, []);

  function handleFormationChange(f: Formation) {
    update({ ...state, formation: f, slots: {} });
  }

  function handleSlotSelect(index: number, player: PlayerResult | null) {
    update({ ...state, slots: { ...state.slots, [index]: player } });
  }

  // Group slots by line for pitch rendering
  const lines = state.formation.split('-').map(Number);
  const lineGroups: number[][] = [[0]]; // goalkeeper
  let cursor = 1;
  for (const count of lines) {
    lineGroups.push(Array.from({ length: count }, (_, i) => cursor + i));
    cursor += count;
  }

  const filledCount = positions.filter((_, i) => state.slots[i]).length;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Minha Seleção</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {filledCount}/11 jogadores escolhidos
          </p>
        </div>
        <button
          onClick={() => update({ formation: state.formation, slots: {} })}
          className="text-xs text-red-500 dark:text-red-400 hover:underline"
        >
          Limpar
        </button>
      </div>

      {/* Seletor de formação */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
          Formação
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_FORMATIONS.map((f) => (
            <button
              key={f}
              onClick={() => handleFormationChange(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                state.formation === f
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Campo */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(180deg, #2d6a2d 0%, #1a4a1a 100%)' }}
      >
        {/* Linhas do campo */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 300 480" preserveAspectRatio="none">
          <rect x="30" y="20" width="240" height="440" rx="4" fill="none" stroke="white" strokeWidth="2"/>
          <line x1="30" y1="240" x2="270" y2="240" stroke="white" strokeWidth="1"/>
          <circle cx="150" cy="240" r="40" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="95" y="20" width="110" height="50" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="95" y="410" width="110" height="50" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="115" y="20" width="70" height="25" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="115" y="435" width="70" height="25" fill="none" stroke="white" strokeWidth="1"/>
          <circle cx="150" cy="60" r="3" fill="white"/>
          <circle cx="150" cy="420" r="3" fill="white"/>
        </svg>

        {/* Jogadores por linha (do goleiro ao ataque) */}
        <div className="relative z-10 flex flex-col-reverse gap-2 py-5 px-2" style={{ minHeight: '420px' }}>
          {lineGroups.map((slotIndices, lineIdx) => (
            <div
              key={lineIdx}
              className="flex justify-around items-center"
            >
              {slotIndices.map((slotIndex) => (
                <PitchSlot
                  key={slotIndex}
                  index={slotIndex}
                  position={positions[slotIndex]}
                  player={state.slots[slotIndex] ?? null}
                  onClick={() => setOpenSlot(slotIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de seleção */}
      {openSlot !== null && (
        <SlotModal
          slotIndex={openSlot}
          expectedPosition={positions[openSlot]}
          current={state.slots[openSlot] ?? null}
          onSelect={(p) => handleSlotSelect(openSlot, p)}
          onClose={() => setOpenSlot(null)}
        />
      )}
    </div>
  );
}
