import { describe, expect, it } from 'vitest';
import { BORD } from '../data/bord';
import { loopUit, stap } from './beurt';
import { huidigType, wisseltBijRonde } from './dagNacht';
import { vakje } from './bord';
import { pasRegelToe } from './eindspel';
import { handelVakjeAf } from './effecten';
import type { GameState } from './gameState';
import { verwerkMinigame } from './minigame';
import { nieuwSpel } from './nieuwSpel';
import { botKiestZijpad, openSplitsing } from './splitsing';
import { keuzes, met, metWorp, spel } from './testhulp';

const UITSLAG = [[0], [1], [2], [3]];

/** Speler 0 (mens) staat op `id` van het echte bord en is aan zet. */
function opBord(id: string, wijzig: (s: GameState) => void = () => {}): GameState {
  return met(nieuwSpel(BORD, keuzes(), 1), (s) => {
    s.volgorde = [0, 1, 2, 3];
    s.spelers[0].vakje = id;
    s.sterren = [{ plek: 'westoever' }];
    wijzig(s);
  });
}

describe('dag en nacht wisselen', () => {
  it('het spel begint overdag', () => {
    expect(spel().nacht).toBe(false);
  });

  it('elke 3 rondes: ronde 1–3 dag, 4–6 nacht, 7–9 dag, 10 nacht', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(wisseltBijRonde)).toEqual([4, 7, 10]);
    let s = met(spel(), (x) => (x.fase = { soort: 'minigame' }));
    const nacht: boolean[] = [s.nacht];
    for (let r = 1; r < 10; r++) {
      s = verwerkMinigame(s, UITSLAG);
      nacht.push(s.nacht);
      s = met(s, (x) => (x.fase = { soort: 'minigame' }));
    }
    expect(nacht).toEqual([false, false, false, true, true, true, false, false, false, true]);
  });

  it('de wissel staat in het verslag, zodat Pommie het kan zeggen', () => {
    const s = verwerkMinigame(met(spel(), (x) => ((x.ronde = 3), (x.fase = { soort: 'minigame' }))), UITSLAG);
    expect(s.verslag).toContainEqual({ soort: 'dagNacht', nacht: true, reden: 'ronde' });
  });

  it('een lantaarnpaal zet het direct om', () => {
    const s = loopUit(metWorp(opBord('noord3'), 1), BORD);
    expect(s.spelers[0].vakje).toBe('noord4');
    expect(s.nacht).toBe(true);
    expect(s.verslag).toContainEqual({ soort: 'dagNacht', nacht: true, reden: 'lantaarnpaal' });
    expect(s.spelers[0].stats.avontuurVakjes).toBe(1);
    const terug = loopUit(metWorp(opBord('plaszoom1', (x) => (x.nacht = true)), 1), BORD);
    expect(terug.nacht).toBe(false);
  });

  it('eeuwige nacht: het wordt meteen nacht en blijft nacht', () => {
    let s = met(spel(), (x) => pasRegelToe(x, BORD, 'eeuwigeNacht', 0));
    expect(s.nacht).toBe(true);
    s = met(s, (x) => ((x.ronde = 6), (x.fase = { soort: 'minigame' })));
    s = verwerkMinigame(s, UITSLAG); // ronde 7 zou dag worden
    expect(s.nacht).toBe(true);
    const lantaarn = loopUit(metWorp(opBord('noord3', (x) => ((x.nacht = true), (x.eindspelRegel = 'eeuwigeNacht'))), 1), BORD);
    expect(lantaarn.nacht).toBe(true);
  });
});

describe("wat er 's nachts verandert", () => {
  it('3 blauwe bosvakjes worden rood (en tellen dan als rood)', () => {
    const nachtRood = BORD.vakjes.filter((v) => v.flags?.includes('nachtRood'));
    expect(nachtRood).toHaveLength(3);
    const dag = spel();
    const nacht = met(dag, (x) => (x.nacht = true));
    for (const v of nachtRood) {
      expect(huidigType(dag, v)).toBe('blauw');
      expect(huidigType(nacht, v)).toBe('rood');
    }
    const s = met(opBord('noord1', (x) => (x.nacht = true)), (x) => handelVakjeAf(x, BORD, 0));
    expect(s.spelers[0].munten).toBe(7);
    expect(s.spelers[0].stats.roodVakjes).toBe(1);
  });

  it('gewone blauwe vakjes blijven blauw', () => {
    const nacht = met(spel(), (x) => (x.nacht = true));
    expect(huidigType(nacht, vakje(BORD, 'strand2'))).toBe('blauw');
  });

  it('de boot vaart niet: je loopt automatisch door', () => {
    const s = opBord('haven2', (x) => ((x.nacht = true), (x.spelers[0].munten = 30)));
    expect(openSplitsing(s, BORD, 0)).toBeUndefined();
    const na = stap(metWorp(s, 1), BORD);
    expect(na.spelers[0].vakje).toBe('haven3');
  });

  it('het hertenkamp blijft open, maar bots kiezen dan altijd het hoofdpad', () => {
    const s = opBord('noord7', (x) => ((x.nacht = true), (x.sterren = [{ plek: 'oostoever' }])));
    const herten = BORD.splitsingen.find((x) => x.soort === 'hertenkamp')!;
    expect(openSplitsing(s, BORD, 0)).toBe(herten);
    for (const ster of BORD.sterplekken) {
      expect(botKiestZijpad(met(s, (x) => (x.sterren = [{ plek: ster.id }])), BORD, herten, 0)).toBe(false);
    }
  });
});
