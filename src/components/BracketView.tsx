import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Share2, Trash2 } from 'lucide-react';
import type { BracketTeam } from '../types';
import { ROUNDS } from '../data/bracket';
import { RoundColumn } from './RoundColumn';
import {
  buildMatchIndex,
  collectDependents,
  deriveRounds,
  buildBracketColumns,
  COLUMN_LAYOUT_PRESETS,
  COLUMN_MATCH_OFFSETS,
} from '../utils/bracketUtils';
import { encodeState, decodeState } from '../utils/shareState';

const MATCH_INDEX = buildMatchIndex(ROUNDS);

/**
 * Reconstrói o mapa de vencedores (matchId → BracketTeam) a partir do mapa
 * compacto matchId → nome do time. Propaga rodada a rodada: a cada passo,
 * deriva os confrontos atuais e fixa os vencedores cujo nome bate, até estabilizar.
 */
function rebuildWinners(saved: Record<string, string>): Record<string, BracketTeam> {
  const winners: Record<string, BracketTeam> = {};
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (const round of deriveRounds(ROUNDS, winners)) {
      for (const m of round.matches) {
        const name = saved[m.id];
        if (!name || winners[m.id]) continue;
        const pick = m.teamA?.name === name ? m.teamA : m.teamB?.name === name ? m.teamB : null;
        if (pick) {
          winners[m.id] = pick;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return winners;
}

/** Mapa de vencedores → forma compacta (matchId → nome) para a URL. */
function toNames(winners: Record<string, BracketTeam>): Record<string, string> {
  return Object.fromEntries(Object.entries(winners).map(([id, t]) => [id, t.name]));
}

export function BracketView() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Palpite vindo de um link compartilhado (?b=...), reconstruído 1x no load.
  const initialWinners = useMemo<Record<string, BracketTeam>>(() => {
    const b = searchParams.get('b');
    if (!b) return {};
    const names = decodeState<Record<string, string>>(b);
    return names ? rebuildWinners(names) : {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [winners, setWinners] = useState<Record<string, BracketTeam>>(initialWinners);
  const [copied, setCopied] = useState(false);

  const pickCount = Object.keys(winners).length;

  async function handleShare() {
    const url = new URL(window.location.href);
    url.searchParams.set('b', encodeState(toNames(winners)));
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloqueado → ao menos reflete o palpite na URL atual
      setSearchParams({ b: encodeState(toNames(winners)) });
    }
  }

  function handleClear() {
    setWinners({});
    searchParams.delete('b');
    setSearchParams(searchParams);
  }

  function handleSelectWinner(matchId: string, team: BracketTeam) {
    setWinners((prev) => {
      const next = { ...prev };

      // If same winner clicked again, deselect
      if (next[matchId]?.name === team.name) {
        const toRemove = collectDependents(matchId, MATCH_INDEX);
        for (const id of toRemove) delete next[id];
        return next;
      }

      // Set winner, then reset all downstream (not the match itself)
      const dependents = collectDependents(matchId, MATCH_INDEX);
      // Remove dependents excluding the match itself (we'll set it below)
      for (const id of dependents) {
        if (id !== matchId) delete next[id];
      }
      next[matchId] = team;
      return next;
    });
  }

  const derivedRounds = deriveRounds(ROUNDS, winners);
  const displayColumns = buildBracketColumns(derivedRounds);

  return (
    <section className="px-2 md:px-4 py-4 md:py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <p className="flex-1 min-w-[12rem] text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-200 dark:bg-amber-900/30 dark:border-amber-800 rounded-lg px-3 py-2">
          ⚠ Projeção — confrontos sujeitos a alteração após fase de grupos (jul/2026).
          Clique em um time para avançá-lo na chave.
        </p>
        {pickCount > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? 'Link copiado!' : 'Compartilhar palpite'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              title="Limpar palpite"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 w-max mx-auto">
          {displayColumns.map((round, index) => (
            <RoundColumn
              key={round.id}
              round={round}
              winners={winners}
              onSelectWinner={handleSelectWinner}
              topOffsetClassName={COLUMN_LAYOUT_PRESETS[index]?.topOffset}
              matchesGapClassName={COLUMN_LAYOUT_PRESETS[index]?.gap}
              matchOffsetClassNames={[...(COLUMN_MATCH_OFFSETS[index] ?? [])]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
