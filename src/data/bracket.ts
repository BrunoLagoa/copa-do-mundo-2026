import type { Round } from '../types';

// Projeção do chaveamento Copa 2026 — confrontos sujeitos a alteração.
// Baseado no sorteio de dez/2025. Os slots de QF/SF/Final são preenchidos
// dinamicamente pelo estado do BracketView.

export const ROUNDS: Round[] = [
  {
    id: 'ro16',
    label: 'Oitavas',
    matches: [
      {
        id: 'r16-1',
        teamA: { name: 'México', flag: '🇲🇽', isHost: true, seed: '1º A' },
        teamB: { name: 'Suíça', flag: '🇨🇭', isHost: false, seed: '2º B' },
        date: '28 Jun',
        city: 'Cidade do México',
        next: { matchId: 'qf-1', slot: 'teamA' },
      },
      {
        id: 'r16-2',
        teamA: { name: 'Canadá', flag: '🇨🇦', isHost: true, seed: '1º B' },
        teamB: { name: 'Escócia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', isHost: false, seed: '2º C' },
        date: '28 Jun',
        city: 'Toronto',
        next: { matchId: 'qf-1', slot: 'teamB' },
      },
      {
        id: 'r16-3',
        teamA: { name: 'Brasil', flag: '🇧🇷', isHost: false, seed: '1º C' },
        teamB: { name: 'Turquia', flag: '🇹🇷', isHost: false, seed: '2º D' },
        date: '29 Jun',
        city: 'Los Angeles',
        next: { matchId: 'qf-2', slot: 'teamA' },
      },
      {
        id: 'r16-4',
        teamA: { name: 'EUA', flag: '🇺🇸', isHost: true, seed: '1º D' },
        teamB: { name: 'Marrocos', flag: '🇲🇦', isHost: false, seed: '2º C' },
        date: '29 Jun',
        city: 'Nova York',
        next: { matchId: 'qf-2', slot: 'teamB' },
      },
      {
        id: 'r16-5',
        teamA: { name: 'Alemanha', flag: '🇩🇪', isHost: false, seed: '1º E' },
        teamB: { name: 'Uruguai', flag: '🇺🇾', isHost: false, seed: '2º H' },
        date: '30 Jun',
        city: 'Dallas',
        next: { matchId: 'qf-3', slot: 'teamA' },
      },
      {
        id: 'r16-6',
        teamA: { name: 'Espanha', flag: '🇪🇸', isHost: false, seed: '1º H' },
        teamB: { name: 'Equador', flag: '🇪🇨', isHost: false, seed: '2º E' },
        date: '30 Jun',
        city: 'Miami',
        next: { matchId: 'qf-3', slot: 'teamB' },
      },
      {
        id: 'r16-7',
        teamA: { name: 'França', flag: '🇫🇷', isHost: false, seed: '1º I' },
        teamB: { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHost: false, seed: '2º L' },
        date: '01 Jul',
        city: 'Boston',
        next: { matchId: 'qf-4', slot: 'teamA' },
      },
      {
        id: 'r16-8',
        teamA: { name: 'Argentina', flag: '🇦🇷', isHost: false, seed: '1º J' },
        teamB: { name: 'Portugal', flag: '🇵🇹', isHost: false, seed: '2º K' },
        date: '01 Jul',
        city: 'San Francisco',
        next: { matchId: 'qf-4', slot: 'teamB' },
      },
    ],
  },
  {
    id: 'qf',
    label: 'Quartas',
    matches: [
      {
        id: 'qf-1',
        teamA: null,
        teamB: null,
        date: '04 Jul',
        city: 'Cidade do México',
        next: { matchId: 'sf-1', slot: 'teamA' },
      },
      {
        id: 'qf-2',
        teamA: null,
        teamB: null,
        date: '04 Jul',
        city: 'Los Angeles',
        next: { matchId: 'sf-1', slot: 'teamB' },
      },
      {
        id: 'qf-3',
        teamA: null,
        teamB: null,
        date: '05 Jul',
        city: 'Dallas',
        next: { matchId: 'sf-2', slot: 'teamA' },
      },
      {
        id: 'qf-4',
        teamA: null,
        teamB: null,
        date: '05 Jul',
        city: 'Nova York',
        next: { matchId: 'sf-2', slot: 'teamB' },
      },
    ],
  },
  {
    id: 'sf',
    label: 'Semifinal',
    matches: [
      {
        id: 'sf-1',
        teamA: null,
        teamB: null,
        date: '09 Jul',
        city: 'Los Angeles',
        next: { matchId: 'final-1', slot: 'teamA' },
      },
      {
        id: 'sf-2',
        teamA: null,
        teamB: null,
        date: '10 Jul',
        city: 'Nova York',
        next: { matchId: 'final-1', slot: 'teamB' },
      },
    ],
  },
  {
    id: 'final',
    label: 'Final',
    matches: [
      {
        id: 'final-1',
        teamA: null,
        teamB: null,
        date: '19 Jul',
        city: 'Nova York',
        next: null,
      },
    ],
  },
];
