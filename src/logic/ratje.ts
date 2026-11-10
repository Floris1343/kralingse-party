/** Ratje de kerstrat (§7.2): munten of een ster laten stelen. */
import type { GameState } from './gameState';
import { kies, plaatsen, trek, wijzigMunten } from './regels';

export type RatjeWat = 'munten' | 'ster';
export interface RatjeKeuze {
  wat: RatjeWat;
  doel: number;
}

export const RATJE_PRIJS = { munten: 5, ster: 30 } as const;
export const RATJE_PRIJS_NACHT = { munten: 0, ster: 25 } as const;
export const RATJE_BUIT = { min: 5, max: 15 } as const;

/** Wat Ratje nu kost. 's Nachts is hij goedkoper; met de eindspelregel "Ratje gratis" kost hij niets. */
export function ratjePrijs(state: GameState, wat: RatjeWat): number {
  if (state.eindspelRegel === 'ratjeGratis') return 0;
  return (state.nacht ? RATJE_PRIJS_NACHT : RATJE_PRIJS)[wat];
}

/** Bij wie kan Ratje dit stelen? (Niet bij jezelf, en er moet iets te halen zijn.) */
export function ratjeDoelen(state: GameState, speler: number, wat: RatjeWat): number[] {
  return state.spelers
    .map((sp, i) => ({ sp, i }))
    .filter(({ sp, i }) => i !== speler && (wat === 'ster' ? sp.sterren > 0 : sp.munten > 0))
    .map(({ i }) => i);
}

export function kanRatjeDoen(state: GameState, speler: number, wat: RatjeWat): boolean {
  return state.spelers[speler].munten >= ratjePrijs(state, wat) && ratjeDoelen(state, speler, wat).length > 0;
}

/** Heeft het zin om Ratje in te huren? Zo niet, dan krijg je de vraag niet. */
export function kanRatjeInhuren(state: GameState, speler: number): boolean {
  return kanRatjeDoen(state, speler, 'munten') || kanRatjeDoen(state, speler, 'ster');
}

/** Ratje gaat op pad. Werkt op een kopie. */
export function huurRatje(s: GameState, speler: number, keuze: RatjeKeuze): void {
  const { wat, doel } = keuze;
  if (!kanRatjeDoen(s, speler, wat) || !ratjeDoelen(s, speler, wat).includes(doel)) {
    throw new Error('Dat kan Ratje nu niet');
  }
  wijzigMunten(s, speler, -ratjePrijs(s, wat), 'ratje');
  let buit: number;
  if (wat === 'ster') {
    s.spelers[doel].sterren -= 1;
    s.spelers[speler].sterren += 1;
    buit = 1;
  } else {
    const gewenst = trek(s, RATJE_BUIT.min, RATJE_BUIT.max);
    buit = -wijzigMunten(s, doel, -gewenst, 'ratje');
    wijzigMunten(s, speler, buit, 'ratje');
  }
  s.verslag.push({ soort: 'ratje', speler, doel, wat, buit });
}

/**
 * Wat een bot met Ratje doet: een ster stelen als het kan (bij wie de meeste sterren heeft),
 * anders munten stelen bij de rijkste. Of niets, als er niets te halen is.
 */
export function botRatjeKeuze(s: GameState, speler: number): RatjeKeuze | null {
  const plek = plaatsen(s);
  const beste = (doelen: number[], waarde: (i: number) => number) => {
    const hoogste = Math.max(...doelen.map(waarde));
    const kandidaten = doelen.filter((i) => waarde(i) === hoogste);
    // Bij gelijke stand: wie het hoogst staat, anders het lot.
    const besteplaats = Math.min(...kandidaten.map((i) => plek[i]));
    return kies(s, kandidaten.filter((i) => plek[i] === besteplaats));
  };
  if (kanRatjeDoen(s, speler, 'ster')) {
    return { wat: 'ster', doel: beste(ratjeDoelen(s, speler, 'ster'), (i) => s.spelers[i].sterren) };
  }
  if (kanRatjeDoen(s, speler, 'munten')) {
    const doelen = ratjeDoelen(s, speler, 'munten');
    // Munten stelen loont alleen als er wat te halen is.
    if (Math.max(...doelen.map((i) => s.spelers[i].munten)) >= ratjePrijs(s, 'munten') + 1) {
      return { wat: 'munten', doel: beste(doelen, (i) => s.spelers[i].munten) };
    }
  }
  return null;
}
