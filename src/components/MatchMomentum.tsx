/**
 * Cronologia e Dinâmica do Jogo — gráfico de momentum minuto a minuto.
 *
 * Derivado do `commentary` da ESPN (a API não expõe win-probability p/ futebol):
 * cada lance ofensivo soma "pressão" ao seu time no minuto. Barra para cima =
 * mandante, para baixo = visitante. Gols (⚽) e substituições (↕) são sobrepostos
 * na linha de base. É uma aproximação visual do domínio, não um número oficial.
 */

import { ArrowUpDown } from 'lucide-react';
import type { MomentumBar } from '../hooks/useMatchDetails';

export interface MomentumMarker {
  minute: number;
  side: 'home' | 'away' | null;
  kind: 'goal' | 'sub';
}

/** Normaliza cor da ESPN ("ef4444") para CSS ("#ef4444"); cai num padrão. */
function color(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  return raw.startsWith('#') ? raw : `#${raw}`;
}

/** Sigla curta a partir do nome do time. */
function abbr(name: string): string {
  return name.slice(0, 3).toUpperCase();
}

export function MatchMomentum({
  bars,
  maxMinute,
  halftime,
  markers,
  homeName,
  awayName,
  homeColor,
  awayColor,
}: {
  bars: MomentumBar[];
  maxMinute: number;
  halftime: number;
  markers: MomentumMarker[];
  homeName: string;
  awayName: string;
  homeColor: string | null;
  awayColor: string | null;
}) {
  if (bars.length === 0) return null;

  const hColor = color(homeColor, '#ef4444'); // vermelho (mandante)
  const aColor = color(awayColor, '#374151'); // cinza-escuro (visitante)
  const maxW = Math.max(1, ...bars.map((b) => Math.max(b.home, b.away)));
  const span = Math.max(1, maxMinute);
  const pct = (minute: number) => (minute / span) * 100;
  const barW = Math.max(1.2, (100 / span) * 0.7); // largura % de cada barra

  return (
    <div className="space-y-2">
      {/* Legenda */}
      <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 dark:text-gray-300">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: hColor }} />
          {abbr(homeName)}
        </span>
        <span className="flex items-center gap-1.5">
          {abbr(awayName)}
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: aColor }} />
        </span>
      </div>

      {/* Gráfico */}
      <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800/60">
        {/* Linha de intervalo (INT) */}
        <span
          className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-300 dark:border-gray-600"
          style={{ left: `${pct(halftime)}%` }}
        />

        {/* Barras (centradas no minuto, p/ alinhar com os marcadores) */}
        {bars.map((b) => {
          const left = pct(b.minute) - barW / 2;
          return (
            <span key={b.minute}>
              {b.home > 0 && (
                <span
                  className="absolute rounded-t-sm"
                  style={{
                    left: `${left}%`,
                    width: `${barW}%`,
                    bottom: '50%',
                    height: `${(b.home / maxW) * 46}%`,
                    backgroundColor: hColor,
                  }}
                />
              )}
              {b.away > 0 && (
                <span
                  className="absolute rounded-b-sm"
                  style={{
                    left: `${left}%`,
                    width: `${barW}%`,
                    top: '50%',
                    height: `${(b.away / maxW) * 46}%`,
                    backgroundColor: aColor,
                  }}
                />
              )}
            </span>
          );
        })}

        {/* Linha de base */}
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-green-600" />

        {/* Marcadores: gols e substituições */}
        {markers.map((m, i) => {
          const offset = m.side === 'home' ? '-translate-y-[140%]' : m.side === 'away' ? 'translate-y-[40%]' : '-translate-y-1/2';
          return (
            <span
              key={`${m.kind}-${m.minute}-${i}`}
              className={`absolute top-1/2 -translate-x-1/2 ${offset}`}
              style={{ left: `${Math.min(100, pct(m.minute))}%` }}
              title={`${m.kind === 'goal' ? 'Gol' : 'Substituição'} aos ${m.minute}'`}
            >
              {m.kind === 'goal' ? (
                <span className="text-xs leading-none">⚽</span>
              ) : (
                <ArrowUpDown size={11} className="text-gray-500 dark:text-gray-400" />
              )}
            </span>
          );
        })}
      </div>

      {/* Eixo */}
      <div className="relative h-3 text-[9px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        <span className="absolute left-0">IN</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${pct(halftime)}%` }}>
          INT
        </span>
        <span className="absolute right-0">FIM</span>
      </div>
    </div>
  );
}
