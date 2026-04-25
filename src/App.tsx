import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { GROUPS } from './data/groups';
import { Header } from './components/Header';
import { GroupGrid } from './components/GroupGrid';
import { TabNav } from './components/TabNav';
import { BracketView } from './components/BracketView';
import { TeamPage } from './components/TeamPage';
import { PlayerPage } from './components/PlayerPage';

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
  const isHome = location.pathname === '/';
  const isBracket = location.pathname === '/bracket';

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
        <Routes>
          <Route path="/" element={<GroupGrid groups={filteredGroups} />} />
          <Route path="/bracket" element={<BracketView />} />
          <Route path="/team/:slug" element={<TeamPage />} />
          <Route path="/player/:teamSlug/:playerNumber" element={<PlayerPage />} />
        </Routes>
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
