/** De laatste 5 rondes (§9). */
import type { Bord } from './bord';
import type { EindspelRegel, GameState } from './gameState';
import {
  EINDSPEL_MUNTEN_LAATSTE, EINDSPEL_RONDES, kies, metKopie, plaatsen, vereisFase, wijzigMunten,
} from './regels';
import { kiesVrijeSterplek } from './ster';

export const EINDSPEL_REGELS: readonly EindspelRegel[] = [
  'munten20', 'extraSter', 'goedkopeSter', 'eeuwigeNacht', 'ratjeGratis',
];

/** De eerste ronde van het eindspel, bijvoorbeeld 6 bij 10 rondes. */
export function eersteEindspelRonde(state: GameState): number {
  return state.instellingen.aantalRondes - EINDSPEL_RONDES + 1;
}

/** Zitten we in de laatste 5 rondes? Dan tellen blauw en rood dubbel. */
export function isEindspel(state: GameState): boolean {
  return state.ronde >= eersteEindspelRonde(state);
}

/**
 * Wie het rad draait: de speler op de laatste plaats.
 * Delen meerdere spelers de laatste plaats, dan wijst het lot er één aan.
 */
export function kiesLaatsteSpeler(s: GameState): number {
  const p = plaatsen(s);
  const slechtste = Math.max(...p);
  return kies(s, p.map((pl, i) => (pl === slechtste ? i : -1)).filter((i) => i >= 0));
}

/** De laatste speler draait het rad. De regel geldt de rest van het spel. */
export function draaiEindspelRad(state: GameState, bord: Bord): GameState {
  const fase = vereisFase(state, 'eindspelRad');
  return metKopie(state, (s) => {
    const regel = kies(s, EINDSPEL_REGELS);
    s.verslag = [{ soort: 'eindspelRegel', speler: fase.speler, regel }];
    pasRegelToe(s, bord, regel, fase.speler);
    s.fase = { soort: 'dobbelen' };
  });
}

/** Zet de regel in de state en voert directe effecten uit. Werkt op een kopie. */
export function pasRegelToe(s: GameState, bord: Bord, regel: EindspelRegel, laatste: number): void {
  s.eindspelRegel = regel;
  if (regel === 'munten20') {
    wijzigMunten(s, laatste, EINDSPEL_MUNTEN_LAATSTE, 'eindspel');
  } else if (regel === 'extraSter') {
    s.sterren.push({ plek: kiesVrijeSterplek(s, bord) });
  }
  // goedkopeSter werkt via sterPrijs(); eeuwigeNacht en ratjeGratis gaan werken
  // zodra dag/nacht en Ratje er zijn.
}
