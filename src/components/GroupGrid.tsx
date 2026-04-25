import type { Group } from '../types';
import { GroupCard } from './GroupCard';

interface GroupGridProps {
  groups: Group[];
}

export function GroupGrid({ groups }: GroupGridProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4 md:p-6">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </section>
  );
}
