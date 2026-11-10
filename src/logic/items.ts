/**
 * Items (§7.1): kopen in de winkel bij het Restaurant (alleen overdag), krijgen op een
 * itemvakje of bij de herten, en gebruiken vóór het dobbelen (één item per beurt).
 */
import type { GameState } from './gameState';
import { kanRatjeInhuren } from './ratje';
import { kies, metKopie, spelerAanZet, vereisFase, wijzigMunten } from './regels';

export type ItemSoort = 'dubbel' | 'driedubbel' | 'kiesWorp' | 'wisseltruc' | 'ratjebel';

export const MAX_ITEMS = 3;
/** Wie al 3 items heeft en er een krijgt, krijgt deze munten (§6.5). */
export const VOLLE_ZAK_MUNTEN = 5;

export interface ItemInfo {
  naam: string;
  prijs: number;
  uitleg: string;
}

/** De items van de gewone winkel, in de volgorde van de winkel. */
export const WINKEL_ITEMS: Record<ItemSoort, ItemInfo> = {
  dubbel: { naam: 'Dubbele dobbelsteen', prijs: 5, uitleg: 'Gooi twee keer en tel de ogen op.' },
  driedubbel: { naam: 'Driedubbele dobbelsteen', prijs: 10, uitleg: 'Gooi drie keer en tel de ogen op.' },
  kiesWorp: { naam: 'Kies-je-worp', prijs: 6, uitleg: 'Kies zelf hoeveel stappen je loopt (1 tot 10).' },
  wisseltruc: { naam: 'Wisseltruc', prijs: 7, uitleg: 'Ruil van plek met een willekeurige andere speler.' },
  ratjebel: { naam: 'Ratjebel', prijs: 8, uitleg: 'Ratje komt naar je toe. Je betaalt wel zijn gewone prijs.' },
};

export const ITEM_SOORTEN = Object.keys(WINKEL_ITEMS) as ItemSoort[];

/** Hoeveel dobbelstenen je gooit met dit item (1 = gewoon). */
export function aantalDobbelstenen(item: ItemSoort | undefined): number {
  return item === 'dubbel' ? 2 : item === 'driedubbel' ? 3 : 1;
}

/** Een gratis willekeurig item (itemvakje, herten). Heb je er al 3, dan 5 munten. Werkt op een kopie. */
export function geefGratisItem(s: GameState, speler: number): void {
  const sp = s.spelers[speler];
  if (sp.items.length >= MAX_ITEMS) {
    wijzigMunten(s, speler, VOLLE_ZAK_MUNTEN, 'item');
    return;
  }
  const item = kies(s, ITEM_SOORTEN);
  sp.items.push(item);
  s.verslag.push({ soort: 'item', speler, item, actie: 'gekregen' });
}

// ------------------------------------------------------------------ winkel

/** Is de winkel bij het Restaurant open? 's Nachts is hij dicht (§7.1). */
export function winkelOpen(state: GameState): boolean {
  return !state.nacht;
}

/** Kan deze speler nu iets kopen (plek in de zak en genoeg munten voor het goedkoopste)? */
export function kanIetsKopen(state: GameState, speler: number): boolean {
  const sp = state.spelers[speler];
  const goedkoopste = Math.min(...ITEM_SOORTEN.map((i) => WINKEL_ITEMS[i].prijs));
  return sp.items.length < MAX_ITEMS && sp.munten >= goedkoopste;
}

export function kanKopen(state: GameState, speler: number, item: ItemSoort): boolean {
  const sp = state.spelers[speler];
  return sp.items.length < MAX_ITEMS && sp.munten >= WINKEL_ITEMS[item].prijs;
}

/** Koopt een item. Werkt op een kopie. */
export function koopItem(s: GameState, speler: number, item: ItemSoort): void {
  if (!kanKopen(s, speler, item)) throw new Error('Dit item kun je nu niet kopen');
  wijzigMunten(s, speler, -WINKEL_ITEMS[item].prijs, 'winkel');
  s.spelers[speler].items.push(item);
  s.verslag.push({ soort: 'item', speler, item, actie: 'gekocht' });
}

// ------------------------------------------------------------------ gebruiken

/** Mag de speler die aan zet is dit item nu gebruiken? */
export function kanItemGebruiken(state: GameState, item: ItemSoort): boolean {
  if (state.fase.soort !== 'dobbelen' || state.fase.gebruikt) return false;
  const speler = spelerAanZet(state);
  if (!state.spelers[speler].items.includes(item)) return false;
  if (item === 'ratjebel') return kanRatjeInhuren(state, speler);
  return true;
}

/**
 * Gebruikt een item vóór het dobbelen. Dobbelstenen en Kies-je-worp gelden voor de worp hierna.
 * De Wisseltruc ruilt meteen van plek. De Ratjebel zet het spel in de Ratje-fase.
 */
export function gebruikItem(state: GameState, item: ItemSoort): GameState {
  vereisFase(state, 'dobbelen');
  if (!kanItemGebruiken(state, item)) throw new Error('Dit item kun je nu niet gebruiken');
  return metKopie(state, (s) => {
    const speler = spelerAanZet(s);
    const sp = s.spelers[speler];
    s.verslag = []; // het item is het begin van de beurt
    sp.items.splice(sp.items.indexOf(item), 1);
    s.verslag.push({ soort: 'item', speler, item, actie: 'gebruikt' });
    s.fase = { soort: 'dobbelen', gebruikt: item };
    if (item === 'wisseltruc') {
      const ander = kies(s, s.spelers.map((_, i) => i).filter((i) => i !== speler));
      const van = sp.vakje;
      sp.vakje = s.spelers[ander].vakje;
      s.spelers[ander].vakje = van;
      s.verslag.push({ soort: 'verplaatst', speler, van, naar: sp.vakje, reden: 'wisseltruc' });
      s.verslag.push({ soort: 'verplaatst', speler: ander, van: sp.vakje, naar: van, reden: 'wisseltruc' });
    } else if (item === 'ratjebel') {
      s.fase = { soort: 'ratje', worp: 0, resterend: 0, voorDobbelen: true };
    }
  });
}
