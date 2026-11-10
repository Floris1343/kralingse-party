/**
 * Een beurt: eventueel een item gebruiken, dobbelen, stap voor stap lopen, langs de ster,
 * de winkel en Ratje komen en het vakje afhandelen.
 * Het scherm roept `stap` per vakje aan, zodat het figuurtje kan lopen en er tussendoor
 * bewaard kan worden. `loopUit` doet alle stappen in één keer, tot er een keuze nodig is.
 */
import { splitsingBij, volgendVakje, type Bord } from './bord';
import { botItemKoop } from './botKeuzes';
import { handelVakjeAf } from './effecten';
import type { GameState } from './gameState';
import { aantalDobbelstenen, kanIetsKopen, koopItem, winkelOpen, type ItemSoort } from './items';
import { botRatjeKeuze, huurRatje, kanRatjeInhuren, type RatjeKeuze } from './ratje';
import { BOOT_PRIJS, metKopie, spelerAanZet, trek, vereisFase, wijzigMunten } from './regels';
import { botKiestZijpad, openSplitsing } from './splitsing';
import { kanSterBetalen, koopSter, sterBijVakje } from './ster';

/**
 * Gooit de dobbelsteen (1–10) voor de speler die aan zet is. Met een dubbele of driedubbele
 * dobbelsteen worden de worpen opgeteld. Met Kies-je-worp geef je `gekozen` mee (1–10).
 */
export function dobbelen(state: GameState, gekozen?: number): GameState {
  const fase = vereisFase(state, 'dobbelen');
  const kiest = fase.gebruikt === 'kiesWorp';
  if (kiest && !(Number.isInteger(gekozen) && gekozen! >= 1 && gekozen! <= 10)) {
    throw new Error('Kies een getal van 1 tot 10');
  }
  return metKopie(state, (s) => {
    const speler = spelerAanZet(s);
    // Een nieuwe beurt begint met een leeg verslag. Is er al een item gebruikt, dan blijft dat erin staan.
    if (!fase.gebruikt) s.verslag = [];
    const worpen = kiest ? [gekozen!] : Array.from({ length: aantalDobbelstenen(fase.gebruikt) }, () => trek(s, 1, 10));
    const worp = worpen.reduce((a, b) => a + b, 0);
    s.verslag.push({ soort: 'worp', speler, waarde: worp, worpen, ...(kiest ? { gekozen: true } : {}) });
    s.fase = { soort: 'lopen', worp, resterend: worp };
  });
}

/**
 * Zet één stap. Staat de speler bij een open splitsing, dan kiest een bot meteen en wacht het
 * spel bij een mens op `splitsingKeuze`. Kan ook stoppen bij een ster, de winkel of Ratje.
 */
export function stap(state: GameState, bord: Bord): GameState {
  const fase = vereisFase(state, 'lopen');
  return metKopie(state, (s) => {
    const speler = spelerAanZet(s);
    const splitsing = openSplitsing(s, bord, speler);
    if (splitsing && !s.spelers[speler].isBot) {
      s.fase = { soort: 'splitsing', worp: fase.worp, resterend: fase.resterend, vakje: splitsing.vakje };
      return;
    }
    const zijpad = splitsing ? botKiestZijpad(s, bord, splitsing, speler) : false;
    zetStap(s, bord, fase.worp, fase.resterend, zijpad);
  });
}

/** Antwoord van een mens bij een splitsing: `zijpad` = hertenkamp-pad of de boot (kost 3 munten). */
export function splitsingKeuze(state: GameState, bord: Bord, zijpad: boolean): GameState {
  const fase = vereisFase(state, 'splitsing');
  return metKopie(state, (s) => zetStap(s, bord, fase.worp, fase.resterend, zijpad));
}

/** Eén vakje verder (eventueel het zijpad op), daarna langs de ster, de winkel en Ratje. */
function zetStap(s: GameState, bord: Bord, worp: number, resterendVoor: number, zijpad: boolean): void {
  const speler = spelerAanZet(s);
  const sp = s.spelers[speler];
  const splitsing = splitsingBij(bord, sp.vakje);
  if (splitsing) {
    s.verslag.push({ soort: 'splitsing', speler, splitsing: splitsing.soort, zijpad });
    if (zijpad && splitsing.soort === 'boot') wijzigMunten(s, speler, -BOOT_PRIJS, 'boot');
  }
  sp.vakje = volgendVakje(bord, sp.vakje, zijpad);
  langs(s, bord, worp, resterendVoor - 1, 'ster');
}

