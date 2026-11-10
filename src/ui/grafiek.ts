/**
 * De lijngrafiek "Sterren per ronde" van het eindscherm, in de stijl van chart.svg uit het design:
 * gestippelde hulplijnen, dikke ronde lijnen in de kleur van elk figuur en een merkteken in de
 * vorm van het figuur (cirkel, driehoek, vierkant, ruit).
 */
import type { Figuur } from '../data/figuren';

export const GRAFIEK_BREEDTE = 492;
export const GRAFIEK_HOOGTE = 168;
const MARGE = 10;

export interface GrafiekLijn {
  figuur: Figuur;
  /** Sterren na ronde 1, 2, 3, ... */
  waarden: number[];
}

/** De getallen langs de y-as, van boven naar beneden: 5, 4, ... 0 (of in stappen van 2 als het veel wordt). */
export function grafiekSchaal(lijnen: GrafiekLijn[]): { max: number; stappen: number[] } {
  const hoogste = Math.max(5, ...lijnen.flatMap((l) => l.waarden));
  const stap = hoogste > 6 ? 2 : 1;
  const max = Math.ceil(hoogste / stap) * stap;
  const stappen: number[] = [];
  for (let v = max; v >= 0; v -= stap) stappen.push(v);
  return { max, stappen };
}

/** De punten van één lijn in grafiekpixels. Lijnen die over elkaar vallen, schuiven 2 px uit elkaar. */
export function grafiekPunten(waarden: number[], max: number, rondes: number, nummer = 0, aantal = 1): [number, number][] {
  const b = GRAFIEK_BREEDTE - 2 * MARGE;
  const h = GRAFIEK_HOOGTE - 2 * MARGE;
  const uit = (nummer - (aantal - 1) / 2) * 2;
  return waarden.map((v, i) => [
    MARGE + (rondes > 1 ? (i / (rondes - 1)) * b : b / 2),
    MARGE + h - (v / max) * h + uit,
  ]);
}

const f = (n: number) => n.toFixed(1);

function merk(vorm: Figuur['vorm'], x: number, y: number, kleur: string): string {
  switch (vorm) {
    case 'driehoek':
      return `<path d="M${f(x)} ${f(y - 6.5)} L${f(x + 6.8)} ${f(y + 5.2)} L${f(x - 6.8)} ${f(y + 5.2)} Z" fill="${kleur}" stroke="${kleur}" stroke-width="3" stroke-linejoin="round"/>`;
    case 'vierkant':
      return `<rect x="${f(x - 5.5)}" y="${f(y - 5.5)}" width="11" height="11" rx="2" fill="${kleur}"/>`;
    case 'ruit':
      return `<path d="M${f(x)} ${f(y - 7)} L${f(x + 7)} ${f(y)} L${f(x)} ${f(y + 7)} L${f(x - 7)} ${f(y)} Z" fill="${kleur}" stroke="${kleur}" stroke-width="2" stroke-linejoin="round"/>`;
    default:
      return `<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="${kleur}"/>`;
  }
}

/** De grafiek als SVG. `rondes` = hoeveel rondes er gespeeld zijn. */
export function sterrenGrafiek(lijnen: GrafiekLijn[], rondes: number): string {
  const { max, stappen } = grafiekSchaal(lijnen);
  const hulp = stappen
    .map((v) => {
      const y = grafiekPunten([v], max, 1)[0][1];
      return `<path d="M${MARGE} ${f(y)} H${GRAFIEK_BREEDTE - MARGE}" stroke="#E3CFAE" stroke-width="${v === 0 ? 2 : 1.2}" stroke-dasharray="${v === 0 ? '' : '4 5'}"/>`;
    })
    .join('');
  const lijnSvg = lijnen
    .map((l, n) => {
      const p = grafiekPunten(l.waarden, max, rondes, n, lijnen.length);
      if (p.length === 0) return '';
      const lijn = `<polyline points="${p.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" fill="none" stroke="${l.figuur.kleur}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      return lijn + p.map(([x, y]) => merk(l.figuur.vorm, x, y, l.figuur.kleurDonker)).join('');
    })
    .join('');
  return `<svg class="grafiek" width="${GRAFIEK_BREEDTE}" height="${GRAFIEK_HOOGTE}" viewBox="0 0 ${GRAFIEK_BREEDTE} ${GRAFIEK_HOOGTE}" role="img" aria-label="Lijngrafiek van het aantal sterren per speler per ronde">${hulp}${lijnSvg}</svg>`;
}
