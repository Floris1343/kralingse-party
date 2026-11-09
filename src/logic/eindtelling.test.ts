import { describe, expect, it } from 'vitest';
import { bonusWinnaars, doeEindtelling } from './eindtelling';
import type { GameState } from './gameState';
import { metKopie } from './regels';
import { met, spel } from './testhulp';

function tel(s: GameState): GameState {
  return metKopie(s, doeEindtelling);
}

/** Een spel waarin elke speler één bonusster duidelijk wint, behalve speler 3. */
const metStats = (bonussterren = true) =>
  met(spel({ bonussterren }), (s) => {
    s.spelers[0].stats.minigameMunten = 40;
    s.spelers[1].stats.hoogsteMunten = 80;
    s.spelers[2].stats.avontuurVakjes = 5;
    s.spelers[3].sterren = 2;
  });

describe('bonussterren', () => {
  it('Minigame-, Rijkaard- en Avonturier-ster gaan naar de beste', () => {
    const s = tel(metStats());
    expect(s.eindtelling!.bonussterren).toEqual([
      { soort: 'minigame', spelers: [0] },
      { soort: 'rijkaard', spelers: [1] },
      { soort: 'avonturier', spelers: [2] },
    ]);
    expect(s.spelers.map((sp) => sp.sterren)).toEqual([1, 1, 1, 2]);
  });

  it('bij gelijkspel krijgt iedereen die gelijk staat hem', () => {
    const s = met(spel(), (x) => {
      x.spelers[1].stats.minigameMunten = 30;
      x.spelers[3].stats.minigameMunten = 30;
    });
    expect(bonusWinnaars(s, 'minigame')).toEqual([1, 3]);
    // Minigame-ster voor 1 en 3; de Rijkaard-ster voor iedereen (allemaal max. 10 munten gehad).
    expect(tel(s).spelers.map((sp) => sp.sterren)).toEqual([1, 2, 1, 2]);
  });

  it('niemand krijgt hem als iedereen op 0 staat', () => {
    expect(bonusWinnaars(spel(), 'avonturier')).toEqual([]);
    expect(bonusWinnaars(spel(), 'minigame')).toEqual([]);
  });

  it('staan ze uit, dan worden ze niet uitgedeeld', () => {
    const s = tel(metStats(false));
    expect(s.eindtelling!.bonussterren).toEqual([]);
    expect(s.spelers.map((sp) => sp.sterren)).toEqual([0, 0, 0, 2]);
    expect(s.eindtelling!.winnaar).toBe(3);
  });
});

describe('winnaar', () => {
  it('de meeste sterren wint', () => {
    const s = tel(
      met(spel({ bonussterren: false }), (x) => {
        x.spelers[2].sterren = 3;
        x.spelers[0].munten = 99;
      }),
    );
    expect(s.eindtelling!.winnaar).toBe(2);
    expect(s.eindtelling!.ranglijst[0]).toBe(2);
    expect(s.fase).toEqual({ soort: 'einde' });
  });

  it('bij gelijke sterren telt het aantal munten', () => {
    const s = tel(
      met(spel({ bonussterren: false }), (x) => {
        x.spelers.forEach((sp, i) => {
          sp.sterren = 2;
          sp.munten = [5, 30, 20, 10][i];
        });
      }),
    );
    expect(s.eindtelling!.ranglijst).toEqual([1, 2, 3, 0]);
    expect(s.eindtelling!.beslisWorpen).toEqual([]);
  });

  it('bij gelijke sterren én munten beslist een extra worp', () => {
    for (let seed = 0; seed < 30; seed++) {
      const s = tel(
        met(spel({ bonussterren: false }), (x) => {
          x.rng = seed;
          x.spelers[0].sterren = 4;
          x.spelers[2].sterren = 4;
        }),
      );
      const { ranglijst, beslisWorpen, winnaar } = s.eindtelling!;
      // Speler 0 en 2 hebben gegooid, en 1 en 3 ook (ook gelijk: 0 sterren, 10 munten).
      expect(beslisWorpen).toHaveLength(4);
      const worp = (i: number) => beslisWorpen.find((w) => w.speler === i)!.waarde;
      expect(worp(0)).not.toBe(worp(2));
      expect(winnaar).toBe(worp(0) > worp(2) ? 0 : 2);
      expect(ranglijst.slice(0, 2).sort()).toEqual([0, 2]);
      expect(ranglijst.slice(2).sort()).toEqual([1, 3]);
    }
  });
});
