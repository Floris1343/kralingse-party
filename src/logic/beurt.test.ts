import { describe, expect, it } from 'vitest';
import { dobbelen, loopUit, stap, sterKeuze } from './beurt';
import type { GameState } from './gameState';
import { spelerAanZet } from './regels';
import { sterPrijs } from './ster';
import { bord, met, metWorp, spel } from './testhulp';

/*
 * Testbord: v0 start, v1 blauw, v2 blauw (ster "noord"), v3 rood, v4 blauw, v5 event,
 * v6 blauw (ster "oost"), v7 blauw, v8 rood, v9 blauw, v10 blauw (ster "west"), v11 blauw.
 */

/** Spel waarin speler 0 (een mens) aan zet is en de ster bij "oost" (v6) staat. */
function basis(wijzig: (s: GameState) => void = () => {}): GameState {
  return met(spel(), (s) => {
    s.volgorde = [0, 1, 2, 3];
    s.sterren = [{ plek: 'oost' }];
    wijzig(s);
  });
}

describe('dobbelen', () => {
  it('gooit 1 t/m 10 en gaat lopen', () => {
    const gezien = new Set<number>();
    for (let seed = 0; seed < 300; seed++) {
      const s = dobbelen(met(spel({}, seed), () => {}));
      if (s.fase.soort !== 'lopen') throw new Error('verwacht lopen');
      expect(s.fase.resterend).toBe(s.fase.worp);
      expect(s.verslag).toEqual([{ soort: 'worp', speler: spelerAanZet(s), waarde: s.fase.worp, worpen: [s.fase.worp] }]);
      gezien.add(s.fase.worp);
    }
    expect([...gezien].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('kan niet twee keer achter elkaar', () => {
    expect(() => dobbelen(dobbelen(spel()))).toThrow();
  });

  it('laat de oude state ongemoeid', () => {
    const s = spel();
    const kopie = structuredClone(s);
    dobbelen(s);
    expect(s).toEqual(kopie);
  });
});

describe('lopen', () => {
  it('zet per stap één vakje vooruit', () => {
    let s = metWorp(basis(), 3);
    s = stap(s, bord);
    expect(s.spelers[0].vakje).toBe('v1');
    expect(s.fase).toMatchObject({ soort: 'lopen', resterend: 2 });
    s = stap(s, bord);
    expect(s.spelers[0].vakje).toBe('v2');
  });

  it('loopt rond het bord', () => {
    const s = loopUit(metWorp(basis((s) => (s.spelers[0].vakje = 'v10')), 4), bord);
    expect(s.spelers[0].vakje).toBe('v2');
  });

  it('kan alleen stappen tijdens het lopen', () => {
    expect(() => stap(spel(), bord)).toThrow();
  });
});

describe('vakjes', () => {
  it('blauw geeft +3', () => {
    const s = loopUit(metWorp(basis(), 1), bord);
    expect(s.spelers[0].munten).toBe(13);
    expect(s.verslag).toContainEqual({ soort: 'munten', speler: 0, verschil: 3, reden: 'blauw' });
  });

  it('rood geeft -3 en telt mee in de statistiek', () => {
    const s = loopUit(metWorp(basis(), 3), bord);
    expect(s.spelers[0].vakje).toBe('v3');
    expect(s.spelers[0].munten).toBe(7);
    expect(s.spelers[0].stats.roodVakjes).toBe(1);
  });

  it('rood gaat nooit onder 0', () => {
    const s = loopUit(metWorp(basis((s) => (s.spelers[0].munten = 2)), 3), bord);
    expect(s.spelers[0].munten).toBe(0);
    expect(s.verslag).toContainEqual({ soort: 'munten', speler: 0, verschil: -2, reden: 'rood' });
  });

  it('in de laatste 5 rondes tellen blauw en rood dubbel', () => {
    const blauw = loopUit(metWorp(basis((s) => (s.ronde = 6)), 1), bord);
    expect(blauw.spelers[0].munten).toBe(16);
    const rood = loopUit(metWorp(basis((s) => (s.ronde = 6)), 3), bord);
    expect(rood.spelers[0].munten).toBe(4);
    const nogNiet = loopUit(metWorp(basis((s) => (s.ronde = 5)), 1), bord);
    expect(nogNiet.spelers[0].munten).toBe(13);
  });

  it('een eventvakje telt mee voor de Avonturier-ster', () => {
    const s = loopUit(metWorp(basis(), 5), bord);
    expect(s.spelers[0].stats.avontuurVakjes).toBe(1);
    expect(s.spelers[0].munten).toBe(10);
  });

  it('de Rijkaard-stat onthoudt de hoogste muntenstand', () => {
    let s = loopUit(metWorp(basis((s) => (s.spelers[0].munten = 30)), 1), bord);
    expect(s.spelers[0].stats.hoogsteMunten).toBe(33);
    s = met(s, (x) => (x.aanZet = 0));
    s = loopUit(metWorp(s, 2), bord); // v1 -> v3 (rood)
    expect(s.spelers[0].munten).toBe(30);
    expect(s.spelers[0].stats.hoogsteMunten).toBe(33);
  });
});

describe('ster kopen bij langslopen', () => {
  const rijk = (s: GameState) => (s.spelers[0].munten = 25);

  it('een mens met genoeg munten krijgt de vraag, ook als hij er niet eindigt', () => {
    const s = loopUit(metWorp(basis(rijk), 8), bord);
    expect(s.spelers[0].vakje).toBe('v6');
    expect(s.fase).toEqual({ soort: 'sterKopen', worp: 8, resterend: 2, plek: 'oost' });
  });

  it('kopen: -20 munten, +1 ster, de ster verhuist en de speler loopt verder', () => {
    let s = loopUit(metWorp(basis(rijk), 8), bord);
    s = sterKeuze(s, bord, true);
    expect(s.spelers[0].sterren).toBe(1);
    expect(s.spelers[0].stats.sterrenGekocht).toBe(1);
    expect(s.sterren).toHaveLength(1);
    expect(s.sterren[0].plek).not.toBe('oost');
    expect(s.verslag).toContainEqual({ soort: 'sterGekocht', speler: 0, plek: 'oost', nieuwePlek: s.sterren[0].plek });
    s = loopUit(s, bord);
    expect(s.spelers[0].vakje).toBe('v8');
    expect(s.spelers[0].munten).toBe(25 - 20 - 3); // v8 is rood
  });

  it('niet kopen: alles blijft hetzelfde en de speler loopt verder', () => {
    let s = loopUit(metWorp(basis(rijk), 8), bord);
    s = loopUit(sterKeuze(s, bord, false), bord);
    expect(s.spelers[0].sterren).toBe(0);
    expect(s.sterren).toEqual([{ plek: 'oost' }]);
    expect(s.spelers[0].vakje).toBe('v8');
  });

  it('eindigen op het stervakje telt ook als langslopen', () => {
    const s = loopUit(metWorp(basis(rijk), 6), bord);
    expect(s.fase).toMatchObject({ soort: 'sterKopen', resterend: 0 });
    const na = sterKeuze(s, bord, true);
    expect(na.spelers[0].munten).toBe(25 - 20 + 3); // v6 is blauw
    expect(na.fase).toEqual({ soort: 'dobbelen' });
    expect(na.aanZet).toBe(1);
  });

  it('te weinig munten: geen vraag, gewoon doorlopen', () => {
    const s = loopUit(metWorp(basis((s) => (s.spelers[0].munten = 19)), 8), bord);
    expect(s.spelers[0].vakje).toBe('v8');
    expect(s.spelers[0].sterren).toBe(0);
  });

  it('een bot koopt de ster meteen', () => {
    const s = loopUit(
      metWorp(
        basis((s) => {
          s.spelers[0].isBot = true;
          s.spelers[0].munten = 25;
        }),
        8,
      ),
      bord,
    );
    expect(s.spelers[0].sterren).toBe(1);
    expect(s.spelers[0].vakje).toBe('v8');
    expect(s.fase).toEqual({ soort: 'dobbelen' });
  });

  it('de ster verhuist nooit naar dezelfde plek', () => {
    for (let seed = 0; seed < 100; seed++) {
      let s = met(basis(rijk), (x) => (x.rng = seed));
      s = sterKeuze(loopUit(metWorp(s, 6), bord), bord, true);
      expect(s.sterren[0].plek).not.toBe('oost');
    }
  });

  it('met twee sterren verhuist hij ook niet naar de plek van de andere ster', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s0 = basis((s) => {
        rijk(s);
        s.rng = seed;
        s.sterren = [{ plek: 'oost' }, { plek: 'noord' }];
      });
      // v2 (noord) eerst: 25 munten -> kopen; daarna niet genoeg meer voor oost.
      const s = sterKeuze(loopUit(metWorp(s0, 2), bord), bord, true);
      expect(s.sterren.map((st) => st.plek).sort()).toEqual(['oost', 'west']);
    }
  });

  it('met de eindspelregel "goedkope ster" kost een ster 10', () => {
    const s0 = basis((s) => {
      s.eindspelRegel = 'goedkopeSter';
      s.spelers[0].munten = 12;
    });
    expect(sterPrijs(s0)).toBe(10);
    const s = sterKeuze(loopUit(metWorp(s0, 8), bord), bord, true);
    expect(s.spelers[0].sterren).toBe(1);
    expect(s.spelers[0].munten).toBe(2);
  });
});

describe('beurtvolgorde', () => {
  it('na een beurt is de volgende in de volgorde aan zet', () => {
    let s = met(spel(), (x) => (x.volgorde = [2, 0, 3, 1]));
    const gezien: number[] = [];
    for (let i = 0; i < 4; i++) {
      gezien.push(spelerAanZet(s));
      s = loopUit(dobbelen(s), bord);
      if (s.fase.soort === 'sterKopen') s = loopUit(sterKeuze(s, bord, false), bord);
    }
    expect(gezien).toEqual([2, 0, 3, 1]);
    expect(s.fase).toEqual({ soort: 'minigame' });
  });
});
