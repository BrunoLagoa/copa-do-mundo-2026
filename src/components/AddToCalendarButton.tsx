/**
 * Botão "Adicionar à agenda" — baixa um .ics com os jogos informados, que o
 * Google/Apple/Outlook Calendar importam. Sem backend.
 */

import { CalendarPlus } from 'lucide-react';
import type { Fixture } from '../types';
import { exportFixtures } from '../utils/calendar';

export function AddToCalendarButton({
  fixtures,
  calName,
  filename,
  label = 'Adicionar à agenda',
  className = '',
}: {
  fixtures: Fixture[];
  calName: string;
  filename: string;
  label?: string;
  className?: string;
}) {
  const count = fixtures.filter((f) => f.homeSlug !== 'tbd' && f.awaySlug !== 'tbd').length;
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={() => exportFixtures(fixtures, calName, filename)}
      title={`Baixar ${count} ${count === 1 ? 'jogo' : 'jogos'} (.ics)`}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 transition-colors hover:bg-green-100 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 ${className}`}
    >
      <CalendarPlus size={13} className="shrink-0" />
      {label}
    </button>
  );
}
