import { describe, expect, it } from 'vitest';
import { loopUit, ratjeKeuze } from './beurt';
import type { GameState } from './gameState';
import { botRatjeKeuze, kanRatjeInhuren, ratjePrijs } from './ratje';
import { bordMetPlekken, met, metWorp, spel } from './testhulp';

const bord = bordMetPlekken(); // Ratje op v9

/** Speler 0 (mens) staat op v8 en loopt 1 stap naar Ratje. */
function bijRatje(wijzig: (s: GameState) => void = () => {}): GameState {
  return loopUit(
    metWorp(
      met(spel(), (s) => {
        s.volgorde = [0, 1, 2, 3];
        s.sterren = [{ plek: 'noord' }];
        s.spelers[0].vakje = 'v8';
        wijzig(s);
      }),
      1,
    ),
    bord,
  );
}

describe('Ratje inhuren (§7.2)', () => {
  it('prijzen: overdag 5 en 30, ’s nachts gratis en 25, met "Ratje gratis" alles 0', () => {
    const dag = spel();
    expect([ratjePrijs(dag, 'munten'), ratjePrijs(dag, 'ster')]).toEqual([5, 30]);
    const nacht = met(dag, (s) => (s.nacht = true));
    expect([ratjePrijs(nacht, 'munten'), ratjePrijs(nacht, 'ster')]).toEqual([0, 25]);
    const gratis = met(dag, (s) => (s.eindspelRegel = 'ratjeGratis'));
    expect([ratjePrijs(gratis, 'munten'), ratjePrijs(gratis, 'ster')]).toEqual([0, 0]);
  });

  it('een mens die langsloopt krijgt de vraag', () => {
    expect(bijRatje().fase).toEqual({ soort: 'ratje', worp: 1, resterend: 0 });
  });

  it('munten stelen: 5 munten, Ratje steelt 5–15', () => {
    const gezien = new Set<number>();
    for (let seed = 0; seed < 200; seed++) {
      const s = ratjeKeuze(bijRatje((x) => ((x.rng = seed), (x.spelers[1].munten = 40))), bord, { wat: 'munten', doel: 1 });
      const r = s.verslag.find((g) => g.soort === 'ratje');
      if (r?.soort !== 'ratje') throw new Error();
      expect(r.buit).toBeGreaterThanOrEqual(5);
      expect(r.buit).toBeLessThanOrEqual(15);
      expect(s.spelers[1].munten).toBe(40 - r.buit);
      // 10 − 5 (Ratje) + buit + 3 (v9 is blauw)
      expect(s.spelers[0].munten).toBe(10 - 5 + r.buit + 3);
      gezien.add(r.buit);
    }
    expect(gezien.size).toBe(11);
  });

  it('Ratje steelt nooit meer dan er is', () => {
    const s = ratjeKeuze(bijRatje((x) => (x.spelers[1].munten = 2)), bord, { wat: 'munten', doel: 1 });
    expect(s.spelers[1].munten).toBe(0);
    expect(s.verslag).toContainEqual({ soort: 'ratje', speler: 0, doel: 1, wat: 'munten', buit: 2 });
  });

  it('een ster stelen', () => {
    const s = ratjeKeuze(
      bijRatje((x) => ((x.spelers[0].munten = 35), (x.spelers[2].sterren = 2))),
      bord,
      { wat: 'ster', doel: 2 },
    );
    expect(s.spelers[0].sterren).toBe(1);
    expect(s.spelers[2].sterren).toBe(1);
    expect(s.spelers[0].munten).toBe(35 - 30 + 3);
  });

  it('niet kunnen: te weinig munten, bij jezelf, of bij iemand zonder ster', () => {
    const s = bijRatje((x) => (x.spelers[2].sterren = 1));
    expect(() => ratjeKeuze(s, bord, { wat: 'ster', doel: 2 })).toThrow();
    expect(() => ratjeKeuze(s, bord, { wat: 'munten', doel: 0 })).toThrow();
    const rijk = bijRatje((x) => (x.spelers[0].munten = 50));
    expect(() => ratjeKeuze(rijk, bord, { wat: 'ster', doel: 1 })).toThrow();
  });

  it('niets inhuren: gewoon verder', () => {
    const s = ratjeKeuze(bijRatje(), bord, null);
    expect(s.spelers[0].munten).toBe(13);
    expect(s.aanZet).toBe(1);
  });

  it('geen vraag als Ratje niets kan doen', () => {
    const s = met(spel(), (x) => {
      x.spelers[0].munten = 3;
    });
    expect(kanRatjeInhuren(s, 0)).toBe(false);
    expect(bijRatje((x) => (x.spelers[0].munten = 3)).fase.soort).not.toBe('ratje');
  });

  it("'s nachts is munten stelen gratis, dus ook zonder munten", () => {
    const s = bijRatje((x) => ((x.nacht = true), (x.spelers[0].munten = 0)));
    expect(s.fase.soort).toBe('ratje');
  });

  it('bots: eerst een ster bij wie de meeste heeft, anders munten bij de rijkste', () => {
    const s = met(spel(), (x) => {
      x.spelers[0].munten = 40;
      x.spelers[1].sterren = 1;
      x.spelers[2].sterren = 3;
      x.spelers[3].munten = 30;
    });
    expect(botRatjeKeuze(s, 0)).toEqual({ wat: 'ster', doel: 2 });
    const arm = met(s, (x) => (x.spelers[0].munten = 10));
    expect(botRatjeKeuze(arm, 0)).toEqual({ wat: 'munten', doel: 3 });
    const niks = met(s, (x) => (x.spelers[0].munten = 2));
    expect(botRatjeKeuze(niks, 0)).toBe(null);
  });
});
