import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import {
  ThemeToggler,
  type ThemeSelection,
  type Resolved,
} from './animate-ui/effects/theme-toggler';

export function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <header className="bg-green-700 dark:bg-green-900 text-white py-10 px-4 relative">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
          Copa do Mundo 2026
        </h1>
        <p className="text-green-200 text-sm md:text-base">
          11 de junho – 19 de julho &bull; Estados Unidos, Canadá e México
        </p>
      </div>

      {/* Theme toggle — top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggler
          theme={(theme ?? 'light') as ThemeSelection}
          resolvedTheme={(resolvedTheme ?? 'light') as Resolved}
          setTheme={setTheme as (t: ThemeSelection) => void}
          direction="ttb"
        >
          {({ resolved, toggleTheme }) => {
            const isDark = resolved === 'dark';
            return (
              <button
                onClick={() => toggleTheme(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {/* mostra o ícone do tema atual: sol = light, lua = dark */}
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            );
          }}
        </ThemeToggler>
      </div>
    </header>
  );
}
