import { describe, expect, it } from 'vitest';
import { BOK_RAD, HERTEN_RAD, PECH_RAD, type Gebeurtenis } from '../logic';
import { spel } from '../logic/testhulp';
import { meldingDelen, RADEN } from './uitkomsten';

describe('melding na een botbeurt', () => {
  it('eerst de worp, dan de munten, dan de rest', () => {
    const s = spel();
    const verslag: Gebeurtenis[] = [
      { soort: 'item', speler: 2, item: 'dubbel', actie: 'gebruikt' },
      { soort: 'worp', speler: 2, waarde: 10, worpen: [4, 6] },
      { soort: 'munten', speler: 2, verschil: -25, reden: 'ratje' },
      { soort: 'ratje', speler: 2, doel: 0, wat: 'ster', buit: 1 },
      { soort: 'munten', speler: 2, verschil: 3, reden: 'blauw' },
    ];
    expect(meldingDelen(s, 2, verslag).map((d) => d.tekst)).toEqual([
      'Bot 1 gooide 4 + 6 = 10',
      '+3 munten',
      'gebruikte de dubbele dobbelsteen',
      'Ratje stal een ster van Anna!',
    ]);
  });
});

describe('raderen', () => {
  it('elk vak van elk rad heeft een tekst', () => {
    for (const [rad, vakken] of [['hertenkamp', HERTEN_RAD], ['bok', BOK_RAD], ['pech', PECH_RAD]] as const) {
      expect(Object.keys(RADEN[rad].vakken).sort()).toEqual([...vakken].sort());
    }
  });
});
