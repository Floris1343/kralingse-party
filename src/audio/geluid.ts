/**
 * Alle geluid van het spel via de Web Audio API: het gebrabbel van Pommie en korte geluidjes
 * voor dobbelen, munten en de ster. Er zijn geen audiobestanden.
 *
 * Op de iPad mag geluid pas na een tik; daarom maakt het eerste `pointerdown` de audio wakker.
 * Werkt er geen audio (of staat het geluid uit), dan gebeurt er gewoon niets.
 */
import { brabbelPlan } from './gebrabbel';

const SLEUTEL = 'kralingse-plas-party/geluid';

let ctx: AudioContext | null = null;
let hoofd: GainNode | null = null;

export function geluidAan(): boolean {
  return localStorage.getItem(SLEUTEL) !== 'uit';
}

export function zetGeluid(aan: boolean): void {
  localStorage.setItem(SLEUTEL, aan ? 'aan' : 'uit');
}

function audio(): { ctx: AudioContext; uit: GainNode } | null {
  if (!geluidAan()) return null;
  try {
    if (!ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
      hoofd = ctx.createGain();
      hoofd.gain.value = 0.5;
      hoofd.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return { ctx, uit: hoofd! };
  } catch {
    return null;
  }
}

/** Maak de audio wakker bij de eerste tik (iOS). */
export function startGeluid(): void {
  const wakker = () => audio();
  document.addEventListener('pointerdown', wakker, { once: true, capture: true });
}

/** Eén toon met een korte aanzet en uitsterven. */
function toon(
  a: { ctx: AudioContext; uit: AudioNode },
  freq: number,
  start: number,
  duur: number,
  opties: { type?: OscillatorType; volume?: number; naar?: number } = {},
): void {
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = opties.type ?? 'triangle';
  osc.frequency.setValueAtTime(freq, start);
  if (opties.naar) osc.frequency.exponentialRampToValueAtTime(opties.naar, start + duur);
  const v = opties.volume ?? 0.4;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(v, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duur);
  osc.connect(g).connect(a.uit);
  osc.start(start);
  osc.stop(start + duur + 0.02);
}

/**
 * Pommie brabbelt een zin. `bijLetters` krijgt na elke blip hoeveel tekens er te zien zijn,
 * zodat de tekst meeloopt. Geeft een functie terug die het gebrabbel stopt.
 */
export function brabbel(tekst: string, bijLetters?: (n: number) => void): () => void {
  const plan = brabbelPlan(tekst);
  const a = audio();
  const timers: ReturnType<typeof setTimeout>[] = [];
  let filter: BiquadFilterNode | null = null;
  if (a) {
    // Laag en wat dof, als een beer: een lowpass-filter over een driehoeksgolf met wat blokgolf.
    filter = a.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(a.uit);
    const nu = a.ctx.currentTime + 0.03;
    for (const b of plan) {
      toon({ ctx: a.ctx, uit: filter }, b.toon, nu + b.start, b.duur, { type: 'triangle', volume: 0.55, naar: b.toon * 0.92 });
      toon({ ctx: a.ctx, uit: filter }, b.toon * 2, nu + b.start, b.duur * 0.8, { type: 'square', volume: 0.06 });
    }
  }
  if (bijLetters) for (const b of plan) timers.push(setTimeout(() => bijLetters(b.tekstTot), (b.start + b.duur) * 1000));
  return () => {
    timers.forEach(clearTimeout);
    if (filter && ctx) {
      // Meteen stil: het filter loskoppelen.
      try {
        filter.disconnect();
      } catch {
        /* al los */
      }
    }
  };
}

let laatsteMunt = 0;

/** Munten erbij (twee hoge tingeltjes) of eraf (een zakkend toontje). Niet vaker dan elke 120 ms. */
export function muntGeluid(erbij: boolean): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  if (nu - laatsteMunt < 0.12) return;
  laatsteMunt = nu;
  if (erbij) {
    toon(a, 988, nu, 0.08, { type: 'square', volume: 0.12 });
    toon(a, 1319, nu + 0.07, 0.22, { type: 'square', volume: 0.12 });
  } else {
    toon(a, 520, nu, 0.25, { type: 'triangle', volume: 0.3, naar: 260 });
  }
}

/** Tik op het dobbelblok: een doffe bonk met een klikje. */
export function dobbelGeluid(): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  toon(a, 180, nu, 0.16, { type: 'sine', volume: 0.7, naar: 60 });
  toon(a, 2200, nu, 0.03, { type: 'square', volume: 0.05 });
}

