/** Dag en nacht (§8): elke 3 rondes, en direct bij een lantaarnpaal. */
import type { Bord, Vakje, VakjeType } from './bord';
import type { GameState } from './gameState';

export const RONDES_PER_DAGDEEL = 3;

/** Moet het aan het begin van deze ronde omslaan? (Ronde 4, 7, 10, ...) */
export function wisseltBijRonde(ronde: number): boolean {
  return ronde > 1 && (ronde - 1) % RONDES_PER_DAGDEEL === 0;
}

/**
 * Zet dag en nacht om. Met de eindspelregel "eeuwige nacht" blijft het nacht.
 * Werkt op een kopie. Geeft true terug als het echt omsloeg.
 */
export function wisselDagNacht(s: GameState, reden: 'ronde' | 'lantaarnpaal'): boolean {
  if (s.eindspelRegel === 'eeuwigeNacht') return false;
  s.nacht = !s.nacht;
  s.verslag.push({ soort: 'dagNacht', nacht: s.nacht, reden });
  return true;
}

/** Het type van een vakje zoals het nu werkt: 's nachts worden de bosvakjes met `nachtRood` rood. */
export function huidigType(state: GameState, v: Vakje): VakjeType {
  if (state.nacht && v.type === 'blauw' && v.flags?.includes('nachtRood')) return 'rood';
  return v.type;
}

/** De vakjes die nu een ander type hebben dan op het bord staat (voor de weergave). */
export function nachtTypen(nacht: boolean, bord: Bord): Map<string, VakjeType> {
  const m = new Map<string, VakjeType>();
  if (nacht) for (const v of bord.vakjes) if (v.type === 'blauw' && v.flags?.includes('nachtRood')) m.set(v.id, 'rood');
  return m;
}
