/**
 * Een beurt: dobbelen, stap voor stap lopen, langs de ster komen en het vakje afhandelen.
 * Het scherm roept `stap` per vakje aan, zodat het figuurtje kan lopen en er tussendoor
 * bewaard kan worden. `loopUit` doet alle stappen in één keer (turbo en tests).
 */
import { vakje, volgendVakje, type Bord } from './bord';
import { isEindspel } from './eindspel';
import type { GameState } from './gameState';
import { BLAUW_MUNTEN, metKopie, ROOD_MUNTEN, spelerAanZet, trek, vereisFase, wijzigMunten } from './regels';
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

/** Zet één stap. Kan stoppen bij een ster (mens met genoeg munten) of de beurt afronden. */
export function stap(state: GameState, bord: Bord): GameState {
  const fase = vereisFase(state, 'lopen');
  return metKopie(state, (s) => {
    const speler = spelerAanZet(s);
    const sp = s.spelers[speler];
    sp.vakje = volgendVakje(bord, sp.vakje);
    const resterend = fase.resterend - 1;

    const plek = sterBijVakje(s, bord, sp.vakje);
    if (plek && kanSterBetalen(s, speler)) {
      if (!sp.isBot) {
        s.fase = { soort: 'sterKopen', worp: fase.worp, resterend, plek };
        return;
      }
      // Bots kopen een ster altijd als het kan.
      koopSter(s, bord, speler, plek);
    }
    gaVerder(s, bord, fase.worp, resterend);
  });
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
