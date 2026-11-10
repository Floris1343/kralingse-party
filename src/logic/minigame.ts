/** De minigame-uitslag verwerken en de volgende ronde starten (§3, §5). */
import { wisseltBijRonde, wisselDagNacht } from './dagNacht';
import { eersteEindspelRonde, kiesLaatsteSpeler } from './eindspel';
import { doeEindtelling } from './eindtelling';
import type { GameState } from './gameState';
import { metKopie, MINIGAME_BELONING, vereisFase, wijzigMunten } from './regels';

/**
 * De uitslag als groepen in volgorde van finish. Gelijke plekken staan in dezelfde groep.
 * Voorbeeld: [[2], [0, 3], [1]] = speler 2 eerste, 0 en 3 gedeeld tweede, 1 vierde.
 */
export type MinigameUitslag = number[][];

/** Controleert de uitslag en geeft de munten per speler terug. */
export function minigameBeloning(uitslag: MinigameUitslag, aantalSpelers: number): number[] {
  const gezien = uitslag.flat();
  const uniek = new Set(gezien);
  if (
    gezien.length !== aantalSpelers ||
    uniek.size !== aantalSpelers ||
    gezien.some((i) => !Number.isInteger(i) || i < 0 || i >= aantalSpelers) ||
    uitslag.some((g) => g.length === 0)
  ) {
    throw new Error('De uitslag moet iedere speler precies één keer bevatten');
  }

  const munten = new Array<number>(aantalSpelers).fill(0);
  let plaats = 0; // 0 = eerste plaats
  for (const groep of uitslag) {
    // Gelijke plek: iedereen krijgt de beloning van de hoogste van die plekken.
    for (const i of groep) munten[i] = MINIGAME_BELONING[plaats] ?? 0;
    plaats += groep.length;
  }
  return munten;
}

/** Verwerkt de uitslag, sluit de ronde af en start de volgende (of de eindtelling). */
export function verwerkMinigame(state: GameState, uitslag: MinigameUitslag): GameState {
  vereisFase(state, 'minigame');
  const beloning = minigameBeloning(uitslag, state.spelers.length);
  return metKopie(state, (s) => {
    s.verslag = [];
    beloning.forEach((m, i) => {
      const echt = wijzigMunten(s, i, m, 'minigame');
      s.spelers[i].stats.minigameMunten += echt;
    });
    sluitRondeAf(s);
  });
}

function sluitRondeAf(s: GameState): void {
  for (const sp of s.spelers) sp.stats.sterrenPerRonde.push(sp.sterren);

  if (s.ronde >= s.instellingen.aantalRondes) {
    doeEindtelling(s);
    return;
  }
  s.ronde += 1;
  s.aanZet = 0;
  if (wisseltBijRonde(s.ronde)) wisselDagNacht(s, 'ronde');
  s.fase =
    s.ronde === eersteEindspelRonde(s)
      ? { soort: 'eindspelRad', speler: kiesLaatsteSpeler(s) }
      : { soort: 'dobbelen' };
}
