import type { Formation, Player } from '../types';
import type { PlayerResult } from './playerSearch';

export const STORAGE_KEY = 'copa2026:my-team:v1';

export interface MyTeamState {
  formation: Formation;
  /** slot index 0..10 → selected player (or null) */
  slots: Record<number, PlayerResult | null>;
}

export const DEFAULT_STATE: MyTeamState = {
  formation: '4-3-3',
  slots: {},
};

export function loadMyTeam(): MyTeamState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, slots: {} };
    return JSON.parse(raw) as MyTeamState;
  } catch {
    return { ...DEFAULT_STATE, slots: {} };
  }
}

export function saveMyTeam(state: MyTeamState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — silent
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derives expected positions for 11 slots based on formation string. */
export function formationPositions(formation: Formation): Player['position'][] {
  const lines = formation.split('-').map(Number);
  const positions: Player['position'][] = ['Goleiro'];
  for (let li = 0; li < lines.length; li++) {
    const count = lines[li];
    for (let i = 0; i < count; i++) {
      if (li === 0) positions.push('Defensor');
      else if (li === lines.length - 1) positions.push('Atacante');
      else positions.push('Meio-campista');
    }
  }
  return positions;
}
