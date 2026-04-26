export interface Team {
  name: string;
  flag: string;
  isHost: boolean;
}

export interface Group {
  id: string;
  teams: [Team, Team, Team, Team];
}

export interface BracketTeam extends Team {
  seed?: string; // ex: "1º A", "2º B"
}

export interface Match {
  id: string;
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  date: string;   // ex: "28 Jun"
  city: string;   // ex: "Los Angeles"
  next: { matchId: string; slot: 'teamA' | 'teamB' } | null;
}

export interface Round {
  id: string;    // "ro16" | "qf" | "sf" | "final"
  label: string; // "Oitavas" | "Quartas" | "Semifinal" | "Final"
  matches: Match[];
}

export interface Player {
  number: number;
  name: string;
  position: 'Goleiro' | 'Defensor' | 'Meio-campista' | 'Atacante';
  club: string;
}

export interface TeamGame {
  round: string;          // ex: "Fase de Grupos — Rodada 1", "Oitavas"
  opponent: string;       // nome do adversário
  opponentFlag: string;   // emoji
  date: string;           // ex: "12 Jun"
  city: string;
  venue: string;          // estádio
  score: string | null;   // null = não jogado; "2–1" quando disponível
  result: 'V' | 'E' | 'D' | null;
}

export type Formation =
  | '4-3-3'
  | '4-4-2'
  | '4-2-3-1'
  | '3-5-2'
  | '3-4-3'
  | '5-3-2'
  | '4-5-1'
  | '4-1-4-1'
  | '4-3-2-1'
  | '4-4-1-1'
  | '3-4-2-1'
  | '5-4-1';

export const ALL_FORMATIONS: Formation[] = [
  '4-3-3',
  '4-4-2',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '5-3-2',
  '4-5-1',
  '4-1-4-1',
  '4-3-2-1',
  '4-4-1-1',
  '3-4-2-1',
  '5-4-1',
];

export interface TeamDetail {
  slug: string;           // ex: "brasil" — usado na URL
  team: Team;
  groupId: string;        // ex: "C"
  coach: string;
  confederation: string;  // ex: "CONMEBOL"
  formation: Formation;   // ex: "4-3-3"
  players: Player[];
  games: TeamGame[];
}
