/**
 * Mapa de chutes — campo inteiro com os dois times atacando gols opostos.
 *
 * Dados: `details.shots` (parseados do `commentary` da ESPN). As coordenadas da
 * ESPN são normalizadas para o gol atacado (x alto = perto do gol), então o
 * mandante ataca a direita (x como está) e o visitante a esquerda (espelhado em
 * x e y). Cores vêm das seleções de verdade (homeBrand/awayBrand da ESPN).
 */

import { useMemo, useState } from 'react';
import type { Shot, ShotResult } from '../hooks/useMatchDetails';

// Campo em unidades de viewBox (proporção ~ gramado FIFA).
const W = 100;
const H = 64;

const RESULTS: { key: ShotResult; label: string }[] = [
  { key: 'goal', label: 'Gol' },
  { key: 'saved', label: 'Defesa' },
  { key: 'off', label: 'Fora' },
  { key: 'blocked', label: 'Bloqueio' },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── Resolução de cor por time ────────────────────────────────────────────────
// A ESPN às vezes dá uma cor primária clara demais (ex.: Inglaterra "ffffff",
// invisível no campo) ou dois times com cores quase iguais. Escolhemos a 1ª cor
// legível e distinta entre os candidatos: primária → alternativa → fallback.
const FALLBACK_HOME = '2563eb'; // azul
const FALLBACK_AWAY = 'dc2626'; // vermelho
const EXTRA = ['f59e0b', 'a855f7', '0ea5e9']; // desempate p/ colisão

function normHex(c: string | null): string | null {
  if (!c) return null;
  const h = c.replace('#', '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(h)) return h.split('').map((d) => d + d).join('');
  return /^[0-9a-f]{6}$/.test(h) ? h : null;
}
const rgb = (h: string) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
const luminance = (h: string) => {
  const [r, g, b] = rgb(h);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const distance = (a: string, b: string) => {
  const [x, y, z] = rgb(a);
  const [p, q, r] = rgb(b);
  return Math.sqrt((x - p) ** 2 + (y - q) ** 2 + (z - r) ** 2);
};

/** 1ª cor legível (não clara demais) e distinta de `avoid` (hex sem #). */
function pickColor(cands: (string | null)[], avoid: string | null): string {
  for (const c of cands) {
    const h = normHex(c);
    if (h && luminance(h) <= 0.85 && (!avoid || distance(h, avoid) > 70)) return `#${h}`;
  }
  return `#${FALLBACK_HOME}`;
}

function periodLabel(p: number): string {
  if (p >= 3) return 'Prorrogação';
  return p === 2 ? '2º tempo' : '1º tempo';
}

/** Posição do chute no campo, já orientando o lado do time. */
function pos(s: Shot): { cx: number; cy: number } {
  const x = s.side === 'home' ? s.x : 100 - s.x;
  const y = s.side === 'home' ? s.y : 100 - s.y;
  return { cx: clamp((x / 100) * W, 3, W - 3), cy: clamp((y / 100) * H, 3, H - 3) };
}

/** Desenho do gramado (linhas, áreas, círculo central). */
function Pitch() {
  const line = { fill: 'none', stroke: 'rgba(255,255,255,0.55)', strokeWidth: 0.4 };
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill="#3a8f54" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={(i * W) / 6} y={0} width={W / 6} height={H} fill={i % 2 ? '#37864f' : '#3a8f54'} />
      ))}
      <rect x={1} y={1} width={W - 2} height={H - 2} {...line} />
      <line x1={W / 2} y1={1} x2={W / 2} y2={H - 1} {...line} />
      <circle cx={W / 2} cy={H / 2} r={8} {...line} />
      <circle cx={W / 2} cy={H / 2} r={0.6} fill="rgba(255,255,255,0.55)" />
      {/* áreas (esquerda / direita) */}
      <rect x={1} y={H / 2 - 18} width={15} height={36} {...line} />
      <rect x={W - 16} y={H / 2 - 18} width={15} height={36} {...line} />
      {/* pequenas áreas */}
      <rect x={1} y={H / 2 - 8} width={6} height={16} {...line} />
      <rect x={W - 7} y={H / 2 - 8} width={6} height={16} {...line} />
      {/* marcas do pênalti */}
      <circle cx={11} cy={H / 2} r={0.5} fill="rgba(255,255,255,0.55)" />
      <circle cx={W - 11} cy={H / 2} r={0.5} fill="rgba(255,255,255,0.55)" />
      {/* gols */}
      <rect x={-0.5} y={H / 2 - 4} width={1.5} height={8} fill="rgba(255,255,255,0.7)" />
      <rect x={W - 1} y={H / 2 - 4} width={1.5} height={8} fill="rgba(255,255,255,0.7)" />
    </g>
  );
}

