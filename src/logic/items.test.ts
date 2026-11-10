import { describe, expect, it } from 'vitest';
import { dobbelen, loopUit, ratjeKeuze, stap, winkelKeuze } from './beurt';
import { botActie, speelBotsAf } from './bot';
import { botItemGebruik, botItemKoop, botKiesWorp } from './botKeuzes';
import type { GameState } from './gameState';
import { annuleerItem, gebruikItem, kanItemAnnuleren, kanItemGebruiken, werktMeteen, WINKEL_ITEMS } from './items';
import { ratjePrijs } from './ratje';
import { bordMetPlekken, met, metWorp, spel } from './testhulp';

/*
 * Testbord met plekken: v0 start, v1 blauw, v2 blauw (ster "noord"), v3 rood, v4 blauw (winkel),
 * v5 event, v6 blauw (ster "oost"), v7 blauw, v8 rood, v9 blauw (Ratje), v10 blauw (ster "west"), v11 blauw.
 */
const bord = bordMetPlekken();

/** Speler 0 is aan zet (mens), de ster staat bij "west". */
function basis(wijzig: (s: GameState) => void = () => {}): GameState {
  return met(spel(), (s) => {
    s.volgorde = [0, 1, 2, 3];
    s.sterren = [{ plek: 'west' }];
    wijzig(s);
  });
}

describe('de winkel bij het restaurant (§7.1)', () => {
  it('een mens die langsloopt krijgt de winkel, ook als hij er niet eindigt', () => {
    const s = loopUit(metWorp(basis(), 6), bord);
    expect(s.spelers[0].vakje).toBe('v4');
    expect(s.fase).toEqual({ soort: 'winkel', worp: 6, resterend: 2 });
  });

  it('kopen kost munten en het item komt in je zak; daarna loop je verder', () => {
    let s = loopUit(metWorp(basis(), 6), bord);
    s = winkelKeuze(s, bord, 'dubbel');
    expect(s.spelers[0].items).toEqual(['dubbel']);
    expect(s.spelers[0].munten).toBe(10 - WINKEL_ITEMS.dubbel.prijs);
    expect(s.verslag).toContainEqual({ soort: 'item', speler: 0, item: 'dubbel', actie: 'gekocht' });
    s = loopUit(s, bord);
    expect(s.spelers[0].vakje).toBe('v6');
  });

  it('te duur of de zak is vol: dat gaat niet', () => {
    const s = loopUit(metWorp(basis((x) => (x.spelers[0].munten = 9)), 6), bord);
    expect(() => winkelKeuze(s, bord, 'driedubbel')).toThrow();
    const vol = loopUit(metWorp(basis((x) => ((x.spelers[0].munten = 50), (x.spelers[0].items = ['dubbel', 'dubbel', 'dubbel']))), 6), bord);
    expect(vol.aanZet).toBe(1); // geen vraag: doorgelopen tot het einde van de beurt
  });

  it("'s nachts is de winkel dicht", () => {
    const s = loopUit(metWorp(basis((x) => (x.nacht = true)), 6), bord);
    expect(s.spelers[0].vakje).toBe('v6');
    expect(s.aanZet).toBe(1); // zonder te stoppen doorgelopen
  });

  it('bots kopen alleen als ze daarna nog een ster kunnen betalen', () => {
    const arm = basis((x) => (x.spelers[0].munten = 24));
    expect(botItemKoop(arm, bord, 0)).toBe(null);
    const rijk = basis((x) => (x.spelers[0].munten = 30));
    expect(botItemKoop(rijk, bord, 0)).toBe('driedubbel');
    const iets = basis((x) => (x.spelers[0].munten = 26));
    expect(botItemKoop(iets, bord, 0)).toBe('dubbel');
  });
});

