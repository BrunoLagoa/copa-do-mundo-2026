/**
 * Resolução de foto de jogador a partir de várias fontes, com casamento
 * tolerante por nome (acentos/caixa/pontuação ignorados).
 *
 * Prioridade:
 *   1. foto vinda da própria ESPN (headshot do roster)
 *   2. mapa por ID de atleta ESPN (fotos reais buscadas off-line)
 *   3. mapa por nome — exato e, em seguida, normalizado
 *
 * Sem match → `null`: a UI exibe um monograma com a cor da seleção, mantendo
 * o grid completo e profissional.
 */

import { PLAYER_PHOTOS } from './playerPhotos';
import { PLAYER_PHOTOS_BY_ESPN_ID } from './playerPhotosEspn';

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Índice normalizado do mapa por nome (1ª ocorrência vence).
const PHOTOS_BY_NORM_NAME: Record<string, string> = (() => {
  const idx: Record<string, string> = {};
  for (const [name, url] of Object.entries(PLAYER_PHOTOS)) {
    const key = normalize(name);
    if (key && !(key in idx)) idx[key] = url;
  }
  return idx;
})();

export interface PhotoQuery {
  id?: string | null;
  name: string;
  espnPhoto?: string | null;
}

/** Melhor foto disponível para um jogador, ou `null` se não houver. */
export function resolvePlayerPhoto({ id, name, espnPhoto }: PhotoQuery): string | null {
  if (espnPhoto) return espnPhoto;
  if (id && PLAYER_PHOTOS_BY_ESPN_ID[id]) return PLAYER_PHOTOS_BY_ESPN_ID[id];
  if (PLAYER_PHOTOS[name]) return PLAYER_PHOTOS[name];
  const norm = normalize(name);
  return PHOTOS_BY_NORM_NAME[norm] ?? null;
}

/** Iniciais (até 2) para o avatar de fallback. */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
