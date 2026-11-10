import { describe, expect, it } from 'vitest';
import { FIGUREN } from '../data/figuren';
import { GRAFIEK_HOOGTE, grafiekPunten, grafiekSchaal, sterrenGrafiek } from './grafiek';

describe('de grafiek "Sterren per ronde" (§10)', () => {
  it('de y-as gaat minstens tot 5, en in stappen van 2 als er veel sterren zijn', () => {
    expect(grafiekSchaal([{ figuur: FIGUREN[0], waarden: [0, 1, 2] }]).stappen).toEqual([5, 4, 3, 2, 1, 0]);
    expect(grafiekSchaal([{ figuur: FIGUREN[0], waarden: [0, 4, 9] }]).stappen).toEqual([10, 8, 6, 4, 2, 0]);
  });

  it('meer sterren = hoger in beeld, en de rondes lopen van links naar rechts', () => {
    const p = grafiekPunten([0, 2, 5], 5, 3);
    expect(p[0][0]).toBeLessThan(p[1][0]);
    expect(p[1][0]).toBeLessThan(p[2][0]);
    expect(p[0][1]).toBeGreaterThan(p[1][1]);
    expect(p[2][1]).toBeGreaterThanOrEqual(0);
    expect(p[0][1]).toBeLessThanOrEqual(GRAFIEK_HOOGTE);
  });

  it('elke speler een lijn in zijn eigen kleur', () => {
    const svg = sterrenGrafiek(FIGUREN.slice(0, 4).map((figuur, i) => ({ figuur, waarden: [0, i, i + 1] })), 3);
    expect(svg.match(/<polyline/g)).toHaveLength(4);
    for (const f of FIGUREN.slice(0, 4)) expect(svg).toContain(f.kleur);
  });
});