describe('items gebruiken vóór het dobbelen', () => {
  const met1 = (...items: GameState['spelers'][0]['items']) => basis((x) => (x.spelers[0].items = items));

  it('dubbele dobbelsteen: twee worpen opgeteld', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = dobbelen(gebruikItem(met(met1('dubbel'), (x) => (x.rng = seed)), 'dubbel'));
      const w = s.verslag.find((g) => g.soort === 'worp')!;
      if (w.soort !== 'worp' || s.fase.soort !== 'lopen') throw new Error();
      expect(w.worpen).toHaveLength(2);
      expect(s.fase.worp).toBe(w.worpen[0] + w.worpen[1]);
      expect(s.spelers[0].items).toEqual([]);
    }
  });

  it('driedubbele dobbelsteen: drie worpen opgeteld', () => {
    const s = dobbelen(gebruikItem(met1('driedubbel'), 'driedubbel'));
    const w = s.verslag.find((g) => g.soort === 'worp');
    expect(w?.soort === 'worp' && w.worpen.length).toBe(3);
  });

  it('kies-je-worp: je kiest zelf 1 t/m 10', () => {
    const s = gebruikItem(met1('kiesWorp'), 'kiesWorp');
    expect(() => dobbelen(s)).toThrow();
    expect(() => dobbelen(s, 11)).toThrow();
    const na = dobbelen(s, 4);
    expect(na.fase).toEqual({ soort: 'lopen', worp: 4, resterend: 4 });
    expect(na.verslag).toContainEqual({ soort: 'worp', speler: 0, waarde: 4, worpen: [4], gekozen: true });
  });

  it('één item per beurt', () => {
    const s = gebruikItem(met1('dubbel', 'driedubbel'), 'dubbel');
    expect(kanItemGebruiken(s, 'driedubbel')).toBe(false);
    expect(() => gebruikItem(s, 'driedubbel')).toThrow();
    expect(s.spelers[0].items).toEqual(['driedubbel']);
  });

  it('alleen items die je hebt, en alleen vóór het dobbelen', () => {
    expect(() => gebruikItem(met1(), 'dubbel')).toThrow();
    expect(() => gebruikItem(dobbelen(met1('dubbel')), 'dubbel')).toThrow();
  });

  it('wisseltruc: ruil van plek met een willekeurige andere speler', () => {
    const s = gebruikItem(
      basis((x) => {
        x.spelers[0].items = ['wisseltruc'];
        x.spelers.forEach((sp, i) => (sp.vakje = `v${i + 1}`));
      }),
      'wisseltruc',
    );
    const ander = s.spelers.findIndex((sp, i) => i > 0 && sp.vakje === 'v1');
    expect(ander).toBeGreaterThan(0);
    expect(s.spelers[0].vakje).toBe(`v${ander + 1}`);
    expect(s.fase).toEqual({ soort: 'dobbelen', gebruikt: 'wisseltruc' });
  });

  it('ratjebel: Ratje komt meteen, daarna dobbel je gewoon', () => {
    let s = gebruikItem(
      basis((x) => {
        x.spelers[0].items = ['ratjebel'];
        x.spelers[1].munten = 20;
      }),
      'ratjebel',
    );
    expect(s.fase).toEqual({ soort: 'ratje', worp: 0, resterend: 0, voorDobbelen: true });
    s = ratjeKeuze(s, bord, { wat: 'munten', doel: 1 });
    expect(s.fase).toEqual({ soort: 'dobbelen', gebruikt: 'ratjebel' });
    expect(s.spelers[0].munten).toBeGreaterThan(10 - ratjePrijs(s, 'munten'));
    expect(dobbelen(s).fase.soort).toBe('lopen');
  });

  it('de ratjebel kan niet als Ratje niets kan doen', () => {
    const s = basis((x) => {
      x.spelers[0].items = ['ratjebel'];
      x.spelers[0].munten = 0;
    });
    expect(kanItemGebruiken(s, 'ratjebel')).toBe(false);
  });
});

