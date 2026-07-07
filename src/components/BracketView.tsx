import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Share2, Trash2, RefreshCw } from 'lucide-react';
import type { BracketTeam, BracketMatch, Round } from '../types';
import { ROUNDS } from '../data/bracket';
import { RoundColumn } from './RoundColumn';
import { MatchCard } from './MatchCard';
import {
  collectDependents,
  deriveRounds,
  overlayTeams,
  buildBracketColumns,
  COLUMN_LAYOUT_PRESETS,
  COLUMN_MATCH_OFFSETS,
} from '../utils/bracketUtils';
import { useKnockoutBracket } from '../hooks/useKnockoutBracket';
import type { KnockoutMatchData } from '../hooks/useKnockoutBracket';
import { encodeState, decodeState } from '../utils/shareState';

/**
 * Simulador de palpite. Parte do quadro REAL da ESPN: as seleções já
 * classificadas preenchem os confrontos, e os vencedores de jogos encerrados
 * vêm pré-marcados como palpite inicial. Toda escolha é editável — o palpite
 * do usuário (por nome do time) sobrepõe o resultado real; ao divergir, as
 * rodadas seguintes voltam a ser projeção livre.
 */

/** Palpite do usuário: matchId → NOME do time escolhido (robusto a re-render/URL). */
type Picks = Record<string, string>;

/**
 * Vencedor efetivo de um confronto: palpite do usuário tem prioridade; senão,
 * o resultado real da ESPN — mas só enquanto o time vencedor ainda estiver no
 * confronto (após uma divergência a montante, o resultado real "sai do caminho").
 */
function pickWinner(
  m: BracketMatch,
  e: KnockoutMatchData | undefined,
  picks: Picks,
): BracketTeam | null {
  const present = (name: string | undefined): BracketTeam | null =>
    !name ? null : m.teamA?.name === name ? m.teamA : m.teamB?.name === name ? m.teamB : null;

  const userPick = present(picks[m.id]);
  if (userPick) return userPick;

  if (e?.state === 'post' && e.winnerSlot) {
    const realWinner = e.winnerSlot === 'A' ? e.teamA : e.teamB;
    return present(realWinner?.name);
  }
  return null;
}

export function BracketView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { byMatchId, available, liveCount, lastUpdated } = useKnockoutBracket();

  // Palpite manual (também restaurado de um link ?b=…). Só o que o usuário
  // escolheu — a realidade entra como camada-base no cálculo efetivo.
  const initialPicks = useMemo<Picks>(() => {
    const b = searchParams.get('b');
    return (b && decodeState<Picks>(b)) || {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [picks, setPicks] = useState<Picks>(initialPicks);
  const [copied, setCopied] = useState(false);

  // Quadro efetivo: base = times reais da ESPN; propaga vencedores (palpite +
  // resultado real) rodada a rodada. A propagação SOBREPÕE a base da ESPN nos
  // slots futuros — por isso o palpite do usuário "manda" daí pra frente.
  const { displayColumns, winners, matchIndex, thirdMatch } = useMemo(() => {
    const base = overlayTeams(ROUNDS, byMatchId);
    let rounds: Round[] = base;
    let w: Record<string, BracketTeam> = {};
    for (let pass = 0; pass < 6; pass++) {
      const next: Record<string, BracketTeam> = {};
      for (const round of rounds) {
        for (const m of round.matches) {
          const t = pickWinner(m, byMatchId[m.id], picks);
          if (t) next[m.id] = t;
        }
      }
      w = next;
      rounds = deriveRounds(base, w);
    }
    const index: Record<string, BracketMatch> = {};
    for (const r of rounds) for (const m of r.matches) index[m.id] = m;

    // Disputa do 3º lugar: os perdedores das semifinais (segundo o palpite
    // efetivo) se enfrentam. Só é definido quando ambas as semis têm vencedor.
    const loserOf = (m: BracketMatch | undefined): BracketTeam | null => {
      const win = m && w[m.id];
      if (!m || !win || !m.teamA || !m.teamB) return null;
      return win.name === m.teamA.name ? m.teamB : m.teamA;
    };
    const thirdSlot = index['third-1'];
    let third: BracketMatch | null = null;
    if (thirdSlot) {
      third = { ...thirdSlot, teamA: loserOf(index['sf-1']), teamB: loserOf(index['sf-2']) };
      index['third-1'] = third; // pickWinner precisa dos times para registrar o palpite
      const bronze = pickWinner(third, byMatchId['third-1'], picks);
      if (bronze) w = { ...w, 'third-1': bronze };
    }
    return { displayColumns: buildBracketColumns(rounds), winners: w, matchIndex: index, thirdMatch: third };
  }, [byMatchId, picks]);

  const pickCount = Object.keys(picks).length;

  async function handleShare() {
    // Compartilha o quadro como exibido (palpite + realidade) → o destinatário
    // vê o mesmo bracket mesmo antes da ESPN carregar para ele.
    const names = Object.fromEntries(Object.entries(winners).map(([id, t]) => [id, t.name]));
    const url = new URL(window.location.href);
    url.searchParams.set('b', encodeState(names));
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSearchParams({ b: encodeState(names) });
    }
  }

  function handleClear() {
    // Volta ao baseline real (limpa só os palpites manuais).
    setPicks({});
    searchParams.delete('b');
    setSearchParams(searchParams);
  }

  function handleSelectWinner(matchId: string, team: BracketTeam) {
    setPicks((prev) => {
      const next = { ...prev };
      const dependents = collectDependents(matchId, matchIndex);

      // Clicar no vencedor já escolhido → desfaz o palpite (e os de baixo).
      if (next[matchId] === team.name) {
        for (const id of dependents) delete next[id];
        return next;
      }
      // Define o palpite e zera os palpites a jusante (o caminho mudou).
      for (const id of dependents) if (id !== matchId) delete next[id];
      next[matchId] = team.name;
      return next;
    });
  }

  return (
    <section className="px-2 md:px-4 py-4 md:py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <p className="flex-1 min-w-[12rem] text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-200 dark:bg-amber-900/30 dark:border-amber-800 rounded-lg px-3 py-2">
          🔮 Simulador — começa com os classificados reais e resultados já decididos.
          Clique em um time para palpitar; sua escolha sobrepõe o resultado real.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            {liveCount > 0 ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">{liveCount} ao vivo</span>
              </>
            ) : available && lastUpdated ? (
              <>
                <RefreshCw size={12} />
                {`Real ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
              </>
            ) : null}
          </span>
          {pickCount > 0 && (
            <>
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
                title="Limpar palpite (volta ao resultado real)"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
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
              footer={
                round.id === 'final-center' && thirdMatch ? (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                        <span aria-hidden>🥉</span> Disputa do 3º lugar
                      </h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Perdedores das semifinais
                      </p>
                    </div>
                    <MatchCard
                      match={thirdMatch}
                      winnerTeam={winners['third-1'] ?? null}
                      onSelectWinner={(team) => handleSelectWinner('third-1', team)}
                      isThird
                    />
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
