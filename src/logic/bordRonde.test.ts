/**
 * Een rondje langs het hele echte bord: werkt elk vakje (overdag en 's nachts), kom je er ook
 * echt (lopend) op, en werken de winkel, de Nachtwinkel en Ratje bij het langslopen?
 */
import { describe, expect, it } from 'vitest';
import { BORD } from '../data/bord';
import { nachtwinkelKeuze, ratjeKeuze, splitsingKeuze, stap, sterKeuze, winkelKeuze } from './beurt';
import { speelBotsAf } from './bot';
import { splitsingBij, vakje, type Vakje } from './bord';
import { huidigType } from './dagNacht';
import { handelVakjeAf } from './effecten';
import type { GameState, Gebeurtenis } from './gameState';
import { ITEM_SOORTEN, NACHT_ITEM_SOORTEN, itemInfo } from './items';
import { nieuwSpel } from './nieuwSpel';
import { ratjePrijs } from './ratje';
import { metKopie } from './regels';
import { keuzes, met, naStartworp } from './testhulp';

/** Speler 0 (mens) is aan zet op het echte bord; de ster staat ver weg. */
function begin(wijzig: (s: GameState) => void = () => {}): GameState {
  return met(naStartworp(nieuwSpel(BORD, keuzes(), 1)), (s) => {
    s.volgorde = [0, 1, 2, 3];
    s.aanZet = 0;
    s.verslag = [];
    s.sterren = [{ plek: 'westoever' }];
    s.spelers.forEach((sp) => (sp.munten = 30));
    wijzig(s);
  });
}

/** Wat er gebeurt als speler 0 op dit vakje eindigt (zonder lopen). */
function landOp(id: string, nacht: boolean, seed: number): GameState {
  return metKopie(begin((s) => ((s.spelers[0].vakje = id), (s.nacht = nacht), (s.rng = seed))), (s) => handelVakjeAf(s, BORD, 0));
}

const soorten = (s: GameState) => s.verslag.map((g) => g.soort);
const rad = (s: GameState) => s.verslag.find((g): g is Extract<Gebeurtenis, { soort: 'rad' }> => g.soort === 'rad');

/** Wat elk soort vakje volgens ONTWERP.md moet doen. */
function controleer(v: Vakje, nacht: boolean): void {
  for (let seed = 1; seed <= 25; seed++) {
    const s = landOp(v.id, nacht, seed);
    const sp = s.spelers[0];
    const type = huidigType(s, v);
    const waar = `${v.id} (${type}${nacht ? ", 's nachts" : ''})`;
    switch (type) {
      case 'blauw':
      case 'ijs':
        expect(sp.munten, waar).toBe(33);
        break;
      case 'rood':
        expect(sp.munten, waar).toBe(27);
        expect(sp.stats.roodVakjes, waar).toBe(1);
        break;
      case 'item':
        expect(sp.items, waar).toHaveLength(1);
        break;
      case 'kans':
        expect(soorten(s), waar).toContain('kans');
        break;
      case 'pech':
        expect(rad(s)?.rad, waar).toBe('pech');
        break;
      case 'hertenkamp':
        expect(rad(s)?.rad, waar).toBe(nacht ? 'bok' : 'hertenkamp');
        expect(sp.stats.avontuurVakjes, waar).toBe(1);
        break;
      case 'vleermuis':
        expect(nacht, waar).toBe(true);
        expect(rad(s)?.rad, waar).toBe('vleermuis');
        break;
      case 'event': {
        const vlag = v.flags![0];
        expect(sp.stats.avontuurVakjes, waar).toBe(1);
        if (vlag === 'lantaarnpaal') expect(s.nacht, waar).toBe(!nacht);
        if (vlag === 'strandtent') expect(soorten(s), waar).toContain('strandtent');
        if (vlag === 'windvlaag') expect(soorten(s), waar).toContain('windvlaag');
        if (vlag === 'zeilwedstrijd') expect(soorten(s), waar).toContain('zeilwedstrijd');
        break;
      }
      case 'start':
      case 'boot':
        expect(s.verslag, waar).toEqual([]);
        break;
      default:
        throw new Error(`Onbekend vakje ${waar}`);
    }
  }
}

