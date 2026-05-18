import { NavLink } from 'react-router-dom';

export function TabNav() {
  const base =
    'px-6 py-2.5 text-sm font-semibold rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500';
  const active = 'bg-green-600 text-white shadow-sm';
  const inactive = 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700';

  return (
    <nav className="flex gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <NavLink
        to="/grupos"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        Grupos
      </NavLink>
      <NavLink
        to="/knockout"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        Eliminatórias
      </NavLink>
      <NavLink
        to="/bracket"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        Simulador
      </NavLink>
      <NavLink
        to="/jogos"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        Jogos
      </NavLink>
      <NavLink
        to="/team/brasil"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        🇧🇷 Brasil
      </NavLink>
      <NavLink
        to="/busca"
        className={({ isActive }) => `${base} ${isActive ? active : inactive} whitespace-nowrap`}
      >
        Busca
      </NavLink>
      <NavLink
        to="/destaques"
        className={({ isActive }) => `${base} ${isActive ? active : inactive} whitespace-nowrap`}
      >
        Destaques
      </NavLink>
      <NavLink
        to="/comparar"
        className={({ isActive }) => `${base} ${isActive ? active : inactive} whitespace-nowrap`}
      >
        Comparar
      </NavLink>
      <NavLink
        to="/minha-selecao"
        className={({ isActive }) => `${base} ${isActive ? active : inactive} whitespace-nowrap`}
      >
        Minha Seleção
      </NavLink>
    </nav>
  );
}
