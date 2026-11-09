/**
 * Bots doen dezelfde acties als mensen, maar beslissen meteen zelf.
 * `botActie` doet één stap (voor animaties); `speelBotsAf` alles tot er een mens nodig is (turbo).
 */
import { dobbelen, stap, sterKeuze } from './beurt';
import type { Bord } from './bord';
import { draaiEindspelRad } from './eindspel';
import type { GameState } from './gameState';
import { spelerAanZet } from './regels';

/** Moet er nu een bot iets doen? (De minigame-uitslag vult altijd een mens in.) */
export function wachtOpBot(state: GameState): boolean {
  switch (state.fase.soort) {
    case 'dobbelen':
    case 'lopen':
    case 'sterKopen':
      return state.spelers[spelerAanZet(state)].isBot;
    case 'eindspelRad':
      return state.spelers[state.fase.speler].isBot;
    default:
      return false;
  }
}

/** Eén actie van een bot, of null als er geen bot aan de beurt is. */
export function botActie(state: GameState, bord: Bord): GameState | null {
  if (!wachtOpBot(state)) return null;
  switch (state.fase.soort) {
    case 'dobbelen':
      return dobbelen(state);
    case 'lopen':
      return stap(state, bord);
    case 'sterKopen':
      return sterKeuze(state, bord, true);
    case 'eindspelRad':
      return draaiEindspelRad(state, bord);
    default:
      return null;
  }
}

/** Speelt alle botacties af tot er een mens (of de minigame-uitslag) nodig is. */
export function speelBotsAf(state: GameState, bord: Bord): GameState {
  let s = state;
  for (let volgende = botActie(s, bord); volgende; volgende = botActie(s, bord)) s = volgende;
  return s;
}
