import { describe, expect, it } from 'vitest';
import { BORD } from '../data/bord';
import { BOK_RAD, handelVakjeAf, HERTEN_RAD, KANS_ACTIES, PECH_RAD, verschuif, vorigVakje } from './effecten';
import type { GameState, Gebeurtenis } from './gameState';
import { nieuwSpel } from './nieuwSpel';
import { keuzes, met } from './testhulp';

/** Speler 0 staat op `id` van het echte bord; daarna wordt het vakje afgehandeld. */
function land(id: string, seed: number, wijzig: (s: GameState) => void = () => {}): GameState {
  const start = met(nieuwSpel(BORD, keuzes(), seed), (s) => {
    s.volgorde = [0, 1, 2, 3];
    s.spelers[0].vakje = id;
    s.verslag = [];
    wijzig(s);
  });
  return met(start, (s) => handelVakjeAf(s, BORD, 0));
}

const vind = <S extends Gebeurtenis['soort']>(s: GameState, soort: S) =>
  s.verslag.find((g) => g.soort === soort) as Extract<Gebeurtenis, { soort: S }> | undefined;

/** Alle uitkomsten van een rad over veel seeds, met de state erna. */
function uitkomsten(id: string, wijzig: (s: GameState) => void = () => {}): Map<string, GameState> {
  const m = new Map<string, GameState>();
  for (let seed = 0; seed < 200; seed++) {
    const s = land(id, seed, wijzig);
    const rad = vind(s, 'rad');
    if (rad && !m.has(rad.uitkomst)) m.set(rad.uitkomst, s);
  }
  return m;
}

describe('route terug en vooruit', () => {
  it('achteruit over land, niet over de boot, en door het hertenkamp', () => {
    expect(vorigVakje(BORD, 'restaurant1')).toBe('oost3');
    expect(vorigVakje(BORD, 'oost1')).toBe('herten4');
    expect(vorigVakje(BORD, 'strand1')).toBe('west4');
    expect(verschuif(BORD, 'oost2', -3)).toBe('herten3');
    expect(verschuif(BORD, 'west3', 3)).toBe('strand2');
  });
});

describe('hertenkamp overdag (§6.3)', () => {
  const m = uitkomsten('herten3');

  it('het rad kan alle vier de uitkomsten geven', () => {
    expect([...m.keys()].sort()).toEqual([...HERTEN_RAD].sort());
  });

  it('+5, +10, een gratis item of 3 vakjes vooruit', () => {
    expect(m.get('munten5')!.spelers[0].munten).toBe(15);
    expect(m.get('munten10')!.spelers[0].munten).toBe(20);
    expect(m.get('item')!.spelers[0].items).toHaveLength(1);
    expect(m.get('hertje')!.spelers[0].vakje).toBe('oost2');
  });

  it('telt mee voor de Avonturier-ster, niet als bok', () => {
    const s = m.get('munten5')!;
    expect(s.spelers[0].stats.avontuurVakjes).toBe(1);
    expect(s.spelers[0].stats.bokOntmoetingen).toBe(0);
  });
});

describe("de wilde bok 's nachts (§6.3)", () => {
  const m = uitkomsten('herten3', (s) => {
    s.nacht = true;
    s.spelers[0].munten = 30;
    s.spelers[0].items = ['dubbel', 'ratjebel'];
  });

  it('alleen nare uitkomsten', () => {
    expect([...m.keys()].sort()).toEqual([...BOK_RAD].sort());
  });

  it('omver (−10), terug naar het strand, items kwijt, of in de plas (−5 en ergens aanspoelen)', () => {
    expect(m.get('omver')!.spelers[0].munten).toBe(20);
    expect(m.get('naarStart')!.spelers[0].vakje).toBe(BORD.start);
    expect(m.get('itemsKwijt')!.spelers[0].items).toEqual([]);
    expect(vind(m.get('itemsKwijt')!, 'itemsKwijt')!.items).toEqual(['dubbel', 'ratjebel']);
    const plas = m.get('plas')!;
    expect(plas.spelers[0].munten).toBe(25);
    expect(plas.spelers[0].vakje).not.toBe('herten3');
    expect(['boot', 'ijspad']).not.toContain(BORD.vakjes.find((v) => v.id === plas.spelers[0].vakje)!.zone);
  });

  it('telt als bokontmoeting', () => {
    for (const s of m.values()) expect(s.spelers[0].stats.bokOntmoetingen).toBe(1);
  });
});

