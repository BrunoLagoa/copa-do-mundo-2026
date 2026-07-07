import type { ReactNode } from 'react';
import type { BracketMatch, Round } from '../types';

/**
 * Chaveamento linear (32-avos → Final) que se auto-alinha.
 *
 * A ideia: todas as colunas têm a MESMA altura (flex `items-stretch`), e cada
 * rodada divide sua altura em "slots" iguais — um slot por par de confrontos.
 * Dentro do slot, os dois cards ficam a 25%/75% (via `justify-around`), de modo
 * que o card da rodada seguinte (que ocupa 1 slot inteiro) cai exatamente no
 * ponto médio entre seus dois classificadores. Nenhum offset fixo é necessário:
 * o alinhamento é 100% proporcional e sobrevive a qualquer altura de card.
 *
 * As linhas de conexão (─┐ ├ └─) são desenhadas por pseudo-elementos em
 * `index.css`, também proporcionais à altura do slot.
 */

interface BracketBoardProps {
  /** As 5 rodadas em ordem: 32-avos, Oitavas, Quartas, Semifinal, Final. */
  rounds: Round[];
  /** Renderiza o card de um confronto. `isFinal` habilita o visual de destaque. */
  renderMatch: (match: BracketMatch, isFinal: boolean) => ReactNode;
  /**
   * Conteúdo ancorado logo abaixo do card da Final (ex.: disputa do 3º lugar).
   * Posicionado de forma absoluta para não deslocar a Final do centro — assim a
   * linha vindas das semifinais continua apontando exatamente para ela.
   */
  finalExtra?: ReactNode;
}

function pairUp(matches: BracketMatch[]): BracketMatch[][] {
  const slots: BracketMatch[][] = [];
  for (let i = 0; i < matches.length; i += 2) slots.push(matches.slice(i, i + 2));
  return slots;
}

function isFinalRound(round: Round): boolean {
  return round.id.includes('final') || round.label.toLowerCase() === 'final';
}

export function BracketBoard({ rounds, renderMatch, finalExtra }: BracketBoardProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="bkt flex items-stretch w-max mx-auto">
        {rounds.map((round, ri) => {
          const final = isFinalRound(round);
          const isLast = ri === rounds.length - 1;
          const slots = pairUp(round.matches);

          return (
            <div
              key={round.id}
              className={`bkt-round flex flex-col ${final ? 'w-[248px]' : 'w-[204px]'} ${
                isLast ? 'bkt-round-last' : ''
              }`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center pb-1.5 mb-1 border-b border-gray-100 dark:border-gray-700">
                {round.label}
              </h3>

              <div className="bkt-body flex-1 flex flex-col">
                {slots.map((pair, si) => (
                  <div
                    key={pair[0]?.id ?? si}
                    className="bkt-slot relative flex-1 flex flex-col justify-around"
                  >
                    {pair.map((match) => (
                      <div key={match.id} className="bkt-cell relative">
                        {renderMatch(match, final)}
                        {final && finalExtra && (
                          <div className="absolute inset-x-0 top-full pt-5">{finalExtra}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
