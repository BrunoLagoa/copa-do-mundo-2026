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

export interface BracketMatch {
  id: string;
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  date: string;   // ex: "28 Jun"
  time: string;   // ex: "16:00" (BRT, derivado de FIXTURES por data+cidade)
  city: string;   // ex: "Los Angeles"
  next: { matchId: string; slot: 'teamA' | 'teamB' } | null;
}

export interface Round {
  id: string;    // "ro16" | "qf" | "sf" | "final"
  label: string; // "Oitavas" | "Quartas" | "Semifinal" | "Final"
  matches: BracketMatch[];
}

export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export type MatchPhase =
  | 'group'
  | 'round-of-32'
  | 'round-of-16'
  | 'quarter'
  | 'semi'
  | 'third'
  | 'final';

export type PlaceholderKind = 'winner' | 'runner' | 'third';

export interface Placeholder {
  kind: PlaceholderKind;
  group: GroupId;
}

/** Jogo oficial da Copa do Mundo 2026 (fonte: FIFA, mar/2026). */
export interface Fixture {
  id: string;            // "M1"..."M104"
  phase: MatchPhase;
  matchday?: 1 | 2 | 3;  // apenas group
  group?: GroupId;       // apenas group
  date: string;          // ISO "2026-06-11" (data em BRT, BRT = UTC-3)
  time: string;          // "HH:MM" em BRT
  city: string;
  venue: string;
  country: 'México' | 'EUA' | 'Canadá';
  homeTeam: string;      // nome (PT-BR) ou placeholder textual
  awayTeam: string;
  homeSlug: string;      // slug para /team/... — "TBD" para mata-mata
  awaySlug: string;
  homeFlag: string;
  awayFlag: string;
  homePlaceholder?: Placeholder;      // mata-mata
  awayPlaceholder?: Placeholder;
  homeThirdGroups?: GroupId[];        // ex: 3º de [C,D,F,G,H]
  awayThirdGroups?: GroupId[];
  homeScore?: number;                 // placar fixo (jogos passados)
  awayScore?: number;
}

export interface Player {
  number: number;
  name: string;
  position: 'Goleiro' | 'Defensor' | 'Meio-campista' | 'Atacante';
  club: string;
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
}
