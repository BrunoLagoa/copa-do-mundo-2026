import { useMemo } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import type { BracketTeam, BracketMatch, Round } from '../types';
import { ROUNDS } from '../data/bracket';
import { ResultMatchCard } from './ResultMatchCard';
import { BracketBoard } from './BracketBoard';
import { useKnockoutBracket } from '../hooks/useKnockoutBracket';
import type { KnockoutMatchData } from '../hooks/useKnockoutBracket';
import { deriveRounds, overlayTeams } from '../utils/bracketUtils';

// ─── ESPN → bracket ───────────────────────────────────────────────────────────

/** Vencedor real (jogos encerrados) de cada confronto, como BracketTeam. */
function winnersFromEspn(
  rounds: Round[],
  byMatchId: Record<string, KnockoutMatchData>,
): Record<string, BracketTeam> {
  const index: Record<string, BracketMatch> = {};
  for (const r of rounds) for (const m of r.matches) index[m.id] = m;

  const winners: Record<string, BracketTeam> = {};
  for (const [id, e] of Object.entries(byMatchId)) {
    if (e.state !== 'post' || !e.winnerSlot) continue;
    const m = index[id];
    const pick = e.winnerSlot === 'A' ? m?.teamA : m?.teamB;
    if (pick) winners[id] = pick;
  }
  return winners;
}

// ─── KnockoutView ───────────────────────────────────────────────────────────

export function KnockoutView() {
  const { available, byMatchId, liveCount, lastUpdated, error } = useKnockoutBracket();

  // Monta o quadro efetivo: injeta as seleções da ESPN e propaga os vencedores
  // reais rodada a rodada (ro32 → final). A ESPN é a fonte da verdade — por isso
  // re-injetamos os times dela a cada passo, sobrepondo a propagação interna.
  const { displayRounds, allWinners } = useMemo(() => {
    let rounds = overlayTeams(ROUNDS, byMatchId);
    let winners: Record<string, BracketTeam> = {};
    for (let pass = 0; pass < 5; pass++) {
      winners = winnersFromEspn(rounds, byMatchId);
      rounds = overlayTeams(deriveRounds(rounds, winners), byMatchId);
    }
    return { displayRounds: rounds, allWinners: winners };
  }, [byMatchId]);

  // A disputa do 3º lugar não entra no chaveamento (não tem "próxima rodada"):
  // é renderizada à parte, como um confronto avulso entre os perdedores das semis.
  const bracketRounds = displayRounds.filter((r) => r.id !== 'third');
  const thirdMatch = displayRounds.find((r) => r.id === 'third')?.matches[0] ?? null;

  return (
    <section className="px-2 md:px-4 py-4 md:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 dark:text-blue-200 dark:bg-blue-900/30 dark:border-blue-800 rounded-lg px-3 py-2 flex-1 min-w-[12rem]">
          ⚽ Quadro oficial — confrontos, placares e classificados atualizados ao vivo.
          O vencedor avança automaticamente.
        </p>
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {error && !available ? (
            <>
              <AlertCircle size={13} className="text-amber-500" />
              Sem conexão com a ESPN
            </>
          ) : liveCount > 0 ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {liveCount} ao vivo
              </span>
            </>
          ) : (
            <>
              <RefreshCw size={13} className={available ? '' : 'animate-spin'} />
              {lastUpdated
                ? `Atualizado ${lastUpdated.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Carregando…'}
            </>
          )}
        </span>
      </div>

      <BracketBoard
        rounds={bracketRounds}
        renderMatch={(match, isFinal) => (
          <ResultMatchCard
            match={match}
            result={byMatchId[match.id]}
            winnerTeam={allWinners[match.id] ?? null}
            isFinal={isFinal}
          />
        )}
        finalExtra={
          thirdMatch && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-0.5 text-center">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                  <span aria-hidden>🥉</span> Disputa do 3º lugar
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Perdedores das semifinais
                </p>
              </div>
              <ResultMatchCard
                match={thirdMatch}
                result={byMatchId[thirdMatch.id]}
                winnerTeam={allWinners[thirdMatch.id] ?? null}
                isThird
              />
            </div>
          )
        }
      />
    </section>
  );
}
