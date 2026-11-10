import { describe, expect, it } from 'vitest';
import { bewaar, heeftOpgeslagenSpel, laad, OPSLAG_SLEUTEL, OPSLAG_VERSIE, wis, type Opslag } from './opslag';
import { spel, speelUit } from './testhulp';

function nepOpslag(): Opslag {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

const voorbeeld = spel({}, 12345);

describe('opslag', () => {
  it('bewaart en laadt hetzelfde spel', () => {
    const o = nepOpslag();
    expect(heeftOpgeslagenSpel(o)).toBe(false);
    bewaar(o, voorbeeld);
    expect(heeftOpgeslagenSpel(o)).toBe(true);
    expect(laad(o)).toEqual(voorbeeld);
  });

  it('negeert een spel met een oud versienummer', () => {
    const o = nepOpslag();
    o.setItem(OPSLAG_SLEUTEL, JSON.stringify({ versie: 0, state: voorbeeld }));
    expect(laad(o)).toBeNull();
  });

  it('een spel uit de vorige versie (2) speelt gewoon verder, overdag en zonder items', () => {
    const o = nepOpslag();
    const oud = structuredClone(voorbeeld) as Partial<typeof voorbeeld>;
    delete oud.nacht;
    o.setItem(OPSLAG_SLEUTEL, JSON.stringify({ versie: 2, state: oud }));
    const geladen = laad(o)!;
    expect(geladen.nacht).toBe(false);
    expect(geladen).toEqual(voorbeeld);
    expect(speelUit(geladen).eind.fase).toEqual({ soort: 'einde' });
  });

  it('crasht niet op kapotte data', () => {
    const o = nepOpslag();
    o.setItem(OPSLAG_SLEUTEL, '{kapot');
    expect(laad(o)).toBeNull();
  });

  it('wist het spel', () => {
    const o = nepOpslag();
    bewaar(o, voorbeeld);
    wis(o);
    expect(laad(o)).toBeNull();
  });

  it('negeert een spel in het oude formaat zonder spelers', () => {
    const o = nepOpslag();
    o.setItem(OPSLAG_SLEUTEL, JSON.stringify({ versie: OPSLAG_VERSIE, state: { rng: 1, ronde: 3 } }));
    expect(laad(o)).toBeNull();
  });

  it('opslaan en laden na elke actie: het spel gaat precies hetzelfde verder', () => {
    for (let seed = 0; seed < 5; seed++) {
      const zonder = speelUit(spel({}, seed));
      const o = nepOpslag();
      const met = speelUit(spel({}, seed), (s) => {
        bewaar(o, s);
        return laad(o)!;
      });
      expect(met.staten).toEqual(zonder.staten);
      expect(met.eind.eindtelling).toEqual(zonder.eind.eindtelling);
    }
  });

  it('een spel halverwege laden en uitspelen geeft dezelfde winnaar', () => {
    const { staten, eind } = speelUit(spel({}, 99));
    const o = nepOpslag();
    bewaar(o, staten[Math.floor(staten.length / 2)]);
    expect(speelUit(laad(o)!).eind).toEqual(eind);
  });
});

describe('opslaan versie 6: het onderste pad bij het hertenkamp is weg', () => {
  it('een speler (en een valstrik) op een verdwenen vakje staat daarna op het dichtstbijzijnde vakje van het nieuwe pad', () => {
    const o = nepOpslag();
    const oud = structuredClone(spel());
    oud.spelers[0].vakje = 'hoofdpad1';
    oud.spelers[1].vakje = 'hoofdpad2';
    oud.spelers[2].vakje = 'hoofdpad3';
    oud.spelers[3].vakje = 'oost2';
    oud.valstrikken = [{ speler: 3, vakje: 'hoofdpad2' }];
    o.setItem(OPSLAG_SLEUTEL, JSON.stringify({ versie: 5, state: oud }));
    const s = laad(o)!;
    expect(s.spelers.map((sp) => sp.vakje)).toEqual(['herten1', 'herten2', 'herten3', 'oost2']);
    expect(s.valstrikken).toEqual([{ speler: 3, vakje: 'herten2' }]);
  });

  it('stond iemand bij de oude splitsing te kiezen, dan loopt hij gewoon verder', () => {
    const o = nepOpslag();
    const oud = { ...structuredClone(spel()), fase: { soort: 'splitsing', worp: 5, resterend: 3, vakje: 'noord7' } };
    o.setItem(OPSLAG_SLEUTEL, JSON.stringify({ versie: 5, state: oud }));
    expect(laad(o)!.fase).toEqual({ soort: 'lopen', worp: 5, resterend: 3 });
  });

  it('een gewoon spel van versie 5 verandert verder niet', () => {
    const o = nepOpslag();
    const oud = structuredClone(spel());
    o.setItem(OPSLAG_SLEUTEL, JSON.stringify({ versie: 5, state: oud }));
    expect(laad(o)).toEqual(oud);
  });
});
