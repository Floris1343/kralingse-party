import { describe, expect, it } from 'vitest';
import { BORD } from '../data/bord';
import { winkelKeuze, loopUit, splitsingKeuze, stap } from './beurt';
import { speelBotsAf } from './bot';
import type { GameState } from './gameState';
import { nieuwSpel } from './nieuwSpel';
import { botKiestZijpad, stappenTotSter } from './splitsing';
import { keuzes, met, metWorp, speelUit, alleBots } from './testhulp';

const splitsing = (soort: string) => BORD.splitsingen.find((s) => s.soort === soort)!;

/** Speler 0 (mens) staat op `vakje` en is aan zet, met de ster bij `ster`. */
function bij(vakje: string, ster: string, wijzig: (s: GameState) => void = () => {}): GameState {
  return met(nieuwSpel(BORD, keuzes(), 1), (s) => {
    s.volgorde = [0, 1, 2, 3];
    s.spelers[0].vakje = vakje;
    s.sterren = [{ plek: ster }];
    wijzig(s);
  });
}

describe('splitsingen op het echte bord', () => {
  it('bij het hertenkamp is geen keuze: je loopt het pad langs het hek', () => {
    const s = stap(metWorp(bij('noord7', 'westoever'), 4), BORD);
    expect(s.fase).toEqual({ soort: 'lopen', worp: 4, resterend: 3 });
    expect(s.spelers[0].vakje).toBe('herten1');
    expect(loopUit(metWorp(bij('noord7', 'westoever'), 5), BORD).spelers[0].vakje).toBe('oost1');
  });

  it('de boot kost 3 munten en vaart naar het restaurant', () => {
    let s = stap(metWorp(bij('haven2', 'westoever'), 5), BORD);
    expect(s.fase.soort).toBe('splitsing');
    s = loopUit(splitsingKeuze(s, BORD, true), BORD);
    expect(s.spelers[0].vakje).toBe('restaurant1');
    expect(s.fase.soort).toBe('winkel'); // bij het restaurant staat de winkel
    s = winkelKeuze(s, BORD, null);
    expect(s.spelers[0].munten).toBe(10 - 3 + 3); // restaurant1 is blauw
    expect(s.verslag).toContainEqual({ soort: 'munten', speler: 0, verschil: -3, reden: 'boot' });
  });

  it('met minder dan 3 munten is er geen bootkeuze', () => {
    const s = loopUit(metWorp(bij('haven2', 'westoever', (x) => (x.spelers[0].munten = 2)), 1), BORD);
    expect(s.spelers[0].vakje).toBe('haven3');
  });

  it('het ijspad is nog dicht (dat komt met de winter)', () => {
    const s = loopUit(metWorp(bij('strand3', 'westoever'), 1), BORD);
    expect(s.spelers[0].vakje).toBe('strand4');
  });

  it('eindig je op een splitsing, dan kies je aan het begin van je volgende beurt', () => {
    let s = loopUit(metWorp(bij('haven1', 'westoever', (x) => (x.spelers[0].munten = 30)), 1), BORD);
    expect(s.spelers[0].vakje).toBe('haven2');
    s = met(s, (x) => (x.aanZet = 0));
    expect(stap(metWorp(s, 3), BORD).fase.soort).toBe('splitsing');
  });
});

describe('bots bij een splitsing', () => {
  it('rekenen hoe ver de ster is', () => {
    const s = bij('noord7', 'oostoever');
    expect(stappenTotSter(s, BORD, 'oost2')).toBe(1);
    expect(stappenTotSter(s, BORD, 'oost3')).toBe(0);
  });

  it('nemen de boot als de ster in het zuidoosten ligt en ze genoeg munten hebben', () => {
    const rijk = bij('haven2', 'plaszoom', (x) => (x.spelers[0].munten = 30));
    expect(botKiestZijpad(rijk, BORD, splitsing('boot'), 0)).toBe(true);
    const arm = bij('haven2', 'plaszoom', (x) => (x.spelers[0].munten = 20));
    expect(botKiestZijpad(arm, BORD, splitsing('boot'), 0)).toBe(false);
    const westen = bij('haven2', 'westoever', (x) => (x.spelers[0].munten = 30));
    expect(botKiestZijpad(westen, BORD, splitsing('boot'), 0)).toBe(false);
  });

  it('kiezen meteen, zonder te wachten', () => {
    const s = bij('haven2', 'plaszoom', (x) => {
      x.spelers[0].isBot = true;
      x.spelers[0].munten = 30;
    });
    const na = speelBotsAf(metWorp(s, 2), BORD);
    expect(na.spelers[0].vakje).toBe('boot2');
    expect(na.spelers[0].munten).toBe(30 - 3 + 3);
    expect(na.verslag).toContainEqual({ soort: 'splitsing', speler: 0, splitsing: 'boot', zijpad: true });
  });
});

describe('een heel spel op het echte bord', () => {
  it('loopt tot het einde, met mensen die soms de boot nemen', () => {
    let zijpaden = 0;
    for (let seed = 0; seed < 20; seed++) {
      const { eind, staten } = speelUit(nieuwSpel(BORD, keuzes(), seed), (s) => s, 20_000, BORD);
      expect(eind.fase).toEqual({ soort: 'einde' });
      zijpaden += staten.flatMap((s) => s.verslag).filter((g) => g.soort === 'splitsing' && g.zijpad).length;
    }
    // 's Nachts vaart de boot niet, dus in één spel kan het toevallig nul keer zijn; in twintig niet.
    expect(zijpaden).toBeGreaterThan(0);
  });

  it('ook met alleen bots', () => {
    const { eind } = speelUit(nieuwSpel(BORD, { ...keuzes(), spelers: alleBots() }, 3), (s) => s, 20_000, BORD);
    expect(eind.fase).toEqual({ soort: 'einde' });
  });
});
