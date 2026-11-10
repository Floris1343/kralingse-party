/**
 * Een beurt: dobbelen, stap voor stap lopen, langs de ster komen en het vakje afhandelen.
 * Het scherm roept `stap` per vakje aan, zodat het figuurtje kan lopen en er tussendoor
 * bewaard kan worden. `loopUit` doet alle stappen in één keer, tot er een keuze nodig is.
 */
import { splitsingBij, vakje, volgendVakje, type Bord } from './bord';
import { isEindspel } from './eindspel';
import type { GameState } from './gameState';
import { BLAUW_MUNTEN, BOOT_PRIJS, metKopie, ROOD_MUNTEN, spelerAanZet, trek, vereisFase, wijzigMunten } from './regels';
import { botKiestZijpad, openSplitsing } from './splitsing';
import { kanSterBetalen, koopSter, sterBijVakje } from './ster';

/** Gooit de dobbelsteen (1–10) voor de speler die aan zet is. */
export function dobbelen(state: GameState): GameState {
  vereisFase(state, 'dobbelen');
  return metKopie(state, (s) => {
    const speler = spelerAanZet(s);
    const worp = trek(s, 1, 10);
    s.verslag = [{ soort: 'worp', speler, waarde: worp }];
    s.fase = { soort: 'lopen', worp, resterend: worp };
  });
}

/**
 * Zet één stap. Staat de speler bij een open splitsing, dan kiest een bot meteen en wacht het
 * spel bij een mens op `splitsingKeuze`. Kan ook stoppen bij een ster of de beurt afronden.
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

/** Eén vakje verder (eventueel het zijpad op), dan de ster en het einde van de beurt. */
function zetStap(s: GameState, bord: Bord, worp: number, resterendVoor: number, zijpad: boolean): void {
  const speler = spelerAanZet(s);
  const sp = s.spelers[speler];
  const splitsing = splitsingBij(bord, sp.vakje);
  if (splitsing) {
    s.verslag.push({ soort: 'splitsing', speler, splitsing: splitsing.soort, zijpad });
    if (zijpad && splitsing.soort === 'boot') wijzigMunten(s, speler, -BOOT_PRIJS, 'boot');
  }
  sp.vakje = volgendVakje(bord, sp.vakje, zijpad);
  const resterend = resterendVoor - 1;

  const plek = sterBijVakje(s, bord, sp.vakje);
  if (plek && kanSterBetalen(s, speler)) {
    if (!sp.isBot) {
      s.fase = { soort: 'sterKopen', worp, resterend, plek };
      return;
    }
    // Bots kopen een ster altijd als het kan.
    koopSter(s, bord, speler, plek);
  }
  gaVerder(s, bord, worp, resterend);
}

/** Antwoord van een mens op "Ster kopen?". Daarna loopt de speler verder. */
export function sterKeuze(state: GameState, bord: Bord, kopen: boolean): GameState {
  const fase = vereisFase(state, 'sterKopen');
  return metKopie(state, (s) => {
    if (kopen) koopSter(s, bord, spelerAanZet(s), fase.plek);
    gaVerder(s, bord, fase.worp, fase.resterend);
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
  handelVakjeAf(s, bord);
  volgendeBeurt(s);
}

/** Het effect van het vakje waarop de speler eindigt. */
function handelVakjeAf(s: GameState, bord: Bord): void {
  const speler = spelerAanZet(s);
  const sp = s.spelers[speler];
  const factor = isEindspel(s) ? 2 : 1;
  switch (vakje(bord, sp.vakje).type) {
    case 'blauw':
      wijzigMunten(s, speler, BLAUW_MUNTEN * factor, 'blauw');
      break;
    case 'rood':
      sp.stats.roodVakjes += 1;
      wijzigMunten(s, speler, -ROOD_MUNTEN * factor, 'rood');
      break;
    case 'event':
    case 'hertenkamp':
      // De effecten komen in een latere stap; de Avonturier-teller telt al mee.
      sp.stats.avontuurVakjes += 1;
      break;
    default:
      // start, item, kans, pech: komen in een latere stap.
      break;
  }
}

function volgendeBeurt(s: GameState): void {
  s.aanZet += 1;
  s.fase = s.aanZet >= s.volgorde.length ? { soort: 'minigame' } : { soort: 'dobbelen' };
}