describe('elk vakje van het bord doet wat het moet doen', () => {
  for (const nacht of [false, true]) {
    it(nacht ? "'s nachts" : 'overdag', () => {
      for (const v of BORD.vakjes) controleer(v, nacht);
    });
  }

  it('alle soorten uit §6.5 komen voor', () => {
    const typen = new Set(BORD.vakjes.map((v) => v.type));
    for (const t of ['start', 'blauw', 'rood', 'event', 'item', 'kans', 'pech', 'hertenkamp', 'boot', 'ijs']) expect(typen.has(t as never)).toBe(true);
    const vlaggen = new Set(BORD.vakjes.flatMap((v) => v.flags ?? []));
    for (const f of ['nachtRood', 'nachtVleermuis', 'lantaarnpaal', 'strandtent', 'windvlaag', 'zeilwedstrijd']) expect(vlaggen.has(f as never)).toBe(true);
  });
});

/**
 * Laat speler 0 (mens) één stap lopen van `van` naar `naar` en beantwoordt alle vragen onderweg
 * met "nee". Geeft de stand na de beurt terug.
 */
function loopEenStap(van: string, naar: string, nacht: boolean): GameState {
  let s = begin((x) => {
    x.spelers[0].vakje = van;
    x.nacht = nacht;
    x.fase = { soort: 'lopen', worp: 1, resterend: 1 };
  });
  const zijpad = splitsingBij(BORD, van)?.zijpad === naar;
  for (let i = 0; i < 20 && s.aanZet === 0; i++) {
    const f = s.fase.soort;
    if (f === 'lopen') s = stap(s, BORD);
    else if (f === 'splitsing') s = splitsingKeuze(s, BORD, zijpad);
    else if (f === 'sterKopen') s = sterKeuze(s, BORD, false);
    else if (f === 'winkel') s = winkelKeuze(s, BORD, null);
    else if (f === 'nachtwinkel') s = nachtwinkelKeuze(s, BORD, null);
    else if (f === 'ratje') s = ratjeKeuze(s, BORD, null);
    else break;
  }
  return s;
}

describe('je kunt op elk vakje komen door te lopen', () => {
  it('elk vakje heeft een vakje ervoor en een vakje erna, en lopend kom je erop', () => {
    for (const v of BORD.vakjes) {
      expect(v.next.length, v.id).toBeGreaterThan(0);
      for (const n of v.next) expect(() => vakje(BORD, n), `${v.id} → ${n}`).not.toThrow();
      // Het ijspad gaat pas open in de winter (fase 8); de boot vaart alleen overdag.
      if (v.zone === 'ijspad' || v.id === 'ijs1') continue;
      for (const naar of v.next) {
        if (vakje(BORD, naar).zone === 'ijspad') continue;
        const s = loopEenStap(v.id, naar, false);
        const verplaatst = s.verslag.some((g) => g.soort === 'verplaatst');
        if (!verplaatst) expect(s.spelers[0].vakje, `${v.id} → ${naar}`).toBe(naar);
        expect(s.aanZet, `${v.id} → ${naar}: beurt klaar`).toBe(1);
      }
    }
  });

  it("'s nachts ook (zonder boot)", () => {
    for (const v of BORD.vakjes.filter((x) => x.zone !== 'ijspad' && x.zone !== 'boot')) {
      const naar = v.next.find((n) => !['ijspad', 'boot'].includes(vakje(BORD, n).zone))!;
      const s = loopEenStap(v.id, naar, true);
      expect(s.aanZet, v.id).toBe(1);
    }
  });
});

describe('de winkel bij het Restaurant', () => {
  const winkel = BORD.plekken.winkel.vakje;
  const ervoor = BORD.vakjes.find((v) => v.next.includes(winkel) && v.zone !== 'boot')!.id;
  const langs = (nacht: boolean) =>
    stap(begin((x) => ((x.spelers[0].vakje = ervoor), (x.nacht = nacht), (x.fase = { soort: 'lopen', worp: 3, resterend: 3 }))), BORD);

  it('overdag: je krijgt de winkel bij het langslopen, en elk item is te koop', () => {
    const s = langs(false);
    expect(s.fase.soort).toBe('winkel');
    for (const item of ITEM_SOORTEN) {
      const na = winkelKeuze(s, BORD, item);
      expect(na.spelers[0].items, item).toEqual([item]);
      expect(na.spelers[0].munten, item).toBe(30 - itemInfo(item).prijs);
    }
  });

  it("'s nachts is hij dicht", () => {
    expect(langs(true).fase.soort).toBe('lopen');
  });

  it('ook met de boot kom je langs de winkel', () => {
    const s = begin((x) => ((x.spelers[0].vakje = 'boot4'), (x.fase = { soort: 'lopen', worp: 2, resterend: 2 })));
    expect(stap(s, BORD).fase.soort).toBe('winkel');
  });

  it('een bot koopt er ook iets', () => {
    const s = speelBotsAf(begin((x) => {
      x.spelers[0].isBot = true;
      x.spelers[0].munten = 40;
      x.spelers[0].vakje = ervoor;
      x.fase = { soort: 'lopen', worp: 1, resterend: 1 };
    }), BORD);
    expect(s.spelers[0].items).toHaveLength(1);
  });
});

