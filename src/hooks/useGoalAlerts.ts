/**
 * Alerta de gol — notificação do navegador quando sai gol num jogo ao vivo.
 *
 * 100% client-side: observa o mapa de placares do useLiveScores a cada
 * atualização e, quando o total de gols de um jogo AO VIVO sobe, dispara uma
 * Notification. Funciona mesmo com a aba em segundo plano (esse é o ganho).
 *
 * Sem servidor/push real: depende do poll de 60s do useLiveScores. A preferência
 * (ligado/desligado) fica no localStorage; o usuário ativa por um botão (a
 * permissão de Notification exige gesto do usuário).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveScoresState } from './useLiveScores';
import { playGoalSound, unlockGoalSound } from '../utils/goalSound';

const STORAGE_KEY = 'copa2026:goal-alerts:v1';

export interface GoalAlertsState {
  supported: boolean;
  permission: NotificationPermission;
  enabled: boolean;
  /** Liga (pedindo permissão se preciso) ou desliga os alertas. */
  toggle: () => void;
}

type NameMap = Record<string, { home: string; away: string }>;

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useGoalAlerts(live: LiveScoresState, names: NameMap): GoalAlertsState {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  );
  const [enabled, setEnabled] = useState(() => supported && readEnabled());

  // Refs p/ ler valores atuais sem re-rodar o efeito de detecção a cada render.
  const liveRef = useRef(live);
  const namesRef = useRef(names);
  const totalsRef = useRef<Map<string, number>>(new Map());

  // Mantém os refs em dia (em efeito, não no render) — roda antes da detecção.
  useEffect(() => {
    liveRef.current = live;
    namesRef.current = names;
  });

  // Detecta gols a cada atualização do placar (chave: live.lastUpdated).
  useEffect(() => {
    const cur = liveRef.current;
    const map = namesRef.current;
    const prev = totalsRef.current;
    const active = enabled && permission === 'granted';

    for (const id of Object.keys(map)) {
      const s = cur.getLive(id);
      if (!s || (!s.isLive && !s.isFinished)) continue;
      const total = s.home + s.away;
      const before = prev.get(id);
      // Só alerta quando: já havia baseline, o jogo está ao vivo e o total subiu.
      if (active && before !== undefined && s.isLive && total > before) {
        const t = map[id];
        playGoalSound(); // som mesmo se a notificação for bloqueada
        try {
          new Notification('⚽ GOL!', {
            body: `${t.home} ${s.home} × ${s.away} ${t.away}${s.clock ? ` · ${s.clock}` : ''}`,
            tag: `goal-${id}`,
            icon: `${import.meta.env.BASE_URL}favicon.svg`,
          });
        } catch {
          /* navegador pode bloquear — ignora silenciosamente */
        }
      }
      prev.set(id, total);
    }
  }, [live.lastUpdated, enabled, permission]);

  const toggle = useCallback(() => {
    if (!supported) return;
    if (enabled) {
      setEnabled(false);
      try {
        localStorage.setItem(STORAGE_KEY, '0');
      } catch {
        /* ignora */
      }
      return;
    }
    // O clique é o gesto que destrava o áudio (exigência dos navegadores).
    unlockGoalSound();
    const enable = () => {
      setEnabled(true);
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignora */
      }
      playGoalSound(); // confirmação imediata: o usuário ouve que está ligado
    };
    if (permission === 'granted') {
      enable();
    } else {
      void Notification.requestPermission().then((p) => {
        setPermission(p);
        if (p === 'granted') enable();
      });
    }
  }, [supported, enabled, permission]);

  return { supported, permission, enabled, toggle };
}
