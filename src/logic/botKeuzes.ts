/**
 * Slimme maar snelle keuzes van de bots voor items (§11: alles direct, niets bevestigen).
 * - Kopen: alleen als ze daarna nog een ster kunnen betalen.
 * - Gebruiken: Ratjebel als Ratje een ster kan stelen, anders de beste dobbelsteen,
 *   Kies-je-worp als de ster binnen 10 vakjes ligt, de Wisseltruc als de ster ver weg is.
 */
import { vakje, type Bord } from './bord';
import { huidigType } from './dagNacht';
import { verschuif } from './effecten';
import type { GameState } from './gameState';
import { kanItemGebruiken, kanKopen, WINKEL_ITEMS, type ItemSoort } from './items';
import { kanRatjeDoen } from './ratje';
import { stappenTotSter } from './splitsing';
import { kanSterBetalen, sterPrijs } from './ster';

const KOOP_VOORKEUR: ItemSoort[] = ['driedubbel', 'dubbel', 'kiesWorp', 'ratjebel', 'wisseltruc'];
/** Vanaf zo ver weg van de ster gebruikt een bot de Wisseltruc. */
export const WISSELTRUC_AFSTAND = 15;

export function botItemKoop(s: GameState, _bord: Bord, speler: number): ItemSoort | null {
  const munten = s.spelers[speler].munten;
  return KOOP_VOORKEUR.find((i) => kanKopen(s, speler, i) && munten - WINKEL_ITEMS[i].prijs >= sterPrijs(s)) ?? null;
}

/** Afstand tot de dichtstbijzijnde ster vanaf het vakje van de speler (0 telt niet: daar sta je al). */
function afstandTotSter(s: GameState, bord: Bord, speler: number): number {
  const id = s.spelers[speler].vakje;
  const d = stappenTotSter(s, bord, id);
  if (d > 0) return d;
  return 1 + stappenTotSter(s, bord, verschuif(bord, id, 1));
}

/** Welk item een bot aan het begin van zijn beurt gebruikt, of null. */
export function botItemGebruik(s: GameState, bord: Bord, speler: number): ItemSoort | null {
  const items = s.spelers[speler].items;
  const kan = (i: ItemSoort) => items.includes(i) && kanItemGebruiken(s, i);
  if (kan('ratjebel') && kanRatjeDoen(s, speler, 'ster')) return 'ratjebel';
  const afstand = afstandTotSter(s, bord, speler);
  if (kan('kiesWorp') && afstand <= 10 && kanSterBetalen(s, speler)) return 'kiesWorp';
  if (kan('driedubbel')) return 'driedubbel';
  if (kan('dubbel')) return 'dubbel';
  if (kan('wisseltruc') && afstand > WISSELTRUC_AFSTAND) return 'wisseltruc';
  return null;
}

/**
 * Het getal dat een bot kiest met Kies-je-worp: langs de ster, en dan het liefst eindigen
 * op een goed vakje. Ligt de ster te ver, dan 10.
 */
export function botKiesWorp(s: GameState, bord: Bord, speler: number): number {
  const afstand = afstandTotSter(s, bord, speler);
  if (afstand > 10) return 10;
  const goed = (n: number) => {
    const t = huidigType(s, vakje(bord, verschuif(bord, s.spelers[speler].vakje, n)));
    return t === 'blauw' ? 3 : t === 'item' ? 2 : t === 'rood' || t === 'pech' ? -1 : 0;
  };
  let beste = afstand;
  for (let n = afstand; n <= 10; n++) if (goed(n) > goed(beste)) beste = n;
  return beste;
}
