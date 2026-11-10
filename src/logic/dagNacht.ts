/**
 * Dag en nacht (§8): elke 3 rondes, en direct bij een lantaarnpaal.
 * Wordt het dag, dan verdwijnt de vallende ster (§8.2) en kan er ochtendmist komen (§8.4).
 */
import type { Bord, Vakje, VakjeType } from './bord';
import type { GameState } from './gameState';
import { trek } from './regels';

export const RONDES_PER_DAGDEEL = 3;
/** Kans (in procenten) op ochtendmist als het dag wordt. */
export const MIST_KANS = 50;

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
  if (s.nacht) {
    wisMist(s);
  } else {
    for (const st of s.sterren.filter((st) => st.vallend)) s.verslag.push({ soort: 'vallendeSterWeg', plek: st.plek });
    s.sterren = s.sterren.filter((st) => !st.vallend);
    if (trek(s, 1, 100) <= MIST_KANS) {
      // Na één volledige ronde trekt de mist op. Begint hij midden in een ronde (lantaarnpaal),
      // dan telt die ronde nog niet mee.
      s.mist = { totRonde: s.ronde + (reden === 'ronde' ? 1 : 2) };
      s.verslag.push({ soort: 'mist', aan: true });
    }
  }
  return true;
}

/** De mist trekt op: iedereen ziet de ster weer. Werkt op een kopie. */
export function wisMist(s: GameState): void {
  if (!s.mist) return;
  s.mist = null;
  for (const st of s.sterren) delete st.ontdekt;
  s.verslag.push({ soort: 'mist', aan: false });
}

/**
 * Het type van een vakje zoals het nu werkt: 's nachts worden de bosvakjes met `nachtRood` rood
 * en die met `nachtVleermuis` vleermuisvakjes.
 */
export function huidigType(state: GameState, v: Vakje): VakjeType {
  return (state.nacht && nachtType(v)) || v.type;
}

function nachtType(v: Vakje): VakjeType | null {
  if (v.type !== 'blauw') return null;
  if (v.flags?.includes('nachtRood')) return 'rood';
  if (v.flags?.includes('nachtVleermuis')) return 'vleermuis';
  return null;
}

/** De vakjes die nu een ander type hebben dan op het bord staat (voor de weergave). */
export function nachtTypen(nacht: boolean, bord: Bord): Map<string, VakjeType> {
  const m = new Map<string, VakjeType>();
  if (nacht) {
    for (const v of bord.vakjes) {
      const t = nachtType(v);
      if (t) m.set(v.id, t);
    }
  }
  return m;
}
