import { TEAMS_BY_SLUG } from '../data/teams';
import type { TeamDetail } from '../types';

// Mapa de abreviações de mês (formato usado nos dados) → índice base-0
const MONTH_MAP: Record<string, number> = {
  Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
  Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
  // abreviações em inglês também presentes nos dados
  Feb: 1, Apr: 3, May: 4, Aug: 7, Sep: 8, Oct: 9,
};

export interface MatchEntry {
  key: string;
  date: string;           // ex: "12 Jun"
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
}

/** Converte "12 Jun" → Date(2026, 5, 12) ou null se não parseável */
export function parseMatchDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'A definir') return null;
  const parts = dateStr.trim().split(' ');
  if (parts.length !== 2) return null;
  const day = parseInt(parts[0], 10);
  const monthIdx = MONTH_MAP[parts[1]];
  if (isNaN(day) || monthIdx === undefined) return null;
  return new Date(2026, monthIdx, day);
}

function toDateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function isToday(d: Date): boolean {
  const now = new Date();
  return toDateOnly(d) === toDateOnly(now);
}

export function isFuture(d: Date): boolean {
  return toDateOnly(d) > toDateOnly(new Date());
}

/** Coleta todos os jogos de todos os times, deduplicados por partida */
export function buildMatchList(): MatchEntry[] {
  const seen = new Set<string>();
  const result: MatchEntry[] = [];

  const teams = Object.values(TEAMS_BY_SLUG) as TeamDetail[];

  for (const team of teams) {
    for (const game of team.games) {
      const parsedDate = parseMatchDate(game.date);
      if (!parsedDate) continue;

      // Chave determinística: slugs ordenados + data
      const awaySlug = Object.values(TEAMS_BY_SLUG).find(
        (t) => t.team.name === game.opponent,
      )?.slug ?? game.opponent.toLowerCase().replace(/\s+/g, '-');

      const keyParts = [team.slug, awaySlug].sort();
      const key = `${keyParts[0]}|${keyParts[1]}|${game.date}`;

      if (seen.has(key)) continue;
      seen.add(key);

      result.push({
        key,
        date: game.date,
        round: game.round,
        homeSlug: team.slug,
        homeTeam: team.team.name,
        homeFlag: team.team.flag,
        awaySlug,
        awayTeam: game.opponent,
        awayFlag: game.opponentFlag,
        city: game.city,
        venue: game.venue,
        score: game.score,
        result: game.result,
        parsedDate,
      });
    }
  }

  return result.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
}
