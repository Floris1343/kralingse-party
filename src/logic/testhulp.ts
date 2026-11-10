/** Hulpjes voor de tests (wordt niet in het spel gebruikt). */
import { loopUit, dobbelen, ratjeKeuze, splitsingKeuze, sterKeuze, winkelKeuze } from './beurt';
import { maakTestbord, type Bord } from './bord';
import { ITEM_SOORTEN, gebruikItem, kanItemGebruiken, kanKopen } from './items';
import { botRatjeKeuze } from './ratje';
import { speelBotsAf } from './bot';
import { draaiEindspelRad } from './eindspel';
import type { AantalRondes, GameState } from './gameState';
import { verwerkMinigame, type MinigameUitslag } from './minigame';
import { nieuwSpel, type NieuwSpelKeuzes } from './nieuwSpel';
import { metKopie, trek } from './regels';

export const bord = maakTestbord();

/** Het testbord met de winkel op v4 en Ratje op v9. */
export function bordMetPlekken(): Bord {
  const b = maakTestbord();
  b.plekken.winkel = { vakje: 'v4', x: 0, y: 0 };
  b.plekken.ratje = { vakje: 'v9', x: 0, y: 0 };
  return b;
}

export function keuzes(over: Partial<NieuwSpelKeuzes> = {}): NieuwSpelKeuzes {
  return {
    aantalRondes: 10,
    seizoen: 'zomer',
    bonussterren: true,
    spelers: [
      { naam: 'Anna', figuur: 'a', isBot: false },
      { naam: 'Bram', figuur: 'b', isBot: false },
      { naam: 'Bot 1', figuur: 'c', isBot: true },
      { naam: 'Bot 2', figuur: 'd', isBot: true },
    ],
    ...over,
  };
}

export function alleBots(): NieuwSpelKeuzes['spelers'] {
  return keuzes().spelers.map((sp) => ({ ...sp, isBot: true }));
}

/** Een nieuw spel met een vaste seed, eventueel met aanpassingen. */
export function spel(over: Partial<NieuwSpelKeuzes> = {}, seed = 1): GameState {
  return nieuwSpel(bord, keuzes(over), seed);
}

/** Past een state aan voor een test (op een kopie). */
export function met(state: GameState, wijzig: (s: GameState) => void): GameState {
  return metKopie(state, wijzig);
}

/** Zet de speler die aan zet is klaar om `n` vakjes te lopen, zonder te dobbelen. */
export function metWorp(state: GameState, n: number): GameState {
  return met(state, (s) => {
    s.fase = { soort: 'lopen', worp: n, resterend: n };
  });
}

/** Willekeurige minigame-uitslag (met af en toe gelijke plekken), via de rng van de state. */
export function willekeurigeUitslag(state: GameState): [MinigameUitslag, GameState] {
  let uitslag: MinigameUitslag = [];
  const na = met(state, (s) => {
    const rest = s.spelers.map((_, i) => i);
    while (rest.length) {
      const grootte = trek(s, 1, 4) === 1 ? Math.min(2, rest.length) : 1;
      const groep: number[] = [];
      for (let k = 0; k < grootte; k++) groep.push(rest.splice(trek(s, 0, rest.length - 1), 1)[0]);
      uitslag.push(groep);
    }
  });
  return [uitslag, na];
}

/**
 * Speelt een heel spel uit. Mensen gebruiken items, dobbelen, lopen uit, kopen altijd een ster,
 * kopen in de winkel, huren Ratje, kiezen bij een splitsing wisselend en draaien het rad.
 * `naElkeActie` kan de state vervangen (bijv. opslaan en weer laden).
 */
export function speelUit(
  start: GameState,
  naElkeActie: (s: GameState) => GameState = (s) => s,
  maxActies = 10_000,
  b: Bord = bord,
): { eind: GameState; staten: GameState[] } {
  let s = start;
  const staten: GameState[] = [s];
  for (let i = 0; i < maxActies && s.fase.soort !== 'einde'; i++) {
    switch (s.fase.soort) {
      case 'minigame': {
        const [uitslag, na] = willekeurigeUitslag(s);
        s = verwerkMinigame(na, uitslag);
        break;
      }
      case 'dobbelen': {
        if (s.spelers[s.volgorde[s.aanZet]].isBot) {
          s = speelBotsAf(s, b);
          break;
        }
        // Mensen gebruiken hun eerste bruikbare item, en kiezen 7 met Kies-je-worp.
        const item = !s.fase.gebruikt && s.spelers[s.volgorde[s.aanZet]].items.find((i) => kanItemGebruiken(s, i));
        if (item) s = gebruikItem(s, item);
        else s = dobbelen(s, s.fase.gebruikt === 'kiesWorp' ? 7 : undefined);
        break;
      }
      case 'winkel': {
        // Mensen kopen het eerste item dat ze kunnen betalen (wisselend per ronde).
        const sp = s.volgorde[s.aanZet];
        const opties = ITEM_SOORTEN.filter((i) => kanKopen(s, sp, i));
        s = winkelKeuze(s, b, opties.length ? opties[s.ronde % opties.length] : null);
        break;
      }
      case 'ratje':
        s = ratjeKeuze(s, b, botRatjeKeuze(structuredClone(s), s.volgorde[s.aanZet]));
        break;
      case 'lopen':
        s = loopUit(s, b);
        break;
      case 'sterKopen':
        s = sterKeuze(s, b, true);
        break;
      case 'splitsing':
        // Mensen nemen in even rondes het zijpad.
        s = splitsingKeuze(s, b, s.ronde % 2 === 0);
        break;
      case 'eindspelRad':
        s = draaiEindspelRad(s, b);
        break;
    }
    s = naElkeActie(s);
    staten.push(s);
  }
  return { eind: s, staten };
}

export const RONDES: AantalRondes[] = [10, 15, 20];
