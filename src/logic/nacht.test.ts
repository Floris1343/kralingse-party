import { describe, expect, it } from 'vitest';
import { dobbelen, loopUit, nachtwinkelKeuze, stap, sterKeuze, winkelKeuze } from './beurt';
import { botActie, speelBotsAf } from './bot';
import { botItemDoel, botItemGebruik, botKiesWorp, botNachtKoop } from './botKeuzes';
import { maakTestbord, vakje, type Bord } from './bord';
import { huidigType, wisselDagNacht } from './dagNacht';
import { handelVakjeAf, VLEERMUIS_RAD } from './effecten';
import { pasRegelToe } from './eindspel';
import type { GameState } from './gameState';
import { gebruikItem, itemDoelen, kanItemGebruiken, NACHT_ITEMS } from './items';
import { verwerkMinigame } from './minigame';
import { bewaar, laad, OPSLAG_SLEUTEL } from './opslag';
import { metKopie } from './regels';
import { stappenTotSter } from './splitsing';
import { misschienVallendeSter, zichtbareSterren } from './ster';
import { met, metWorp, spel } from './testhulp';

/*
 * Testbord: v0 start, v1 blauw (vleermuis), v2 blauw (ster "noord"), v3 rood, v4 blauw, v5 event,
 * v6 blauw (ster "oost"), v7 blauw (Nachtwinkel), v8 rood, v9 blauw, v10 blauw (ster "west"), v11 blauw.
 */
function nachtbord(): Bord {
  const b = maakTestbord();
  b.plekken.nachtwinkel = { vakje: 'v7', x: 0, y: 0 };
  b.vakjes[1].flags = ['nachtVleermuis'];
  return b;
}
const bord = nachtbord();
const UITSLAG = [[0], [1], [2], [3]];

/** Speler 0 (mens) is aan zet, de ster staat bij "west", het is nacht. */
function basis(wijzig: (s: GameState) => void = () => {}): GameState {
  return met(spel(), (s) => {
    s.volgorde = [0, 1, 2, 3];
    s.sterren = [{ plek: 'west' }];
    s.nacht = true;
    wijzig(s);
  });
}

/** Zoekt een seed waarbij `test` slaagt (voor willekeurige uitkomsten). */
function metSeed<T>(start: GameState, doe: (s: GameState) => T, test: (uit: T) => boolean): T {
  for (let seed = 1; seed < 2000; seed++) {
    const uit = doe(met(start, (s) => (s.rng = seed)));
    if (test(uit)) return uit;
  }
  throw new Error('Geen seed gevonden');
}

describe('de Nachtwinkel bij de jachthaven (§8.1)', () => {
  it("'s nachts stopt een mens die langsloopt bij de Nachtwinkel", () => {
    const s = loopUit(metWorp(basis(), 9), bord);
    expect(s.spelers[0].vakje).toBe('v7');
    expect(s.fase).toEqual({ soort: 'nachtwinkel', worp: 9, resterend: 2 });
  });

  it('overdag is hij dicht', () => {
    const s = loopUit(metWorp(basis((x) => (x.nacht = false)), 9), bord);
    expect(s.aanZet).toBe(1);
  });

  it('je koopt één gemeen item en loopt dan verder; gewone items verkoopt hij niet', () => {
    let s = loopUit(metWorp(basis(), 9), bord);
    expect(() => nachtwinkelKeuze(s, bord, 'dubbel')).toThrow();
    s = nachtwinkelKeuze(s, bord, 'valstrik');
    expect(s.spelers[0].items).toEqual(['valstrik']);
    expect(s.spelers[0].munten).toBe(10 - NACHT_ITEMS.valstrik.prijs);
    expect(loopUit(s, bord).spelers[0].vakje).toBe('v9');
  });

  it('de gewone winkel verkoopt geen gemene items', () => {
    const b = nachtbord();
    b.plekken.winkel = { vakje: 'v4', x: 0, y: 0 };
    const s = loopUit(metWorp(basis((x) => (x.nacht = false)), 6), b);
    expect(s.fase.soort).toBe('winkel');
    expect(() => winkelKeuze(s, b, 'valstrik')).toThrow();
  });

  it('met een volle zak of te weinig munten krijg je hem niet te zien', () => {
    const vol = loopUit(metWorp(basis((x) => (x.spelers[0].items = ['dubbel', 'dubbel', 'dubbel'])), 9), bord);
    expect(vol.aanZet).toBe(1);
    const arm = loopUit(metWorp(basis((x) => (x.spelers[0].munten = 4)), 9), bord);
    expect(arm.aanZet).toBe(1);
  });

  it('bots kopen alleen als ze daarna nog een ster kunnen betalen', () => {
    expect(botNachtKoop(basis((x) => (x.spelers[0].munten = 24)), 0)).toBe(null);
    expect(botNachtKoop(basis((x) => (x.spelers[0].munten = 27)), 0)).toBe('achteruitpet');
    expect(botNachtKoop(basis((x) => (x.spelers[0].munten = 25)), 0)).toBe('slakkendobbel');
  });

  it('een bot koopt bij het langslopen zonder te wachten', () => {
    const s = speelBotsAf(metWorp(basis((x) => {
      x.volgorde = [2, 0, 1, 3];
      x.spelers[2].munten = 30;
    }), 9), bord);
    expect(s.spelers[2].items).toEqual(['achteruitpet']);
    expect(s.aanZet).toBe(1);
  });
});

