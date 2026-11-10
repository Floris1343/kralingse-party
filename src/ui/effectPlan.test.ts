import { describe, expect, it } from 'vitest';
import type { Gebeurtenis } from '../logic';
import { betrokken, effectenUit, nieuwInVerslag } from './effectPlan';

const munt = (speler: number, verschil: number, reden: 'blauw' | 'minigame' | 'kans' | 'ster' | 'winkel' = 'blauw'): Gebeurtenis =>
  ({ soort: 'munten', speler, verschil, reden });

describe('de effecten na een actie (§11)', () => {
  it('een blauw vakje: +3 munten', () => {
    expect(effectenUit([{ soort: 'worp', speler: 0, waarde: 4, worpen: [4] }, munt(0, 3)])).toEqual([
      { soort: 'munten', reden: 'blauw', verschil: { 0: 3 } },
    ]);
  });

  it('de minigame-uitslag: alle munten tegelijk', () => {
    expect(effectenUit([munt(2, 10, 'minigame'), munt(0, 5, 'minigame'), munt(1, 2, 'minigame')])).toEqual([
      { soort: 'munten', reden: 'minigame', verschil: { 2: 10, 0: 5, 1: 2 } },
    ]);
  });

  it('een ster kopen: eerst de munten eraf, dan het feest', () => {
    const e = effectenUit([munt(1, -20, 'ster'), { soort: 'sterGekocht', speler: 1, plek: 'a', nieuwePlek: 'b' }]);
    expect(e).toEqual([
      { soort: 'munten', reden: 'ster', verschil: { 1: -20 } },
      { soort: 'ster', speler: 1, vallend: false },
    ]);
    const vallend = effectenUit([{ soort: 'sterGekocht', speler: 1, plek: 'a', nieuwePlek: '' }]);
    expect(vallend).toEqual([{ soort: 'ster', speler: 1, vallend: true }]);
  });

  it('een item gekregen of gekocht is +1; de bok die je items opeet is −N; gebruiken telt niet', () => {
    expect(effectenUit([
      munt(0, -5, 'winkel'),
      { soort: 'item', speler: 0, item: 'dubbel', actie: 'gekocht' },
      { soort: 'item', speler: 0, item: 'dubbel', actie: 'gebruikt' },
      { soort: 'itemsKwijt', speler: 0, items: ['kiesWorp', 'valstrik'] },
    ])).toEqual([
      { soort: 'munten', reden: 'winkel', verschil: { 0: -5 } },
      { soort: 'item', speler: 0, item: 'dubbel', aantal: 1, gekocht: true },
      { soort: 'item', speler: 0, item: 'kiesWorp', aantal: -2, gekocht: false },
    ]);
  });

  it('een ster kwijt aan Ratje of door kans: de ster vliegt naar de ander', () => {
    expect(effectenUit([{ soort: 'ratje', speler: 2, doel: 0, wat: 'ster', buit: 1 }])).toEqual([{ soort: 'sterWeg', van: 0, naar: 2 }]);
    expect(effectenUit([{ soort: 'kans', speler: 0, a: 1, b: 3, actie: 'geefSter', gelukt: true }])).toEqual([{ soort: 'sterWeg', van: 1, naar: 3 }]);
    expect(effectenUit([{ soort: 'kans', speler: 0, a: 1, b: 3, actie: 'geefSter', gelukt: false }])).toEqual([]);
  });

  it('verschillende redenen komen na elkaar; een groep die op nul uitkomt verdwijnt', () => {
    const e = effectenUit([munt(0, 3), munt(0, -3, 'kans'), munt(0, 3, 'kans')]);
    expect(e).toEqual([{ soort: 'munten', reden: 'blauw', verschil: { 0: 3 } }]);
    expect(betrokken(effectenUit([munt(0, 3), { soort: 'ratje', speler: 2, doel: 1, wat: 'ster', buit: 1 }]))).toEqual([0, 1, 2]);
  });

  it('alleen het nieuwe deel van het verslag; bij een nieuw verslag alles', () => {
    const a = munt(0, 3);
    const b = munt(1, 2);
    expect(nieuwInVerslag([a], [a, b])).toEqual([b]);
    expect(nieuwInVerslag([a, b], [b])).toEqual([b]);
    expect(nieuwInVerslag([a], [b, a])).toEqual([b, a]);
  });
});