let ruisBuffer: AudioBuffer | null = null;

/** Een halve seconde witte ruis, één keer gemaakt (voor het woesj). */
function ruis(c: AudioContext): AudioBuffer {
  if (!ruisBuffer || ruisBuffer.sampleRate !== c.sampleRate) {
    ruisBuffer = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate);
    const d = ruisBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ruisBuffer;
}

/**
 * Het blok versnelt: een stijgend woesj (ruis door een filter dat omhoog schuift),
 * dat bij het afremmen weer zakt en wegsterft. `versnel` en `rest` in seconden.
 */
export function woesjGeluid(versnel: number, rest: number): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  const bron = a.ctx.createBufferSource();
  bron.buffer = ruis(a.ctx);
  bron.loop = true;
  const filter = a.ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.4;
  filter.frequency.setValueAtTime(350, nu);
  filter.frequency.exponentialRampToValueAtTime(2600, nu + versnel);
  filter.frequency.exponentialRampToValueAtTime(500, nu + versnel + rest);
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, nu);
  g.gain.exponentialRampToValueAtTime(0.32, nu + versnel);
  g.gain.exponentialRampToValueAtTime(0.0001, nu + versnel + rest);
  bron.connect(filter).connect(g).connect(a.uit);
  bron.start(nu);
  bron.stop(nu + versnel + rest + 0.05);
}

/** Het blok klikt vast: een droog houten "tok". */
export function tokGeluid(): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  toon(a, 900, nu, 0.07, { type: 'sine', volume: 0.6, naar: 520 });
  toon(a, 1800, nu, 0.025, { type: 'triangle', volume: 0.15 });
}

/** De uitslag van de worp: een kort opwaarts toontje. */
export function worpGeluid(hoog: boolean): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  const tonen = hoog ? [523, 659, 784, 1047] : [440, 523];
  tonen.forEach((f, i) => toon(a, f, nu + i * 0.06, 0.14, { type: 'triangle', volume: 0.3 }));
}

/** Een ster gekocht of gekregen: een fonkelend loopje omhoog. */
export function sterGeluid(): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  [1047, 1319, 1568, 2093, 2637].forEach((f, i) => toon(a, f, nu + i * 0.07, 0.3, { type: 'triangle', volume: 0.22 }));
  toon(a, 3136, nu + 0.4, 0.5, { type: 'sine', volume: 0.12 });
}

/** De winnaar: een klein fanfaretje. */
export function fanfare(): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  const noten: [number, number, number][] = [[523, 0, 0.14], [523, 0.16, 0.14], [523, 0.32, 0.14], [659, 0.48, 0.5], [587, 1.0, 0.2], [659, 1.2, 0.2], [784, 1.4, 0.7]];
  for (const [f, t, d] of noten) {
    toon(a, f, nu + t, d, { type: 'square', volume: 0.1 });
    toon(a, f / 2, nu + t, d, { type: 'triangle', volume: 0.25 });
  }
}

let laatsteTik = 0;

/** Eén tikje bij het tellen van de munten: hoog als er munten bij komen, lager als ze eraf gaan. */
export function muntTik(erbij: boolean): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  if (nu - laatsteTik < 0.045) return;
  laatsteTik = nu;
  if (erbij) toon(a, 1760 + Math.random() * 300, nu, 0.05, { type: 'square', volume: 0.06 });
  else toon(a, 330 - Math.random() * 40, nu, 0.06, { type: 'triangle', volume: 0.18 });
}

/** Een ster gekocht: een korte fanfare met een fonkel erachteraan. */
export function sterFanfare(): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  const noten: [number, number, number][] = [[784, 0, 0.12], [988, 0.12, 0.12], [1175, 0.24, 0.12], [1568, 0.36, 0.45]];
  for (const [f, t, d] of noten) {
    toon(a, f, nu + t, d, { type: 'square', volume: 0.09 });
    toon(a, f / 2, nu + t, d, { type: 'triangle', volume: 0.22 });
  }
  [2093, 2637, 3136].forEach((f, i) => toon(a, f, nu + 0.5 + i * 0.06, 0.25, { type: 'sine', volume: 0.1 }));
}

/** De ster vliegt weg: een dalende toon, sip. */
export function sterKwijtGeluid(): void {
  const a = audio();
  if (!a) return;
  const nu = a.ctx.currentTime;
  toon(a, 880, nu, 0.7, { type: 'triangle', volume: 0.28, naar: 220 });
  toon(a, 440, nu + 0.1, 0.6, { type: 'sine', volume: 0.15, naar: 110 });
}
