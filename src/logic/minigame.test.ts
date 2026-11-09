import { describe, expect, it } from 'vitest';
import type { GameState } from './gameState';
import { minigameBeloning, verwerkMinigame } from './minigame';
import { met, spel } from './testhulp';

function inMinigame(wijzig: (s: GameState) => void = () => {}): GameState {
  return met(spel(), (s) => {
    s.fase = { soort: 'minigame' };
    s.aanZet = 4;
    wijzig(s);
  });
}

describe('minigame-beloning', () => {
  it('1e 10, 2e 5, 3e 2, 4e 0', () => {
    expect(minigameBeloning([[2], [0], [3], [1]], 4)).toEqual([5, 0, 10, 2]);
  });

  it('gelijke plekken krijgen de beloning van de hoogste plek', () => {
    expect(minigameBeloning([[0, 1], [2], [3]], 4)).toEqual([10, 10, 2, 0]);
    expect(minigameBeloning([[0], [1, 2], [3]], 4)).toEqual([10, 5, 5, 0]);
    expect(minigameBeloning([[0], [1], [2, 3]], 4)).toEqual([10, 5, 2, 2]);
    expect(minigameBeloning([[0], [1, 2, 3]], 4)).toEqual([10, 5, 5, 5]);
    expect(minigameBeloning([[0, 1, 2, 3]], 4)).toEqual([10, 10, 10, 10]);
  });

  it('werkt ook met minder spelers', () => {
    expect(minigameBeloning([[1], [0]], 2)).toEqual([5, 10]);
  });

  it('weigert een onvolledige of foute uitslag', () => {
    expect(() => minigameBeloning([[0], [1], [2]], 4)).toThrow();
    expect(() => minigameBeloning([[0], [1], [2], [2]], 4)).toThrow();
    expect(() => minigameBeloning([[0], [1], [2], [4]], 4)).toThrow();
    expect(() => minigameBeloning([[0], [], [1, 2, 3]], 4)).toThrow();
  });
});

describe('minigame-uitslag verwerken', () => {
  it('deelt munten uit en houdt de minigame-munten bij', () => {
    const s = verwerkMinigame(inMinigame(), [[3], [1, 2], [0]]);
    expect(s.spelers.map((sp) => sp.munten)).toEqual([10, 15, 15, 20]);
    expect(s.spelers.map((sp) => sp.stats.minigameMunten)).toEqual([0, 5, 5, 10]);
    expect(s.spelers[3].stats.hoogsteMunten).toBe(20);
    expect(s.verslag).toContainEqual({ soort: 'munten', speler: 3, verschil: 10, reden: 'minigame' });
  });

  it('start de volgende ronde', () => {
    const s = verwerkMinigame(inMinigame(), [[0], [1], [2], [3]]);
    expect(s.ronde).toBe(2);
    expect(s.aanZet).toBe(0);
    expect(s.fase).toEqual({ soort: 'dobbelen' });
  });

  it('onthoudt per ronde hoeveel sterren iedereen heeft', () => {
    let s = inMinigame((x) => (x.spelers[1].sterren = 2));
    s = verwerkMinigame(s, [[0], [1], [2], [3]]);
    expect(s.spelers.map((sp) => sp.stats.sterrenPerRonde)).toEqual([[0], [2], [0], [0]]);
    s = met(s, (x) => {
      x.fase = { soort: 'minigame' };
      x.spelers[0].sterren = 1;
    });
    s = verwerkMinigame(s, [[0], [1], [2], [3]]);
    expect(s.spelers.map((sp) => sp.stats.sterrenPerRonde)).toEqual([[0, 1], [2, 2], [0, 0], [0, 0]]);
  });

  it('kan alleen als het spel op de minigame wacht', () => {
    expect(() => verwerkMinigame(spel(), [[0], [1], [2], [3]])).toThrow();
  });

  it('na de laatste ronde volgt de eindtelling', () => {
    const s = verwerkMinigame(inMinigame((x) => (x.ronde = 10)), [[0], [1], [2], [3]]);
    expect(s.ronde).toBe(10);
    expect(s.fase).toEqual({ soort: 'einde' });
    expect(s.eindtelling).not.toBeNull();
  });

  it('bij het begin van de 5e ronde voor het einde draait de laatste het rad', () => {
    const s = verwerkMinigame(
      inMinigame((x) => {
        x.ronde = 5;
        x.spelers[0].sterren = 1;
        x.spelers[1].sterren = 1;
        x.spelers[2].sterren = 1;
      }),
      [[0], [1], [2], [3]],
    );
    expect(s.ronde).toBe(6);
    expect(s.fase).toEqual({ soort: 'eindspelRad', speler: 3 });
  });
});
