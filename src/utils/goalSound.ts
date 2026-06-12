/**
 * Som de gol — sintetizado na hora via Web Audio API (sem arquivo de áudio).
 *
 * Por que sintetizado: zero peso no bundle, funciona offline e não depende de
 * baixar mp3. Toca um jingle curto e ascendente ("tá- rá-rá-RÁ").
 *
 * Regra dos navegadores: áudio só toca após um gesto do usuário. Por isso
 * `unlockGoalSound()` deve ser chamado dentro de um clique (ao ativar os
 * alertas) — aí `playGoalSound()` funciona depois, mesmo de forma assíncrona.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Destrava o áudio num gesto do usuário (necessário p/ tocar depois). */
export function unlockGoalSound(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

/** Toca o jingle de gol. Silencioso se o áudio não estiver disponível/destravado. */
export function playGoalSound(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();

  const now = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 · E5 · G5 · C6
  for (let i = 0; i < notes.length; i++) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square'; // timbre "retrô", alegre e bem audível
    osc.frequency.value = notes[i];
    const t = now + i * 0.12;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }
}
