import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchPlayers } from '../utils/playerSearch';
import { playerAvatarUrl, positionGradient } from '../utils/playerStats';

export function PlayerSearchView() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchPlayers(query), [query]);

  const isEmpty = query.trim().length < 2;
  const noResults = !isEmpty && results.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Campo de busca */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, clube ou posição..."
          autoFocus
          className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition shadow-sm"
        />
      </div>

      {/* Estado: dica inicial */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🔍</span>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Digite ao menos 2 caracteres para buscar jogadores
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Você pode buscar por nome, clube ou posição
          </p>
        </div>
      )}

      {/* Estado: sem resultado */}
      {noResults && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">😕</span>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nenhum jogador encontrado para{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">"{query}"</span>
          </p>
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {results.length} jogador{results.length !== 1 ? 'es' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map(({ player, teamSlug, teamFlag }) => {
              const gradient = positionGradient(player.position);
              return (
                <Link
                  key={`${teamSlug}-${player.number}`}
                  to={`/player/${teamSlug}/${player.number}`}
                  state={{ player, teamSlug, teamFlag }}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:shadow-md hover:border-green-400 dark:hover:border-green-500 transition-all group"
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} overflow-hidden shrink-0 shadow`}>
                    <img
                      src={playerAvatarUrl(player.name)}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {player.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{player.club}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{player.position}</p>
                  </div>

                  {/* Flag + camisa */}
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-xl leading-none">{teamFlag}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">#{player.number}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
