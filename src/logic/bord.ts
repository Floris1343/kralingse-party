/**
 * Het bord: vakjes, routes en sterplekken.
 * Het echte bord komt later uit `src/data/board.json`; voor nu is er een klein testbord.
 */

export type VakjeType = 'start' | 'blauw' | 'rood' | 'event' | 'item' | 'kans' | 'pech' | 'hertenkamp';

export interface Vakje {
  id: string;
  /** Bordcoördinaten 0–1000. */
  x: number;
  y: number;
  type: VakjeType;
  /** De vakjes waar je hierna heen kunt. Meer dan één = splitsing. */
  next: string[];
  zone?: string;
  flags?: string[];
}

export interface Sterplek {
  id: string;
  naam: string;
  /** Langs dit vakje lopen = langs de ster lopen. */
  vakje: string;
}

export interface Bord {
  start: string;
  vakjes: Vakje[];
  sterplekken: Sterplek[];
}

const opzoekCache = new WeakMap<Bord, Map<string, Vakje>>();

export function vakje(bord: Bord, id: string): Vakje {
  let kaart = opzoekCache.get(bord);
  if (!kaart) {
    kaart = new Map(bord.vakjes.map((v) => [v.id, v]));
    opzoekCache.set(bord, kaart);
  }
  const v = kaart.get(id);
  if (!v) throw new Error(`Onbekend vakje: ${id}`);
  return v;
}

/** Het volgende vakje op de route. Splitsingen komen in een latere stap; nu geldt de eerste route. */
export function volgendVakje(bord: Bord, id: string): string {
  const v = vakje(bord, id);
  if (v.next.length === 0) throw new Error(`Vakje ${id} heeft geen vervolg`);
  return v.next[0];
}

/** Klein rondje van 12 vakjes met 3 sterplekken, om de spelregels mee te testen. */
export function maakTestbord(): Bord {
  const typen: VakjeType[] = [
    'start', 'blauw', 'blauw', 'rood', 'blauw', 'event',
    'blauw', 'blauw', 'rood', 'blauw', 'blauw', 'blauw',
  ];
  const n = typen.length;
  const vakjes: Vakje[] = typen.map((type, i) => {
    const hoek = (i / n) * Math.PI * 2;
    return {
      id: `v${i}`,
      x: Math.round(500 + 400 * Math.sin(hoek)),
      y: Math.round(500 - 400 * Math.cos(hoek)),
      type,
      next: [`v${(i + 1) % n}`],
    };
  });
  return {
    start: 'v0',
    vakjes,
    sterplekken: [
      { id: 'noord', naam: 'Noord', vakje: 'v2' },
      { id: 'oost', naam: 'Oost', vakje: 'v6' },
      { id: 'west', naam: 'West', vakje: 'v10' },
    ],
  };
}
