import { describe, expect, it } from 'vitest';
import { botActie, speelBotsAf } from './bot';
import type { GameState } from './gameState';
import { nieuwSpel } from './nieuwSpel';
import { bewaar, laad, OPSLAG_SLEUTEL } from './opslag';
import { gooiStartworp, startSpel, startwerper } from './startworp';
import { alleBots, bord, keuzes, met, naStartworp } from './testhulp';

const nieuw = (seed = 1) => nieuwSpel(bord, keuzes(), seed);

/** Gooit voor de spelers in `worpen` elk precies één keer een vaste worp (in plaats van de dobbelsteen). */
function gooiVast(s: GameState, worpen: Record<number, number>): GameState {
  let t = s;
  for (let n = Object.keys(worpen).length; n > 0 && t.fase.soort === 'startworp'; n--) {
    const speler = startwerper(t);
    if (!(speler in worpen)) throw new Error(`Speler ${speler} gooit nu, maar die staat niet in de test`);
    t = zoekWorp(t, worpen[speler]);
  }
  return t;
}

/** Zoekt een rng-stand waarbij de volgende startworp precies `doel` is. */
function zoekWorp(s: GameState, doel: number): GameState {
  for (let seed = 1; seed < 5000; seed++) {
    const na = gooiStartworp(met(s, (x) => (x.rng = seed)));
    const laatste = [...na.verslag].reverse().find((x) => x.soort === 'startworp')!;
    if (laatste.soort === 'startworp' && laatste.waarde === doel) return na;
  }
  throw new Error('geen seed');
}

describe('de startworp (§2)', () => {
  it('iedereen gooit één voor één, en de hoogste begint', () => {
    const s = gooiVast(nieuw(), { 0: 4, 1: 9, 2: 2, 3: 6 });
    expect(s.fase).toEqual({ soort: 'startVolgorde' });
    expect(s.volgorde).toEqual([1, 3, 0, 2]);
    expect(s.startworpen).toEqual([[4], [9], [2], [6]]);
    const begin = startSpel(s);
    expect(begin.fase).toEqual({ soort: 'dobbelen' });
    expect(begin.aanZet).toBe(0);
    expect(begin.verslag).toEqual([]);
  });

  it('gooien twee spelers hetzelfde, dan gooien alleen die opnieuw', () => {
    let s = gooiVast(nieuw(), { 0: 7, 1: 3, 2: 7, 3: 5 });
    expect(s.fase).toEqual({ soort: 'startworp', teGooien: [0, 2] });
    expect(s.verslag).toContainEqual({ soort: 'startworpGelijk', spelers: [0, 2] });
    s = gooiVast(s, { 0: 2, 2: 8 });
    expect(s.fase).toEqual({ soort: 'startVolgorde' });
    // 2 wint het gelijkspel om de eerste plek; 3 (5) en 1 (3) blijven waar ze waren.
    expect(s.volgorde).toEqual([2, 0, 3, 1]);
    expect(s.startworpen[1]).toEqual([3]);
  });

  it('twee keer achter elkaar gelijk: ze gooien gewoon nog eens', () => {
    let s = gooiVast(nieuw(), { 0: 5, 1: 5, 2: 1, 3: 9 });
    s = gooiVast(s, { 0: 6, 1: 6 });
    expect(s.fase).toEqual({ soort: 'startworp', teGooien: [0, 1] });
    s = gooiVast(s, { 0: 3, 1: 10 });
    expect(s.volgorde).toEqual([3, 1, 0, 2]);
  });

  it('twee gelijke paren: alleen die vier gooien opnieuw, en elk paar wordt apart beslist', () => {
    let s = gooiVast(nieuw(), { 0: 4, 1: 8, 2: 4, 3: 8 });
    expect(s.fase).toEqual({ soort: 'startworp', teGooien: [0, 1, 2, 3] });
    // Ook al gooit 0 nu hoger dan 1: 1 had eerst 8, dus 1 en 3 blijven boven 0 en 2.
    s = gooiVast(s, { 0: 10, 1: 2, 2: 1, 3: 3 });
    expect(s.volgorde).toEqual([3, 1, 0, 2]);
  });

  it('drie of vier spelers gelijk', () => {
    let s = gooiVast(nieuw(), { 0: 6, 1: 6, 2: 6, 3: 2 });
    expect(s.fase).toEqual({ soort: 'startworp', teGooien: [0, 1, 2] });
    s = gooiVast(s, { 0: 1, 1: 9, 2: 5 });
    expect(s.volgorde).toEqual([1, 2, 0, 3]);
    const vier = gooiVast(nieuw(), { 0: 3, 1: 3, 2: 3, 3: 3 });
    expect(vier.fase).toEqual({ soort: 'startworp', teGooien: [0, 1, 2, 3] });
  });

  it('na de startworp is de volgorde altijd volledig, voor veel seeds', () => {
    for (let seed = 0; seed < 100; seed++) {
      const s = naStartworp(nieuw(seed));
      expect([...s.volgorde].sort()).toEqual([0, 1, 2, 3]);
      expect(s.fase).toEqual({ soort: 'dobbelen' });
    }
  });

  it('bots gooien zelf; bij een mens wacht het spel', () => {
    const s = nieuwSpel(bord, keuzes({ spelers: keuzes().spelers.map((sp, i) => ({ ...sp, isBot: i !== 1 })) }), 3);
    const na = speelBotsAf(s, bord);
    // Speler 0 is een bot en heeft gegooid; speler 1 is een mens: daar wacht het.
    expect(na.fase).toMatchObject({ soort: 'startworp' });
    expect(startwerper(na)).toBe(1);
    expect(botActie(na, bord)).toBe(null);
  });

  it('met alleen bots gaat de hele startworp vanzelf', () => {
    const s = speelBotsAf(nieuwSpel(bord, keuzes({ spelers: alleBots() }), 4), bord);
    expect(s.fase).toEqual({ soort: 'startVolgorde' });
  });

  it('opslaan midden in de startworp: precies daar verder', () => {
    const opslag = new Map<string, string>();
    const o = { getItem: (k: string) => opslag.get(k) ?? null, setItem: (k: string, v: string) => void opslag.set(k, v), removeItem: (k: string) => void opslag.delete(k) };
    const half = gooiStartworp(gooiStartworp(nieuw(9)));
    bewaar(o, half);
    const geladen = laad(o)!;
    expect(geladen).toEqual(half);
    expect(naStartworp(geladen)).toEqual(naStartworp(half));
  });

  it('gooien kan alleen in de startworp, en Start! alleen als de volgorde vaststaat', () => {
    expect(() => startSpel(nieuw())).toThrow();
    expect(() => gooiStartworp(naStartworp(nieuw()))).toThrow();
  });

  it('een bewaard spel van vóór de nieuwe startworp (versie 4) speelt gewoon verder', () => {
    const opslag = new Map<string, string>();
    const o = { getItem: (k: string) => opslag.get(k) ?? null, setItem: (k: string, v: string) => void opslag.set(k, v), removeItem: (k: string) => void opslag.delete(k) };
    const nu = naStartworp(nieuw(5));
    const oud = { ...structuredClone(nu), startworpen: [7, 2, 9, 4] };
    o.setItem(OPSLAG_SLEUTEL, JSON.stringify({ versie: 4, state: oud }));
    const geladen = laad(o)!;
    expect(geladen.startworpen).toEqual([[7], [2], [9], [4]]);
    expect(geladen.fase).toEqual(nu.fase);
    expect(geladen.volgorde).toEqual(nu.volgorde);
  });
});
