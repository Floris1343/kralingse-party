/**
 * Items (§7.1, §8.1): kopen in de winkel bij het Restaurant (alleen overdag) of in de
 * Nachtwinkel bij de jachthaven (alleen 's nachts), krijgen op een itemvakje of bij de herten,
 * en gebruiken vóór het dobbelen (één item per beurt).
 */
import type { GameState } from './gameState';
import { kanRatjeInhuren } from './ratje';
import { kies, metKopie, spelerAanZet, vereisFase, wijzigMunten } from './regels';

export type WinkelItem = 'dubbel' | 'driedubbel' | 'kiesWorp' | 'wisseltruc' | 'ratjebel';
export type NachtItem = 'zakkenroller' | 'slakkendobbel' | 'achteruitpet' | 'valstrik';
export type ItemSoort = WinkelItem | NachtItem;

export const MAX_ITEMS = 3;
/** Wie al 3 items heeft en er een krijgt, krijgt deze munten (§6.5). */
export const VOLLE_ZAK_MUNTEN = 5;

export interface ItemInfo {
  naam: string;
  prijs: number;
  uitleg: string;
}

/** De items van de gewone winkel, in de volgorde van de winkel. */
export const WINKEL_ITEMS: Record<WinkelItem, ItemInfo> = {
  dubbel: { naam: 'Dubbele dobbelsteen', prijs: 5, uitleg: 'Gooi twee keer en tel de ogen op.' },
  driedubbel: { naam: 'Driedubbele dobbelsteen', prijs: 10, uitleg: 'Gooi drie keer en tel de ogen op.' },
  kiesWorp: { naam: 'Kies-je-worp', prijs: 6, uitleg: 'Kies zelf hoeveel stappen je loopt (1 tot 10).' },
  wisseltruc: { naam: 'Wisseltruc', prijs: 7, uitleg: 'Ruil van plek met een willekeurige andere speler.' },
  ratjebel: { naam: 'Ratjebel', prijs: 8, uitleg: 'Ratje komt naar je toe. Je betaalt wel zijn gewone prijs.' },
};

export const ITEM_SOORTEN = Object.keys(WINKEL_ITEMS) as WinkelItem[];

/** De gemene items van de Nachtwinkel (§8.1), in de volgorde van de winkel. */
export const NACHT_ITEMS: Record<NachtItem, ItemInfo> = {
  zakkenroller: { naam: 'Zakkenroller', prijs: 6, uitleg: 'Steel meteen 5 munten van een speler naar keuze.' },
  slakkendobbel: { naam: 'Slakkendobbel', prijs: 5, uitleg: 'Kies een speler. Die gooit zijn volgende beurt maar 1 tot 3.' },
  achteruitpet: { naam: 'Achteruitpet', prijs: 7, uitleg: 'Kies een speler. Die loopt zijn volgende beurt achteruit.' },
  valstrik: { naam: 'Valstrik', prijs: 6, uitleg: 'Leg een valstrik waar je staat. Wie daar eindigt, geeft jou 10 munten.' },
};

export const NACHT_ITEM_SOORTEN = Object.keys(NACHT_ITEMS) as NachtItem[];

export const ZAKKENROLLER_BUIT = 5;
export const VALSTRIK_MUNTEN = 10;
/** Met de Slakkendobbel gooi je 1 t/m dit getal. */
export const SLAK_MAX = 3;

/** Naam, prijs en uitleg van elk item. */
export function itemInfo(item: ItemSoort): ItemInfo {
  return item in WINKEL_ITEMS ? WINKEL_ITEMS[item as WinkelItem] : NACHT_ITEMS[item as NachtItem];
}

export function isNachtItem(item: ItemSoort): item is NachtItem {
  return item in NACHT_ITEMS;
}

/** Items die je op een andere speler richt. */
export type DoelItem = 'zakkenroller' | 'slakkendobbel' | 'achteruitpet';
export function heeftDoel(item: ItemSoort): item is DoelItem {
  return item === 'zakkenroller' || item === 'slakkendobbel' || item === 'achteruitpet';
}

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

/** Is de Nachtwinkel bij de jachthaven open? Alleen 's nachts (§8.1). */
export function nachtwinkelOpen(state: GameState): boolean {
  return state.nacht;
}

/** Kan deze speler nu iets kopen in deze winkel (plek in de zak en genoeg munten voor het goedkoopste)? */
export function kanIetsKopen(state: GameState, speler: number, nachtwinkel = false): boolean {
  const sp = state.spelers[speler];
  const soorten: ItemSoort[] = nachtwinkel ? NACHT_ITEM_SOORTEN : ITEM_SOORTEN;
  const goedkoopste = Math.min(...soorten.map((i) => itemInfo(i).prijs));
  return sp.items.length < MAX_ITEMS && sp.munten >= goedkoopste;
}

export function kanKopen(state: GameState, speler: number, item: ItemSoort): boolean {
  const sp = state.spelers[speler];
  return sp.items.length < MAX_ITEMS && sp.munten >= itemInfo(item).prijs;
}

