import { describe, expect, it } from 'vitest';
import { RUST_X, RUST_Y, WORP_BOT, WORP_MENS, hoekOp, naarJeToe, planAs, snelheidOp, worpDuur } from './dobbelBeweging';

const mod = (h: number) => ((h % 360) + 360) % 360;

describe('dobbelblok-beweging', () => {
  it('een worp van een mens duurt hoogstens ±1,2 s, van een bot ±0,5 s', () => {
    expect(worpDuur(WORP_MENS)).toBeLessThanOrEqual(1.2);
    expect(worpDuur(WORP_BOT)).toBeLessThanOrEqual(0.6);
  });

  it('eindigt precies op de rusthoek, wat de starthoek ook is', () => {
    for (const w of [WORP_MENS, WORP_BOT]) {
      for (let start = -500; start < 900; start += 37) {
        const y = planAs(start, 120, 1300, RUST_Y, 10, w);
        const x = planAs(start * 0.7, 66, 700, RUST_X, 6, w);
        expect(mod(hoekOp(y, worpDuur(w), w))).toBeCloseTo(mod(RUST_Y), 6);
        expect(mod(hoekOp(x, worpDuur(w), w))).toBeCloseTo(mod(RUST_X), 6);
      }
    }
  });

  it('draait soepel: geen sprongen, eerst sneller en dan langzamer, en schiet net door', () => {
    const w = WORP_MENS;
    const p = planAs(42, 120, 1300, RUST_Y, 10, w);
    // De snelheid begint bij de rustsnelheid.
    expect(snelheidOp(p, 0.001, w)).toBeCloseTo(120, -1);
    let vorige = hoekOp(p, 0, w);
    let max = 0;
    for (let t = 0.005; t <= worpDuur(w); t += 0.005) {
      const h = hoekOp(p, t, w);
      expect(Math.abs(h - vorige)).toBeLessThan(15); // geen sprong per beeldje
      max = Math.max(max, snelheidOp(p, t, w));
      vorige = h;
    }
    expect(max).toBeGreaterThan(800); // echt snel
    // Op het eind van het afremmen staat hij net voorbij de uitkomst en veert terug.
    const voorVeer = worpDuur(w) - w.veer;
    expect(hoekOp(p, voorVeer, w)).toBeCloseTo(p.doel + 10, 3);
  });

  it('bij de rusthoek wijst het voorvlak naar je toe', () => {
    const z = naarJeToe(RUST_X, RUST_Y);
    expect(z.indexOf(Math.max(...z))).toBe(0);
    // Recht vooraan: voor = 1, achter = −1, de rest opzij.
    expect(naarJeToe(0, 0).map((v) => Math.round(v) + 0)).toEqual([1, 0, -1, 0, 0, 0]);
    // Een kwartslag om de Y-as: het linkervlak komt naar voren.
    expect(Math.round(naarJeToe(0, 90)[3])).toBe(1);
  });
});
