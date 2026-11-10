import { describe, expect, it } from 'vitest';
import { brabbelPlan, lettergrepen, MAX_BLIPS } from './gebrabbel';

describe('het gebrabbel van Pommie (§12)', () => {
  it('telt de lettergrepen als groepjes klinkers', () => {
    expect(lettergrepen('Hoi hoi')).toHaveLength(2);
    expect(lettergrepen('Welkom bij de plas')).toHaveLength(5);
    expect(lettergrepen('...')).toHaveLength(0);
  });

  it('één lage blip per lettergreep, met een wisselende toonhoogte', () => {
    const plan = brabbelPlan('Welkom bij de plas!', () => 0.5);
    expect(plan).toHaveLength(5);
    for (const b of plan) {
      expect(b.toon).toBeGreaterThan(100);
      expect(b.toon).toBeLessThan(250);
    }
    expect(plan.at(-1)!.tekstTot).toBe('Welkom bij de plas!'.length);
    const wisselend = brabbelPlan('Welkom bij de plas!', (() => { let i = 0; return () => (i++ % 2 ? 0.1 : 0.9); })());
    expect(new Set(wisselend.map((b) => Math.round(b.toon))).size).toBeGreaterThan(1);
  });

  it('een lange zin brabbelt niet eindeloos door', () => {
    const lang = 'Dit is een hele lange zin van Pommie die maar doorgaat en doorgaat over de Kralingse Plas en de sterren.';
    const plan = brabbelPlan(lang, () => 0.5);
    expect(plan.length).toBeLessThanOrEqual(MAX_BLIPS);
    expect(plan.at(-1)!.tekstTot).toBe(lang.length);
    // Ongeveer 1 tot 3 seconden: kort, zodat het tempo erin blijft (§11).
    const duur = plan.at(-1)!.start + plan.at(-1)!.duur;
    expect(duur).toBeLessThan(3.5);
  });

  it('de tijden lopen op en de tekst loopt mee', () => {
    const plan = brabbelPlan('Een vallende ster! Koop hem snel.', () => 0.3);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].start).toBeGreaterThan(plan[i - 1].start);
      expect(plan[i].tekstTot).toBeGreaterThanOrEqual(plan[i - 1].tekstTot);
    }
  });
});
