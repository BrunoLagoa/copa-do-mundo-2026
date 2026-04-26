import type { Player } from '../types';
import { PLAYER_PHOTOS } from '../data/playerPhotos';

export interface PlayerStat {
  label: string;
  value: number;
  max: number;
  unit: string;   // ex: "", "%", "/jogo"
  emoji: string;
}

/**
 * Generates deterministic pseudo-stats for a player based on position + number.
 * Same input → same output always. Values are fictional (no real data).
 */
export function generateStats(player: Player): PlayerStat[] {
  // Deterministic seed — never changes for the same player
  const seed = player.number * 7 + player.name.length * 13;
  const s = (offset: number, range: number, base: number) =>
    base + ((seed + offset) % range);

  switch (player.position) {
    case 'Goleiro':
      return [
        { label: 'Defesas',          value: s(0, 40, 40),  max: 80,  unit: '',      emoji: '🧤' },
        { label: 'Jogos',            value: s(1, 12, 10),  max: 22,  unit: '',      emoji: '📅' },
        { label: '% Passes certos',  value: s(2, 20, 70),  max: 100, unit: '%',     emoji: '🎯' },
        { label: 'Gols sofridos',    value: s(3,  8,  4),  max: 20,  unit: '',      emoji: '🚨' },
      ];
    case 'Defensor':
      return [
        { label: 'Interceptações',   value: s(0, 30,  20), max: 60,  unit: '',      emoji: '✋' },
        { label: 'Duelos ganhos',    value: s(1, 25,  55), max: 100, unit: '%',     emoji: '💪' },
        { label: 'Bloqueios',        value: s(2, 20,  10), max: 40,  unit: '',      emoji: '🛡️' },
        { label: 'Jogos',            value: s(3, 12,  10), max: 22,  unit: '',      emoji: '📅' },
      ];
    case 'Meio-campista':
      return [
        { label: 'Assistências',     value: s(0,  8,  1),  max: 12,  unit: '',      emoji: '🤝' },
        { label: 'Passes-chave',     value: s(1,  4,  1),  max:  6,  unit: '/jogo', emoji: '🔑' },
        { label: '% Passes certos',  value: s(2, 20, 75),  max: 100, unit: '%',     emoji: '🎯' },
        { label: 'Dribles',          value: s(3, 10,  3),  max: 15,  unit: '',      emoji: '🔄' },
      ];
    case 'Atacante':
    default:
      return [
        { label: 'Gols',             value: s(0, 12,  2),  max: 20,  unit: '',      emoji: '⚽' },
        { label: 'Finalizações',     value: s(1,  4,  2),  max:  6,  unit: '/jogo', emoji: '🥅' },
        { label: 'Assistências',     value: s(2,  6,  1),  max: 10,  unit: '',      emoji: '🤝' },
        { label: 'Dribles',          value: s(3,  8,  3),  max: 15,  unit: '',      emoji: '🔄' },
      ];
  }
}

export function playerAvatarUrl(name: string): string {
  const photo = PLAYER_PHOTOS[name];
  if (photo) return photo;
  // DiceBear adventurer — restrito a cabelos curtos (masculino)
  const maleHair = [
    'short01','short02','short03','short04','short05','short06','short07',
    'short08','short09','short10','short11','short12','short13','short14',
    'short15','short16','short17','short18','short19',
  ].map(h => `hair[]=${h}`).join('&');
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,ffd5dc,c0aede,d1d4f9&backgroundType=gradientLinear&${maleHair}`;
}



/** Position accent colours — returns Tailwind gradient classes */
export function positionGradient(position: Player['position']): string {
  switch (position) {
    case 'Goleiro':       return 'from-amber-600 via-amber-800 to-zinc-900';
    case 'Defensor':      return 'from-blue-700 via-blue-900 to-zinc-900';
    case 'Meio-campista': return 'from-emerald-600 via-emerald-900 to-zinc-900';
    case 'Atacante':      return 'from-red-600 via-red-900 to-zinc-900';
  }
}

export function positionLabel(position: Player['position']): string {
  return position; // already PT-BR
}
