import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import {
  formatShortDate,
  getFinalFixture,
  parseFixtureDateTime,
} from '../utils/matchDate';

/**
 * Contagem regressiva até o apito inicial da grande final.
 *
 * O alvo vem do fixture M104 (não é hardcoded), então segue qualquer
 * ajuste de data/hora feito em `data/matches.ts`. Some sozinha assim que
 * a bola rola — daí em diante quem sinaliza o jogo é o selo "ao vivo".
 */

const FINAL = getFinalFixture();
const KICKOFF = FINAL ? parseFixtureDateTime(FINAL) : null;

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Tempo até `target`, ou null se já passou. */
function remainingUntil(target: Date): Remaining | null {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor(total / 3_600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
  };
}

const UNITS: { key: keyof Remaining; label: string }[] = [
  { key: 'days', label: 'dias' },
  { key: 'hours', label: 'horas' },
  { key: 'minutes', label: 'min' },
  { key: 'seconds', label: 'seg' },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function FinalCountdown() {
  const [left, setLeft] = useState(() => (KICKOFF ? remainingUntil(KICKOFF) : null));

  useEffect(() => {
    if (!KICKOFF) return;
    const id = setInterval(() => {
      const next = remainingUntil(KICKOFF);
      setLeft(next);
      if (!next) clearInterval(id); // chegou ao fim: para de tickar
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  if (!FINAL || !left) return null;

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="flex items-center gap-1.5 text-amber-300">
        <Trophy size={12} aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em]">
          Grande Final
        </span>
      </div>

      {/* role="timer" não anuncia sozinho (aria-live padrão = off); os números
          ficam aria-hidden e o texto abaixo dá a versão legível por leitor de
          tela — sem isso, seria uma tagarelice de uma atualização por segundo. */}
      <div role="timer" className="mt-2.5 flex items-center gap-1.5 sm:gap-2">
        <span className="sr-only">
          Faltam {left.days} {left.days === 1 ? 'dia' : 'dias'}, {left.hours}{' '}
          {left.hours === 1 ? 'hora' : 'horas'} e {left.minutes}{' '}
          {left.minutes === 1 ? 'minuto' : 'minutos'} para a grande final.
        </span>
        {UNITS.map(({ key, label }) => (
          <div
            key={key}
            aria-hidden
            className="min-w-[3.5rem] rounded-xl bg-white/10 px-2 py-1.5 ring-1 ring-white/15 backdrop-blur sm:min-w-[4rem]"
          >
            <div className="text-xl font-black tabular-nums leading-tight sm:text-2xl">
              {pad(left[key])}
            </div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-green-100/70">
              {label}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-[11px] font-medium text-green-100/70">
        {formatShortDate(FINAL.date)} · {FINAL.time} (Brasília) · {FINAL.venue}
      </p>
    </div>
  );
}
