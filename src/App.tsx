import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { GROUPS } from './data/groups';
import { Header } from './components/Header';
import { GroupGrid } from './components/GroupGrid';
import { TabNav } from './components/TabNav';

// Rotas carregadas sob demanda (code-splitting) → bundle inicial menor.
const StandingsView = lazy(() => import('./components/StandingsView').then((m) => ({ default: m.StandingsView })));
const BracketView = lazy(() => import('./components/BracketView').then((m) => ({ default: m.BracketView })));
const KnockoutView = lazy(() => import('./components/KnockoutView').then((m) => ({ default: m.KnockoutView })));
const TeamPage = lazy(() => import('./components/TeamPage').then((m) => ({ default: m.TeamPage })));
const PlayerPage = lazy(() => import('./components/PlayerPage').then((m) => ({ default: m.PlayerPage })));
const GamesView = lazy(() => import('./components/GamesView').then((m) => ({ default: m.GamesView })));
const PlayerSearchView = lazy(() => import('./components/PlayerSearchView').then((m) => ({ default: m.PlayerSearchView })));
const RankingsView = lazy(() => import('./components/RankingsView').then((m) => ({ default: m.RankingsView })));
const PlayerComparatorView = lazy(() => import('./components/PlayerComparatorView').then((m) => ({ default: m.PlayerComparatorView })));
const MyTeamView = lazy(() => import('./components/MyTeamView').then((m) => ({ default: m.MyTeamView })));
const NewsView = lazy(() => import('./components/NewsView').then((m) => ({ default: m.NewsView })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
    </div>
  );
}

function SearchBar({ query, onChange }: { query: string; onChange: (v: string) => void }) {
  return (
    <div className="px-4 md:px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar seleção..."
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        />
      </div>
    </div>
  );
}

function AppRoutes() {
  const [query, setQuery] = useState('');
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/grupos';
  const isBracket = location.pathname === '/bracket' || location.pathname === '/knockout';

  const filteredGroups = query.trim()
    ? GROUPS.filter((g) =>
        g.teams.some((t) =>
          t.name.toLowerCase().includes(query.toLowerCase())
        )
      )
    : GROUPS;

  return (
    <>
      {isHome && <SearchBar query={query} onChange={setQuery} />}
      <main className={isBracket ? 'w-full' : 'max-w-7xl mx-auto'}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="grupos" replace />} />
            <Route path="/grupos" element={<GroupGrid groups={filteredGroups} />} />
            <Route path="/classificacao" element={<StandingsView />} />
            <Route path="/bracket" element={<BracketView />} />
            <Route path="/knockout" element={<KnockoutView />} />
            <Route path="/jogos" element={<GamesView />} />
            <Route path="/noticias" element={<NewsView />} />
            <Route path="/busca" element={<PlayerSearchView />} />
            <Route path="/destaques" element={<RankingsView />} />
            <Route path="/comparar" element={<PlayerComparatorView />} />
            <Route path="/minha-selecao" element={<MyTeamView />} />
            <Route path="/team/:slug" element={<TeamPage />} />
            <Route path="/player/:teamSlug/:playerNumber" element={<PlayerPage />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <TabNav />
      <AppRoutes />
    </div>
  );
}

export default App;
