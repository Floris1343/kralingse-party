/**
 * Getallen uit het ontwerp en kleine hulpfuncties die door de andere logica gedeeld worden.
 * De hulpfuncties met een `s`-parameter werken op een kopie van de state (zie `metKopie`).
 */
import type { Fase, GameState, MuntReden } from './gameState';
import { geheelGetal } from './rng';

export const STARTMUNTEN = 10;
export const STERPRIJS = 20;
export const STERPRIJS_GOEDKOOP = 10;
export const BLAUW_MUNTEN = 3;
export const ROOD_MUNTEN = 3;
/** Beloning per plaats bij een minigame: 1e, 2e, 3e, 4e. */
export const MINIGAME_BELONING = [10, 5, 2, 0] as const;
export const EINDSPEL_RONDES = 5;
export const EINDSPEL_MUNTEN_LAATSTE = 20;

/** Maakt een diepe kopie, laat `wijzig` die aanpassen en geeft de kopie terug. Het origineel blijft heel. */
export function metKopie(state: GameState, wijzig: (s: GameState) => void): GameState {
  const s = structuredClone(state);
  wijzig(s);
  return s;
}

/** Trekt een geheel getal van min t/m max en zet de rng verder. */
export function trek(s: GameState, min: number, max: number): number {
  const [w, nieuw] = geheelGetal(s.rng, min, max);
  s.rng = nieuw;
  return w;
}

/** Kiest een willekeurig element uit een (niet-lege) lijst. */
export function kies<T>(s: GameState, lijst: readonly T[]): T {
  if (lijst.length === 0) throw new Error('Kan niet kiezen uit een lege lijst');
  return lijst[trek(s, 0, lijst.length - 1)];
}

/** `aantal` verschillende worpen van 1 t/m 10 (zoals dobbelblokken die elk een ander getal geven). */
export function verschillendeWorpen(s: GameState, aantal: number): number[] {
  const pot = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const uit: number[] = [];
  for (let i = 0; i < aantal; i++) {
    const idx = trek(s, 0, pot.length - 1);
    uit.push(pot.splice(idx, 1)[0]);
  }
  return uit;
}

/**
 * Past de munten van een speler aan (nooit onder 0), werkt de Rijkaard-stat bij
 * en schrijft het in het verslag. Geeft het echte verschil terug.
 */
export function wijzigMunten(s: GameState, speler: number, verschil: number, reden: MuntReden): number {
  const sp = s.spelers[speler];
  const nieuw = Math.max(0, sp.munten + verschil);
  const echt = nieuw - sp.munten;
  sp.munten = nieuw;
  sp.stats.hoogsteMunten = Math.max(sp.stats.hoogsteMunten, nieuw);
  if (echt !== 0) s.verslag.push({ soort: 'munten', speler, verschil: echt, reden });
  return echt;
}

/** Index van de speler die aan zet is. */
export function spelerAanZet(state: GameState): number {
  return state.volgorde[state.aanZet];
}

export function vereisFase<S extends Fase['soort']>(
  state: GameState,
  soort: S,
): Extract<Fase, { soort: S }> {
  if (state.fase.soort !== soort) {
    throw new Error(`Dit kan nu niet: het spel wacht op "${state.fase.soort}", niet op "${soort}"`);
  }
  return state.fase as Extract<Fase, { soort: S }>;
}

/**
 * De plaats van elke speler (1 = beste), op sterren en daarna munten.
 * Gelijke stand = gelijke plaats (1, 1, 3, 4).
 */
export function plaatsen(state: GameState): number[] {
  const sp = state.spelers;
  return sp.map(
    (a) => 1 + sp.filter((b) => b.sterren > a.sterren || (b.sterren === a.sterren && b.munten > a.munten)).length,
  );
}
