/** Sterren kopen en verhuizen (§4), de vallende ster (§8.2) en de ster in de mist (§8.4). */
import type { Bord } from './bord';
import type { GameState, Ster } from './gameState';
import { kies, STERPRIJS, STERPRIJS_GOEDKOOP, trek, wijzigMunten } from './regels';

/** Kans (in procenten) op een vallende ster aan het begin van een nachtronde. */
export const VALLENDE_STER_KANS = 20;

/** Ziet iedereen deze ster? Bij ochtendmist pas als iemand erlangs is gelopen. */
export function sterZichtbaar(state: GameState, ster: Ster): boolean {
  return !state.mist || ster.ontdekt === true;
}

/** De sterren die je nu op het bord ziet (bots weten bij mist ook niet meer, §8.4). */
export function zichtbareSterren(state: GameState): Ster[] {
  return state.sterren.filter((st) => sterZichtbaar(state, st));
}

/**
 * Aan het begin van een nachtronde: 20% kans op een vallende ster op een vrije sterplek.
 * Er is er nooit meer dan één tegelijk. Werkt op een kopie.
 */
export function misschienVallendeSter(s: GameState, bord: Bord): void {
  if (!s.nacht || s.sterren.some((st) => st.vallend)) return;
  // Er moet daarna nog een vrije plek over zijn, zodat een gekochte gewone ster kan verhuizen.
  if (bord.sterplekken.length - s.sterren.length < 2) return;
  if (trek(s, 1, 100) > VALLENDE_STER_KANS) return;
  const plek = kiesVrijeSterplek(s, bord);
  s.sterren.push({ plek, vallend: true });
  s.verslag.push({ soort: 'vallendeSter', plek });
}

export function sterPrijs(state: GameState): number {
  return state.eindspelRegel === 'goedkopeSter' ? STERPRIJS_GOEDKOOP : STERPRIJS;
}

/** De sterplek waar een ster staat bij dit vakje, of null. */
export function sterBijVakje(state: GameState, bord: Bord, vakjeId: string): string | null {
  for (const ster of state.sterren) {
    const plek = bord.sterplekken.find((p) => p.id === ster.plek);
    if (plek?.vakje === vakjeId) return ster.plek;
  }
  return null;
}

export function kanSterBetalen(state: GameState, speler: number): boolean {
  return state.spelers[speler].munten >= sterPrijs(state);
}

/** Een willekeurige sterplek waar nu geen ster staat (dus ook niet dezelfde plek). */
export function kiesVrijeSterplek(s: GameState, bord: Bord): string {
  const bezet = new Set(s.sterren.map((st) => st.plek));
  const vrij = bord.sterplekken.filter((p) => !bezet.has(p.id)).map((p) => p.id);
  return kies(s, vrij);
}

/**
 * Koopt de ster bij `plek` voor `speler` en verhuist hem naar een andere plek.
 * Werkt op een kopie van de state (gebruik binnen `metKopie`).
 */
export function koopSter(s: GameState, bord: Bord, speler: number, plek: string): void {
  const idx = s.sterren.findIndex((st) => st.plek === plek);
  if (idx < 0) throw new Error(`Er staat geen ster bij ${plek}`);
  const prijs = sterPrijs(s);
  if (s.spelers[speler].munten < prijs) throw new Error('Niet genoeg munten voor een ster');

  wijzigMunten(s, speler, -prijs, 'ster');
  const sp = s.spelers[speler];
  sp.sterren += 1;
  sp.stats.sterrenGekocht += 1;

  if (s.sterren[idx].vallend) {
    // Een vallende ster verhuist niet: na aankoop is hij weg.
    s.sterren.splice(idx, 1);
    s.verslag.push({ soort: 'sterGekocht', speler, plek, nieuwePlek: '' });
    return;
  }
  const nieuwePlek = kiesVrijeSterplek(s, bord);
  s.sterren[idx] = { plek: nieuwePlek };
  s.verslag.push({ soort: 'sterGekocht', speler, plek, nieuwePlek });
}