/** Koopt een item. Werkt op een kopie. */
export function koopItem(s: GameState, speler: number, item: ItemSoort): void {
  if (!kanKopen(s, speler, item)) throw new Error('Dit item kun je nu niet kopen');
  wijzigMunten(s, speler, -itemInfo(item).prijs, 'winkel');
  s.spelers[speler].items.push(item);
  s.verslag.push({ soort: 'item', speler, item, actie: 'gekocht' });
}

// ------------------------------------------------------------------ gebruiken

/**
 * Op wie kan `speler` dit item richten? Niet op jezelf. Bij de Zakkenroller moet er wat te halen
 * zijn; de Slakkendobbel en de Achteruitpet stapelen niet (heeft iemand hem al, dan niet nog eens).
 */
export function itemDoelen(state: GameState, speler: number, item: DoelItem): number[] {
  return state.spelers
    .map((sp, i) => ({ sp, i }))
    .filter(({ sp, i }) => {
      if (i === speler) return false;
      if (item === 'zakkenroller') return sp.munten > 0;
      if (item === 'slakkendobbel') return !sp.slak;
      return !sp.achteruit;
    })
    .map(({ i }) => i);
}

/** Kan deze speler hier een valstrik leggen? Eén per speler, en niet op een vakje waar er al een ligt. */
export function kanValstrikLeggen(state: GameState, speler: number): boolean {
  const vakje = state.spelers[speler].vakje;
  return !state.valstrikken.some((v) => v.speler === speler || v.vakje === vakje);
}

/** Mag de speler die aan zet is dit item nu gebruiken? */
export function kanItemGebruiken(state: GameState, item: ItemSoort): boolean {
  if (state.fase.soort !== 'dobbelen' || state.fase.gebruikt) return false;
  const speler = spelerAanZet(state);
  if (!state.spelers[speler].items.includes(item)) return false;
  if (item === 'ratjebel') return kanRatjeInhuren(state, speler);
  if (item === 'valstrik') return kanValstrikLeggen(state, speler);
  if (heeftDoel(item)) return itemDoelen(state, speler, item).length > 0;
  return true;
}

/** Items die pas bij het gooien werken. Die kun je annuleren zolang je nog niet gedobbeld hebt. */
export const DOBBEL_ITEMS: readonly ItemSoort[] = ['dubbel', 'driedubbel', 'kiesWorp'];

/** Werkt dit item meteen (Wisseltruc, Ratjebel, gemene items)? Dan kun je het niet annuleren. */
export function werktMeteen(item: ItemSoort): boolean {
  return !DOBBEL_ITEMS.includes(item);
}

/** Kan het gekozen item nog terug in de zak? Alleen een dobbelsteen of Kies-je-worp, vóór het gooien. */
export function kanItemAnnuleren(state: GameState): boolean {
  return state.fase.soort === 'dobbelen' && !!state.fase.gebruikt && DOBBEL_ITEMS.includes(state.fase.gebruikt);
}

/** Zet het gekozen item terug in de zak; daarna kun je een ander kiezen (of gewoon gooien). */
export function annuleerItem(state: GameState): GameState {
  const fase = vereisFase(state, 'dobbelen');
  if (!kanItemAnnuleren(state)) throw new Error('Dit item kun je niet meer annuleren');
  return metKopie(state, (s) => {
    const speler = spelerAanZet(s);
    s.spelers[speler].items.push(fase.gebruikt!);
    s.verslag = s.verslag.filter((g) => !(g.soort === 'item' && g.actie === 'gebruikt' && g.speler === speler && g.item === fase.gebruikt));
    s.fase = { soort: 'dobbelen' };
  });
}

/**
 * Gebruikt een item vóór het dobbelen. Dobbelstenen en Kies-je-worp gelden voor de worp hierna.
 * De Wisseltruc ruilt meteen van plek. De Ratjebel zet het spel in de Ratje-fase.
 * De gemene items op een ander (`doel`) werken meteen; daarna dobbel je gewoon.
 */
export function gebruikItem(state: GameState, item: ItemSoort, doel?: number): GameState {
  vereisFase(state, 'dobbelen');
  if (!kanItemGebruiken(state, item)) throw new Error('Dit item kun je nu niet gebruiken');
  if (heeftDoel(item) && !itemDoelen(state, spelerAanZet(state), item).includes(doel ?? -1)) {
    throw new Error('Op deze speler kun je dit item niet gebruiken');
  }
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
    } else if (item === 'valstrik') {
      s.valstrikken.push({ speler, vakje: sp.vakje });
      s.verslag.push({ soort: 'valstrikGelegd', speler, vakje: sp.vakje });
    } else if (heeftDoel(item)) {
      const d = doel!;
      let buit = 0;
      if (item === 'zakkenroller') {
        buit = -wijzigMunten(s, d, -ZAKKENROLLER_BUIT, 'item');
        wijzigMunten(s, speler, buit, 'item');
      } else if (item === 'slakkendobbel') {
        s.spelers[d].slak = true;
      } else {
        s.spelers[d].achteruit = true;
      }
      s.verslag.push({ soort: 'gemeen', speler, doel: d, item, buit });
    }
  });
}
