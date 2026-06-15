import { useState, useRef } from 'react';
import type { Formation } from '../types';

// ─── Pitch player model (fonte-agnóstico: ESPN ou elenco local) ──────────────

export type PitchPosGroup = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface PitchPlayer {
  number: number;
  name: string;
  posGroup: PitchPosGroup;
  photo?: string | null;
}

// ─── Formation layout ────────────────────────────────────────────────────────

function parseFormation(formation: Formation | string): number[] {
  return formation.split('-').map(Number);
}

// ─── Player selection ────────────────────────────────────────────────────────

export interface StartingEleven {
  goalkeeper: PitchPlayer;
  lines: PitchPlayer[][];   // lines[0] = defesa … lines[last] = ataque
}

function pickStartingEleven(players: PitchPlayer[], formation: Formation | string): StartingEleven | null {
  const goalkeeper = players.find(p => p.posGroup === 'GK');
  if (!goalkeeper) return null;

  const lineCounts = parseFormation(formation);

  const byPos: Record<PitchPosGroup, PitchPlayer[]> = {
    GK: [],
    DEF: players.filter(p => p.posGroup === 'DEF'),
    MID: players.filter(p => p.posGroup === 'MID'),
    FWD: players.filter(p => p.posGroup === 'FWD'),
  };

  // line[0] = defesa, última = ataque, demais = meio-campo
  const lines: PitchPlayer[][] = lineCounts.map((count, i) => {
    const key: PitchPosGroup = i === 0 ? 'DEF' : i === lineCounts.length - 1 ? 'FWD' : 'MID';
    return byPos[key].splice(0, count);
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
  /** Escalação heurística (por elenco). Ignorado quando `lineup` é fornecido. */
  players?: PitchPlayer[];
  /** Escalação explícita pré-montada (ex. XI real da ESPN) — tem prioridade. */
  lineup?: StartingEleven | null;
  formation: Formation | string;
  teamName: string;
  teamColor?: string | null;       // hex sem '#', ex. "d42339"
  teamAltColor?: string | null;
  onPlayerClick?: (player: PitchPlayer) => void;
}

/** Normaliza cor hex (com/sem '#') → "#rrggbb" ou null. */
function normHex(c?: string | null): string | null {
  if (!c) return null;
  const h = c.replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h}` : null;
}

// ── Drag state interface (outside component to avoid re-declaration) ──────────
interface DragState {
  playerNumber: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
}

export default function FootballPitch({ players, lineup, formation, teamName, teamColor, teamAltColor, onPlayerClick }: Props) {
  // ── Drag & Drop state (hooks MUST be before any early return) ────────────────
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [overrides, setOverrides] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [draggingPlayer, setDraggingPlayer] = useState<number | null>(null);
  // Fotos que falharam ao carregar → caem para a bolinha numerada.
  const [photoErrors, setPhotoErrors] = useState<Set<number>>(new Set());

  const outfieldColor = normHex(teamColor) ?? '#1e3a8a';
  const gkColor = normHex(teamAltColor) ?? '#b45309';
  // Track the last rendered formation to detect changes and flush overrides.
  const [activeFormation, setActiveFormation] = useState<string>(formation);
  if (activeFormation !== formation) {
    setActiveFormation(formation);
    setOverrides(new Map());
  }

  // Escalação explícita (XI real) tem prioridade; senão, heurística por elenco.
  const result = lineup ?? pickStartingEleven(players ?? [], formation);

  if (!result) {
    return (
      <div className="text-center text-amber-400 text-sm py-4">
        Dados de elenco insuficientes para exibir a formação.
      </div>
    );
  }

  const { goalkeeper, lines } = result;

  const VIEWBOX_W = VW;   // 400
  const VIEWBOX_H = 520;
  const PITCH_X_MIN = 15, PITCH_X_MAX = 385;
  const PITCH_Y_MIN = 10, PITCH_Y_MAX = 510;

  function clampCoords(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(PITCH_X_MIN, Math.min(PITCH_X_MAX, x)),
      y: Math.max(PITCH_Y_MIN, Math.min(PITCH_Y_MAX, y)),
    };
  }

  // Convert a screen-space delta (pixels) to SVG viewBox units.
  // Uses getBoundingClientRect() on the SVG element — unaffected by CSS 3D
  // transforms on ancestor elements (rotateX, perspective, etc.).
  function screenDeltaToSVG(dx: number, dy: number): { dx: number; dy: number } {
    const rect = svgRef.current!.getBoundingClientRect();
    const scaleX = VIEWBOX_W / rect.width;
    const scaleY = VIEWBOX_H / rect.height;
    return { dx: dx * scaleX, dy: dy * scaleY };
  }

  function handlePointerDown(e: React.PointerEvent, playerNumber: number, px: number, py: number) {
    e.stopPropagation();
    dragRef.current = {
      playerNumber,
      offsetX: e.clientX,   // last known clientX (updated each move for delta tracking)
      offsetY: e.clientY,   // last known clientY
      startX: e.clientX,    // fixed — for click-vs-drag detection
      startY: e.clientY,
    };
    // Seed the override map with the player's current SVG position so the first
    // move delta has a valid base to add to.
    setOverrides(prev => {
      if (prev.has(playerNumber)) return prev; // already overridden, keep it
      return new Map(prev).set(playerNumber, { x: px, y: py });
    });
    setDraggingPlayer(playerNumber);
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const { playerNumber, offsetX, offsetY } = dragRef.current;

    const screenDx = e.clientX - offsetX;
    const screenDy = e.clientY - offsetY;
    const { dx, dy } = screenDeltaToSVG(screenDx, screenDy);

    // Update last position for next delta
    dragRef.current.offsetX = e.clientX;
    dragRef.current.offsetY = e.clientY;

    setOverrides(prev => {
      const current = prev.get(playerNumber);
      // current position comes from the override map; if not set yet, we need
      // the original position — but we don't have it here. We store it on pointerDown.
      if (!current) return prev;
      return new Map(prev).set(playerNumber, clampCoords(current.x + dx, current.y + dy));
    });
  }

  function handlePointerUp(e: React.PointerEvent, playerNumber: number, player: PitchPlayer) {
    if (!dragRef.current || dragRef.current.playerNumber !== playerNumber) return;
    const totalDx = e.clientX - dragRef.current.startX;
    const totalDy = e.clientY - dragRef.current.startY;
    const dist = Math.hypot(totalDx, totalDy);
    dragRef.current = null;
    setDraggingPlayer(null);
    const CLICK_THRESHOLD = e.pointerType === 'touch' ? 10 : 5;
    if (dist < CLICK_THRESHOLD) {
      onPlayerClick?.(player);
    }
  }

  // lines[0] = defense, lines[last] = attack, rest = midfield
  const defLine   = lines[0]   ?? [];
  const atkLine   = lines[lines.length - 1] ?? [];
  const midLines  = lines.slice(1, -1);

  interface PositionedPlayer {
    player: PitchPlayer;
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
      <h2 className="text-center text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
        Formação · <span className="text-gray-900 dark:text-white">{formation}</span>
      </h2>

        <style>{`
        @keyframes pitchPop {
          0%   { opacity: 0; scale: 0.4; translate: 0 6px; }
          70%  { scale: 1.1; translate: 0 -2px; }
          100% { opacity: 1; scale: 1; translate: 0 0; }
        }
        .pitch-player {
          animation: pitchPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .pitch-player.clickable:hover .player-hover-ring {
          opacity: 1;
        }
        .pitch-player.clickable {
          cursor: grab;
        }
        .pitch-player.dragging {
          cursor: grabbing;
        }
      `}</style>

      {/* 3-D perspective wrapper — paddingBottom compensa o overflow visual do rotateX */}
      <div
        style={{
          perspective: '700px',
          perspectiveOrigin: '50% 10%',
          paddingBottom: '4rem',
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
            ref={svgRef}
            viewBox={`0 0 ${VW} 520`}
            className="w-full block"
            role="img"
            aria-label={`Campo de futebol com formação ${formation}`}
            style={{ touchAction: 'none' }}
            onPointerMove={handlePointerMove}
            onPointerUp={e => {
              if (dragRef.current) {
                const player = positioned.find(p => p.player.number === dragRef.current!.playerNumber)?.player;
                if (player) handlePointerUp(e, dragRef.current.playerNumber, player);
              }
            }}
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

              {/* Sombreado esférico — aplicado sobre a cor sólida do time (3-D em qualquer cor) */}
              <radialGradient id="sphereShade" cx="38%" cy="28%" r="75%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="45%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
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
            {positioned.map(({ player, x: ox, y: oy, delay, isGK }) => {
              const override = overrides.get(player.number);
              const px = override?.x ?? ox;
              const py = override?.y ?? oy;
              const isDragging = draggingPlayer === player.number;

              const r  = circleR(py);
              const fs = fontSize(py);
              const ls = labelSize(py);
              const sx = shadowRx(py);
              const sy = shadowRy(py);
              const lastName = player.name.split(' ').pop() ?? player.name;

              // Formation-change transition: smooth slide to new position.
              // Disabled while dragging to avoid lag. Stagger = delay * 0.5ms.
              const transitionStyle = isDragging
                ? undefined
                : {
                    transition: `transform 420ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    transitionDelay: `${delay * 0.5}ms`,
                  };

              return (
                <g
                  key={player.number}
                  className={`pitch-player${onPlayerClick ? ' clickable' : ''}${isDragging ? ' dragging' : ''}`}
                  style={{
                    transform: `translate(${px}px, ${py}px)`,
                    animationDelay: `${delay}ms`,
                    ...transitionStyle,
                  }}
                  role={onPlayerClick ? 'button' : undefined}
                  aria-label={onPlayerClick ? player.name : undefined}
                  onPointerDown={e => handlePointerDown(e, player.number, px, py)}
                >
                  {/* Hover ring — centred at (0,0) in group space */}
                  <circle
                    className="player-hover-ring"
                    cx={0} cy={0} r={r + 6}
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth={2}
                    opacity={0}
                    style={{ transition: 'opacity 0.15s' }}
                  />
                  {/* Drop shadow */}
                  <ellipse cx={0} cy={r + 2} rx={sx} ry={sy} fill="rgba(0,0,0,0.35)" />

                  {(() => {
                    const showPhoto = Boolean(player.photo) && !photoErrors.has(player.number);
                    if (showPhoto) {
                      const ir = r - 1.2;
                      const badgeR = r * 0.5;
                      const bx = r * 0.62, by = r * 0.62;
                      return (
                        <>
                          {/* Aro com a cor do time */}
                          <circle cx={0} cy={0} r={r} fill={isGK ? gkColor : outfieldColor} stroke="rgba(255,255,255,0.95)" strokeWidth={1.6} />
                          {/* Foto recortada em círculo */}
                          <clipPath id={`pc-${player.number}`}>
                            <circle cx={0} cy={0} r={ir} />
                          </clipPath>
                          <image
                            href={player.photo as string}
                            x={-ir} y={-ir} width={ir * 2} height={ir * 2}
                            clipPath={`url(#pc-${player.number})`}
                            preserveAspectRatio="xMidYMid slice"
                            onError={() => setPhotoErrors(prev => new Set(prev).add(player.number))}
                          />
                          {/* Selo com o número */}
                          <circle cx={bx} cy={by} r={badgeR} fill={isGK ? gkColor : outfieldColor} stroke="white" strokeWidth={0.8} />
                          <text
                            x={bx} y={by + 0.4}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize={badgeR * 1.15} fontWeight="800" fill="white"
                            fontFamily="system-ui, sans-serif"
                          >
                            {player.number}
                          </text>
                        </>
                      );
                    }
                    return (
                      <>
                        {/* Bolinha numerada (cor do time + sombreado esférico) */}
                        <circle cx={0} cy={0} r={r} fill={isGK ? gkColor : outfieldColor} stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} />
                        <circle cx={0} cy={0} r={r} fill="url(#sphereShade)" />
                        <text
                          x={0} y={0.5}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={fs} fontWeight="800" fill="white"
                          fontFamily="system-ui, sans-serif"
                        >
                          {player.number}
                        </text>
                      </>
                    );
                  })()}
                  {/* Name label */}
                  <text
                    x={0} y={r + 5}
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

      <p className="text-center text-xs text-gray-500 dark:text-zinc-500 mt-2">
        11 titulares projetados · primeiros por posição
      </p>
    </section>
  );
}
