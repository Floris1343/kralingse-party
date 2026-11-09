import { describe, expect, it } from 'vitest';
import { dobbel, geheelGetal, volgende } from './rng';

describe('rng', () => {
  it('is deterministisch: dezelfde seed geeft dezelfde reeks', () => {
    const reeks = (seed: number) => {
      const uit: number[] = [];
      let s = seed;
      for (let i = 0; i < 20; i++) {
        const [w, n] = dobbel(s);
        uit.push(w);
        s = n;
      }
      return uit;
    };
    expect(reeks(42)).toEqual(reeks(42));
    expect(reeks(42)).not.toEqual(reeks(43));
  });

  it('geeft waarden tussen 0 en 1', () => {
    let s = 1;
    for (let i = 0; i < 1000; i++) {
      const [w, n] = volgende(s);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(1);
      s = n;
    }
  });

  it('dobbelt alleen 1 t/m 10 en elk getal komt voor', () => {
    const gezien = new Set<number>();
    let s = 7;
    for (let i = 0; i < 2000; i++) {
      const [w, n] = dobbel(s);
      expect(w).toBeGreaterThanOrEqual(1);
      expect(w).toBeLessThanOrEqual(10);
      gezien.add(w);
      s = n;
    }
    expect(gezien.size).toBe(10);
  });

  it('geheelGetal respecteert de grenzen', () => {
    let s = 99;
    for (let i = 0; i < 500; i++) {
      const [w, n] = geheelGetal(s, 5, 15);
      expect(w).toBeGreaterThanOrEqual(5);
      expect(w).toBeLessThanOrEqual(15);
      s = n;
    }
  });
});
