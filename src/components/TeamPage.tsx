import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { AddToCalendarButton } from './AddToCalendarButton';
import {
  ArrowLeft, Calendar, MapPin, Radio, Trophy, Ruler, Cake, Activity, Shirt, X,
  Weight, Globe, ShieldAlert,
} from 'lucide-react';
import { getTeamDetail } from '../data/teams';
import type { Fixture, Formation, Player } from '../types';
import { ALL_FORMATIONS } from '../types';
import {
  getNextTeamMatch,
  getTeamMatches,
  isDateFuture,
} from '../utils/matchDate';
import { useTeamProfile, type EspnPlayer, type PosGroup } from '../hooks/useTeamProfile';
import { useTeamLineup, type LineupStarter } from '../hooks/useTeamLineup';
import { useTeamStats } from '../hooks/useTeamStats';
import { useLiveScores } from '../hooks/useLiveScores';
import { resolvePlayerPhoto, initialsFor } from '../data/playerPhoto';
import { translateCountry } from '../utils/translateCommentary';
import FootballPitch, { type PitchPlayer, type StartingEleven } from './FootballPitch';
import PlayerModal from './PlayerModal';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const [, mm, dd] = iso.split('-');
  return `${parseInt(dd, 10)}/${parseInt(mm, 10)}`;
}

function formatWeekday(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 3));
  return date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' });
}

