import { TEAMS_BY_SLUG } from '../data/teams';
import { generateStats } from './playerStats';
import type { PlayerResult } from './playerSearch';
import type { PlayerStat } from './playerStats';
import type { Player } from '../types';

export interface RankedPlayer extends PlayerResult {
  stats: PlayerStat[];
  primaryStat: PlayerStat;
}

const PRIMARY_STAT: Record<Player['position'], string> = {
  'Goleiro':       'Defesas',
  'Defensor':      'Interceptações',
  'Meio-campista': 'Assistências',
  'Atacante':      'Gols',
};

export function getRankingByPosition(position: Player['position']): RankedPlayer[] {
  const results: RankedPlayer[] = [];

  for (const team of Object.values(TEAMS_BY_SLUG)) {
    for (const player of team.players) {
      if (player.position !== position) continue;
      const stats = generateStats(player);
      const label = PRIMARY_STAT[position];
      const primaryStat = stats.find((s) => s.label === label) ?? stats[0];
      results.push({
        player,
        teamSlug: team.slug,
        teamName: team.team.name,
        teamFlag: team.team.flag,
        stats,
        primaryStat,
      });
    }
  }

  return results
    .sort((a, b) => b.primaryStat.value - a.primaryStat.value)
    .slice(0, 20);
}