describe('de gemene items', () => {
  const metItem = (item: GameState['spelers'][0]['items'][0], wijzig: (s: GameState) => void = () => {}) =>
    basis((x) => {
      x.spelers[0].items = [item];
      wijzig(x);
    });

  it('Zakkenroller: steel meteen 5 munten, daarna dobbel je gewoon', () => {
    const s = gebruikItem(metItem('zakkenroller'), 'zakkenroller', 2);
    expect(s.spelers[0].munten).toBe(15);
    expect(s.spelers[2].munten).toBe(5);
    expect(s.spelers[0].items).toEqual([]);
    expect(s.fase).toEqual({ soort: 'dobbelen', gebruikt: 'zakkenroller' });
    expect(s.verslag).toContainEqual({ soort: 'gemeen', speler: 0, doel: 2, item: 'zakkenroller', buit: 5 });
  });

  it('Zakkenroller: nooit meer dan iemand heeft, niet bij jezelf en niet bij iemand zonder munten', () => {
    const s0 = metItem('zakkenroller', (x) => ((x.spelers[1].munten = 3), (x.spelers[2].munten = 0)));
    expect(itemDoelen(s0, 0, 'zakkenroller')).toEqual([1, 3]);
    expect(() => gebruikItem(s0, 'zakkenroller', 0)).toThrow();
    expect(() => gebruikItem(s0, 'zakkenroller', 2)).toThrow();
    expect(() => gebruikItem(s0, 'zakkenroller')).toThrow();
    expect(gebruikItem(s0, 'zakkenroller', 1).spelers[0].munten).toBe(13);
  });

  it('Slakkendobbel: het doel gooit zijn volgende beurt maar 1–3, daarna weer gewoon', () => {
    let s = gebruikItem(metItem('slakkendobbel'), 'slakkendobbel', 1);
    expect(s.spelers[1].slak).toBe(true);
    // Iemand die hem al heeft, kun je hem niet nog eens geven.
    expect(itemDoelen(s, 0, 'slakkendobbel')).toEqual([2, 3]);
    for (let seed = 1; seed <= 30; seed++) {
      const t = dobbelen(met(s, (x) => ((x.aanZet = 1), (x.fase = { soort: 'dobbelen' }), (x.rng = seed))));
      const worp = t.verslag.find((g) => g.soort === 'worp')!;
      expect(worp.soort === 'worp' && worp.waarde).toBeGreaterThanOrEqual(1);
      expect(worp.soort === 'worp' && worp.waarde).toBeLessThanOrEqual(3);
      expect(t.spelers[1].slak).toBe(false);
    }
  });

  it('Slakkendobbel met een dubbele dobbelsteen: 2× 1–3; met Kies-je-worp kies je 1–3', () => {
    const slak = basis((x) => (x.spelers[0].slak = true));
    const dubbel = dobbelen(met(slak, (x) => (x.fase = { soort: 'dobbelen', gebruikt: 'dubbel' })));
    const w = dubbel.verslag.find((g) => g.soort === 'worp')!;
    expect(w.soort === 'worp' && w.worpen.every((n) => n >= 1 && n <= 3)).toBe(true);
    const kies = met(slak, (x) => (x.fase = { soort: 'dobbelen', gebruikt: 'kiesWorp' }));
    expect(() => dobbelen(kies, 4)).toThrow();
    expect(dobbelen(kies, 3).fase).toMatchObject({ soort: 'lopen', worp: 3 });
    expect(botKiesWorp(slak, bord, 0)).toBeLessThanOrEqual(3);
  });

  it('Achteruitpet: het doel loopt zijn volgende beurt achteruit, daarna weer vooruit', () => {
    let s = gebruikItem(metItem('achteruitpet'), 'achteruitpet', 1);
    expect(s.spelers[1].achteruit).toBe(true);
    s = met(s, (x) => {
      x.aanZet = 1;
      x.spelers[1].vakje = 'v5';
      x.fase = { soort: 'lopen', worp: 3, resterend: 3 };
    });
    s = loopUit(s, bord);
    expect(s.spelers[1].vakje).toBe('v2');
    expect(s.spelers[1].achteruit).toBe(false);
    expect(s.aanZet).toBe(2);
  });

  it('achteruit langs de ster telt als langslopen', () => {
    const s = loopUit(metWorp(basis((x) => {
      x.spelers[0].achteruit = true;
      x.spelers[0].vakje = 'v11';
      x.spelers[0].munten = 20;
    }), 3), bord);
    expect(s.fase).toMatchObject({ soort: 'sterKopen', plek: 'west' });
    expect(sterKeuze(s, bord, true).spelers[0].sterren).toBe(1);
  });

  it('achteruit van de start af loopt het rondje terug', () => {
    const s = loopUit(metWorp(basis((x) => (x.spelers[0].achteruit = true)), 2), bord);
    expect(s.spelers[0].vakje).toBe('v10');
  });

  it('achteruit op het echte bord: nooit terug het hertenkamp-pad, de boot of het ijs op', async () => {
    const { BORD } = await import('../data/bord');
    const zij = new Set(['hertenkamp-pad', 'boot', 'ijspad']);
    for (const start of BORD.vakjes.filter((v) => !zij.has(v.zone))) {
      let s = met(spel(), (x) => {
        x.volgorde = [0, 1, 2, 3];
        x.spelers.forEach((sp) => (sp.munten = 0));
        x.spelers[0].vakje = start.id;
        x.spelers[0].achteruit = true;
        x.sterren = [];
        x.fase = { soort: 'lopen', worp: 10, resterend: 10 };
      });
      while (s.fase.soort === 'lopen') {
        s = stap(s, BORD);
        if (s.aanZet === 0) expect(zij.has(vakje(BORD, s.spelers[0].vakje).zone)).toBe(false);
      }
      expect(s.aanZet).toBe(1);
    }
  });

  it('Valstrik: leggen, de ander die erop eindigt betaalt 10, langslopen niet', () => {
    let s = gebruikItem(metItem('valstrik', (x) => (x.spelers[0].vakje = 'v4')), 'valstrik');
    expect(s.valstrikken).toEqual([{ speler: 0, vakje: 'v4' }]);
    // Langslopen: niets.
    const langs = loopUit(met(s, (x) => {
      x.aanZet = 1;
      x.spelers[1].vakje = 'v3';
      x.fase = { soort: 'lopen', worp: 2, resterend: 2 };
    }), bord);
    expect(langs.valstrikken).toHaveLength(1);
    // Erop eindigen: 10 munten aan de eigenaar, en de valstrik is weg.
    const erop = loopUit(met(s, (x) => {
      x.aanZet = 1;
      x.spelers[1].vakje = 'v3';
      x.fase = { soort: 'lopen', worp: 1, resterend: 1 };
    }), bord);
    expect(erop.valstrikken).toEqual([]);
    expect(erop.spelers[0].munten).toBe(20);
    expect(erop.spelers[1].munten).toBe(0 + 3); // 10 - 10, daarna +3 van het blauwe vakje
    expect(erop.verslag).toContainEqual({ soort: 'valstrik', speler: 1, eigenaar: 0, vakje: 'v4', munten: 10 });
  });

  it('Valstrik: wie arm is geeft wat hij heeft; op je eigen valstrik gebeurt niets', () => {
    const s = met(basis(), (x) => {
      x.valstrikken = [{ speler: 2, vakje: 'v4' }];
      x.spelers[0].munten = 4;
    });
    const arm = loopUit(met(s, (x) => (x.fase = { soort: 'lopen', worp: 4, resterend: 4 })), bord);
    expect(arm.spelers[2].munten).toBe(14);
    const eigen = loopUit(met(s, (x) => {
      x.valstrikken = [{ speler: 0, vakje: 'v4' }];
      x.fase = { soort: 'lopen', worp: 4, resterend: 4 };
    }), bord);
    expect(eigen.valstrikken).toHaveLength(1);
  });

  it('Valstrik: maar één per speler, en niet op een vakje waar er al een ligt', () => {
    const al = metItem('valstrik', (x) => (x.valstrikken = [{ speler: 0, vakje: 'v8' }]));
    expect(kanItemGebruiken(al, 'valstrik')).toBe(false);
    const bezet = metItem('valstrik', (x) => (x.valstrikken = [{ speler: 1, vakje: 'v0' }]));
    expect(kanItemGebruiken(bezet, 'valstrik')).toBe(false);
  });

  it('Valstrik: verplaatst worden (windvlaag e.d.) telt niet als eindigen', () => {
    // v5 is een event zonder vlag op het testbord; zet er een windvlaag op die je naar v8 blaast.
    const b = nachtbord();
    b.vakjes[5].flags = ['windvlaag'];
    const s = metSeed(
      met(basis(), (x) => (x.valstrikken = [{ speler: 2, vakje: 'v8' }])),
      (t) => loopUit(met(t, (x) => (x.fase = { soort: 'lopen', worp: 5, resterend: 5 })), b),
      (t) => t.spelers[0].vakje === 'v8',
    );
    expect(s.valstrikken).toHaveLength(1);
  });

  it('bots richten gemene items op de koploper, of op de 2e als ze zelf eerst staan', () => {
    const s = basis((x) => {
      x.spelers[1].sterren = 2;
      x.spelers[3].sterren = 1;
    });
    expect(botItemDoel(s, 2, 'achteruitpet')).toBe(1);
    expect(botItemDoel(s, 1, 'achteruitpet')).toBe(3);
  });

  it('een bot gebruikt zijn gemene item meteen, zonder te wachten', () => {
    let s = basis((x) => {
      x.volgorde = [2, 0, 1, 3];
      x.spelers[2].items = ['slakkendobbel', 'dubbel'];
      x.spelers[1].sterren = 1;
    });
    expect(botItemGebruik(s, bord, 2)).toBe('slakkendobbel');
    s = botActie(s, bord)!;
    expect(s.spelers[1].slak).toBe(true);
    expect(s.fase).toEqual({ soort: 'dobbelen', gebruikt: 'slakkendobbel' });
  });

  it('een bot met de Achteruitpet gebruikt geen extra dobbelstenen', () => {
    const s = basis((x) => {
      x.spelers[0].items = ['driedubbel'];
      x.spelers[0].achteruit = true;
    });
    expect(botItemGebruik(s, bord, 0)).toBe(null);
  });
});

