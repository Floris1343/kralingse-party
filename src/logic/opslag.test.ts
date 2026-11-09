import { describe, expect, it } from 'vitest';
import type { GameState } from './gameState';
import { bewaar, heeftOpgeslagenSpel, laad, OPSLAG_SLEUTEL, wis, type Opslag } from './opslag';

function nepOpslag(): Opslag {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

const voorbeeld: GameState = { rng: 12345, ronde: 3, aantalRondes: 10 };

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
});
