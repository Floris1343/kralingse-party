import type { SplitsingSoort } from './bord';
import type { ItemSoort } from './items';

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
  /** Aantal keer de wilde bok tegengekomen. */
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
  /** Hoogstens 3 items (§7.1). */
  items: ItemSoort[];
  /** Iemand gaf je de Slakkendobbel: je volgende worp is maar 1–3 (§8.1). */
  slak: boolean;
  /** Iemand gaf je de Achteruitpet: je volgende beurt loop je achteruit (§8.1). Geldt tot het eind van die beurt. */
  achteruit: boolean;
  stats: SpelerStats;
}

/** Een ster op het bord, bij een sterplek. */
export interface Ster {
  plek: string;
  /** Een vallende ster (§8.2): na aankoop weg, en hij verdwijnt als het dag wordt. */
  vallend?: boolean;
  /** Bij ochtendmist: iemand is erlangs gelopen, dus iedereen ziet hem weer (§8.4). */
  ontdekt?: boolean;
}

/** Een valstrik op het bord (§8.1). Per speler hoogstens één. */
export interface Valstrik {
  speler: number;
  vakje: string;
}

/** De regel die het rad van de laatste speler aan het eindspel toevoegt (§9). */
export type EindspelRegel = 'munten20' | 'extraSter' | 'goedkopeSter' | 'eeuwigeNacht' | 'ratjeGratis';

/** Waar het spel op wacht. Het scherm toont de knoppen die bij de fase horen. */
export type Fase =
  /**
   * De speler die aan zet is, mag eerst één item gebruiken en moet dan dobbelen.
   * `gebruikt` = het item dat deze beurt al gebruikt is (dubbele dobbelsteen enz.).
   */
  | { soort: 'dobbelen'; gebruikt?: ItemSoort }
  /** De speler loopt; `resterend` = nog te lopen vakjes. */
  | { soort: 'lopen'; worp: number; resterend: number }
  /** Een mens staat bij een splitsing en kiest: gewoon doorlopen of het zijpad (hertenkamp, boot). */
  | { soort: 'splitsing'; worp: number; resterend: number; vakje: string }
  /** Een mens loopt langs een ster en heeft genoeg munten: kopen of niet? */
  | { soort: 'sterKopen'; worp: number; resterend: number; plek: string }
  /** Een mens loopt langs de winkel (overdag): één item kopen of niets. */
  | { soort: 'winkel'; worp: number; resterend: number }
  /** Een mens loopt 's nachts langs de Nachtwinkel bij de jachthaven (§8.1). */
  | { soort: 'nachtwinkel'; worp: number; resterend: number }
  /**
   * Een mens kan Ratje inhuren: bij het langslopen, of met de Ratjebel vóór het dobbelen
   * (`voorDobbelen`; daarna wordt er gewoon gedobbeld).
   */
  | { soort: 'ratje'; worp: number; resterend: number; voorDobbelen?: boolean }
  /** Alle spelers zijn geweest: minigame op de Switch, wacht op de uitslag. */
  | { soort: 'minigame' }
  /** Begin van het eindspel: de laatste speler draait het rad. */
  | { soort: 'eindspelRad'; speler: number }
  /** Het spel is afgelopen; zie `eindtelling`. */
  | { soort: 'einde' };

export type MuntReden =
  | 'blauw' | 'rood' | 'ster' | 'minigame' | 'eindspel' | 'boot'
  | 'winkel' | 'ratje' | 'item' | 'hertenkamp' | 'kans' | 'pech' | 'event' | 'valstrik' | 'vleermuis';

/** De raderen die op het scherm draaien. */
export type RadSoort = 'hertenkamp' | 'bok' | 'pech' | 'vleermuis';

export type VerplaatsReden = 'windvlaag' | 'hertje' | 'bok' | 'plas' | 'wisseltruc' | 'vleermuis';

/** De acties van het Kans-vakje (§7.3). */
export type KansActie = 'geef10' | 'geef20' | 'ruilMunten' | 'geefSter' | 'ruilSterren';

/** Wat er net gebeurd is, voor meldingen als "Bot 2 gooide 7 · +3 munten". */
export type Gebeurtenis =
  /** `worpen` = de losse worpen (meer dan één met een dubbele dobbelsteen); `gekozen` = Kies-je-worp. */
  | { soort: 'worp'; speler: number; waarde: number; worpen: number[]; gekozen?: boolean }
  | { soort: 'munten'; speler: number; verschil: number; reden: MuntReden }
  /** `nieuwePlek` is leeg bij een vallende ster: die verhuist niet. */
  | { soort: 'sterGekocht'; speler: number; plek: string; nieuwePlek: string }
  | { soort: 'splitsing'; speler: number; splitsing: SplitsingSoort; zijpad: boolean }
  | { soort: 'eindspelRegel'; speler: number; regel: EindspelRegel }
  | { soort: 'dagNacht'; nacht: boolean; reden: 'ronde' | 'lantaarnpaal' | 'eindspel' }
  | { soort: 'item'; speler: number; item: ItemSoort; actie: 'gekocht' | 'gekregen' | 'gebruikt' }
  | { soort: 'itemsKwijt'; speler: number; items: ItemSoort[] }
  | { soort: 'verplaatst'; speler: number; van: string; naar: string; reden: VerplaatsReden }
  | { soort: 'rad'; speler: number; rad: RadSoort; uitkomst: string }
  | { soort: 'kans'; speler: number; a: number; b: number; actie: KansActie; gelukt: boolean }
  | { soort: 'strandtent'; speler: number; kampvuur: boolean }
  | { soort: 'windvlaag'; speler: number; stappen: number }
  | { soort: 'zeilwedstrijd'; speler: number; worpen: number[]; winnaars: number[]; prijs: number; lampionnen: boolean }
  | { soort: 'ratje'; speler: number; doel: number; wat: 'munten' | 'ster'; buit: number }
  /** Een gemeen item uit de Nachtwinkel op iemand gericht. */
  | { soort: 'gemeen'; speler: number; doel: number; item: 'zakkenroller' | 'slakkendobbel' | 'achteruitpet'; buit: number }
  | { soort: 'valstrikGelegd'; speler: number; vakje: string }
  /** `speler` trapte in de valstrik van `eigenaar` en betaalde `munten`. */
  | { soort: 'valstrik'; speler: number; eigenaar: number; vakje: string; munten: number }
  | { soort: 'vallendeSter'; plek: string }
  | { soort: 'vallendeSterWeg'; plek: string }
  | { soort: 'mist'; aan: boolean }
  /** Bij ochtendmist: de ster is gevonden. */
  | { soort: 'sterOntdekt'; speler: number; plek: string };

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
  /** Nacht (§8). Het spel begint overdag. */
  nacht: boolean;
  eindspelRegel: EindspelRegel | null;
  /** Valstrikken op het bord (§8.1). */
  valstrikken: Valstrik[];
  /** Ochtendmist (§8.4): de mist trekt op aan het begin van ronde `totRonde`. */
  mist: { totRonde: number } | null;
  /** Gebeurtenissen sinds de laatste beurt/uitslag begon. */
  verslag: Gebeurtenis[];
  eindtelling: Eindtelling | null;
}
