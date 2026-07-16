import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import {
  ThemeToggler,
  type ThemeSelection,
  type Resolved,
} from './animate-ui/effects/theme-toggler';
import { useLiveScores } from '../hooks/useLiveScores';
import { useKnockoutBracket } from '../hooks/useKnockoutBracket';
import { FinalCountdown } from './FinalCountdown';

/** Países-sede, exibidos como chips com bandeira. */
const HOSTS = [
  { flag: '🇺🇸', name: 'EUA' },
  { flag: '🇨🇦', name: 'Canadá' },
  { flag: '🇲🇽', name: 'México' },
];

/** Fatos do torneio (estáticos) — chips de contexto. */
const STATS = ['48 seleções', '104 jogos', '16 sedes'];

export function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Jogos ao vivo vêm de duas fontes: fase de grupos (useLiveScores) e
  // mata-mata (useKnockoutBracket, pois o useLiveScores ignora os fixtures
  // com slugs placeholder das eliminatórias). Somamos as duas contagens.
  const groups = useLiveScores();
  const knockout = useKnockoutBracket();
  const liveCount = groups.liveCount + knockout.liveCount;
  const available = groups.available || knockout.available;

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-700 to-green-800 text-white dark:from-emerald-950 dark:via-green-950 dark:to-gray-950">
      {/* textura de pontos sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        aria-hidden
      />
      {/* brilho radial suave no topo */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[120%] -translate-x-1/2 -translate-y-1/3 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />

      {/* selo "ao vivo" — só quando há jogo rolando; leva para /jogos */}
      {available && liveCount > 0 && (
        <Link
          to="/jogos"
          aria-label={`${liveCount} ${liveCount === 1 ? 'jogo ao vivo' : 'jogos ao vivo'} — ver jogos`}
          className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold shadow-lg shadow-red-900/30 ring-1 ring-white/20 transition-transform hover:scale-105 hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          {liveCount} ao vivo
        </Link>
      )}

      {/* toggle de tema (canto superior direito) */}
      <div className="absolute right-4 top-4 z-10">
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
                className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
              >
                {/* mostra o ícone do tema atual: sol = light, lua = dark */}
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            );
          }}
        </ThemeToggler>
      </div>

      {/* conteúdo centralizado */}
      <div className="relative mx-auto max-w-4xl px-4 py-9 text-center sm:py-11">
        {/* kicker */}
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <span className="h-px w-6 bg-amber-300/50" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300 sm:text-xs">
            FIFA World Cup
          </span>
          <span className="h-px w-6 bg-amber-300/50" />
        </div>

        {/* título */}
        <h1 className="text-3xl font-black tracking-tight drop-shadow-sm sm:text-4xl md:text-5xl">
          Copa do Mundo 2026
        </h1>

        {/* período */}
        <p className="mt-2 text-sm font-medium text-green-100/90 sm:text-base">
          11 de junho – 19 de julho
        </p>

        {/* chips dos anfitriões */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {HOSTS.map((h) => (
            <span
              key={h.name}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-white/15"
            >
              <span aria-hidden>{h.flag}</span>
              {h.name}
            </span>
          ))}
        </div>

        {/* estatísticas */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {STATS.map((s) => (
            <span
              key={s}
              className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-green-100/80 ring-1 ring-white/10"
            >
              {s}
            </span>
          ))}
        </div>

        {/* contagem regressiva até o apito inicial da final */}
        <FinalCountdown />
      </div>

      {/* linha dourada (acento de campeonato) */}
      <div className="h-[3px] w-full bg-gradient-to-r from-amber-400/0 via-amber-400 to-amber-400/0" aria-hidden />
    </header>
  );
}
