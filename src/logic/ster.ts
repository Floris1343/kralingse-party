/** Sterren kopen en verhuizen (§4). */
import type { Bord } from './bord';
import type { GameState } from './gameState';
import { kies, STERPRIJS, STERPRIJS_GOEDKOOP, wijzigMunten } from './regels';

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

  const nieuwePlek = kiesVrijeSterplek(s, bord);
  s.sterren[idx] = { plek: nieuwePlek };
  s.verslag.push({ soort: 'sterGekocht', speler, plek, nieuwePlek });
}
