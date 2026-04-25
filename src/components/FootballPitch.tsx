import type { Formation, Player } from '../types';

// ─── Formation layout ────────────────────────────────────────────────────────

function parseFormation(formation: Formation): number[] {
  return formation.split('-').map(Number);
}

// ─── Player selection ────────────────────────────────────────────────────────

interface StartingEleven {
  goalkeeper: Player;
  lines: Player[][];
}

function pickStartingEleven(players: Player[], formation: Formation): StartingEleven | null {
  const goalkeeper = players.find(p => p.position === 'Goleiro');
  if (!goalkeeper) return null;

  const lineCounts = parseFormation(formation);

  const byPos: Record<string, Player[]> = {
    Defensor: players.filter(p => p.position === 'Defensor'),
    'Meio-campista': players.filter(p => p.position === 'Meio-campista'),
    Atacante: players.filter(p => p.position === 'Atacante'),
  };

  // line[0] = Defensor, last line = Atacante, rest = Meio-campista
  const lines: Player[][] = lineCounts.map((count, i) => {
    let pos: Player['position'];
    if (i === 0) pos = 'Defensor';
    else if (i === lineCounts.length - 1) pos = 'Atacante';
    else pos = 'Meio-campista';
    return byPos[pos].splice(0, count);
  });

  return { goalkeeper, lines };
}

// ─── Coordinate helpers ──────────────────────────────────────────────────────
// SVG viewBox: 0 0 400 580
// Pitch boundary: x: 15..385, y: 10..570
//
// Vertical layout (top = GK side, bottom = attacking end — perspective makes
// top look "far away" and bottom look "close"):
//   GK         y ≈  48   (inside own goal area, top)
//   Defenders  y ≈ 155
//   Midfield   distributed between 240 and 360 depending on formation depth
//   Attackers  y ≈ 450
//
// Horizontal: equal spacing within x: 35..365

const VW = 400;
const GK_Y   = 52;
const DEF_Y  = 158;
const ATK_Y  = 455;
const MID_TOP = 248;
const MID_BOT = 370;

function xPositions(count: number): number[] {
  const left = 35;
  const right = 365;
  if (count === 1) return [VW / 2];
  const step = (right - left) / (count - 1);
  return Array.from({ length: count }, (_, i) => left + i * step);
}

function midY(lineIdx: number, totalMidLines: number): number {
  if (totalMidLines === 1) return (MID_TOP + MID_BOT) / 2;
  const step = (MID_BOT - MID_TOP) / (totalMidLines - 1);
  return MID_TOP + lineIdx * step;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  players: Player[];
  formation: Formation;
  teamName: string;
  teamSlug?: string;
  onPlayerClick?: (player: Player) => void;
}