/** Escurece um hex "#rrggbb" para o gradiente do hero. */
function darken(hex: string, amt = 0.45): string {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const n = parseInt(h, 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amt));
  const g = Math.round(((n >> 8) & 255) * (1 - amt));
  const b = Math.round((n & 255) * (1 - amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Fotos "cutout" (thesportsdb / wikimedia) são recortes de meio-corpo: o rosto
 * fica no terço superior. Num crop circular centralizado, o rosto sai do quadro.
 * Detectamos a fonte pela URL p/ alinhar o crop ao topo (`object-top`).
 * Headshots oficiais da ESPN já vêm enquadrados 1:1 no rosto → crop centralizado.
 */
function isCutoutPhoto(url: string | null): boolean {
  if (!url) return false;
  return /thesportsdb\.com|wikimedia\.org|wikipedia\.org/i.test(url);
}

/** Converte "183 lbs" → "83 kg". Mantém original se não reconhecer. */
function weightToKg(w: string | null): string | null {
  if (!w) return null;
  const m = w.match(/([\d.]+)\s*lb/i);
  if (m) return `${Math.round(parseFloat(m[1]) * 0.453592)} kg`;
  return w;
}

/** Converte altura "6' 2"" (pés/pol) → "1,88 m". Mantém original se não reconhecer. */
function heightToMeters(h: string | null): string | null {
  if (!h) return null;
  const m = h.match(/(\d+)'\s*(\d+)/);
  if (m) {
    const cm = (parseInt(m[1], 10) * 12 + parseInt(m[2], 10)) * 2.54;
    return `${(cm / 100).toFixed(2).replace('.', ',')} m`;
  }
  return h;
}

/** Data de nascimento ISO → "13 de dezembro de 1987". */
function formatBirthDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

const PHASE_LABEL = (g: Fixture): string =>
  g.phase === 'group'
    ? `Grupo ${g.group} · R${g.matchday}`
    : g.phase === 'round-of-32' ? '32-avos'
    : g.phase === 'round-of-16' ? 'Oitavas'
    : g.phase === 'quarter' ? 'Quartas'
    : g.phase === 'semi' ? 'Semifinal'
    : g.phase === 'third' ? '3º lugar'
    : 'Final';

/* ── Modelo unificado de elenco (ESPN ou local) ──────────────────────────── */

const POS_LABEL: Record<PosGroup, string> = {
  GK: 'Goleiros', DEF: 'Defensores', MID: 'Meio-campistas', FWD: 'Atacantes',
};
const POS_LABEL_SING: Record<PosGroup, string> = {
  GK: 'Goleiro', DEF: 'Defensor', MID: 'Meio-campista', FWD: 'Atacante',
};
/** Nomes de posição detalhados vindos da ESPN (em inglês) → PT-BR. */
const POS_NAME_PT: Record<string, string> = {
  Goalkeeper: 'Goleiro',
  Defender: 'Defensor',
  Midfielder: 'Meio-campista',
  Forward: 'Atacante',
  'Center Back': 'Zagueiro',
  'Full Back': 'Lateral',
  'Left Back': 'Lateral-esquerdo',
  'Right Back': 'Lateral-direito',
  'Defensive Midfielder': 'Volante',
  'Central Midfielder': 'Meia-central',
  'Attacking Midfielder': 'Meia-atacante',
  'Left Midfielder': 'Meia-esquerda',
  'Right Midfielder': 'Meia-direita',
  'Left Winger': 'Ponta-esquerda',
  'Right Winger': 'Ponta-direita',
  'Center Forward': 'Centroavante',
  Striker: 'Atacante',
};
const LOCAL_TO_GROUP: Record<Player['position'], PosGroup> = {
  Goleiro: 'GK', Defensor: 'DEF', 'Meio-campista': 'MID', Atacante: 'FWD',
};
const GROUP_ORDER: PosGroup[] = ['GK', 'DEF', 'MID', 'FWD'];

interface SquadVM {
  key: string;
  number: number | null;
  name: string;
  shortName: string;
  fullName: string | null;
  posGroup: PosGroup;
  posLabel: string;
  posName: string | null;
  photo: string | null;
  isCutout: boolean;
  age: number | null;
  dateOfBirth: string | null;
  height: string | null;
  weight: string | null;
  club: string | null;
  flag: string | null;
  birthCountry: string | null;
  birthCity: string | null;
  citizenship: string | null;
  injured: boolean;
  injuryDetail: string | null;
  source: 'espn' | 'local';
  localPlayer?: Player;
  espn?: EspnPlayer;
}

function fromEspn(p: EspnPlayer): SquadVM {
  const photo = resolvePlayerPhoto({ id: p.id, name: p.name, espnPhoto: p.photo });
  return {
    key: p.id || `${p.number}-${p.name}`,
    number: p.number,
    name: p.name,
    shortName: p.shortName,
    fullName: p.fullName,
    posGroup: p.posGroup,
    posLabel: POS_LABEL_SING[p.posGroup],
    posName: p.posName || null,
    photo,
    isCutout: isCutoutPhoto(photo),
    age: p.age,
    dateOfBirth: p.dateOfBirth,
    height: p.height,
    weight: p.weight,
    club: null,
    flag: p.flag,
    birthCountry: p.birthCountry,
    birthCity: p.birthCity,
    citizenship: p.citizenship,
    injured: p.injured,
    injuryDetail: p.injuryDetail,
    source: 'espn',
    espn: p,
  };
}

function fromLocal(p: Player): SquadVM {
  const group = LOCAL_TO_GROUP[p.position];
  const photo = resolvePlayerPhoto({ name: p.name });
  return {
    key: `${p.number}-${p.name}`,
    number: p.number,
    name: p.name,
    shortName: p.name,
    fullName: null,
    posGroup: group,
    posLabel: POS_LABEL_SING[group],
    posName: null,
    photo,
    isCutout: isCutoutPhoto(photo),
    age: null,
    dateOfBirth: null,
    height: null,
    weight: null,
    club: p.club,
    flag: null,
    birthCountry: null,
    birthCity: null,
    citizenship: null,
    injured: false,
    injuryDetail: null,
    source: 'local',
    localPlayer: p,
  };
}

function fromStarter(s: LineupStarter): SquadVM {
  const photo = resolvePlayerPhoto({ id: s.id, name: s.name, espnPhoto: s.photo });
  return {
    key: s.id || `${s.number}-${s.name}`,
    number: s.number,
    name: s.name,
    shortName: s.shortName,
    fullName: null,
    posGroup: s.posGroup,
    posLabel: POS_LABEL_SING[s.posGroup],
    posName: null,
    photo,
    isCutout: isCutoutPhoto(photo),
    age: null,
    dateOfBirth: null,
    height: null,
    weight: null,
    club: null,
    flag: null,
    birthCountry: null,
    birthCity: null,
    citizenship: null,
    injured: false,
    injuryDetail: null,
    source: 'espn',
  };
}

/* ── Avatar com fallback (foto → número/iniciais) ────────────────────────── */

function Avatar({ src, name, color, className, cutout }: { src: string | null; name?: string; color?: string | null; className?: string; cutout?: boolean }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    const base = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#64748b';
    return (
      <div
        className="flex h-full w-full items-center justify-center text-xs font-bold uppercase tracking-tight text-white/95"
        style={{ background: `linear-gradient(135deg, ${base} 0%, ${darken(base, 0.4)} 100%)` }}
      >
        {name ? initialsFor(name) : '—'}
      </div>
    );
  }
  // Cutouts (meio-corpo): alinha o crop ao topo p/ manter o rosto visível.
  const fit = className ?? `h-full w-full object-cover ${cutout ? 'object-top' : 'object-center'}`;
  return <img src={src} alt={name ?? ''} loading="lazy" onError={() => setErr(true)} className={fit} />;
}

/* ── Stat box (recorde no torneio) ───────────────────────────────────────── */

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className={`text-lg font-extrabold tabular-nums leading-none ${accent ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</div>
    </div>
  );
}

/* ── Estatísticas (agregadas da ESPN) ────────────────────────────────────── */

function AvgCard({ label, value, suffix, color }: { label: string; value: string; suffix?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="text-2xl font-extrabold leading-none tabular-nums" style={color ? { color } : undefined}>
        {value}<span className="text-sm font-bold">{suffix}</span>
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</div>
    </div>
  );
}

function CompareBar({ label, mine, opp, color, fmt }: {
  label: string;
  mine: number;
  opp: number;
  color: string;
  fmt: (n: number) => string;
}) {
  const total = mine + opp || 1;
  const pct = Math.round((mine / total) * 100);
  const lead = mine >= opp;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={`font-extrabold tabular-nums ${lead ? '' : 'opacity-60'}`} style={{ color }}>{fmt(mine)}</span>
        <span className="font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`font-bold tabular-nums text-gray-500 dark:text-gray-400 ${lead ? 'opacity-60' : ''}`}>{fmt(opp)}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div style={{ width: `${pct}%`, backgroundColor: color }} className="transition-all" />
        <div style={{ width: `${100 - pct}%` }} className="bg-gray-400/60 dark:bg-gray-500/50" />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-center dark:border-gray-700 dark:bg-gray-800">
      <div className="text-base font-extrabold tabular-nums text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</div>
    </div>
  );
}

/* ── Card de jogador no elenco ───────────────────────────────────────────── */

function SquadCard({ p, color, onClick }: { p: SquadVM; color: string | null; onClick: () => void }) {
  const sub = [p.age != null ? `${p.age} anos` : null, p.club].filter(Boolean).join(' · ');
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="relative h-12 w-12 shrink-0">
        <div className="h-full w-full overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-100 dark:bg-gray-700 dark:ring-gray-700">
          <Avatar src={p.photo} name={p.name} color={color} cutout={p.isCutout} />
        </div>
        {p.number != null && (
          <span
            className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-gray-800"
            style={{ backgroundColor: color ?? '#16a34a' }}
          >
            {p.number}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-green-600 dark:text-gray-100 dark:group-hover:text-green-400">
          {p.name}
        </p>
        {sub && <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
      {p.injured && (
        <span title="Lesão / dúvida" className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <Activity size={11} className="inline" />
        </span>
      )}
    </button>
  );
}

/* ── Modal de jogador (dados reais da ESPN) ──────────────────────────────── */

function EspnPlayerModal({ p, teamFlag, color, onClose }: {
  p: SquadVM;
  teamFlag: string;
  color: string | null;
  onClose: () => void;
}) {
  // ESC + scroll lock (portal p/ escapar de qualquer overflow do pai)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const accent = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#16a34a';
  const header = `linear-gradient(150deg, ${accent} 0%, ${darken(accent, 0.55)} 100%)`;

  // Atributos primários (sempre 3: Camisa, Posição, Idade)
  const primary = [
    p.number != null && { icon: <Shirt size={15} strokeWidth={2.5} />, label: 'Camisa', value: `${p.number}` },
    { icon: <Trophy size={15} strokeWidth={2.5} />, label: 'Posição', value: p.posLabel },
    p.age != null && { icon: <Cake size={15} strokeWidth={2.5} />, label: 'Idade', value: `${p.age}` },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  // Atributos secundários (linha compacta de metadados físicos)
  const secondary = [
    p.height && { icon: <Ruler size={14} strokeWidth={2.5} />, value: heightToMeters(p.height) ?? p.height },
    p.weight && { icon: <Weight size={14} strokeWidth={2.5} />, value: weightToKg(p.weight) ?? p.weight },
  ].filter(Boolean) as { icon: React.ReactNode; value: string }[];

  // "Sobre" — linhas descritivas (países sempre em PT-BR)
  const birthDate = formatBirthDate(p.dateOfBirth);
  const birthPlace = [p.birthCity, translateCountry(p.birthCountry)].filter(Boolean).join(', ') || null;
  const citizenshipPt = translateCountry(p.citizenship);
  // Oculta Nacionalidade quando coincide com o país de nascimento (caso comum).
  const showCitizenship = citizenshipPt && citizenshipPt !== translateCountry(p.birthCountry);
  const facts = [
    birthDate && { icon: <Calendar size={14} />, label: 'Nascimento', value: birthDate },
    birthPlace && { icon: <MapPin size={14} />, label: 'Naturalidade', value: birthPlace },
    showCitizenship && { icon: <Globe size={14} />, label: 'Nacionalidade', value: citizenshipPt },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  // Posição detalhada (PT-BR) com fallback para a genérica
  const posNamePt = (p.posName && POS_NAME_PT[p.posName]) || p.posLabel;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(8,10,14,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes ppIn { from { opacity:0; transform: translateY(20px) scale(.94); } to { opacity:1; transform:none; } }
        @keyframes ppFloat { from { opacity:0; transform: translateY(14px) scale(.9); } to { opacity:1; transform:none; } }
        .pp-card { animation: ppIn .26s cubic-bezier(.16,1,.3,1) both; }
        .pp-avatar { animation: ppFloat .42s cubic-bezier(.16,1,.3,1) .08s both; }
      `}</style>

      <div className="pp-card w-full max-w-sm overflow-hidden rounded-[20px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden px-5 pb-16 pt-5" style={{ background: header }}>
          {/* número gigante como marca d'água */}
          {p.number != null && (
            <span
              className="pointer-events-none absolute -right-3 -top-6 select-none font-black leading-none text-white/10"
              style={{ fontSize: '9rem' }}
            >
              {p.number}
            </span>
          )}
          {/* brilho radial sutil */}
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(255,255,255,.18), transparent 60%)' }} />

          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          <div className="relative">
            <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm backdrop-blur-sm">
              {posNamePt}
            </span>
            <div className="mt-2.5 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[1.7rem] font-black leading-[1.05] tracking-tight text-white drop-shadow-sm">
                  {p.name}
                </h2>
                {p.fullName && p.fullName.trim().toLowerCase() !== p.name.trim().toLowerCase() && (
                  <p className="mt-1 truncate text-xs font-medium text-white/65">{p.fullName.trim()}</p>
                )}
              </div>
              {/* bandeira oficial da ESPN > emoji */}
              {p.flag ? (
                <img src={p.flag} alt="" className="h-7 w-10 shrink-0 rounded-[3px] object-cover shadow-md ring-1 ring-white/30" />
              ) : (
                <span className="shrink-0 text-3xl leading-none drop-shadow">{teamFlag}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Avatar sobreposto ── */}
        <div className="-mt-12 mb-4 flex justify-center">
          <div className="pp-avatar relative">
            <div
              className="h-24 w-24 overflow-hidden rounded-full border-[5px] border-white bg-gray-100 shadow-xl dark:border-gray-900 dark:bg-gray-800"
              style={{ boxShadow: `0 8px 28px -6px ${accent}66` }}
            >
              <Avatar src={p.photo} name={p.name} color={color} cutout={p.isCutout} />
            </div>
            {/* badge de número sobre o avatar */}
            {p.number != null && (
              <span
                className="absolute -bottom-1 -right-1 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-black text-white shadow-lg ring-[3px] ring-white dark:ring-gray-900"
                style={{ backgroundColor: accent }}
              >
                {p.number}
              </span>
            )}
          </div>
        </div>

        {/* ── Atributos primários (sempre 3 cards) ── */}
        <div className="px-5">
          <div className="grid grid-cols-3 gap-2">
            {primary.map((a) => (
              <div
                key={a.label}
                className="rounded-xl bg-gray-50 px-2 py-2.5 text-center ring-1 ring-gray-100 transition dark:bg-gray-800/70 dark:ring-gray-700/60"
              >
                <span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center" style={{ color: accent }}>
                  {a.icon}
                </span>
                <p className="text-sm font-extrabold leading-none text-gray-900 dark:text-gray-50">{a.value}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{a.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Atributos secundários (altura/peso, inline) ── */}
        {secondary.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 text-xs text-gray-500 dark:text-gray-400">
            {secondary.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="text-gray-400 dark:text-gray-500">{s.icon}</span>
                <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-300">{s.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Status de lesão ── */}
        {p.injured && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900/50">
            <ShieldAlert size={16} className="shrink-0 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {p.injuryDetail || 'Lesão / dúvida para a próxima partida'}
            </span>
          </div>
        )}

        {/* ── Sobre ── */}
        {facts.length > 0 && (
          <div className="mt-4 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">Sobre</p>
            <dl className="space-y-2">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 text-xs">
                  <span className="shrink-0 text-gray-400 dark:text-gray-500">{f.icon}</span>
                  <dt className="shrink-0 font-medium text-gray-400 dark:text-gray-500">{f.label}</dt>
                  <dd className="ml-auto truncate text-right font-semibold text-gray-800 dark:text-gray-200">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {facts.length === 0 && <div className="pb-5" />}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

/* ── Próximo jogo ────────────────────────────────────────────────────────── */

function NextMatchCallout({ fixture, teamSlug, teamFlag }: { fixture: Fixture; teamSlug: string; teamFlag: string }) {
  const isHome = fixture.homeSlug === teamSlug;
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const opponentFlag = isHome ? fixture.awayFlag : fixture.homeFlag;
  return (
    <Link
      to="/jogos"
      className="block rounded-2xl bg-gradient-to-r from-green-600 to-green-700 p-4 text-white shadow-md transition-colors hover:from-green-700 hover:to-green-800"
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-90">
        <Calendar size={12} />
        Próximo jogo
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-2xl leading-none">{teamFlag}</span>
          <span className="text-sm font-medium opacity-90">vs</span>
          <span className="text-2xl leading-none">{opponentFlag}</span>
          <span className="truncate text-base font-bold">{opponent}</span>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold tabular-nums">{fixture.time}</div>
          <div className="text-[10px] uppercase opacity-80">BRT</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs opacity-90">
        <span className="capitalize">{formatWeekday(fixture.date)}</span>
        <span>·</span>
        <span>{formatDate(fixture.date)}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><MapPin size={11} />{fixture.city}</span>
      </div>
    </Link>
  );
}

/* ── Página ──────────────────────────────────────────────────────────────── */

export function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const team = getTeamDetail(slug);
  const matches = slug ? getTeamMatches(slug) : [];
  const nextMatch = slug ? getNextTeamMatch(slug) : null;

  const { info, players, available, loading, lastUpdated } = useTeamProfile(slug);
  const { lineup } = useTeamLineup(slug);
  const { stats, loading: statsLoading } = useTeamStats(slug);
  const { getLive } = useLiveScores();

  const [selectedLocal, setSelectedLocal] = useState<Player | null>(null);
  const [selectedEspn, setSelectedEspn] = useState<SquadVM | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation>(team?.formation ?? '4-3-3');

  // Quando a escalação real chega, adota a formação do último jogo (se conhecida).
  const [autoFormation, setAutoFormation] = useState<string | null>(null);
  if (lineup?.formation && autoFormation !== lineup.formation) {
    setAutoFormation(lineup.formation);
    if ((ALL_FORMATIONS as string[]).includes(lineup.formation)) {
      setSelectedFormation(lineup.formation as Formation);
    }
  }

  const usingEspn = available && players.length > 0;

  // Elenco unificado (ESPN quando disponível; senão, projetado local).
  const squad = useMemo<SquadVM[]>(() => {
    if (usingEspn) return players.map(fromEspn);
    return (team?.players ?? []).map(fromLocal);
  }, [usingEspn, players, team]);

  // Jogadores do campo + lookup por número (sintético quando sem camisa).
  const { pitchPlayers, byNumber } = useMemo(() => {
    const byNumber = new Map<number, SquadVM>();
    const pitchPlayers: PitchPlayer[] = squad.map((s, i) => {
      const number = s.number ?? 900 + i;
      byNumber.set(number, s);
      return { number, name: s.shortName || s.name, posGroup: s.posGroup, photo: s.photo };
    });
    return { pitchPlayers, byNumber };
  }, [squad]);

  // Escalação REAL (XI do último jogo) montada para a formação selecionada:
  // jogadores ordenados por linha (vertical) e lado (horizontal). null → heurística.
  const realLineup = useMemo<{ eleven: StartingEleven; byNumber: Map<number, SquadVM> } | null>(() => {
    if (!lineup) return null;
    const gk = lineup.starters.find((s) => s.posGroup === 'GK');
    const outfield = lineup.starters
      .filter((s) => s.posGroup !== 'GK')
      .slice()
      .sort((a, b) => a.vertical - b.vertical || a.horizontal - b.horizontal);
    const counts = selectedFormation.split('-').map(Number);
    const sum = counts.reduce((a, b) => a + b, 0);
    if (!gk || outfield.length !== sum) return null;

    const byNumber = new Map<number, SquadVM>();
    const squadById = new Map(squad.map((s) => [s.espn?.id, s] as const));
    let synthetic = 900;
    const toPP = (s: LineupStarter): PitchPlayer => {
      const number = s.number ?? synthetic++;
      byNumber.set(number, (s.id && squadById.get(s.id)) || fromStarter(s));
      return { number, name: s.shortName || s.name, posGroup: s.posGroup, photo: resolvePlayerPhoto({ id: s.id, name: s.name, espnPhoto: s.photo }) };
    };

    const goalkeeper = toPP(gk);
    const lines: PitchPlayer[][] = [];
    let idx = 0;
    for (const c of counts) {
      const lineStarters = outfield.slice(idx, idx + c).slice().sort((a, b) => a.horizontal - b.horizontal);
      lines.push(lineStarters.map(toPP));
      idx += c;
    }
    return { eleven: { goalkeeper, lines }, byNumber };
  }, [lineup, selectedFormation, squad]);

  const grouped = useMemo(
    () => GROUP_ORDER.map((g) => ({ g, label: POS_LABEL[g], items: squad.filter((s) => s.posGroup === g) }))
      .filter((x) => x.items.length > 0),
    [squad],
  );

  if (!team) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-500">Seleção não encontrada.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-green-600 hover:underline">
          ← Voltar para os grupos
        </Link>
      </div>
    );
  }

  const colorHex = info?.color ? `#${info.color}` : null;
  const heroBg = colorHex
    ? `linear-gradient(135deg, ${colorHex} 0%, ${darken(colorHex, 0.5)} 100%)`
    : 'linear-gradient(135deg, #15803d 0%, #14532d 100%)';
  const rec = info?.record ?? null;

  function openPlayer(vm: SquadVM) {
    if (vm.source === 'local' && vm.localPlayer) setSelectedLocal(vm.localPlayer);
    else setSelectedEspn(vm);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* back */}
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-green-600 hover:underline">
        <ArrowLeft size={15} /> Voltar para os grupos
      </Link>

      {/* ── HERO ── */}
      <header className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg sm:p-6" style={{ background: heroBg }}>
        {info?.logo && (
          <img src={info.logo} alt="" className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-10" />
        )}
        <div className="relative flex items-start gap-4">
          <span className="text-5xl leading-none drop-shadow sm:text-6xl">{team.team.flag}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black leading-tight sm:text-3xl">{team.team.name}</h1>
            <p className="mt-1 text-sm text-white/80">
              {[`Grupo ${team.groupId}`, team.confederation, team.coach && `Téc. ${team.coach}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {info?.standingSummary && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                  <Trophy size={12} /> {info.standingSummary}
                </span>
              )}
              {team.team.isHost && (
                <span className="rounded-full bg-yellow-300/90 px-2.5 py-1 text-[11px] font-bold text-yellow-900">
                  País-sede
                </span>
              )}
              {lastUpdated && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-medium">
                  <Radio size={11} className="animate-pulse" />
                  {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── RECORDE NO TORNEIO ── */}
      {rec ? (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          <Stat label="J" value={rec.played} />
          <Stat label="V" value={rec.wins} accent="text-green-600 dark:text-green-400" />
          <Stat label="E" value={rec.draws} />
          <Stat label="D" value={rec.losses} accent="text-red-600 dark:text-red-400" />
          <Stat label="GP" value={rec.goalsFor} />
          <Stat label="GC" value={rec.goalsAgainst} />
          <Stat label="SG" value={rec.goalDiff > 0 ? `+${rec.goalDiff}` : rec.goalDiff} accent={rec.goalDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
          <Stat label="Pts" value={rec.points} accent="text-gray-900 dark:text-gray-100" />
        </div>
      ) : loading ? (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[58px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : null}

      {/* ── PRÓXIMO JOGO ── */}
      {nextMatch && (
        <div className="mt-4">
          <NextMatchCallout fixture={nextMatch} teamSlug={slug!} teamFlag={team.team.flag} />
        </div>
      )}

      {/* ── FORMAÇÃO ── */}
      <section className="mt-6 rounded-2xl bg-gray-50 p-4 dark:bg-[#121728] sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <label htmlFor="formation-select" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {realLineup ? 'Escalação titular' : 'Escalação projetada'}
            </label>
            {realLineup && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                <Radio size={9} className="animate-pulse" /> real · último jogo
              </span>
            )}
          </div>
          <select
            id="formation-select"
            value={selectedFormation}
            onChange={(e) => setSelectedFormation(e.target.value as Formation)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {ALL_FORMATIONS.map((f) => (
              <option key={f} value={f}>
                {f}{f === lineup?.formation ? ' • real' : f === team.formation ? ' ✦' : ''}
              </option>
            ))}
          </select>
        </div>
        <FootballPitch
          players={realLineup ? undefined : pitchPlayers}
          lineup={realLineup?.eleven ?? null}
          formation={selectedFormation}
          teamName={team.team.name}
          teamColor={info?.color}
          teamAltColor={info?.altColor}
          onPlayerClick={(pp) => {
            const map = realLineup?.byNumber ?? byNumber;
            const vm = map.get(pp.number);
            if (vm) openPlayer(vm);
          }}
        />
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-zinc-500">
          {realLineup
            ? `Titulares do último jogo${lineup?.opponentCode ? ` · vs ${lineup.opponentCode}` : ''} · arraste para reposicionar`
            : 'Toque num jogador para ver detalhes · arraste para reposicionar'}
        </p>
      </section>

      {/* ── ESTATÍSTICAS ── */}
      {stats ? (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-200">
            Estatísticas
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {stats.games} {stats.games === 1 ? 'jogo' : 'jogos'}
            </span>
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">· médias por jogo</span>
          </h2>

          {/* destaques */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <AvgCard label="Posse de bola" value={stats.possession.toFixed(1)} suffix="%" color={colorHex ?? undefined} />
            <AvgCard label="Finalizações" value={stats.shots.toFixed(1)} color={colorHex ?? undefined} />
            <AvgCard label="Precisão de passe" value={stats.passAccuracy.toFixed(0)} suffix="%" color={colorHex ?? undefined} />
            <AvgCard label="Desarmes" value={stats.tacklesPerGame.toFixed(1)} color={colorHex ?? undefined} />
          </div>

          {/* nós × adversários */}
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
              <span style={{ color: colorHex ?? '#16a34a' }}>{team.team.name}</span>
              <span className="text-gray-400">Adversários</span>
            </div>
            <div className="space-y-3">
              <CompareBar label="Posse de bola" mine={stats.possession} opp={stats.oppPossession} color={colorHex ?? '#16a34a'} fmt={(n) => `${n.toFixed(0)}%`} />
              <CompareBar label="Finalizações" mine={stats.shots} opp={stats.oppShots} color={colorHex ?? '#16a34a'} fmt={(n) => n.toFixed(1)} />
              <CompareBar label="Finalizações no gol" mine={stats.shotsOnTarget} opp={stats.oppShotsOnTarget} color={colorHex ?? '#16a34a'} fmt={(n) => n.toFixed(1)} />
              <CompareBar label="Escanteios" mine={stats.corners} opp={stats.oppCorners} color={colorHex ?? '#16a34a'} fmt={(n) => n.toFixed(1)} />
              <CompareBar label="Faltas cometidas" mine={stats.fouls} opp={stats.oppFouls} color={colorHex ?? '#16a34a'} fmt={(n) => n.toFixed(1)} />
            </div>
          </div>

          {/* extras / disciplina */}
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <MiniStat label="Passes/jogo" value={Math.round(stats.passesPerGame).toString()} />
            <MiniStat label="Interceptações" value={stats.interceptionsPerGame.toFixed(1)} />
            <MiniStat label="Defesas" value={stats.savesPerGame.toFixed(1)} />
            <MiniStat label="Impedimentos" value={stats.offsidesPerGame.toFixed(1)} />
            <MiniStat label="Amarelos" value={stats.yellow.toString()} />
            <MiniStat label="Vermelhos" value={stats.red.toString()} />
          </div>
        </section>
      ) : statsLoading ? (
        <section className="mt-8">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[68px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── ELENCO ── */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-200">
            Elenco
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {squad.length}
            </span>
          </h2>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            usingEspn
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
          }`}>
            {usingEspn ? <><Radio size={11} className="animate-pulse" /> ao vivo · ESPN</> : 'projetado'}
          </span>
        </div>

        <div className="space-y-5">
          {grouped.map(({ g, label, items }) => (
            <div key={g}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {label} <span className="text-gray-300 dark:text-gray-600">· {items.length}</span>
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <SquadCard key={p.key} p={p} color={colorHex} onClick={() => openPlayer(p)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── JOGOS ── */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Jogos</h2>
          <AddToCalendarButton
            fixtures={matches}
            calName={`${team.team.name} · Copa 2026`}
            filename={`copa2026-${slug}`}
            label="Adicionar à agenda"
          />
        </div>
        <div className="space-y-2">
          {matches.map((g) => {
            const isHome = g.homeSlug === slug;
            const opponent = isHome ? g.awayTeam : g.homeTeam;
            const opponentFlag = isHome ? g.awayFlag : g.homeFlag;
            const opponentSlug = isHome ? g.awaySlug : g.homeSlug;
            const live = getLive(g.id);
            const hs = live?.home ?? g.homeScore;
            const as = live?.away ?? g.awayScore;
            const played = hs != null && as != null;
            const myScore = isHome ? hs : as;
            const oppScore = isHome ? as : hs;
            const res = played ? (myScore! > oppScore! ? 'V' : myScore! < oppScore! ? 'D' : 'E') : null;
            const future = isDateFuture(g.date ? new Date(`${g.date}T${g.time}:00-03:00`) : new Date(0));
            const resColor =
              res === 'V' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : res === 'D' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : res === 'E' ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              : '';
            return (
              <div
                key={g.id}
                className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${played && !live?.isLive ? 'opacity-80' : ''}`}
              >
                <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {PHASE_LABEL(g)}
                </span>
                <Link
                  to={`/team/${opponentSlug}`}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg transition-colors hover:opacity-80"
                >
                  <span className="text-xl leading-none">{opponentFlag}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800 hover:underline dark:text-gray-200">{opponent}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {isHome ? 'em casa' : 'fora'} · {formatDate(g.date)} · {g.city}
                    </p>
                  </div>
                </Link>
                {played ? (
                  <div className="flex shrink-0 items-center gap-2">
                    {live?.isLive && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                        <Radio size={10} className="animate-pulse" />{live.clock}
                      </span>
                    )}
                    <span className="tabular-nums text-base font-extrabold text-gray-900 dark:text-gray-100">
                      {myScore} <span className="text-gray-300 dark:text-gray-600">-</span> {oppScore}
                    </span>
                    {res && (
                      <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${resColor}`}>{res}</span>
                    )}
                  </div>
                ) : (
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold tabular-nums ${
                    future ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {g.time}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* nota */}
      <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-600">
        {usingEspn
          ? `Elenco e estatísticas ao vivo via ESPN · escalação no campo é ${realLineup ? 'a titular do último jogo' : 'projetada por elenco'} · jogos: calendário oficial FIFA.`
          : 'Dados projetados — elenco e jogos são estimativas sujeitas a alteração.'}
      </p>

      {/* modais */}
      {selectedLocal && (
        <PlayerModal
          player={selectedLocal}
          teamSlug={team.slug}
          teamFlag={team.team.flag}
          onClose={() => setSelectedLocal(null)}
        />
      )}
      {selectedEspn && (
        <EspnPlayerModal
          p={selectedEspn}
          teamFlag={team.team.flag}
          color={colorHex}
          onClose={() => setSelectedEspn(null)}
        />
      )}
    </div>
  );
}
