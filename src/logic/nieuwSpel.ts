/** Een nieuw spel opzetten vanuit het opstartscherm (§2, §3). */
import type { Bord } from './bord';
import type { GameState, Instellingen } from './gameState';
import { kies, STARTMUNTEN } from './regels';

export interface SpelerKeuze {
  naam: string;
  figuur: string;
  isBot: boolean;
}

export interface NieuwSpelKeuzes extends Instellingen {
  spelers: SpelerKeuze[];
}

export function nieuwSpel(bord: Bord, keuzes: NieuwSpelKeuzes, seed: number): GameState {
  const { spelers, ...instellingen } = keuzes;
  if (spelers.length < 2 || spelers.length > 4) throw new Error('Er moeten 2 tot 4 spelers zijn');
  if (![10, 15, 20].includes(instellingen.aantalRondes)) throw new Error('Aantal rondes moet 10, 15 of 20 zijn');

  const s: GameState = {
    rng: seed | 0,
    instellingen: { ...instellingen },
    spelers: spelers.map((k) => ({
      naam: k.naam,
      figuur: k.figuur,
      isBot: k.isBot,
      munten: STARTMUNTEN,
      sterren: 0,
      vakje: bord.start,
      items: [],
      slak: false,
      achteruit: false,
      stats: {
        minigameMunten: 0,
        hoogsteMunten: STARTMUNTEN,
        avontuurVakjes: 0,
        roodVakjes: 0,
        bokOntmoetingen: 0,
        sterrenGekocht: 0,
        sterrenPerRonde: [],
      },
    })),
    startworpen: spelers.map(() => []),
    volgorde: spelers.map((_, i) => i),
    aanZet: 0,
    ronde: 1,
    // Eerst de startworp (§2): iedereen gooit één voor één, in de volgorde van het opstartscherm.
    fase: { soort: 'startworp', teGooien: spelers.map((_, i) => i) },
    sterren: [],
    nacht: false,
    eindspelRegel: null,
    valstrikken: [],
    mist: null,
    verslag: [],
    eindtelling: null,
  };

  s.sterren = [{ plek: kies(s, bord.sterplekken).id }];
  return s;
}
