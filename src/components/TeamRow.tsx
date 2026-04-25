import { Link } from 'react-router-dom';
import type { Team } from '../types';
import { toSlug } from '../utils/slug';

interface TeamRowProps {
  team: Team;
  position: number;
}

export function TeamRow({ team }: TeamRowProps) {
  return (
    <li className="border-b border-gray-100 dark:border-gray-700 last:border-0">
      <Link
        to={`/team/${toSlug(team.name)}`}
        className="flex items-center gap-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
      >
        <span className="text-xl leading-none">{team.flag}</span>
        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{team.name}</span>
        {team.isHost && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
            Anfitrião
          </span>
        )}
      </Link>
    </li>
  );
}
