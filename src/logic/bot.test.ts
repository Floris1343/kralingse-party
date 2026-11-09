import { describe, expect, it } from 'vitest';
import { botActie, speelBotsAf, wachtOpBot } from './bot';
import { spelerAanZet } from './regels';
import { alleBots, bord, met, RONDES, spel, speelUit } from './testhulp';

describe('bots', () => {
  it('weten wanneer ze aan de beurt zijn', () => {
    const s = met(spel(), (x) => (x.volgorde = [2, 0, 1, 3]));
    expect(wachtOpBot(s)).toBe(true);
    expect(wachtOpBot(met(s, (x) => (x.aanZet = 1)))).toBe(false);
    expect(wachtOpBot(met(s, (x) => (x.fase = { soort: 'minigame' })))).toBe(false);
    expect(wachtOpBot(met(s, (x) => (x.fase = { soort: 'eindspelRad', speler: 3 })))).toBe(true);
    expect(wachtOpBot(met(s, (x) => (x.fase = { soort: 'eindspelRad', speler: 0 })))).toBe(false);
  });

  it('botActie doet één stap, en niets als een mens aan zet is', () => {
    const s = met(spel(), (x) => (x.volgorde = [2, 0, 1, 3]));
    const na = botActie(s, bord)!;
    expect(na.fase.soort).toBe('lopen');
    expect(botActie(met(s, (x) => (x.aanZet = 1)), bord)).toBeNull();
  });

  it('speelBotsAf stopt bij de eerste mens', () => {
    const s = speelBotsAf(met(spel(), (x) => (x.volgorde = [2, 3, 0, 1])), bord);
    expect(s.fase).toEqual({ soort: 'dobbelen' });
    expect(spelerAanZet(s)).toBe(0);
  });

  it('speelBotsAf stopt bij de minigame', () => {
    const s = speelBotsAf(met(spel(), (x) => (x.volgorde = [0, 1, 2, 3], x.aanZet = 2)), bord);
    expect(s.fase).toEqual({ soort: 'minigame' });
  });
});

describe('een heel spel', () => {
  for (const aantalRondes of RONDES) {
    it(`${aantalRondes} rondes met 4 bots loopt netjes tot het einde`, () => {
      for (let seed = 0; seed < 5; seed++) {
        const { eind, staten } = speelUit(spel({ aantalRondes, spelers: alleBots() }, seed));
        expect(eind.fase).toEqual({ soort: 'einde' });
        expect(eind.ronde).toBe(aantalRondes);

        for (const s of staten) for (const sp of s.spelers) expect(sp.munten).toBeGreaterThanOrEqual(0);

        const t = eind.eindtelling!;
        expect([...t.ranglijst].sort()).toEqual([0, 1, 2, 3]);
        expect(t.winnaar).toBe(t.ranglijst[0]);

        // Elke ster is gekocht of een bonusster.
        const bonus = t.bonussterren.reduce((n, b) => n + b.spelers.length, 0);
        const gekocht = eind.spelers.reduce((n, sp) => n + sp.stats.sterrenGekocht, 0);
        expect(eind.spelers.reduce((n, sp) => n + sp.sterren, 0)).toBe(gekocht + bonus);

        for (const sp of eind.spelers) {
          expect(sp.stats.sterrenPerRonde).toHaveLength(aantalRondes);
          expect(sp.stats.hoogsteMunten).toBeGreaterThanOrEqual(sp.munten);
        }
        expect(eind.eindspelRegel).not.toBeNull();
      }
    });
  }

  it('2 mensen + 2 bots loopt ook tot het einde', () => {
    const { eind } = speelUit(spel({}, 3));
    expect(eind.fase).toEqual({ soort: 'einde' });
    expect(eind.spelers.some((sp) => sp.stats.sterrenGekocht > 0)).toBe(true);
  });
});
