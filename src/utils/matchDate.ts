import { FIXTURES } from '../data/matches';
import type { Fixture, GroupId, MatchPhase } from '../types';


/** ISO "2026-06-11" + "HH:MM" BRT → Date em horário local do browser. */
function parseFixtureDateTime(f: Fixture): Date {
  // BRT (UTC-3) → soma 3h para obter UTC, depois Date aplica offset local.
  const [y, m, d] = f.date.split('-').map(Number);
  const [hh, mm] = f.time.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
}

function toDateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function isDateToday(d: Date): boolean {
  return toDateOnly(d) === toDateOnly(new Date());
}

export function isDateFuture(d: Date): boolean {
  return d.getTime() > Date.now();
}

export function isDatePast(d: Date): boolean {
  return d.getTime() < Date.now();
}

export function isFixtureToday(f: Fixture): boolean {
  return isDateToday(parseFixtureDateTime(f));
}

export function isFixtureFuture(f: Fixture): boolean {
  return isDateFuture(parseFixtureDateTime(f));
}

export function isFixturePast(f: Fixture): boolean {
  return isDatePast(parseFixtureDateTime(f));
}

// ─── Lookups ────────────────────────────────────────────────────────────────

export function getTeamMatches(slug: string): Fixture[] {
  return FIXTURES.filter((f) => f.homeSlug === slug || f.awaySlug === slug).sort(
    (a, b) => parseFixtureDateTime(a).getTime() - parseFixtureDateTime(b).getTime(),
  );
}

export function getGroupMatches(group: GroupId): Fixture[] {
  return FIXTURES.filter((f) => f.group === group && f.phase === 'group').sort(
    (a, b) => parseFixtureDateTime(a).getTime() - parseFixtureDateTime(b).getTime(),
  );
}

export function getNextTeamMatch(slug: string): Fixture | null {
  return getTeamMatches(slug).find(isFixtureFuture) ?? null;
}

// ─── Agrupamentos ───────────────────────────────────────────────────────────

export function getFixturesByDate(): { date: string; fixtures: Fixture[] }[] {
  const map = new Map<string, Fixture[]>();
  for (const f of FIXTURES) {
    const list = map.get(f.date) ?? [];
    list.push(f);
    map.set(f.date, list);
  }
  return Array.from(map.entries())
    .map(([date, fixtures]) => ({
      date,
      fixtures: fixtures.sort(
        (a, b) => parseFixtureDateTime(a).getTime() - parseFixtureDateTime(b).getTime(),
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface PhaseGroup {
  phase: MatchPhase;
  label: string;
  fixtures: Fixture[];
}

export function getFixturesByPhase(): PhaseGroup[] {
  const labels: Record<MatchPhase, string> = {
    group: 'Fase de Grupos',
    'round-of-32': '32-avos de final',
    'round-of-16': 'Oitavas de final',
    quarter: 'Quartas de final',
    semi: 'Semifinais',
    third: 'Disputa de 3º lugar',
    final: 'Final',
  };
  const order: MatchPhase[] = [
    'group',
    'round-of-32',
    'round-of-16',
    'quarter',
    'semi',
    'third',
    'final',
  ];
  return order
    .map((phase) => ({
      phase,
      label: labels[phase],
      fixtures: FIXTURES.filter((f) => f.phase === phase).sort(
        (a, b) => parseFixtureDateTime(a).getTime() - parseFixtureDateTime(b).getTime(),
      ),
    }))
    .filter((g) => g.fixtures.length > 0);
}

// ─── MatchEntry (compat legada usada por GamesView existente) ───────────────

export interface MatchEntry {
  key: string;
  date: string; // ex: "12 Jun"
  round: string;
  homeSlug: string;
  homeTeam: string;
  homeFlag: string;
  awaySlug: string;
  awayTeam: string;
  awayFlag: string;
  city: string;
  venue: string;
  score: string | null;
  result: 'V' | 'E' | 'D' | null;
  parsedDate: Date;
  time: string;          // "HH:MM" BRT
  fullDate: string;      // ISO "2026-06-11"
  phase: MatchPhase;
  group?: GroupId;       // apenas group
  country: 'México' | 'EUA' | 'Canadá';
  isPlaceholder: boolean;
}

const MONTH_PT: Record<number, string> = {
  0: 'Jan', 1: 'Fev', 2: 'Mar', 3: 'Abr', 4: 'Mai', 5: 'Jun',
  6: 'Jul', 7: 'Ago', 8: 'Set', 9: 'Out', 10: 'Nov', 11: 'Dez',
};

function formatShortDate(iso: string): string {
  const [, mm, dd] = iso.split('-');
  return `${parseInt(dd, 10)} ${MONTH_PT[parseInt(mm, 10) - 1]}`;
}

function phaseLabel(f: Fixture): string {
  if (f.phase === 'group') {
    return `Grupo ${f.group} — Rodada ${f.matchday}`;
  }
  const labels: Partial<Record<MatchPhase, string>> = {
    'round-of-32': '32-avos',
    'round-of-16': 'Oitavas',
    quarter: 'Quartas',
    semi: 'Semifinal',
    third: '3º lugar',
    final: 'Final',
  };
  return labels[f.phase] ?? '';
}

export function buildMatchList(): MatchEntry[] {
  return FIXTURES.map((f): MatchEntry => {
    const isPlaceholder = f.homeSlug === 'tbd' || f.awaySlug === 'tbd';
    return {
      key: f.id,
      date: formatShortDate(f.date),
      round: phaseLabel(f),
      homeSlug: f.homeSlug,
      homeTeam: f.homeTeam,
      homeFlag: f.homeFlag,
      awaySlug: f.awaySlug,
      awayTeam: f.awayTeam,
      awayFlag: f.awayFlag,
      city: f.city,
      venue: f.venue,
      score: null,
      result: null,
      parsedDate: parseFixtureDateTime(f),
      time: f.time,
      fullDate: f.date,
      phase: f.phase,
      country: f.country,
      isPlaceholder,
    };
  }).sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
}
