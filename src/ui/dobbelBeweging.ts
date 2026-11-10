/**
 * De beweging van het dobbelblok, zonder DOM (en dus te testen).
 *
 * Het blok draait om twee assen: om de Y-as (links-rechts) en, wat trager, om de X-as (voorover).
 * Rustig draaien: een vaste snelheid. Na een tik plannen we in één keer de hele worp:
 *   versnellen (soepel, zonder schok) → even op topsnelheid → afremmen → net te ver → terugveren.
 * De hoek is een formule van de tijd. Zo loopt het op elk scherm even soepel, ook als er
 * een beeldje wegvalt, en eindigt het blok precies met het voorvlak recht naar je toe.
 */

/** Hoe het blok staat als het stilligt: het voorvlak naar je toe, net schuin zodat je het blok ziet. */
export const RUST_X = -14;
export const RUST_Y = -18;

/** De tijden van één worp, in seconden (vanaf de tik). */
export interface WorpTijden {
  /** Versnellen tot topsnelheid. */
  versnel: number;
  /** Op topsnelheid. */
  top: number;
  /** Afremmen tot (net voorbij) de uitkomst. */
  rem: number;
  /** Terugveren naar de uitkomst. */
  veer: number;
}

export const WORP_MENS: WorpTijden = { versnel: 0.4, top: 0.12, rem: 0.48, veer: 0.16 };
export const WORP_BOT: WorpTijden = { versnel: 0.15, top: 0.05, rem: 0.27, veer: 0.1 };

export const worpDuur = (t: WorpTijden) => t.versnel + t.top + t.rem + t.veer;

const smooth = (u: number) => u * u * (3 - 2 * u);

/**
 * De vorm van de extra snelheid (0 → 1 → 0), en de oppervlakte eronder tot tijd t.
 * Versnellen met een smoothstep (begint en eindigt zacht), afremmen met (1-u)².
 */
function extraOpp(t: number, w: WorpTijden): number {
  const { versnel: a, top: c, rem: d } = w;
  if (t <= 0) return 0;
  if (t < a) {
    const u = t / a;
    return a * (u ** 3 - u ** 4 / 2);
  }
  const naVersnel = a / 2;
  if (t < a + c) return naVersnel + (t - a);
  const u = Math.min(1, (t - a - c) / d);
  return naVersnel + c + (d * (1 - (1 - u) ** 3)) / 3;
}

/** De rustige snelheid loopt door tot het afremmen en sterft dan mee uit. Oppervlakte tot t. */
function rustOpp(t: number, w: WorpTijden): number {
  const { versnel: a, top: c, rem: d } = w;
  if (t < a + c) return t; // ook vóór de tik: gewoon rustig doordraaien
  const u = Math.min(1, (t - a - c) / d);
  return a + c + (d * (1 - (1 - u) ** 3)) / 3;
}

/** Het plan voor één as. */
export interface AsPlan {
  start: number;
  rust: number; // graden per seconde in rust
  extra: number; // extra graden per seconde op topsnelheid
  doel: number; // waar de as eindigt
  over: number; // hoe ver hij er net voorbij schiet
}

/**
 * Plan één as: begin op `start` met snelheid `rust`, eindig op een hoek die gelijk is aan
 * `rustHoek` (modulo 360), met een topsnelheid zo dicht mogelijk bij `extraWens`.
 */
export function planAs(start: number, rust: number, extraWens: number, rustHoek: number, over: number, w: WorpTijden): AsPlan {
  const eind = worpDuur(w) - w.veer;
  const opp = extraOpp(eind, w);
  const rustDeel = rust * rustOpp(eind, w);
  const vrij = start + rustDeel + extraWens * opp + over; // waar hij uit zichzelf zou eindigen
  // De dichtstbijzijnde goede eindhoek, maar nooit zo dichtbij dat hij bijna niet versnelt.
  let doel = rustHoek + 360 * Math.round((vrij - over - rustHoek) / 360);
  while ((doel + over - start - rustDeel) / opp < extraWens * 0.5) doel += 360;
  const extra = (doel + over - start - rustDeel) / opp;
  return { start, rust, extra, doel, over };
}

/** De hoek van een as op tijd t (seconden na de tik). */
export function hoekOp(p: AsPlan, t: number, w: WorpTijden): number {
  const eind = worpDuur(w) - w.veer;
  if (t >= worpDuur(w)) return p.doel;
  if (t > eind) {
    const u = (t - eind) / w.veer;
    return p.doel + p.over * (1 - smooth(u)); // terugveren
  }
  return p.start + p.rust * rustOpp(t, w) + p.extra * extraOpp(t, w);
}

/** De snelheid (graden per seconde) op tijd t, voor de vervaging en het geluid. */
export function snelheidOp(p: AsPlan, t: number, w: WorpTijden): number {
  const h = 1 / 240;
  return (hoekOp(p, t + h, w) - hoekOp(p, t - h, w)) / (2 * h);
}

/**
 * Naar welke kant kijken de zes vlakken? Geeft per vlak hoeveel het naar je toe wijst
 * (1 = recht naar je toe, 0 = opzij, −1 = van je af), bij `rotateX(x) rotateY(y)`.
 * De volgorde van de vlakken: voor, rechts, achter, links, boven, onder.
 */
export function naarJeToe(xGraden: number, yGraden: number): number[] {
  const a = (xGraden * Math.PI) / 180;
  const b = (yGraden * Math.PI) / 180;
  const zx = -Math.cos(a) * Math.sin(b);
  const zy = Math.sin(a);
  const zz = Math.cos(a) * Math.cos(b);
  return [zz, zx, -zz, -zx, -zy, zy];
}
