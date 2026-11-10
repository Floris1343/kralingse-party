/**
 * Splitsingen (§6.2, §6.3): het hertenkamp-pad en de boot.
 * Het ijspad (§8.5) gaat pas open als de winter gebouwd is.
 */
import { splitsingBij, volgendVakje, type Bord, type Splitsing } from './bord';
import type { GameState } from './gameState';
import { BOOT_PRIJS } from './regels';
import { sterPrijs } from './ster';

/** Kan deze speler hier het zijpad nemen? Zo niet, dan loopt hij vanzelf door. */
export function zijpadOpen(state: GameState, splitsing: Splitsing, speler: number): boolean {
  switch (splitsing.soort) {
    case 'hertenkamp':
      return true;
    case 'boot':
      // Te weinig munten voor de boot? Dan krijg je de vraag niet (net als bij de ster).
      return state.spelers[speler].munten >= BOOT_PRIJS;
    case 'ijspad':
      return false;
  }
}

/** De splitsing waar de speler nu een keuze heeft, of undefined. */
export function openSplitsing(state: GameState, bord: Bord, speler: number): Splitsing | undefined {
  const splitsing = splitsingBij(bord, state.spelers[speler].vakje);
  return splitsing && zijpadOpen(state, splitsing, speler) ? splitsing : undefined;
}

/** Aantal stappen vanaf `start` (via het hoofdpad) tot een vakje met een ster, of Infinity. */
export function stappenTotSter(state: GameState, bord: Bord, start: string): number {
  const sterVakjes = new Set(
    state.sterren.map((st) => bord.sterplekken.find((p) => p.id === st.plek)?.vakje),
  );
  let id = start;
  for (let n = 0; n <= bord.vakjes.length; n++) {
    if (sterVakjes.has(id)) return n;
    id = volgendVakje(bord, id);
  }
  return Infinity;
}

/**
 * Bots kiezen het zijpad alleen als ze daarmee sneller bij de ster zijn.
 * Voor de boot moeten ze na het betalen ook nog een ster kunnen kopen.
 */
export function botKiestZijpad(state: GameState, bord: Bord, splitsing: Splitsing, speler: number): boolean {
  if (splitsing.soort === 'boot' && state.spelers[speler].munten - BOOT_PRIJS < sterPrijs(state)) return false;
  const viaZijpad = 1 + stappenTotSter(state, bord, splitsing.zijpad);
  const viaHoofdpad = 1 + stappenTotSter(state, bord, splitsing.hoofdpad);
  return viaZijpad < viaHoofdpad;
}