describe('de vallende ster (§8.2)', () => {
  const nachtronde = (wijzig: (s: GameState) => void = () => {}) =>
    met(spel(), (s) => {
      s.ronde = 4; // ronde 5 blijft nacht
      s.nacht = true;
      s.sterren = [{ plek: 'west' }];
      s.fase = { soort: 'minigame' };
      wijzig(s);
    });

  it('aan het begin van een nachtronde verschijnt er soms een tweede ster op een andere plek', () => {
    let gezien = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const s = verwerkMinigame(met(nachtronde(), (x) => (x.rng = seed)), UITSLAG, bord);
      const vallend = s.sterren.filter((st) => st.vallend);
      if (vallend.length) {
        gezien++;
        expect(vallend).toHaveLength(1);
        expect(vallend[0].plek).not.toBe('west');
        expect(s.verslag).toContainEqual({ soort: 'vallendeSter', plek: vallend[0].plek });
      }
    }
    // Ongeveer 20%.
    expect(gezien).toBeGreaterThan(50);
    expect(gezien).toBeLessThan(110);
  });

  it('overdag nooit, en nooit twee tegelijk', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const dag = verwerkMinigame(nachtronde((x) => ((x.nacht = false), (x.ronde = 1), (x.rng = seed))), UITSLAG, bord);
      expect(dag.sterren.some((st) => st.vallend)).toBe(false);
      const al = metKopie(nachtronde((x) => ((x.sterren.push({ plek: 'oost', vallend: true })), (x.rng = seed))), (s) =>
        misschienVallendeSter(s, maakTestbord()),
      );
      expect(al.sterren.filter((st) => st.vallend)).toHaveLength(1);
    }
  });

  it('na aankoop is hij weg; hij verhuist niet', () => {
    const s = loopUit(metWorp(basis((x) => {
      x.sterren = [{ plek: 'west' }, { plek: 'noord', vallend: true }];
      x.spelers[0].munten = 20;
    }), 2), bord);
    expect(s.fase).toMatchObject({ soort: 'sterKopen', plek: 'noord' });
    const na = sterKeuze(s, bord, true);
    expect(na.sterren).toEqual([{ plek: 'west' }]);
    expect(na.spelers[0].sterren).toBe(1);
  });

  it('wordt het dag, dan verdwijnt hij', () => {
    const s = metKopie(basis((x) => (x.sterren = [{ plek: 'west' }, { plek: 'noord', vallend: true }])), (x) =>
      wisselDagNacht(x, 'lantaarnpaal'),
    );
    expect(s.sterren).toEqual([{ plek: 'west' }]);
    expect(s.verslag).toContainEqual({ soort: 'vallendeSterWeg', plek: 'noord' });
  });

  it('bots lopen er ook op af', () => {
    const s = basis((x) => (x.sterren = [{ plek: 'west' }, { plek: 'noord', vallend: true }]));
    expect(stappenTotSter(s, bord, 'v0')).toBe(2);
  });
});