/** Um marcador, com gramática visual por resultado (cor = time). */
function Marker({ s, color }: { s: Shot; color: string }) {
  const { cx, cy } = pos(s);
  const title = `${s.clock} ${s.player ?? ''} · ${RESULTS.find((r) => r.key === s.result)?.label}`.trim();
  // Posição no atributo SVG (externo); escala do hover via CSS (interno),
  // ancorada no próprio centro. Misturar os dois no mesmo <g> faria o CSS
  // sobrescrever o translate → o marcador "pula" e entra em loop de hover.
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g
        className="cursor-pointer transition-transform hover:scale-150"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <title>{title}</title>
        {/* halo branco p/ contraste em qualquer cor */}
        <circle r={3} fill="white" opacity={0.85} />
        {s.result === 'goal' && (
          <>
            <circle r={4.4} fill="none" stroke={color} strokeWidth={0.5} opacity={0.4} />
            <circle r={2.6} fill={color} stroke="white" strokeWidth={0.5} />
          </>
        )}
        {s.result === 'saved' && (
          <>
            <circle r={2.6} fill="none" stroke={color} strokeWidth={1} />
            <circle r={0.9} fill={color} />
          </>
        )}
        {s.result === 'off' && <circle r={2.4} fill="none" stroke={color} strokeWidth={1} />}
        {s.result === 'blocked' && (
          <>
            <circle r={2.4} fill="none" stroke={color} strokeWidth={1} />
            <line x1={-1.7} y1={-1.7} x2={1.7} y2={1.7} stroke={color} strokeWidth={1} />
          </>
        )}
      </g>
    </g>
  );
}

export function ShotMap({
  shots,
  homeName,
  awayName,
  homeColor,
  awayColor,
  homeAltColor,
  awayAltColor,
}: {
  shots: Shot[];
  homeName: string;
  awayName: string;
  homeColor: string | null;
  awayColor: string | null;
  homeAltColor: string | null;
  awayAltColor: string | null;
}) {
  const [period, setPeriod] = useState<number | 'all'>('all');
  const [player, setPlayer] = useState<string>('all');
  const [on, setOn] = useState<Record<ShotResult, boolean>>({ goal: true, saved: true, off: true, blocked: true });

  // Mandante resolve primeiro; visitante evita ficar parecido com o mandante.
  const home = pickColor([homeColor, homeAltColor, FALLBACK_HOME, ...EXTRA], null);
  const away = pickColor([awayColor, awayAltColor, FALLBACK_AWAY, ...EXTRA], home.slice(1));

  const periods = useMemo(() => [...new Set(shots.map((s) => s.period))].sort(), [shots]);
  const players = useMemo(
    () => [...new Set(shots.map((s) => s.player).filter((p): p is string => Boolean(p)))].sort(),
    [shots],
  );

  // Filtro por período/jogador (os chips de tipo entram depois, na renderização).
  const scoped = useMemo(
    () => shots.filter((s) => (period === 'all' || s.period === period) && (player === 'all' || s.player === player)),
    [shots, period, player],
  );
  const counts = useMemo(() => {
    const c: Record<ShotResult, number> = { goal: 0, saved: 0, off: 0, blocked: 0 };
    for (const s of scoped) c[s.result] += 1;
    return c;
  }, [scoped]);
  const visible = scoped.filter((s) => on[s.result]);

  const sel = 'rounded-md border-gray-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200';
  const tally = (side: 'home' | 'away') => {
    const t = scoped.filter((s) => s.side === side);
    return `${t.length} ${t.length === 1 ? 'chute' : 'chutes'} · ${t.filter((s) => s.result === 'goal' || s.result === 'saved').length} no gol`;
  };

  return (
    <div className="space-y-2">
      {/* mini-resumo por time */}
      <div className="flex items-center justify-between text-[10px] font-semibold">
        <span className="flex items-center gap-1 text-gray-700 dark:text-gray-200">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: home }} />
          {homeName} <span className="font-normal text-gray-400">{tally('home')}</span>
        </span>
        <span className="flex items-center gap-1 text-right text-gray-700 dark:text-gray-200">
          <span className="font-normal text-gray-400">{tally('away')}</span> {awayName}
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: away }} />
        </span>
      </div>

      {/* filtros */}
      <div className="flex flex-wrap gap-1.5">
        <select className={sel} value={String(period)} onChange={(e) => setPeriod(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
          <option value="all">Todos os tempos</option>
          {periods.map((p) => (
            <option key={p} value={p}>{periodLabel(p)}</option>
          ))}
        </select>
        <select className={sel} value={player} onChange={(e) => setPlayer(e.target.value)}>
          <option value="all">Todos os jogadores</option>
          {players.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* chips de tipo (toggle, com contagem) */}
      <div className="flex flex-wrap gap-1.5">
        {RESULTS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setOn((prev) => ({ ...prev, [r.key]: !prev[r.key] }))}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
              on[r.key]
                ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'bg-gray-100 text-gray-400 line-through dark:bg-gray-700 dark:text-gray-500'
            }`}
          >
            {r.label} {counts[r.key]}
          </button>
        ))}
      </div>

      {/* campo */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible rounded-lg" role="img" aria-label="Mapa de chutes">
        <Pitch />
        {visible.map((s, i) => (
          <Marker key={i} s={s} color={s.side === 'home' ? home : away} />
        ))}
      </svg>

      {visible.length === 0 && (
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">Nenhum chute para este filtro.</p>
      )}
    </div>
  );
}
