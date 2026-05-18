import { TEAMS_BY_SLUG } from '../data/teams';
import type { Player } from '../types';

export interface PlayerResult {
  player: Player;
  teamSlug: string;
  teamName: string;
  teamFlag: string;
}

/** Busca jogadores por nome, clube ou posição. Retorna [] se query < 2 chars. */
export function searchPlayers(query: string): PlayerResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: PlayerResult[] = [];

  for (const team of Object.values(TEAMS_BY_SLUG)) {
    for (const player of team.players) {
      const matchName     = player.name.toLowerCase().includes(q);
      const matchClub     = player.club.toLowerCase().includes(q);
      const matchPosition = player.position.toLowerCase().includes(q);
      if (matchName || matchClub || matchPosition) {
        results.push({
          player,
          teamSlug: team.slug,
          teamName: team.team.name,
          teamFlag: team.team.flag,
        });
      }
    }
  }

  return results.sort((a, b) => a.player.name.localeCompare(b.player.name, 'pt-BR'));
}
