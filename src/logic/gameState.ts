import type { SplitsingSoort } from './bord';

/**
 * De volledige spelstand. Alles hierin is gewone JSON (geen klassen, geen functies),
 * zodat het spel na elke actie in localStorage bewaard kan worden.
 */

export type AantalRondes = 10 | 15 | 20;
export type Seizoen = 'zomer' | 'winter' | 'wisselend';

export interface Instellingen {
  aantalRondes: AantalRondes;
  seizoen: Seizoen;
  /** Bonussterren aan het eind (§10). */
  bonussterren: boolean;
}

export interface SpelerStats {
  /** Munten verdiend met minigames (voor de Minigame-ster). */
  minigameMunten: number;
  /** De hoogste muntenstand ooit (voor de Rijkaard-ster). */
  hoogsteMunten: number;
  /** Aantal keer op een event-, hertenkamp- of vleermuisvakje beland (Avonturier-ster). */
  avontuurVakjes: number;
  /** Aantal keer op een rood vakje beland. */
  roodVakjes: number;
  /** Aantal keer de wilde bok tegengekomen (komt in een latere stap). */
  bokOntmoetingen: number;
  /** Aantal gekochte sterren. */
  sterrenGekocht: number;
  /** Sterren aan het eind van elke ronde: index 0 = na ronde 1. Voor de grafiek. */
  sterrenPerRonde: number[];
}

export interface Speler {
  naam: string;
  figuur: string;
  isBot: boolean;
  munten: number;
  sterren: number;
  /** Id van het vakje waar de speler staat. */
  vakje: string;
  /** Items komen in een latere stap. */
  items: string[];
  stats: SpelerStats;
}

/** Een ster op het bord, bij een sterplek. */
export interface Ster {
  plek: string;
}

/** De regel die het rad van de laatste speler aan het eindspel toevoegt (§9). */
export type EindspelRegel = 'munten20' | 'extraSter' | 'goedkopeSter' | 'eeuwigeNacht' | 'ratjeGratis';

/** Waar het spel op wacht. Het scherm toont de knoppen die bij de fase horen. */
export type Fase =
  /** De speler die aan zet is, moet dobbelen. */
  | { soort: 'dobbelen' }
  /** De speler loopt; `resterend` = nog te lopen vakjes. */
  | { soort: 'lopen'; worp: number; resterend: number }
  /** Een mens staat bij een splitsing en kiest: gewoon doorlopen of het zijpad (hertenkamp, boot). */
  | { soort: 'splitsing'; worp: number; resterend: number; vakje: string }
  /** Een mens loopt langs een ster en heeft genoeg munten: kopen of niet? */
  | { soort: 'sterKopen'; worp: number; resterend: number; plek: string }
  /** Alle spelers zijn geweest: minigame op de Switch, wacht op de uitslag. */
  | { soort: 'minigame' }
  /** Begin van het eindspel: de laatste speler draait het rad. */
  | { soort: 'eindspelRad'; speler: number }
  /** Het spel is afgelopen; zie `eindtelling`. */
  | { soort: 'einde' };

export type MuntReden = 'blauw' | 'rood' | 'ster' | 'minigame' | 'eindspel' | 'boot';

/** Wat er net gebeurd is, voor meldingen als "Bot 2 gooide 7 · +3 munten". */
export type Gebeurtenis =
  | { soort: 'worp'; speler: number; waarde: number }
  | { soort: 'munten'; speler: number; verschil: number; reden: MuntReden }
  | { soort: 'sterGekocht'; speler: number; plek: string; nieuwePlek: string }
  | { soort: 'splitsing'; speler: number; splitsing: SplitsingSoort; zijpad: boolean }
  | { soort: 'eindspelRegel'; speler: number; regel: EindspelRegel };

export type BonusSoort = 'minigame' | 'rijkaard' | 'avonturier';

export interface Eindtelling {
  /** Per bonusster wie hem kreeg (leeg als hij uit staat of niemand hem verdiende). */
  bonussterren: { soort: BonusSoort; spelers: number[] }[];
  /** Spelers van 1e naar laatste plaats. */
  ranglijst: number[];
  winnaar: number;
  /** Extra worpen bij gelijkspel op sterren én munten. */
  beslisWorpen: { speler: number; waarde: number }[];
}

export interface GameState {
  /** Huidige stand van de random generator. */
  rng: number;
  instellingen: Instellingen;
  /** In de volgorde van het opstartscherm (Bot 1 blijft dus speler-index 2, enz.). */
  spelers: Speler[];
  /** De worp van elke speler bij de start (index = speler). */
  startworpen: number[];
  /** Beurtvolgorde: speler-indexen, hoogste startworp eerst. */
  volgorde: number[];
  /** Positie in `volgorde` van wie er aan zet is. */
  aanZet: number;
  /** 1 t/m aantalRondes. */
  ronde: number;
  fase: Fase;
  sterren: Ster[];
  eindspelRegel: EindspelRegel | null;
  /** Gebeurtenissen sinds de laatste beurt/uitslag begon. */
  verslag: Gebeurtenis[];
  eindtelling: Eindtelling | null;
}
