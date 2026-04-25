import type { TeamDetail } from '../../types';
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

export const TEAMS_BY_SLUG: Record<string, TeamDetail> = Object.fromEntries(
  ALL_TEAMS.map((t) => [t.slug, t]),
);
