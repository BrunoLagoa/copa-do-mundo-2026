import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TEAMS_BY_SLUG } from '../data/teams';
import type { Player } from '../types';
import FootballPitch from './FootballPitch';
import PlayerModal from './PlayerModal';

export function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const team = slug ? TEAMS_BY_SLUG[slug] : undefined;
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  if (!team) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-lg">Seleção não encontrada.</p>
        <Link to="/" className="mt-4 inline-block text-green-600 hover:underline text-sm font-medium">
          ← Voltar para os grupos
        </Link>
      </div>
    );
  }

  const resultColors: Record<string, string> = {
    V: 'bg-green-100 text-green-800',
    E: 'bg-yellow-100 text-yellow-800',
    D: 'bg-red-100 text-red-800',
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
      {/* disclaimer */}
      <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
        Dados projetados — elencos e jogos são estimativas sujeitas a alteração.
      </div>

      {/* back */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline mb-4">
        ← Voltar para os grupos
      </Link>

      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-5xl leading-none">{team.team.flag}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{team.team.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Grupo {team.groupId} · {team.confederation} · Técnico: {team.coach}
          </p>
        </div>
        {team.team.isHost && (
          <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">
            País Anfitrião
          </span>
        )}
      </div>

      {/* formation pitch */}
      <div className="mb-20 bg-[#f9fafb] dark:bg-[#121728] rounded-xl p-4 sm:p-6">
        <FootballPitch
          players={team.players}
          formation={team.formation}
          teamName={team.team.name}
          teamSlug={team.slug}
          onPlayerClick={(p) => setSelectedPlayer(p)}
        />
      </div>

      {/* player modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          teamSlug={team.slug}
          teamFlag={team.team.flag}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* squad */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Elenco</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left w-10">#</th>
                <th className="px-3 py-2 text-left">Jogador</th>
                <th className="px-3 py-2 text-left hidden sm:table-cell">Posição</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Clube</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {team.players.map((p) => (
                <tr
                  key={p.number}
                  onClick={() => setSelectedPlayer(p)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2 text-gray-400 dark:text-gray-500 font-mono">{p.number}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{p.name}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{p.position}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden md:table-cell">{p.club}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* games */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Jogos</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Fase</th>
                <th className="px-3 py-2 text-left">Adversário</th>
                <th className="px-3 py-2 text-left hidden sm:table-cell">Data</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Local</th>
                <th className="px-3 py-2 text-center">Placar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {team.games.map((g, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{g.round}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                    <span className="mr-1">{g.opponentFlag}</span>
                    {g.opponent}
                  </td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{g.date}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden md:table-cell">{g.city}</td>
                  <td className="px-3 py-2 text-center">
                    {g.score ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          g.result ? resultColors[g.result] ?? '' : ''
                        }`}
                      >
                        {g.score}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
