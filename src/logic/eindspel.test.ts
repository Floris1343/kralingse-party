import { describe, expect, it } from 'vitest';
import { draaiEindspelRad, eersteEindspelRonde, EINDSPEL_REGELS, isEindspel, kiesLaatsteSpeler, pasRegelToe } from './eindspel';
import type { GameState } from './gameState';
import { metKopie } from './regels';
import { sterPrijs } from './ster';
import { bord, met, spel } from './testhulp';

describe('wanneer begint het eindspel', () => {
  it('de laatste 5 rondes', () => {
    expect(eersteEindspelRonde(spel({ aantalRondes: 10 }))).toBe(6);
    expect(eersteEindspelRonde(spel({ aantalRondes: 15 }))).toBe(11);
    expect(eersteEindspelRonde(spel({ aantalRondes: 20 }))).toBe(16);
    expect(isEindspel(met(spel(), (s) => (s.ronde = 5)))).toBe(false);
    expect(isEindspel(met(spel(), (s) => (s.ronde = 6)))).toBe(true);
    expect(isEindspel(met(spel(), (s) => (s.ronde = 10)))).toBe(true);
  });
});

describe('wie draait het rad', () => {
  it('de speler op de laatste plaats (sterren, dan munten)', () => {
    const s = met(spel(), (x) => {
      x.spelers[0].sterren = 1;
      x.spelers[1].munten = 5;
      x.spelers[2].munten = 30;
    });
    expect(metKopieLaatste(s)).toBe(1);
  });

  it('bij een gedeelde laatste plaats wijst het lot een van hen aan', () => {
    const s0 = met(spel(), (x) => (x.spelers[0].sterren = 1));
    const gekozen = new Set<number>();
    for (let seed = 0; seed < 50; seed++) gekozen.add(metKopieLaatste(met(s0, (x) => (x.rng = seed))));
    expect([...gekozen].sort()).toEqual([1, 2, 3]);
  });
});

function metKopieLaatste(s: GameState): number {
  let uit = -1;
  metKopie(s, (x) => (uit = kiesLaatsteSpeler(x)));
  return uit;
}

describe('het rad', () => {
  const radState = (seed: number) =>
    met(spel(), (s) => {
      s.ronde = 6;
      s.fase = { soort: 'eindspelRad', speler: 2 };
      s.rng = seed;
    });

  it('kiest een regel, zet hem in de spelstand en gaat door met dobbelen', () => {
    const s = draaiEindspelRad(radState(1), bord);
    expect(EINDSPEL_REGELS).toContain(s.eindspelRegel);
    expect(s.fase).toEqual({ soort: 'dobbelen' });
    expect(s.verslag[0]).toEqual({ soort: 'eindspelRegel', speler: 2, regel: s.eindspelRegel });
  });

  it('alle vijf uitkomsten kunnen voorkomen', () => {
    const gezien = new Set<string | null>();
    for (let seed = 0; seed < 200; seed++) gezien.add(draaiEindspelRad(radState(seed), bord).eindspelRegel);
    expect(gezien.size).toBe(5);
  });

  it('kan alleen als het spel op het rad wacht', () => {
    expect(() => draaiEindspelRad(spel(), bord)).toThrow();
  });
});

describe('de regels', () => {
  const pas = (regel: (typeof EINDSPEL_REGELS)[number], seed = 1) =>
    metKopie(
      met(spel(), (s) => (s.rng = seed)),
      (s) => pasRegelToe(s, bord, regel, 3),
    );

  it('+20 munten voor de laatste', () => {
    const s = pas('munten20');
    expect(s.spelers.map((sp) => sp.munten)).toEqual([10, 10, 10, 30]);
    expect(s.spelers[3].stats.hoogsteMunten).toBe(30);
  });

  it('extra sterplek: twee sterren op verschillende plekken', () => {
    for (let seed = 0; seed < 30; seed++) {
      const s = pas('extraSter', seed);
      expect(s.sterren).toHaveLength(2);
      expect(s.sterren[0].plek).not.toBe(s.sterren[1].plek);
    }
  });

  it('een ster kost 10 munten', () => {
    expect(sterPrijs(spel())).toBe(20);
    expect(sterPrijs(pas('goedkopeSter'))).toBe(10);
  });

  it('eeuwige nacht en gratis Ratje worden onthouden voor later', () => {
    expect(pas('eeuwigeNacht').eindspelRegel).toBe('eeuwigeNacht');
    expect(pas('ratjeGratis').eindspelRegel).toBe('ratjeGratis');
  });
});