export default function FootballPitch({ players, formation, teamName, onPlayerClick }: Props) {
  const result = pickStartingEleven(players, formation);

  if (!result) {
    return (
      <div className="text-center text-amber-400 text-sm py-4">
        Dados de elenco insuficientes para exibir a formação.
      </div>
    );
  }

  const { goalkeeper, lines } = result;

  // lines[0] = defense, lines[last] = attack, rest = midfield
  const defLine   = lines[0]   ?? [];
  const atkLine   = lines[lines.length - 1] ?? [];
  const midLines  = lines.slice(1, -1);

  interface PositionedPlayer {
    player: Player;
    x: number;
    y: number;
    delay: number;
    isGK: boolean;
  }

  const positioned: PositionedPlayer[] = [];
  let di = 0;

  // GK
  positioned.push({ player: goalkeeper, x: VW / 2, y: GK_Y, delay: di++ * 70, isGK: true });

  // Defenders
  xPositions(defLine.length).forEach((x, i) => {
    positioned.push({ player: defLine[i], x, y: DEF_Y, delay: di++ * 70, isGK: false });
  });

  // Midfield lines
  midLines.forEach((line, li) => {
    const y = midY(li, midLines.length);
    xPositions(line.length).forEach((x, i) => {
      positioned.push({ player: line[i], x, y, delay: di++ * 70, isGK: false });
    });
  });

  // Attackers
  xPositions(atkLine.length).forEach((x, i) => {
    positioned.push({ player: atkLine[i], x, y: ATK_Y, delay: di++ * 70, isGK: false });
  });

  // ── Derived sizes based on Y (perspective: closer = larger) ──
  // y range: 48 (far/small) → 455 (near/large)
  function circleR(y: number)   { return 11 + ((y - GK_Y) / (ATK_Y - GK_Y)) * 5; }  // 11..16
  function fontSize(y: number)  { return 9  + ((y - GK_Y) / (ATK_Y - GK_Y)) * 3; }  // 9..12
  function labelSize(y: number) { return 8  + ((y - GK_Y) / (ATK_Y - GK_Y)) * 2; }  // 8..10
  function shadowRx(y: number)  { return circleR(y) * 1.1; }
  function shadowRy(y: number)  { return circleR(y) * 0.35; }

  // Grass stripe count — more stripes toward bottom (perspective)
  const STRIPES = 14;

  return (
    <section aria-label={`Formação ${formation} — ${teamName}`} className="w-full max-w-sm mx-auto select-none">
      <h2 className="text-center text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">
        Formação · <span className="text-white">{formation}</span>
      </h2>

      <style>{`
        @keyframes pitchPop {
          0%   { opacity: 0; transform: scale(0.4) translateY(6px); }
          70%  { transform: scale(1.1) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .pitch-player {
          animation: pitchPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .pitch-player.clickable:hover .player-hover-ring {
          opacity: 1;
        }
        .pitch-player.clickable {
          cursor: pointer;
        }
      `}</style>

      {/* 3-D perspective wrapper */}
      <div
        style={{
          perspective: '700px',
          perspectiveOrigin: '50% 10%',
        }}
      >
        <div
          style={{
            transform: 'rotateX(28deg)',
            transformOrigin: '50% 0%',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <svg
            viewBox={`0 0 ${VW} 520`}
            className="w-full block"
            role="img"
            aria-label={`Campo de futebol com formação ${formation}`}
          >
            <defs>
              {/* Grass gradient — darker at top (far), lighter at bottom (near) */}
              <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#1e5c1e" />
                <stop offset="50%"  stopColor="#2d7a2d" />
                <stop offset="100%" stopColor="#3a9c3a" />
              </linearGradient>

              {/* Spotlight vignette */}
              <radialGradient id="vignette" cx="50%" cy="55%" r="65%">
                <stop offset="0%"   stopColor="rgba(255,255,255,0.07)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
              </radialGradient>

              {/* Player circle gradients */}
              <radialGradient id="gkGrad" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
              <radialGradient id="playerGrad" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </radialGradient>
            </defs>

            {/* ── Base grass ── */}
            <rect x={0} y={0} width={VW} height={520} fill="url(#grassGrad)" />

            {/* ── Alternating grass stripes ── */}
            {Array.from({ length: STRIPES }).map((_, i) => {
              const stripeH = 520 / STRIPES;
              return i % 2 === 0 ? null : (
                <rect
                  key={i}
                  x={0} y={i * stripeH}
                  width={VW} height={stripeH}
                  fill="rgba(0,0,0,0.06)"
                />
              );
            })}

            {/* ── Vignette overlay ── */}
            <rect x={0} y={0} width={VW} height={520} fill="url(#vignette)" />

            {/* ── Pitch markings ── */}
            <g stroke="rgba(255,255,255,0.75)" strokeWidth={1.8} fill="none">
              {/* Boundary */}
              <rect x={15} y={10} width={370} height={500} />

              {/* Halfway line */}
              <line x1={15} y1={260} x2={385} y2={260} />

              {/* Centre circle */}
              <circle cx={200} cy={260} r={52} />
              <circle cx={200} cy={260} r={2.5} fill="rgba(255,255,255,0.75)" stroke="none" />

              {/* Penalty area — top */}
              <rect x={95} y={10} width={210} height={82} />
              {/* Goal area — top */}
              <rect x={148} y={10} width={104} height={34} />
              {/* Penalty spot — top */}
              <circle cx={200} cy={70} r={2.5} fill="rgba(255,255,255,0.75)" stroke="none" />
              {/* Penalty arc — top */}
              <path d="M 150 92 A 52 52 0 0 1 250 92" strokeWidth={1.5} />

              {/* Penalty area — bottom */}
              <rect x={95} y={428} width={210} height={82} />
              {/* Goal area — bottom */}
              <rect x={148} y={476} width={104} height={34} />
              {/* Penalty spot — bottom */}
              <circle cx={200} cy={450} r={2.5} fill="rgba(255,255,255,0.75)" stroke="none" />
              {/* Penalty arc — bottom */}
              <path d="M 150 428 A 52 52 0 0 0 250 428" strokeWidth={1.5} />

              {/* Corner arcs */}
              <path d="M 15 28 A 18 18 0 0 1 33 10" />
              <path d="M 367 10 A 18 18 0 0 1 385 28" />
              <path d="M 15 492 A 18 18 0 0 0 33 510" />
              <path d="M 385 492 A 18 18 0 0 1 367 510" />
            </g>

            {/* ── Goal nets (simple rectangles) ── */}
            <rect x={155} y={2} width={90} height={12} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
            <rect x={155} y={506} width={90} height={12} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />

            {/* ── Players ── */}
            {positioned.map(({ player, x, y, delay, isGK }) => {
              const r  = circleR(y);
              const fs = fontSize(y);
              const ls = labelSize(y);
              const sx = shadowRx(y);
              const sy = shadowRy(y);
              const lastName = player.name.split(' ').pop() ?? player.name;

              return (
                <g
                  key={player.number}
                  className={`pitch-player${onPlayerClick ? ' clickable' : ''}`}
                  style={{ animationDelay: `${delay}ms` }}
                  onClick={() => onPlayerClick?.(player)}
                  role={onPlayerClick ? 'button' : undefined}
                  aria-label={onPlayerClick ? player.name : undefined}
                >
                  {/* Hover ring */}
                  <circle
                    className="player-hover-ring"
                    cx={x} cy={y} r={r + 6}
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth={2}
                    opacity={0}
                    style={{ transition: 'opacity 0.15s' }}
                  />
                  {/* Drop shadow */}
                  <ellipse cx={x} cy={y + r + 2} rx={sx} ry={sy} fill="rgba(0,0,0,0.35)" />
                  {/* Circle */}
                  <circle
                    cx={x} cy={y} r={r}
                    fill={isGK ? 'url(#gkGrad)' : 'url(#playerGrad)'}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={1.5}
                  />
                  {/* Highlight gloss */}
                  <ellipse
                    cx={x - r * 0.22} cy={y - r * 0.3}
                    rx={r * 0.38} ry={r * 0.22}
                    fill="rgba(255,255,255,0.28)"
                  />
                  {/* Number */}
                  <text
                    x={x} y={y + 0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fs}
                    fontWeight="800"
                    fill="white"
                    fontFamily="system-ui, sans-serif"
                  >
                    {player.number}
                  </text>
                  {/* Name label */}
                  <text
                    x={x} y={y + r + 5}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fontSize={ls}
                    fontWeight="600"
                    fill="white"
                    fontFamily="system-ui, sans-serif"
                    opacity={0.92}
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}
                  >
                    {lastName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500 mt-2">
        11 titulares projetados · primeiros por posição
      </p>
    </section>
  );
}