describe('kans-vakje (§7.3)', () => {
  it('kiest twee verschillende spelers en een van de vijf acties', () => {
    const acties = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const k = vind(land('plaszoom3', seed), 'kans')!;
      expect(k.a).not.toBe(k.b);
      acties.add(k.actie);
    }
    expect([...acties].sort()).toEqual([...KANS_ACTIES].sort());
  });

  it('de acties doen wat ze zeggen', () => {
    for (let seed = 0; seed < 200; seed++) {
      const voor = (s: GameState) => {
        s.spelers.forEach((sp, i) => ((sp.munten = 15 + i), (sp.sterren = i)));
      };
      const s = land('plaszoom3', seed, voor);
      const { a, b, actie } = vind(s, 'kans')!;
      const [ma, mb, sa, sb] = [15 + a, 15 + b, a, b];
      const A = s.spelers[a];
      const B = s.spelers[b];
      switch (actie) {
        case 'geef10':
          expect([A.munten, B.munten]).toEqual([ma - 10, mb + 10]);
          break;
        case 'geef20':
          expect([A.munten, B.munten]).toEqual([0, mb + ma]); // A had minder dan 20
          break;
        case 'ruilMunten':
          expect([A.munten, B.munten]).toEqual([mb, ma]);
          break;
        case 'geefSter':
          expect([A.sterren, B.sterren]).toEqual(sa > 0 ? [sa - 1, sb + 1] : [0, sb]);
          break;
        case 'ruilSterren':
          expect([A.sterren, B.sterren]).toEqual([sb, sa]);
          break;
      }
    }
  });
});

describe('pech-vakje (§7.4)', () => {
  const m = uitkomsten('zuid5', (s) => {
    s.spelers[0].munten = 50;
    s.spelers[1].munten = 0; // speler 1 staat laatste
  });

  it('alle vier de uitkomsten komen voor', () => {
    expect([...m.keys()].sort()).toEqual([...PECH_RAD].sort());
  });

  it('−10, de helft (max 20), iedereen 3 geven, of munten ruilen met de laatste', () => {
    expect(m.get('min10')!.spelers[0].munten).toBe(40);
    expect(m.get('helft')!.spelers[0].munten).toBe(30); // de helft van 50 is 25, maar max 20
    const ieder = m.get('iedereen3')!;
    expect(ieder.spelers[0].munten).toBe(41);
    expect(ieder.spelers[1].munten).toBe(3);
    const ruil = m.get('ruilLaatste')!;
    expect(ruil.spelers[0].munten).toBe(0);
    expect(ruil.spelers[1].munten).toBe(50);
  });

  it('de helft van weinig munten', () => {
    for (let seed = 0; seed < 200; seed++) {
      const s = land('zuid5', seed, (x) => (x.spelers[0].munten = 7));
      if (vind(s, 'rad')!.uitkomst === 'helft') return expect(s.spelers[0].munten).toBe(4);
    }
    throw new Error('helft kwam niet voor');
  });
});

describe('eventvakjes (§7.5)', () => {
  it('Strandtent overdag: +5 munten', () => {
    const s = land('strand4', 1);
    expect(s.spelers[0].munten).toBe(15);
    expect(vind(s, 'strandtent')).toEqual({ soort: 'strandtent', speler: 0, kampvuur: false });
  });

  it("Strandtent 's nachts: kampvuur, iedereen geeft je 2 munten", () => {
    const s = land('strand4', 1, (x) => ((x.nacht = true), (x.spelers[3].munten = 1)));
    expect(s.spelers[0].munten).toBe(10 + 2 + 2 + 1);
    expect(s.spelers.slice(1).map((sp) => sp.munten)).toEqual([8, 8, 0]);
  });

  it('Windvlaag: 3 vooruit of 3 achteruit', () => {
    const plekken = new Set<string>();
    for (let seed = 0; seed < 50; seed++) plekken.add(land('oost2', seed).spelers[0].vakje);
    expect([...plekken].sort()).toEqual(['herten3', 'plaszoom1']);
  });

  it('Zeilwedstrijd: de hoogste worp wint 10, de organisator krijgt +2', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = land('west2', seed);
      const z = vind(s, 'zeilwedstrijd')!;
      expect(z.worpen).toHaveLength(4);
      expect(z.prijs).toBe(10);
      const hoogste = Math.max(...z.worpen);
      expect(z.winnaars).toEqual(z.worpen.map((w, i) => (w === hoogste ? i : -1)).filter((i) => i >= 0));
      s.spelers.forEach((sp, i) => {
        const verwacht = 10 + (z.winnaars.includes(i) ? 10 : 0) + (i === 0 ? 2 : 0);
        expect(sp.munten).toBe(verwacht);
      });
    }
  });

  it("'s Nachts een lampionnenrace: de prijs is 15", () => {
    const z = vind(land('west2', 3, (x) => (x.nacht = true)), 'zeilwedstrijd')!;
    expect(z).toMatchObject({ prijs: 15, lampionnen: true });
  });

  it('elk eventvakje telt voor de Avonturier-ster', () => {
    for (const id of ['strand4', 'noord4', 'oost2', 'plaszoom2', 'west2']) {
      expect(land(id, 1).spelers[0].stats.avontuurVakjes).toBe(1);
    }
  });
});

describe('itemvakje', () => {
  it('geeft een gratis item, of 5 munten als je er al 3 hebt', () => {
    const s = land('strand5', 1);
    expect(s.spelers[0].items).toHaveLength(1);
    const vol = land('strand5', 1, (x) => (x.spelers[0].items = ['dubbel', 'dubbel', 'dubbel']));
    expect(vol.spelers[0].items).toHaveLength(3);
    expect(vol.spelers[0].munten).toBe(15);
  });
});
