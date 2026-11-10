/**
 * Het bord: vakjes, routes en sterplekken.
 * Het echte bord staat in `src/data/board.json`; voor de tests is er ook een klein testbord.
 */

export type VakjeType =
  | 'start' | 'blauw' | 'rood' | 'event' | 'item' | 'kans' | 'pech'
  | 'hertenkamp' | 'boot' | 'ijs';

/** Extra eigenschappen van een vakje: 's nachts anders, of welk event het is. */
export type VakjeVlag =
  | 'nachtRood' | 'nachtVleermuis'
  | 'lantaarnpaal' | 'strandtent' | 'windvlaag' | 'zeilwedstrijd';

export interface Vakje {
  id: string;
  /** Bordcoördinaten: pixels van het design-bord (1180 × 820). Het punt is het midden van de bovenkant. */
  x: number;
  y: number;
  type: VakjeType;
  /** De vakjes waar je hierna heen kunt. Meer dan één = splitsing. */
  next: string[];
  zone: string;
  flags?: VakjeVlag[];
}

export type SplitsingSoort = 'hertenkamp' | 'boot' | 'ijspad';

export interface Splitsing {
  /** Op dit vakje kies je. */
  vakje: string;
  soort: SplitsingSoort;
  /** Gewoon doorlopen. */
  hoofdpad: string;
  /** Het hertenkamp-pad, de boot of het ijspad. */
  zijpad: string;
}

export interface Sterplek {
  id: string;
  naam: string;
  /** Langs dit vakje lopen = langs de ster lopen. */
  vakje: string;
  /** Waar de ster staat (naast het pad). */
  x: number;
  y: number;
}

export interface Plek {
  vakje: string;
  x: number;
  y: number;
}

export interface BordLabel {
  tekst: string;
  x: number;
  y: number;
  /** true = het label hangt onder het punt, anders erboven. */
  onder: boolean;
}

export interface Bord {
  breedte: number;
  hoogte: number;
  start: string;
  vakjes: Vakje[];
  splitsingen: Splitsing[];
  sterplekken: Sterplek[];
  plekken: { winkel: Plek; nachtwinkel: Plek; ratje: Plek };
  labels: BordLabel[];
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

export function splitsingBij(bord: Bord, id: string): Splitsing | undefined {
  return bord.splitsingen.find((s) => s.vakje === id);
}

/**
 * Het volgende vakje op de route. Bij een splitsing kies je met `zijpad` het hertenkamp-pad,
 * de boot of het ijspad; anders loop je gewoon het hoofdpad.
 */
export function volgendVakje(bord: Bord, id: string, zijpad = false): string {
  const splitsing = splitsingBij(bord, id);
  if (splitsing) return zijpad ? splitsing.zijpad : splitsing.hoofdpad;
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
      zone: 'test',
    };
  });
  const plek = (v: string): Plek => ({ vakje: v, x: 500, y: 500 });
  return {
    breedte: 1000,
    hoogte: 1000,
    start: 'v0',
    vakjes,
    splitsingen: [],
    sterplekken: [
      { id: 'noord', naam: 'Noord', vakje: 'v2', x: 500, y: 150 },
      { id: 'oost', naam: 'Oost', vakje: 'v6', x: 850, y: 500 },
      { id: 'west', naam: 'West', vakje: 'v10', x: 150, y: 500 },
    ],
    plekken: { winkel: plek('v4'), nachtwinkel: plek('v8'), ratje: plek('v9') },
    labels: [],
  };
}