describe('de Nachtwinkel bij de jachthaven', () => {
  const nw = BORD.plekken.nachtwinkel.vakje;
  const ervoor = BORD.vakjes.find((v) => v.next.includes(nw))!.id;
  const langs = (nacht: boolean) =>
    stap(begin((x) => ((x.spelers[0].vakje = ervoor), (x.nacht = nacht), (x.fase = { soort: 'lopen', worp: 3, resterend: 3 }))), BORD);

  it("'s nachts: je krijgt de Nachtwinkel bij het langslopen, en elk gemeen item is te koop", () => {
    const s = langs(true);
    expect(s.fase.soort).toBe('nachtwinkel');
    for (const item of NACHT_ITEM_SOORTEN) {
      const na = nachtwinkelKeuze(s, BORD, item);
      expect(na.spelers[0].items, item).toEqual([item]);
      expect(na.spelers[0].munten, item).toBe(30 - itemInfo(item).prijs);
    }
  });

  it('overdag is hij dicht (en dan krijg je de bootkeuze)', () => {
    expect(langs(false).fase.soort).toBe('lopen');
  });

  it('een bot koopt er ook iets', () => {
    const s = speelBotsAf(begin((x) => {
      x.nacht = true;
      x.spelers[0].isBot = true;
      x.spelers[0].munten = 40;
      x.spelers[0].vakje = ervoor;
      x.fase = { soort: 'lopen', worp: 1, resterend: 1 };
    }), BORD);
    expect(s.spelers[0].items).toHaveLength(1);
  });
});

describe('Ratje bij Park Rozenburg', () => {
  const ratje = BORD.plekken.ratje.vakje;
  const ervoor = BORD.vakjes.find((v) => v.next.includes(ratje))!.id;
  const langs = (nacht: boolean, wijzig: (s: GameState) => void = () => {}) =>
    stap(begin((x) => {
      x.spelers[0].vakje = ervoor;
      x.nacht = nacht;
      x.spelers[2].sterren = 1;
      x.fase = { soort: 'lopen', worp: 3, resterend: 3 };
      wijzig(x);
    }), BORD);

  for (const nacht of [false, true]) {
    it(`${nacht ? "'s nachts" : 'overdag'}: munten stelen en een ster stelen, voor de goede prijs`, () => {
      const s = langs(nacht);
      expect(s.fase.soort).toBe('ratje');
      const munten = ratjeKeuze(s, BORD, { wat: 'munten', doel: 1 });
      const buit = munten.verslag.find((g) => g.soort === 'ratje');
      expect(buit?.soort === 'ratje' && buit.buit).toBeGreaterThanOrEqual(5);
      expect(munten.spelers[0].munten).toBe(30 - ratjePrijs(s, 'munten') + (buit?.soort === 'ratje' ? buit.buit : 0));
      const ster = ratjeKeuze(s, BORD, { wat: 'ster', doel: 2 });
      expect(ster.spelers[0].sterren).toBe(1);
      expect(ster.spelers[2].sterren).toBe(0);
      expect(ster.spelers[0].munten).toBe(30 - (nacht ? 25 : 30));
    });
  }

  it('je kunt niet stelen van iemand zonder ster, en zonder geld krijg je de vraag niet', () => {
    const s = langs(false);
    expect(() => ratjeKeuze(s, BORD, { wat: 'ster', doel: 1 })).toThrow();
    const arm = langs(false, (x) => (x.spelers[0].munten = 2));
    expect(arm.fase.soort).toBe('lopen');
  });

  it('een bot huurt Ratje ook', () => {
    const s = speelBotsAf(begin((x) => {
      x.spelers[0].isBot = true;
      x.spelers[0].munten = 40;
      x.spelers[2].sterren = 1;
      x.spelers[0].vakje = ervoor;
      x.fase = { soort: 'lopen', worp: 1, resterend: 1 };
    }), BORD);
    expect(s.verslag.some((g) => g.soort === 'ratje')).toBe(true);
  });
});
