import { describe, expect, it } from 'vitest';
import { nieuwSpel } from './nieuwSpel';
import { bord, keuzes, spel } from './testhulp';

describe('nieuw spel', () => {
  it('zet iedereen met 10 munten en 0 sterren op de start', () => {
    const s = spel();
    expect(s.spelers).toHaveLength(4);
    for (const sp of s.spelers) {
      expect(sp.munten).toBe(10);
      expect(sp.sterren).toBe(0);
      expect(sp.vakje).toBe(bord.start);
      expect(sp.stats.hoogsteMunten).toBe(10);
      expect(sp.stats.sterrenPerRonde).toEqual([]);
    }
    expect(s.ronde).toBe(1);
    expect(s.aanZet).toBe(0);
    expect(s.fase).toEqual({ soort: 'dobbelen' });
    expect(s.eindspelRegel).toBeNull();
    expect(s.eindtelling).toBeNull();
  });

  it('bewaart de instellingen in de spelstand', () => {
    const s = spel({ aantalRondes: 15, bonussterren: false, seizoen: 'winter' });
    expect(s.instellingen).toEqual({ aantalRondes: 15, bonussterren: false, seizoen: 'winter' });
  });

  it('neemt namen, figuren en mens/bot over', () => {
    const s = spel();
    expect(s.spelers.map((sp) => [sp.naam, sp.figuur, sp.isBot])).toEqual([
      ['Anna', 'a', false],
      ['Bram', 'b', false],
      ['Bot 1', 'c', true],
      ['Bot 2', 'd', true],
    ]);
  });

  it('startworp: iedereen gooit een ander getal en de hoogste begint', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = spel({}, seed);
      expect(new Set(s.startworpen).size).toBe(4);
      for (const w of s.startworpen) expect(w).toBeGreaterThanOrEqual(1);
      for (const w of s.startworpen) expect(w).toBeLessThanOrEqual(10);
      const worpenInVolgorde = s.volgorde.map((i) => s.startworpen[i]);
      expect(worpenInVolgorde).toEqual([...worpenInVolgorde].sort((a, b) => b - a));
      expect([...s.volgorde].sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it('zet één ster op een bestaande sterplek', () => {
    const s = spel();
    expect(s.sterren).toHaveLength(1);
    expect(bord.sterplekken.map((p) => p.id)).toContain(s.sterren[0].plek);
  });

  it('dezelfde seed geeft hetzelfde spel, een andere seed meestal niet', () => {
    expect(spel({}, 7)).toEqual(spel({}, 7));
    const verschillend = [1, 2, 3, 4, 5].some((seed) => JSON.stringify(spel({}, seed)) !== JSON.stringify(spel({}, 7)));
    expect(verschillend).toBe(true);
  });

  it('weigert een verkeerd aantal spelers of rondes', () => {
    const vier = keuzes().spelers;
    expect(() => nieuwSpel(bord, keuzes({ spelers: vier.slice(0, 1) }), 1)).toThrow();
    expect(() => nieuwSpel(bord, keuzes({ spelers: [...vier, vier[0]] }), 1)).toThrow();
    expect(() => nieuwSpel(bord, { ...keuzes(), aantalRondes: 12 as 10 }, 1)).toThrow();
  });
});
