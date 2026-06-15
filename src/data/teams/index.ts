import type { Formation, GroupId, TeamDetail } from '../../types';
import { GROUPS } from '../groups';
import { confederationForSlug } from '../teamCodes';
import { toSlug } from '../../utils/slug';
import { TEAMS_A } from './grupo-a';
import { TEAMS_B } from './grupo-b';
import { TEAMS_C } from './grupo-c';
import { TEAMS_D } from './grupo-d';
import { TEAMS_E } from './grupo-e';
import { TEAMS_F } from './grupo-f';
import { TEAMS_G } from './grupo-g';
import { TEAMS_H } from './grupo-h';
import { TEAMS_I } from './grupo-i';
import { TEAMS_J } from './grupo-j';
import { TEAMS_K } from './grupo-k';
import { TEAMS_L } from './grupo-l';

const ALL_TEAMS: TeamDetail[] = [
  ...TEAMS_A,
  ...TEAMS_B,
  ...TEAMS_C,
  ...TEAMS_D,
  ...TEAMS_E,
  ...TEAMS_F,
  ...TEAMS_G,
  ...TEAMS_H,
  ...TEAMS_I,
  ...TEAMS_J,
  ...TEAMS_K,
  ...TEAMS_L,
];

/** Seleções com elenco curado localmente (uma por grupo). */
export const TEAMS_BY_SLUG: Record<string, TeamDetail> = Object.fromEntries(
  ALL_TEAMS.map((t) => [t.slug, t]),
);

/**
 * Esqueleto mínimo de cada uma das 48 seleções, derivado de `groups.ts`
 * (nome, bandeira, anfitrião, grupo). Permite abrir QUALQUER seleção mesmo
 * sem elenco local — o restante (elenco, estatísticas, escalação, cores) é
 * preenchido ao vivo pela ESPN em `TeamPage` via `useTeamProfile`.
 */
const SKELETON_BY_SLUG: Record<string, TeamDetail> = Object.fromEntries(
  GROUPS.flatMap((group) =>
    group.teams.map((team): [string, TeamDetail] => {
      const slug = toSlug(team.name);
      return [
        slug,
        {
          slug,
          team,
          groupId: group.id as GroupId,
          coach: '',
          confederation: confederationForSlug(slug) ?? '',
          formation: '4-3-3' as Formation,
          players: [],
        },
      ];
    }),
  ),
);

/**
 * Resolve a seleção pelo slug: usa o elenco curado local quando existe;
 * senão cai no esqueleto derivado de `groups.ts` (sempre disponível para os
 * 48 participantes). Retorna `undefined` apenas para slugs realmente inválidos.
 */
export function getTeamDetail(slug: string | undefined): TeamDetail | undefined {
  if (!slug) return undefined;
  return TEAMS_BY_SLUG[slug] ?? SKELETON_BY_SLUG[slug];
}
