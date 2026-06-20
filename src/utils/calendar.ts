/**
 * Exportação de jogos para a agenda (formato iCalendar / .ics).
 *
 * 100% client-side: gera o texto .ics e dispara o download de um arquivo que o
 * Google/Apple/Outlook Calendar importam. Horários são convertidos de BRT
 * (UTC-3) para UTC, como o padrão iCalendar espera.
 */

import type { Fixture, MatchPhase } from '../types';

export interface CalendarEvent {
  uid: string;
  start: Date;          // instante absoluto
  durationMin: number;
  title: string;
  location?: string;
  description?: string;
}

const PHASE_LABEL: Record<MatchPhase, string> = {
  group: 'Fase de Grupos',
  'round-of-32': '32-avos de final',
  'round-of-16': 'Oitavas de final',
  quarter: 'Quartas de final',
  semi: 'Semifinal',
  third: 'Disputa de 3º lugar',
  final: 'Final',
};

/** "2026-06-11" + "13:00" (BRT) → instante absoluto (UTC = BRT + 3h). */
function fixtureStart(f: Fixture): Date {
  const [y, m, d] = f.date.split('-').map(Number);
  const [hh, mm] = f.time.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
}

/** Date → "YYYYMMDDTHHMMSSZ" (UTC, formato iCalendar). */
function toIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Escapa texto conforme RFC 5545 (vírgula, ponto-e-vírgula, barra, quebra). */
function esc(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Converte um fixture oficial num evento de calendário. */
export function fixtureToEvent(f: Fixture): CalendarEvent {
  const round =
    f.phase === 'group' && f.matchday
      ? `Grupo ${f.group} · Rodada ${f.matchday}`
      : PHASE_LABEL[f.phase];
  return {
    uid: `${f.id}@copa2026`,
    start: fixtureStart(f),
    durationMin: 120,
    title: `${f.homeFlag} ${f.homeTeam} x ${f.awayTeam} ${f.awayFlag}`.trim(),
    location: `${f.venue}, ${f.city} (${f.country})`,
    description: `${round} — Copa do Mundo 2026`,
  };
}

/** Monta o texto .ics de uma lista de eventos. */
export function buildIcs(events: CalendarEvent[], calName: string): string {
  const stamp = toIcsUtc(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Copa do Mundo 2026//PT-BR//',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName)}`,
  ];
  for (const e of events) {
    const end = new Date(e.start.getTime() + e.durationMin * 60_000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsUtc(e.start)}`,
      `DTEND:${toIcsUtc(end)}`,
      `SUMMARY:${esc(e.title)}`,
    );
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Dispara o download de um arquivo .ics no browser. */
export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Libera o objeto URL no próximo tick (após o clique iniciar o download).
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Atalho: exporta uma lista de fixtures como .ics (ignora placeholders TBD). */
export function exportFixtures(fixtures: Fixture[], calName: string, filename: string): void {
  const events = fixtures
    .filter((f) => f.homeSlug !== 'tbd' && f.awaySlug !== 'tbd')
    .map(fixtureToEvent);
  if (events.length === 0) return;
  downloadIcs(filename, buildIcs(events, calName));
}