type Halte = 'ster' | 'winkel' | 'ratje';
const HALTES: Halte[] = ['ster', 'winkel', 'ratje'];

/**
 * Wat je tegenkomt op het vakje waar je net bent: de ster, de winkel en Ratje, in die volgorde.
 * Een mens krijgt een vraag (de fase wacht); een bot beslist meteen. `vanaf` = waar we verdergaan
 * nadat een mens geantwoord heeft.
 */
function langs(s: GameState, bord: Bord, worp: number, resterend: number, vanaf: Halte): void {
  const speler = spelerAanZet(s);
  const sp = s.spelers[speler];
  for (const halte of HALTES.slice(HALTES.indexOf(vanaf))) {
    if (halte === 'ster') {
      const plek = sterBijVakje(s, bord, sp.vakje);
      if (!plek || !kanSterBetalen(s, speler)) continue;
      if (!sp.isBot) return void (s.fase = { soort: 'sterKopen', worp, resterend, plek });
      // Bots kopen een ster altijd als het kan.
      koopSter(s, bord, speler, plek);
    } else if (halte === 'winkel') {
      if (sp.vakje !== bord.plekken.winkel.vakje || !winkelOpen(s) || !kanIetsKopen(s, speler)) continue;
      if (!sp.isBot) return void (s.fase = { soort: 'winkel', worp, resterend });
      const item = botItemKoop(s, bord, speler);
      if (item) koopItem(s, speler, item);
    } else {
      if (sp.vakje !== bord.plekken.ratje.vakje || !kanRatjeInhuren(s, speler)) continue;
      if (!sp.isBot) return void (s.fase = { soort: 'ratje', worp, resterend });
      const keuze = botRatjeKeuze(s, speler);
      if (keuze) huurRatje(s, speler, keuze);
    }
  }
  gaVerder(s, bord, worp, resterend);
}

/** Antwoord van een mens op "Ster kopen?". Daarna loopt de speler verder. */
export function sterKeuze(state: GameState, bord: Bord, kopen: boolean): GameState {
  const fase = vereisFase(state, 'sterKopen');
  return metKopie(state, (s) => {
    if (kopen) koopSter(s, bord, spelerAanZet(s), fase.plek);
    langs(s, bord, fase.worp, fase.resterend, 'winkel');
  });
}

/** Antwoord van een mens in de winkel: een item, of null voor "Niks kopen". */
export function winkelKeuze(state: GameState, bord: Bord, item: ItemSoort | null): GameState {
  const fase = vereisFase(state, 'winkel');
  return metKopie(state, (s) => {
    if (item) koopItem(s, spelerAanZet(s), item);
    langs(s, bord, fase.worp, fase.resterend, 'ratje');
  });
}

/** Antwoord van een mens bij Ratje: wat hij steelt en bij wie, of null voor "Niets". */
export function ratjeKeuze(state: GameState, bord: Bord, keuze: RatjeKeuze | null): GameState {
  const fase = vereisFase(state, 'ratje');
  return metKopie(state, (s) => {
    if (keuze) huurRatje(s, spelerAanZet(s), keuze);
    if (fase.voorDobbelen) s.fase = { soort: 'dobbelen', gebruikt: 'ratjebel' };
    else gaVerder(s, bord, fase.worp, fase.resterend);
  });
}

/** Loopt alle resterende stappen in één keer, tot er een keuze nodig is of de beurt klaar is. */
export function loopUit(state: GameState, bord: Bord): GameState {
  let s = state;
  while (s.fase.soort === 'lopen') s = stap(s, bord);
  return s;
}

function gaVerder(s: GameState, bord: Bord, worp: number, resterend: number): void {
  if (resterend > 0) {
    s.fase = { soort: 'lopen', worp, resterend };
    return;
  }
  handelVakjeAf(s, bord, spelerAanZet(s));
  volgendeBeurt(s);
}

function volgendeBeurt(s: GameState): void {
  s.aanZet += 1;
  s.fase = s.aanZet >= s.volgorde.length ? { soort: 'minigame' } : { soort: 'dobbelen' };
}
