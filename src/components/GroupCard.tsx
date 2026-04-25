import type { Group } from '../types';
import { TeamRow } from './TeamRow';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
        Grupo {group.id}
      </h2>
      <ul>
        {group.teams.map((team, i) => (
          <TeamRow key={team.name} team={team} position={i + 1} />
        ))}
      </ul>
    </div>
  );
}