describe('bots en items', () => {
  it('een bot gebruikt zijn beste dobbelsteen, zonder te wachten', () => {
    const s = met(spel(), (x) => {
      x.volgorde = [2, 0, 1, 3];
      x.spelers[2].items = ['dubbel', 'driedubbel'];
    });
    const na = botActie(s, bord)!;
    expect(na.fase).toEqual({ soort: 'dobbelen', gebruikt: 'driedubbel' });
    const gegooid = botActie(na, bord)!;
    expect(gegooid.fase.soort).toBe('lopen');
  });

  it('kies-je-worp: de bot loopt langs de ster als die binnen 10 vakjes ligt', () => {
    const s = basis((x) => {
      x.spelers[0].munten = 25;
      x.spelers[0].items = ['kiesWorp'];
    });
    expect(botItemGebruik(s, bord, 0)).toBe('kiesWorp');
    const n = botKiesWorp(gebruikItem(s, 'kiesWorp'), bord, 0);
    expect(n).toBeGreaterThanOrEqual(10); // de ster bij "west" ligt op v10
    const dichtbij = basis((x) => ((x.spelers[0].munten = 25), (x.sterren = [{ plek: 'oost' }])));
    const k = botKiesWorp(dichtbij, bord, 0);
    expect(k).toBeGreaterThanOrEqual(6);
    expect(['v6', 'v7', 'v9', 'v10']).toContain(`v${k}`); // eindigt niet op rood (v8)
  });

  it('bots spelen een beurt helemaal af met winkel en Ratje', () => {
    const s = met(spel(), (x) => {
      x.volgorde = [2, 0, 1, 3];
      x.spelers[2].munten = 60;
      x.spelers[1].sterren = 1;
      x.sterren = [{ plek: 'west' }];
      x.fase = { soort: 'lopen', worp: 9, resterend: 9 };
    });
    const na = speelBotsAf(s, bord);
    expect(na.spelers[2].vakje).toBe('v9');
    expect(na.verslag.some((g) => g.soort === 'item' && g.actie === 'gekocht')).toBe(true);
    expect(na.verslag).toContainEqual({ soort: 'ratje', speler: 2, doel: 1, wat: 'ster', buit: 1 });
    expect(na.spelers[2].sterren).toBe(1);
    expect(na.aanZet).toBe(1);
  });

  it('stap werkt nog gewoon voor één vakje', () => {
    expect(stap(metWorp(basis(), 2), bord).spelers[0].vakje).toBe('v1');
  });
});

describe('een item kiezen en annuleren (keuzemenu)', () => {
  const metZak = (items: GameState['spelers'][0]['items']) => basis((x) => (x.spelers[0].items = items));

  it('een dobbelsteen kiezen en weer annuleren: het item gaat terug in je zak', () => {
    const gekozen = gebruikItem(metZak(['dubbel', 'kiesWorp']), 'dubbel');
    expect(gekozen.fase).toEqual({ soort: 'dobbelen', gebruikt: 'dubbel' });
    expect(kanItemAnnuleren(gekozen)).toBe(true);
    const terug = annuleerItem(gekozen);
    expect(terug.fase).toEqual({ soort: 'dobbelen' });
    expect([...terug.spelers[0].items].sort()).toEqual(['dubbel', 'kiesWorp']);
    expect(terug.verslag.some((g) => g.soort === 'item')).toBe(false);
  });

  it('na annuleren kun je een ander item kiezen, en daarna gewoon gooien', () => {
    let s = annuleerItem(gebruikItem(metZak(['dubbel', 'kiesWorp']), 'dubbel'));
    s = gebruikItem(s, 'kiesWorp');
    expect(s.fase).toEqual({ soort: 'dobbelen', gebruikt: 'kiesWorp' });
    expect(s.spelers[0].items).toEqual(['dubbel']);
    s = dobbelen(s, 4);
    expect(s.fase).toMatchObject({ soort: 'lopen', worp: 4 });
  });

  it('nog steeds maar één item per beurt', () => {
    const s = gebruikItem(metZak(['dubbel', 'driedubbel']), 'dubbel');
    expect(kanItemGebruiken(s, 'driedubbel')).toBe(false);
    expect(() => gebruikItem(s, 'driedubbel')).toThrow();
  });

  it('na het dobbelen kun je niet meer annuleren', () => {
    const s = dobbelen(gebruikItem(metZak(['dubbel']), 'dubbel'));
    expect(kanItemAnnuleren(s)).toBe(false);
    expect(() => annuleerItem(s)).toThrow();
  });

  it('items die meteen werken (Wisseltruc, gemene items) kun je niet annuleren', () => {
    expect(werktMeteen('wisseltruc')).toBe(true);
    expect(werktMeteen('zakkenroller')).toBe(true);
    expect(werktMeteen('dubbel')).toBe(false);
    const s = gebruikItem(metZak(['wisseltruc']), 'wisseltruc');
    expect(kanItemAnnuleren(s)).toBe(false);
    expect(() => annuleerItem(s)).toThrow();
    // Zonder gekozen item valt er niets te annuleren.
    expect(kanItemAnnuleren(metZak(['dubbel']))).toBe(false);
  });
});