describe('de vleermuizen in het bos (§8.3)', () => {
  const opVleermuis = (wijzig: (s: GameState) => void = () => {}) =>
    basis((x) => {
      x.spelers[0].vakje = 'v1';
      wijzig(x);
    });
  const af = (s: GameState) => metKopie(s, (x) => handelVakjeAf(x, bord, 0));
  const uitkomst = (s: GameState) => {
    const g = s.verslag.find((g) => g.soort === 'rad');
    return g?.soort === 'rad' ? g.uitkomst : null;
  };

  it("alleen 's nachts is het een vleermuisvakje", () => {
    expect(huidigType(basis(), bord.vakjes[1])).toBe('vleermuis');
    expect(huidigType(basis((x) => (x.nacht = false)), bord.vakjes[1])).toBe('blauw');
    const dag = af(opVleermuis((x) => (x.nacht = false)));
    expect(dag.spelers[0].munten).toBe(13);
  });

  it('het rad heeft 6 vakken; naar de ster is 1 op 6', () => {
    expect(VLEERMUIS_RAD).toHaveLength(6);
    expect(VLEERMUIS_RAD.filter((u) => u === 'ster')).toHaveLength(1);
  });

  it('elke uitkomst doet wat hij moet doen, en het nieuwe vakje telt niet', () => {
    const verwacht: Record<string, (s: GameState) => void> = {
      terug: (s) => expect(s.spelers[0].vakje).toBe('v11'),
      vooruit: (s) => expect(s.spelers[0].vakje).toBe('v3'),
      munten5: (s) => expect(s.spelers[0].munten).toBe(15),
      min5: (s) => expect(s.spelers[0].munten).toBe(5),
      // De ster staat bij west (v10): vlak ervoor is v9.
      ster: (s) => expect(s.spelers[0].vakje).toBe('v9'),
    };
    for (const [naam, check] of Object.entries(verwacht)) {
      const s = metSeed(opVleermuis(), af, (t) => uitkomst(t) === naam);
      check(s);
      if (naam !== 'munten5' && naam !== 'min5') expect(s.spelers[0].munten).toBe(10);
      expect(s.spelers[0].stats.avontuurVakjes).toBe(1);
    }
  });

  it('de vleermuizen weten ook in de mist waar de ster staat', () => {
    const s = metSeed(opVleermuis((x) => (x.mist = { totRonde: 9 })), af, (t) => uitkomst(t) === 'ster');
    expect(s.spelers[0].vakje).toBe('v9');
  });
});

