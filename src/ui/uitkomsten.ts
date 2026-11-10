/**
 * De teksten bij de raderen, de kans-rollen en de melding na een beurt.
 * (Wat Pommie zegt staat in src/data/teksten.ts.)
 */
import type { GameState, Gebeurtenis, KansActie, MuntReden, RadSoort } from '../logic';
import { WINKEL_ITEMS } from '../logic';

export interface RadVak {
  /** Kort, past op het rad. */
  kort: string;
  /** De uitkomst als zin. */
  zin: string;
  kleur: string;
}

/** De vakken van elk rad, in de volgorde van HERTEN_RAD, BOK_RAD en PECH_RAD. */
export const RADEN: Record<RadSoort, { titel: string; uitleg: string; vakken: Record<string, RadVak> }> = {
  hertenkamp: {
    titel: 'Herten voeren',
    uitleg: 'De herten zijn blij met je! Wat krijg je?',
    vakken: {
      munten5: { kort: '+5', zin: 'De herten geven je 5 munten!', kleur: '#2FAE5B' },
      munten10: { kort: '+10', zin: 'De herten geven je 10 munten!', kleur: '#F47B20' },
      item: { kort: 'Item', zin: 'Een hert brengt je een gratis item!', kleur: '#8E5BD9' },
      hertje: { kort: '3 vooruit', zin: 'Een hertje duwt je 3 vakjes vooruit!', kleur: '#2F7DE1' },
    },
  },
  bok: {
    titel: 'De bok is wild!',
    uitleg: "Het is nacht en de bok heeft je gezien…",
    vakken: {
      omver: { kort: '−10', zin: 'De bok rent je omver: −10 munten!', kleur: '#D62839' },
      naarStart: { kort: 'Naar start', zin: 'De bok jaagt je terug naar het Strand!', kleur: '#8E5BD9' },
      itemsKwijt: { kort: 'Items op', zin: 'De bok eet al je items op!', kleur: '#C85A0A' },
      plas: { kort: 'In de plas', zin: 'De bok gooit je in de plas: −5 munten, en je spoelt ergens aan!', kleur: '#1E5BB0' },
    },
  },
  pech: {
    titel: 'Pech!',
    uitleg: 'Het pech-rad draait…',
    vakken: {
      min10: { kort: '−10', zin: 'Je verliest 10 munten!', kleur: '#D62839' },
      helft: { kort: 'Helft weg', zin: 'De helft van je munten is weg (hoogstens 20)!', kleur: '#C85A0A' },
      iedereen3: { kort: 'Geef 3', zin: 'Je geeft iedereen 3 munten!', kleur: '#8E5BD9' },
      ruilLaatste: { kort: 'Ruil', zin: 'Je ruilt je munten met de speler op de laatste plaats!', kleur: '#1E5BB0' },
    },
  },
};

export const KANS_TEKST: Record<KansActie, { kort: string; zin: (a: string, b: string) => string }> = {
  geef10: { kort: 'geeft 10 munten aan', zin: (a, b) => `${a} geeft ${b} 10 munten!` },
  geef20: { kort: 'geeft 20 munten aan', zin: (a, b) => `${a} geeft ${b} 20 munten!` },
  ruilMunten: { kort: 'ruilt munten met', zin: (a, b) => `${a} en ${b} ruilen al hun munten!` },
  geefSter: { kort: 'geeft een ster aan', zin: (a, b) => `${a} geeft ${b} een ster!` },
  ruilSterren: { kort: 'ruilt sterren met', zin: (a, b) => `${a} en ${b} ruilen al hun sterren!` },
};

export interface MeldingDeel {
  tekst: string;
  icoon?: string;
}

/** Munten die niet als "+3 munten" in de melding horen, omdat ze al als eigen deel staan. */
const EIGEN_DEEL: MuntReden[] = ['ster', 'boot', 'winkel', 'ratje'];

