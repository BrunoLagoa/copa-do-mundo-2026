import { useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { TEAMS_BY_SLUG } from '../data/teams';
import type { Player } from '../types';
import {
  generateStats,
  positionGradient,
  playerAvatarUrl,
} from '../utils/playerStats';
import { PLAYER_PHOTOS } from '../data/playerPhotos';

interface LocationState {
  player?: Player;
  teamSlug?: string;
  teamFlag?: string;
}

export function PlayerPage() {
  const { teamSlug, playerNumber } = useParams<{ teamSlug: string; playerNumber: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state ?? {}) as LocationState;

  // Resolve player — prefer router state (fast), fall back to data lookup (direct URL)
  const team = teamSlug ? TEAMS_BY_SLUG[teamSlug] : undefined;
  const player: Player | undefined =
    state.player ??
    team?.players.find(p => p.number === Number(playerNumber));

  const teamFlag = state.teamFlag ?? team?.team.flag ?? '🏳️';

  // ALL hooks MUST be before any early return (rules-of-hooks)
  const [copied, setCopied] = useState(false);
  const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const avatarUrl = playerAvatarUrl(player?.name ?? '');
  const hasRealPhoto = Boolean(player?.name && PLAYER_PHOTOS[player.name]);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!player || !team) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-lg mb-4">Jogador não encontrado.</p>
        <Link to="/" className="text-emerald-600 hover:underline text-sm">
          ← Voltar para os grupos
        </Link>
      </div>
    );
  }

  const stats = generateStats(player);
  const gradient = positionGradient(player.position);

  // Teammates: same position, different number, max 4
  const teammates = team.players
    .filter(p => p.position === player.position && p.number !== player.number)
    .slice(0, 4);

  // Rating approximation — weighted avg of stat percentages
  const rating = (
    stats.reduce((acc, s) => acc + (s.value / s.max) * 10, 0) / stats.length
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-16">

      {/* ── Hero ── */}
      <div className={`relative bg-gradient-to-br ${gradient} overflow-hidden`}>
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Back button */}
        <div className="relative z-10 px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center px-6 pt-6 pb-24">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full border-4 border-white/20 overflow-hidden bg-zinc-700 shadow-2xl mb-4 relative">
            {/* Skeleton shimmer — visível enquanto foto real carrega */}
            {hasRealPhoto && imgState === 'loading' && (
              <div className="absolute inset-0 animate-pulse bg-white/20 rounded-full" />
            )}
            <img
              src={avatarUrl}
              alt={player.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                hasRealPhoto && imgState === 'loading' ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImgState('loaded')}
              onError={() => setImgState('error')}
            />
          </div>

          {/* Position badge */}
          <span className="text-xs font-bold uppercase tracking-widest text-white/60 bg-white/10 px-3 py-1 rounded-full mb-2">
            {player.position}
          </span>

          {/* Name */}
          <h1 className="text-3xl font-black text-white text-center leading-tight mb-1">
            {player.name}
          </h1>
          <p className="text-white/60 text-sm">{player.club}</p>

          {/* Team info */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-2xl">{teamFlag}</span>
            <span className="text-white/70 text-sm">{team.team.name} · Copa 2026</span>
          </div>
        </div>

        {/* Jersey number watermark */}
        <div className="absolute bottom-0 right-6 text-white/5 font-black text-9xl leading-none select-none pointer-events-none">
          {player.number}
        </div>
      </div>

      {/* ── Rating pill (overlaps hero) ── */}
      <div className="flex justify-center -mt-7 mb-8 relative z-10">
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl px-8 py-3 shadow-xl flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400">{rating}</p>
            <p className="text-gray-500 dark:text-zinc-500 text-xs uppercase tracking-wide">Rating</p>
          </div>
          <div className="w-px h-10 bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-3xl font-black text-gray-900 dark:text-white">#{player.number}</p>
            <p className="text-gray-500 dark:text-zinc-500 text-xs uppercase tracking-wide">Camisa</p>
          </div>
          <div className="w-px h-10 bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-3xl">{teamFlag}</p>
            <p className="text-gray-500 dark:text-zinc-500 text-xs uppercase tracking-wide">Seleção</p>
          </div>
          <div className="w-px h-10 bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <button
              onClick={handleCopy}
              aria-label="Copiar link do jogador"
              className="flex flex-col items-center gap-1 text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              <span className="text-xs uppercase tracking-wide">{copied ? 'Copiado!' : 'Link'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6">

        {/* ── Stats ── */}
        <section>
          <h2 className="text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-4">
            Estatísticas projetadas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const pct = Math.round((stat.value / stat.max) * 100);
              return (
                <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{stat.emoji}</span>
                    <span className="text-gray-500 dark:text-zinc-400 text-xs">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {stat.value}
                    <span className="text-sm font-normal text-gray-400 dark:text-zinc-500 ml-0.5">{stat.unit}</span>
                  </p>
                  <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Perfil ── */}
        <section>
          <h2 className="text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-4">
            Perfil
          </h2>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl divide-y divide-gray-100 dark:divide-zinc-800">
            {[
              { label: 'Número de camisa', value: `#${player.number}` },
              { label: 'Posição',          value: player.position },
              { label: 'Clube atual',      value: player.club },
              { label: 'Seleção',          value: `${team.team.name} (Grupo ${team.groupId})` },
              { label: 'Confederação',     value: team.confederation },
              { label: 'Técnico',          value: team.coach },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-500 dark:text-zinc-500 text-sm">{label}</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium text-right max-w-[55%]">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Companheiros de equipe ── */}
        {teammates.length > 0 && (
          <section>
            <h2 className="text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-4">
              Companheiros · {player.position}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {teammates.map((tm) => (
                <button
                  key={tm.number}
                  onClick={() =>
                    navigate(`/player/${teamSlug}/${tm.number}`, {
                      state: { player: tm, teamSlug, teamFlag },
                    })
                  }
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600 rounded-xl p-3 flex items-center gap-3 text-left transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(tm.name)}&backgroundColor=b6e3f4,ffd5dc,c0aede,d1d4f9&backgroundType=gradientLinear`}
                      alt={tm.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        const p = el.parentElement!;
                        p.innerHTML = `<span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:900;color:white;background:#52525b">${tm.name.charAt(0)}</span>`;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-900 dark:text-white text-xs font-semibold truncate">{tm.name}</p>
                    <p className="text-gray-500 dark:text-zinc-500 text-xs">#{tm.number} · {tm.club}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Disclaimer ── */}
        <p className="text-gray-400 dark:text-zinc-600 text-xs text-center pb-4">
          Dados projetados — estatísticas são estimativas para fins ilustrativos.
        </p>
      </div>
    </div>
  );
}
