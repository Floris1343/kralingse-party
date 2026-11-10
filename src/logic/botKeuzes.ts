/**
 * Slimme maar snelle keuzes van de bots voor items (§11: alles direct, niets bevestigen).
 * - Kopen: alleen als ze daarna nog een ster kunnen betalen.
 * - Gebruiken: Ratjebel als Ratje een ster kan stelen, anders de beste dobbelsteen,
 *   Kies-je-worp als de ster binnen 10 vakjes ligt, de Wisseltruc als de ster ver weg is.
 * - Nachtwinkel (§8.1): ook alleen als er daarna nog een ster af kan. Gemene items gaan naar
 *   de speler op de 1e plaats (of de 2e, als de bot zelf eerste staat).
 */
import { vakje, type Bord } from './bord';
import { huidigType } from './dagNacht';
import { verschuif } from './effecten';
import type { GameState } from './gameState';
import {
  itemDoelen, itemInfo, kanItemGebruiken, kanKopen, WINKEL_ITEMS,
  SLAK_MAX, type DoelItem, type ItemSoort, type NachtItem, type WinkelItem,
} from './items';
import { plaatsen } from './regels';
import { kanRatjeDoen } from './ratje';
import { stappenTotSter } from './splitsing';
import { kanSterBetalen, sterPrijs } from './ster';

const KOOP_VOORKEUR: WinkelItem[] = ['driedubbel', 'dubbel', 'kiesWorp', 'ratjebel', 'wisseltruc'];
/** Vanaf zo ver weg van de ster gebruikt een bot de Wisseltruc. */
export const WISSELTRUC_AFSTAND = 15;

export function botItemKoop(s: GameState, _bord: Bord, speler: number): ItemSoort | null {
  const munten = s.spelers[speler].munten;
  return KOOP_VOORKEUR.find((i) => kanKopen(s, speler, i) && munten - WINKEL_ITEMS[i].prijs >= sterPrijs(s)) ?? null;
}

const NACHT_VOORKEUR: NachtItem[] = ['achteruitpet', 'slakkendobbel', 'valstrik', 'zakkenroller'];

/** Wat een bot in de Nachtwinkel koopt, of null. */
export function botNachtKoop(s: GameState, speler: number): NachtItem | null {
  const munten = s.spelers[speler].munten;
  return NACHT_VOORKEUR.find((i) => kanKopen(s, speler, i) && munten - itemInfo(i).prijs >= sterPrijs(s)) ?? null;
}

/**
 * Op wie een bot een gemeen item richt: de best geplaatste speler die het kan krijgen
 * (bij gelijke plaats de eerste in de lijst), of null als niemand kan.
 */
export function botItemDoel(s: GameState, speler: number, item: DoelItem): number | null {
  const doelen = itemDoelen(s, speler, item);
  if (doelen.length === 0) return null;
  const p = plaatsen(s);
  return doelen.reduce((a, b) => (p[b] < p[a] ? b : a));
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
  // Gemene items: zo snel mogelijk, dan werken ze het best tegen de koploper.
  if (kan('valstrik')) return 'valstrik';
  for (const i of ['achteruitpet', 'slakkendobbel', 'zakkenroller'] as const) {
    if (kan(i) && botItemDoel(s, speler, i) !== null) return i;
  }
  // Met de Achteruitpet: zo kort mogelijk lopen, dus geen extra dobbelstenen.
  if (s.spelers[speler].achteruit) return kan('kiesWorp') ? 'kiesWorp' : null;
  const afstand = afstandTotSter(s, bord, speler);
  if (kan('kiesWorp') && afstand <= 10 && kanSterBetalen(s, speler)) return 'kiesWorp';
  if (kan('driedubbel')) return 'driedubbel';
  if (kan('dubbel')) return 'dubbel';
  // In de mist weet een bot niet waar de ster is (afstand Infinity): dan geen Wisseltruc.
  if (kan('wisseltruc') && Number.isFinite(afstand) && afstand > WISSELTRUC_AFSTAND) return 'wisseltruc';
  return null;
}

/**
 * Het getal dat een bot kiest met Kies-je-worp: langs de ster, en dan het liefst eindigen
 * op een goed vakje. Ligt de ster te ver, dan 10.
 */
export function botKiesWorp(s: GameState, bord: Bord, speler: number): number {
  if (s.spelers[speler].achteruit) return 1;
  const max = s.spelers[speler].slak ? SLAK_MAX : 10;
  const afstand = afstandTotSter(s, bord, speler);
  if (afstand > max) return max;
  const goed = (n: number) => {
    const t = huidigType(s, vakje(bord, verschuif(bord, s.spelers[speler].vakje, n)));
    return t === 'blauw' ? 3 : t === 'item' ? 2 : t === 'rood' || t === 'pech' ? -1 : 0;
  };
  let beste = afstand;
  for (let n = afstand; n <= max; n++) if (goed(n) > goed(beste)) beste = n;
  return beste;
}