/**
 * De korte melding na een beurt, bijvoorbeeld "Bot 2 gooide 7 · +3 munten · kocht een ster!".
 * Alleen het belangrijkste, zodat de melding kort blijft.
 */
export function meldingDelen(s: GameState, speler: number, verslag: Gebeurtenis[] = s.verslag): MeldingDeel[] {
  const naam = (i: number) => s.spelers[i].naam;
  const delen: MeldingDeel[] = [];
  let worp: MeldingDeel | null = null;
  let munten = 0;
  for (const g of verslag) {
    switch (g.soort) {
      case 'worp':
        worp = { tekst: `${naam(g.speler)} gooide ${g.worpen.length > 1 ? `${g.worpen.join(' + ')} = ` : ''}${g.waarde}` };
        break;
      case 'munten':
        if (g.speler === speler && !EIGEN_DEEL.includes(g.reden)) munten += g.verschil;
        break;
      case 'splitsing':
        if (g.splitsing === 'boot' && g.zijpad) delen.push({ tekst: 'nam de boot' });
        break;
      case 'item':
        if (g.speler !== speler) break;
        if (g.actie === 'gekocht') delen.push({ tekst: `kocht ${WINKEL_ITEMS[g.item].naam.toLowerCase()}` });
        else if (g.actie === 'gekregen') delen.push({ tekst: `kreeg ${WINKEL_ITEMS[g.item].naam.toLowerCase()}` });
        else delen.push({ tekst: `gebruikte ${g.item === 'kiesWorp' ? 'Kies-je-worp' : `de ${WINKEL_ITEMS[g.item].naam.toLowerCase()}`}` });
        break;
      case 'rad':
        delen.push({ tekst: radKort(g.rad, g.uitkomst) });
        break;
      case 'kans':
        delen.push({ tekst: `Kans: ${KANS_TEKST[g.actie].zin(naam(g.a), naam(g.b))}` });
        break;
      case 'ratje':
        delen.push({
          tekst: g.wat === 'ster' ? `Ratje stal een ster van ${naam(g.doel)}!` : `Ratje stal ${g.buit} munten van ${naam(g.doel)}`,
          icoon: 'personages/ratje.svg',
        });
        break;
      case 'windvlaag':
        delen.push({ tekst: `windvlaag: ${g.stappen > 0 ? '3 vooruit' : '3 achteruit'}` });
        break;
      case 'zeilwedstrijd':
        delen.push({ tekst: `${g.lampionnen ? 'Lampionnenrace' : 'Zeilwedstrijd'}: ${g.winnaars.map(naam).join(' en ')} ${g.winnaars.length > 1 ? 'winnen' : 'wint'}!` });
        break;
      case 'strandtent':
        delen.push({ tekst: g.kampvuur ? 'kampvuur bij de Strandtent' : 'drankje bij de Strandtent' });
        break;
      case 'dagNacht':
        delen.push({ tekst: g.nacht ? 'het wordt nacht!' : 'het wordt dag!', icoon: g.nacht ? 'iconen/maan.svg' : 'iconen/zon.svg' });
        break;
      case 'sterGekocht':
        if (g.speler === speler) delen.push({ tekst: 'kocht een ster!', icoon: 'iconen/ster.svg' });
        break;
    }
  }
  // Eerst de worp, dan de munten, dan de rest.
  if (munten) delen.unshift({ tekst: `${munten > 0 ? '+' : '−'}${Math.abs(munten)} munten`, icoon: 'iconen/munt.svg' });
  if (worp) delen.unshift(worp);
  return delen;
}

function radKort(rad: RadSoort, uitkomst: string): string {
  if (rad === 'bok') return `de bok! ${RADEN.bok.vakken[uitkomst].kort.toLowerCase()}`;
  if (rad === 'pech') return `pech: ${RADEN.pech.vakken[uitkomst].kort.toLowerCase()}`;
  if (uitkomst === 'hertje') return 'een hertje duwde 3 vooruit';
  return 'voerde de herten';
}
