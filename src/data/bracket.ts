import type { Round } from '../types';

/**
 * Chaveamento completo da fase eliminatória — 32 seleções.
 * Baseado no calendário oficial FIFA (30/mar/2026) — 31 jogos (5 rounds).
 *
 * Ro32 usa placeholders descritivos (1º A, 2º B, 3º de C/D/F/G/H, etc.)
 * porque as equipes reais são definidas após a fase de grupos (jun/2026).
 * `date` e `time` (BRT) são oficiais — derivados de FIXTURES (matches.ts).
 *
 * Os slots de Ro16/QF/SF/Final são preenchidos dinamicamente pelo
 * BracketView/KnockoutView conforme o usuário seleciona vencedores.
 */

/** Placeholder flag para jogos ainda sem equipe definida */
const TBD_FLAG = '🏳️';

function seed(name: string, seed: string) {
  return { name, flag: TBD_FLAG, isHost: false, seed };
}

export const ROUNDS: Round[] = [
  // ─── 32-avos (16 jogos, 28 jun – 03 jul) ──────────────────────────────
  {
    id: 'ro32',
    label: '32-avos',
    matches: [
      {
        id: 'ro32-1',          // M73
        teamA: seed('2º do Grupo A', '2º A'),
        teamB: seed('2º do Grupo B', '2º B'),
        date: '28 Jun', time: '13:00', city: 'Los Angeles',
        next: { matchId: 'ro16-2', slot: 'teamA' },
      },
      {
        id: 'ro32-2',          // M74
        teamA: seed('1º do Grupo E', '1º E'),
        teamB: seed('3º de A/B/C/D/F', '3º'),
        date: '29 Jun', time: '17:30', city: 'Foxborough',
        next: { matchId: 'ro16-1', slot: 'teamA' },
      },
      {
        id: 'ro32-3',          // M75
        teamA: seed('1º do Grupo F', '1º F'),
        teamB: seed('2º do Grupo C', '2º C'),
        date: '29 Jun', time: '22:00', city: 'Monterrey',
        next: { matchId: 'ro16-2', slot: 'teamB' },
      },
      {
        id: 'ro32-4',          // M76
        teamA: seed('1º do Grupo C', '1º C'),
        teamB: seed('2º do Grupo F', '2º F'),
        date: '29 Jun', time: '16:00', city: 'Houston',
        next: { matchId: 'ro16-3', slot: 'teamA' },
      },
      {
        id: 'ro32-5',          // M77
        teamA: seed('1º do Grupo I', '1º I'),
        teamB: seed('3º de C/D/F/G/H', '3º'),
        date: '30 Jun', time: '18:00', city: 'Nova York',
        next: { matchId: 'ro16-1', slot: 'teamB' },
      },
      {
        id: 'ro32-6',          // M78
        teamA: seed('2º do Grupo E', '2º E'),
        teamB: seed('2º do Grupo I', '2º I'),
        date: '30 Jun', time: '16:00', city: 'Dallas',
        next: { matchId: 'ro16-3', slot: 'teamB' },
      },
      {
        id: 'ro32-7',          // M79
        teamA: seed('1º do Grupo A', '1º A'),
        teamB: seed('3º de C/E/F/H/I', '3º'),
        date: '30 Jun', time: '22:00', city: 'Cidade do México',
        next: { matchId: 'ro16-4', slot: 'teamA' },
      },
      {
        id: 'ro32-8',          // M80
        teamA: seed('1º do Grupo L', '1º L'),
        teamB: seed('3º de E/H/I/J/K', '3º'),
        date: '01 Jul', time: '15:00', city: 'Atlanta',
        next: { matchId: 'ro16-4', slot: 'teamB' },
      },
      // ── direita do bracket ──
      {
        id: 'ro32-9',          // M81
        teamA: seed('1º do Grupo D', '1º D'),
        teamB: seed('3º de B/E/F/I/J', '3º'),
        date: '01 Jul', time: '21:00', city: 'San Francisco',
        next: { matchId: 'ro16-6', slot: 'teamA' },
      },
      {
        id: 'ro32-10',         // M82
        teamA: seed('1º do Grupo G', '1º G'),
        teamB: seed('3º de A/E/H/I/J', '3º'),
        date: '01 Jul', time: '19:00', city: 'Seattle',
        next: { matchId: 'ro16-6', slot: 'teamB' },
      },
      {
        id: 'ro32-11',         // M83
        teamA: seed('2º do Grupo K', '2º K'),
        teamB: seed('2º do Grupo L', '2º L'),
        date: '02 Jul', time: '18:00', city: 'Toronto',
        next: { matchId: 'ro16-5', slot: 'teamA' },
      },
      {
        id: 'ro32-12',         // M84
        teamA: seed('1º do Grupo H', '1º H'),
        teamB: seed('2º do Grupo J', '2º J'),
        date: '02 Jul', time: '16:00', city: 'Los Angeles',
        next: { matchId: 'ro16-5', slot: 'teamB' },
      },
      {
        id: 'ro32-13',         // M85
        teamA: seed('1º do Grupo B', '1º B'),
        teamB: seed('3º de E/F/G/I/J', '3º'),
        date: '02 Jul', time: '00:00', city: 'Vancouver',
        next: { matchId: 'ro16-8', slot: 'teamA' },
      },
      {
        id: 'ro32-14',         // M86
        teamA: seed('1º do Grupo J', '1º J'),
        teamB: seed('2º do Grupo H', '2º H'),
        date: '03 Jul', time: '19:00', city: 'Miami',
        next: { matchId: 'ro16-7', slot: 'teamA' },
      },
      {
        id: 'ro32-15',         // M87
        teamA: seed('1º do Grupo K', '1º K'),
        teamB: seed('3º de D/E/I/J/L', '3º'),
        date: '03 Jul', time: '22:30', city: 'Kansas City',
        next: { matchId: 'ro16-8', slot: 'teamB' },
      },
      {
        id: 'ro32-16',         // M88
        teamA: seed('2º do Grupo D', '2º D'),
        teamB: seed('2º do Grupo G', '2º G'),
        date: '03 Jul', time: '17:00', city: 'Dallas',
        next: { matchId: 'ro16-7', slot: 'teamB' },
      },
    ],
  },

  // ─── Oitavas (8 jogos, 04–07 jul) ─────────────────────────────────────
  {
    id: 'ro16',
    label: 'Oitavas',
    matches: [
      {
        id: 'ro16-1',          // M89
        teamA: null, teamB: null,
        date: '04 Jul', time: '18:00', city: 'Filadélfia',
        next: { matchId: 'qf-1', slot: 'teamA' },
      },
      {
        id: 'ro16-2',          // M90
        teamA: null, teamB: null,
        date: '04 Jul', time: '17:00', city: 'Houston',
        next: { matchId: 'qf-1', slot: 'teamB' },
      },
      {
        id: 'ro16-3',          // M91
        teamA: null, teamB: null,
        date: '05 Jul', time: '17:00', city: 'Nova York',
        next: { matchId: 'qf-3', slot: 'teamA' },
      },
      {
        id: 'ro16-4',          // M92
        teamA: null, teamB: null,
        date: '05 Jul', time: '21:00', city: 'Cidade do México',
        next: { matchId: 'qf-3', slot: 'teamB' },
      },
      {
        id: 'ro16-5',          // M93
        teamA: null, teamB: null,
        date: '06 Jul', time: '18:00', city: 'Dallas',
        next: { matchId: 'qf-2', slot: 'teamA' },
      },
      {
        id: 'ro16-6',          // M94
        teamA: null, teamB: null,
        date: '06 Jul', time: '21:00', city: 'Seattle',
        next: { matchId: 'qf-2', slot: 'teamB' },
      },
      {
        id: 'ro16-7',          // M95
        teamA: null, teamB: null,
        date: '07 Jul', time: '15:00', city: 'Atlanta',
        next: { matchId: 'qf-4', slot: 'teamA' },
      },
      {
        id: 'ro16-8',          // M96
        teamA: null, teamB: null,
        date: '07 Jul', time: '17:00', city: 'Vancouver',
        next: { matchId: 'qf-4', slot: 'teamB' },
      },
    ],
  },

  // ─── Quartas (4 jogos, 09–11 jul) ─────────────────────────────────────
  {
    id: 'qf',
    label: 'Quartas',
    matches: [
      {
        id: 'qf-1',            // M97
        teamA: null, teamB: null,
        date: '09 Jul', time: '17:00', city: 'Foxborough',
        next: { matchId: 'sf-1', slot: 'teamA' },
      },
      {
        id: 'qf-2',            // M98
        teamA: null, teamB: null,
        date: '10 Jul', time: '16:00', city: 'Los Angeles',
        next: { matchId: 'sf-1', slot: 'teamB' },
      },
      {
        id: 'qf-3',            // M99
        teamA: null, teamB: null,
        date: '11 Jul', time: '18:00', city: 'Miami',
        next: { matchId: 'sf-2', slot: 'teamA' },
      },
      {
        id: 'qf-4',            // M100
        teamA: null, teamB: null,
        date: '11 Jul', time: '22:00', city: 'Kansas City',
        next: { matchId: 'sf-2', slot: 'teamB' },
      },
    ],
  },

  // ─── Semifinais (2 jogos, 14–15 jul) ──────────────────────────────────
  {
    id: 'sf',
    label: 'Semifinal',
    matches: [
      {
        id: 'sf-1',            // M101
        teamA: null, teamB: null,
        date: '14 Jul', time: '16:00', city: 'Dallas',
        next: { matchId: 'final-1', slot: 'teamA' },
      },
      {
        id: 'sf-2',            // M102
        teamA: null, teamB: null,
        date: '15 Jul', time: '16:00', city: 'Atlanta',
        next: { matchId: 'final-1', slot: 'teamB' },
      },
    ],
  },

  // ─── Final (1 jogo, 19 jul) ───────────────────────────────────────────
  {
    id: 'final',
    label: 'Final',
    matches: [
      {
        id: 'final-1',         // M104
        teamA: null, teamB: null,
        date: '19 Jul', time: '16:00', city: 'Nova York',
        next: null,
      },
    ],
  },
];
