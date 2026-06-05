import type { Group } from '../types';
import { getGroupMatches } from '../utils/matchDate';
import { TeamRow } from './TeamRow';

interface GroupCardProps {
  group: Group;
}

function formatShortDate(iso: string): string {
  const [, mm, dd] = iso.split('-');
  return `${parseInt(dd, 10)}/${parseInt(mm, 10)}`;
}

function GroupSchedule({ groupId }: { groupId: string }) {
  const matches = getGroupMatches(groupId as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L');
  if (matches.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Jogos
      </p>
      {matches.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300"
          title={`${m.homeTeam} vs ${m.awayTeam} — ${m.time} BRT`}
        >
          <span className="font-mono text-gray-400 dark:text-gray-500 tabular-nums shrink-0 w-10">
            {formatShortDate(m.date)}
          </span>
          <span className="font-bold text-green-700 dark:text-green-400 tabular-nums shrink-0 w-9">
            {m.time}
          </span>
          <span className="flex-1 truncate text-right">{m.homeFlag} {m.homeTeam}</span>
          <span className="text-gray-300 dark:text-gray-600 px-0.5">×</span>
          <span className="flex-1 truncate">{m.awayFlag} {m.awayTeam}</span>
        </div>
      ))}
    </div>
  );
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
      <GroupSchedule groupId={group.id} />
    </div>
  );
}