describe('de ochtendmist (§8.4)', () => {
  const wordtDag = (wijzig: (s: GameState) => void = () => {}) => (s0: GameState) =>
    metKopie(s0, (s) => {
      wijzig(s);
      wisselDagNacht(s, 'ronde');
    });

  it('als het dag wordt, is er ongeveer de helft van de keren mist', () => {
    let mist = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const s = wordtDag((x) => (x.rng = seed))(basis((x) => (x.ronde = 7)));
      if (s.mist) {
        mist++;
        expect(s.mist).toEqual({ totRonde: 8 });
        expect(s.verslag).toContainEqual({ soort: 'mist', aan: true });
      }
    }
    expect(mist).toBeGreaterThan(70);
    expect(mist).toBeLessThan(130);
  });

  it('bij mist zie je de ster niet, en bots weten het ook niet', () => {
    const s = basis((x) => ((x.nacht = false), (x.mist = { totRonde: 5 })));
    expect(zichtbareSterren(s)).toEqual([]);
    expect(stappenTotSter(s, bord, 'v0')).toBe(Infinity);
  });

  it('wie erlangs loopt, ontdekt de ster en kan hem gewoon kopen', () => {
    const s = loopUit(metWorp(basis((x) => {
      x.nacht = false;
      x.mist = { totRonde: 5 };
      x.spelers[0].munten = 20;
    }), 11), bord);
    expect(s.fase).toMatchObject({ soort: 'sterKopen', plek: 'west' });
    expect(s.verslag).toContainEqual({ soort: 'sterOntdekt', speler: 0, plek: 'west' });
    expect(zichtbareSterren(s)).toHaveLength(1);
    // Na aankoop verhuist hij weer verborgen.
    const na = sterKeuze(s, bord, true);
    expect(zichtbareSterren(na)).toEqual([]);
  });

  it('ook zonder genoeg munten ontdek je hem', () => {
    const s = loopUit(metWorp(basis((x) => ((x.nacht = false), (x.mist = { totRonde: 5 }))), 11), bord);
    expect(s.sterren[0].ontdekt).toBe(true);
  });

  it('de mist trekt op na één volledige ronde', () => {
    const s0 = basis((x) => {
      x.nacht = false;
      x.ronde = 7;
      x.mist = { totRonde: 8 };
      x.sterren = [{ plek: 'west', ontdekt: true }];
      x.fase = { soort: 'minigame' };
    });
    const s = verwerkMinigame(s0, UITSLAG, bord);
    expect(s.ronde).toBe(8);
    expect(s.mist).toBe(null);
    expect(s.sterren).toEqual([{ plek: 'west' }]);
    expect(s.verslag).toContainEqual({ soort: 'mist', aan: false });
  });

  it('door een lantaarnpaal midden in een ronde blijft hij tot de ronde erna', () => {
    const s = metSeed(basis((x) => (x.ronde = 4)), (t) => metKopie(t, (x) => wisselDagNacht(x, 'lantaarnpaal')), (t) => !!t.mist);
    expect(s.mist).toEqual({ totRonde: 6 });
  });

  it('wordt het nacht, dan is de mist meteen weg (ook bij eeuwige nacht)', () => {
    const dag = basis((x) => ((x.nacht = false), (x.mist = { totRonde: 9 })));
    expect(metKopie(dag, (x) => wisselDagNacht(x, 'lantaarnpaal')).mist).toBe(null);
    expect(metKopie(dag, (x) => pasRegelToe(x, bord, 'eeuwigeNacht', 0)).mist).toBe(null);
  });

  it('bots gebruiken in de mist geen Wisseltruc (ze weten niet hoe ver de ster is)', () => {
    const s = basis((x) => {
      x.nacht = false;
      x.mist = { totRonde: 9 };
      x.spelers[0].items = ['wisseltruc'];
    });
    expect(botItemGebruik(s, bord, 0)).toBe(null);
  });
});

describe('opslaan (versie 4)', () => {
  it('een spel uit stap 5 (versie 3) speelt gewoon verder', () => {
    const oud = structuredClone(spel()) as Partial<GameState> & GameState;
    delete (oud as Partial<GameState>).valstrikken;
    delete (oud as Partial<GameState>).mist;
    for (const sp of oud.spelers) {
      delete (sp as Partial<typeof sp>).slak;
      delete (sp as Partial<typeof sp>).achteruit;
    }
    const opslag = new Map<string, string>();
    const o = {
      getItem: (k: string) => opslag.get(k) ?? null,
      setItem: (k: string, v: string) => void opslag.set(k, v),
      removeItem: (k: string) => void opslag.delete(k),
    };
    o.setItem(OPSLAG_SLEUTEL, JSON.stringify({ versie: 3, state: oud }));
    const geladen = laad(o)!;
    expect(geladen.valstrikken).toEqual([]);
    expect(geladen.mist).toBe(null);
    expect(geladen.spelers.every((sp) => !sp.slak && !sp.achteruit)).toBe(true);
    bewaar(o, geladen);
    expect(laad(o)).toEqual(geladen);
  });
});
