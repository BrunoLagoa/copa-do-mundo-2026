/**
 * Som de gol — sintetizado na hora via Web Audio API (sem arquivo de áudio).
 *
 * Por que sintetizado: zero peso no bundle, funciona offline e não depende de
 * baixar mp3. Toca uma mini-fanfarra de comemoração: um arpejo ascendente que
 * resolve num acorde maior sustentado ("tá-rá-rá-rá-TÁÁÁ").
 *
 * Timbre: dois osciladores por nota (triangle dá corpo + square dá brilho),
 * passando por um filtro low-pass pra tirar a aspereza do square puro. Soa
 * festivo sem virar um beep estridente.
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

/** Toca uma nota com corpo (triangle) + brilho (square), via filtro low-pass. */
function playNote(
  c: AudioContext,
  out: AudioNode,
  freq: number,
  start: number,
  dur: number,
  peak: number,
): void {
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.025); // ataque rápido
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur); // decaimento suave
  gain.connect(out);

  for (const [type, level] of [['triangle', 1], ['square', 0.35]] as const) {
    const osc = c.createOscillator();
    const sub = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    sub.gain.value = level;
    osc.connect(sub).connect(gain);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
}

/**
 * Vibra o dispositivo em padrão de comemoração: "da-da-DAAAA".
 * Só funciona em Android (Chrome/Firefox). iOS/Safari ignora silenciosamente.
 */
export function vibrateGoal(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 500]);
  }
}

/** Toca a fanfarra de gol. Silencioso se o áudio não estiver disponível/destravado. */
export function playGoalSound(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();

  const now = c.currentTime + 0.02;

  // Filtro low-pass arredonda o brilho do square (tira a aspereza de beep).
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3200;
  const master = c.createGain();
  master.gain.value = 0.85;
  filter.connect(master).connect(c.destination);

  // Arpejo ascendente em dó maior: rápido e empolgante.
  const run = [523.25, 659.25, 783.99, 1046.5]; // C5 · E5 · G5 · C6
  const step = 0.1;
  run.forEach((f, i) => playNote(c, filter, f, now + i * step, 0.16, 0.22));

  // Resolve num acorde maior sustentado ("TÁÁÁ") — a comemoração.
  const chordAt = now + run.length * step;
  const chord = [523.25, 659.25, 783.99, 1046.5]; // C maior, duas oitavas
  chord.forEach((f) => playNote(c, filter, f, chordAt, 0.6, 0.16));
}
