/**
 * Hook para persistir placares editáveis pelo usuário (jogos de hoje).
 * Segue a regra client-localstorage-schema: chave versionada, try/catch obrigatório.
 *
 * Chave: copa2026:group-scores:v1
 * Formato: Record<matchId, { home: number; away: number }>
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'copa2026:group-scores:v1';

export interface MatchScore {
  home: number;
  away: number;
}

type ScoresMap = Record<string, MatchScore>;

function loadFromStorage(): ScoresMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // JSON válido porém com shape errado (null, número, array) → mapa vazio.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as ScoresMap;
  } catch {
    return {};
  }
}

function saveToStorage(scores: ScoresMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // incognito / quota exceeded — ignorar silenciosamente
  }
}

export function useGroupScores() {
  const [scores, setScores] = useState<ScoresMap>(loadFromStorage);

  const setScore = useCallback((matchId: string, home: number, away: number) => {
    setScores((prev) => {
      const next = { ...prev, [matchId]: { home, away } };
      saveToStorage(next);
      return next;
    });
  }, []);

  const getScore = useCallback(
    (matchId: string): MatchScore | null => scores[matchId] ?? null,
    [scores],
  );

  return { getScore, setScore };
}
