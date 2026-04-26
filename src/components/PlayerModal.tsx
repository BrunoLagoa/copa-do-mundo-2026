import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../types';
import { generateStats, positionGradient, playerAvatarUrl } from '../utils/playerStats';

interface Props {
  player: Player;
  teamSlug: string;
  teamFlag: string;
  onClose: () => void;
}

export default function PlayerModal({ player, teamSlug, teamFlag, onClose }: Props) {
  const navigate = useNavigate();
  const stats = generateStats(player);
  const avatarUrl = playerAvatarUrl(player.name);
  const gradient = positionGradient(player.position);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on ESC + lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // iOS Safari fix
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [onClose]);

  function handleNavigate() {
    onClose();
    navigate(`/player/${teamSlug}/${player.number}`, {
      state: { player, teamSlug, teamFlag },
    });
  }

  const content = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .modal-card { animation: modalIn 0.22s ease-out both; }
      `}</style>

      {/* card: overflow-hidden apenas no conteúdo abaixo do avatar */}
      <div className="modal-card w-full max-w-sm rounded-2xl shadow-2xl bg-zinc-900 border border-zinc-700">

        {/* ── Header gradient by position ── */}
        <div className={`relative bg-gradient-to-br ${gradient} px-5 pt-5 pb-16 rounded-t-2xl`}>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Fechar"
          >
            ×
          </button>

          {/* Position badge */}
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-white/70 bg-white/10 px-2 py-0.5 rounded-full mb-2">
            {player.position}
          </span>

          {/* Name + flag */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-white leading-tight">{player.name}</h2>
              <p className="text-white/60 text-sm mt-0.5">{player.club}</p>
            </div>
            <span className="text-4xl leading-none ml-2">{teamFlag}</span>
          </div>
        </div>

        {/* ── Avatar (overlaps header — fora do overflow-hidden) ── */}
        <div className="flex justify-center -mt-11 mb-3 relative z-10">
          <div className="w-20 h-20 rounded-full border-4 border-zinc-900 overflow-hidden bg-zinc-700 shadow-xl">
            <img
              src={avatarUrl}
              alt={player.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback: initials circle
                const el = e.currentTarget;
                el.style.display = 'none';
                const parent = el.parentElement!;
                parent.innerHTML = `<span class="w-full h-full flex items-center justify-center text-2xl font-black text-white bg-zinc-600">${player.name.charAt(0)}</span>`;
              }}
            />
          </div>
        </div>

        {/* ── Jersey number ── */}
        <p className="text-center text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Camisa <span className="text-white font-black text-sm">#{player.number}</span>
        </p>

        {/* ── Stats ── */}
        <div className="px-5 mb-5">
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-3">Estatísticas projetadas</p>
          <div className="space-y-2.5">
            {stats.map((stat) => {
              const pct = Math.round((stat.value / stat.max) * 100);
              return (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-300 text-xs flex items-center gap-1.5">
                      <span>{stat.emoji}</span>
                      {stat.label}
                    </span>
                    <span className="text-white font-bold text-xs tabular-nums">
                      {stat.value}{stat.unit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="px-5 pb-5">
          <button
            onClick={handleNavigate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
          >
            Ver perfil completo →
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
