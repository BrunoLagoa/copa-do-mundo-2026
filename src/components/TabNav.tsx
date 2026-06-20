import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/grupos',        label: 'Grupos' },
  { to: '/classificacao', label: 'Classificação' },
  { to: '/knockout',      label: 'Eliminatórias' },
  { to: '/bracket',       label: 'Simulador' },
  { to: '/jogos',         label: 'Jogos' },
  { to: '/team/brasil',   label: '🇧🇷 Brasil' },
  { to: '/noticias',      label: 'Notícias' },
  { to: '/busca',         label: 'Busca' },
  { to: '/destaques',     label: 'Destaques' },
  { to: '/comparar',      label: 'Comparar' },
  { to: '/minha-selecao', label: 'Minha Seleção' },
];

export function TabNav() {
  const base =
    'whitespace-nowrap px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 shrink-0';
  const active   = 'bg-green-600 text-white shadow-sm';
  const inactive = 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700';

  return (
    <nav className="flex gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-none">
      {TABS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
