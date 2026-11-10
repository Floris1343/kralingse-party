/**
 * De teksten bij de raderen, de kans-rollen en de melding na een beurt.
 * (Wat Pommie zegt staat in src/data/teksten.ts.)
 */
import type { EindspelRegel, GameState, Gebeurtenis, KansActie, MuntReden, RadSoort } from '../logic';
import { itemInfo, type ItemSoort } from '../logic';

export interface RadVak {
  /** Kort, past op het rad. */
  kort: string;
  /** De uitkomst als zin. */
  zin: string;
  kleur: string;
}

/** De vakken van elk rad, in de volgorde van HERTEN_RAD, BOK_RAD, PECH_RAD en VLEERMUIS_RAD. */
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
  vleermuis: {
    titel: 'Vleermuizen!',
    uitleg: 'Een zwerm vleermuizen pakt je op…',
    vakken: {
      terug: { kort: '2 terug', zin: 'De vleermuizen fladderen je 2 vakjes terug!', kleur: '#4B3A6B' },
      vooruit: { kort: '2 vooruit', zin: 'De vleermuizen dragen je 2 vakjes vooruit!', kleur: '#2F7DE1' },
      munten5: { kort: '+5', zin: 'Ze laten iets glimmends vallen: +5 munten!', kleur: '#2FAE5B' },
      min5: { kort: '−5', zin: 'Ze pikken een munt per vleugelslag: −5 munten!', kleur: '#D62839' },
      ster: { kort: 'Naar de ster', zin: 'Ze vliegen je naar het vakje vlak vóór de ster!', kleur: '#E39A00' },
    },
  },
};

/** De vakken van het eindspelrad (§9), in de volgorde van EINDSPEL_REGELS. */
export const EINDSPEL_VAKKEN: Record<EindspelRegel, RadVak> = {
  munten20: { kort: '+20', zin: '+20 munten voor de laatste!', kleur: '#2FAE5B' },
  extraSter: { kort: 'Extra ster', zin: 'Er komt een extra ster bij!', kleur: '#E39A00' },
  goedkopeSter: { kort: 'Ster 10', zin: 'Een ster kost vanaf nu maar 10 munten!', kleur: '#F47B20' },
  eeuwigeNacht: { kort: 'Nacht', zin: 'Eeuwige nacht: het blijft nacht tot het einde!', kleur: '#4B3A6B' },
  ratjeGratis: { kort: 'Ratje gratis', zin: 'Ratje werkt vanaf nu helemaal gratis!', kleur: '#D62839' },
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
const EIGEN_DEEL: MuntReden[] = ['ster', 'boot', 'winkel', 'ratje', 'valstrik'];

const naamKlein = (item: ItemSoort) => (item === 'kiesWorp' ? 'Kies-je-worp' : itemInfo(item).naam.toLowerCase());
const metLidwoord = (item: ItemSoort) => (item === 'kiesWorp' ? 'Kies-je-worp' : `de ${naamKlein(item)}`);

const GEMEEN_TEKST = {
  zakkenroller: (doel: string, buit: number) => `rolde ${buit} munten van ${doel}`,
  slakkendobbel: (doel: string) => `gaf ${doel} de slakkendobbel`,
  achteruitpet: (doel: string) => `gaf ${doel} de achteruitpet`,
} as const;

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
        if (g.actie === 'gekocht') delen.push({ tekst: `kocht ${metLidwoord(g.item)}` });
        else if (g.actie === 'gekregen') delen.push({ tekst: `kreeg ${metLidwoord(g.item)}` });
        // Gemene items op een ander krijgen hun eigen deel (hieronder), de valstrik ook.
        else if (g.item !== 'zakkenroller' && g.item !== 'slakkendobbel' && g.item !== 'achteruitpet' && g.item !== 'valstrik') {
          delen.push({ tekst: `gebruikte ${metLidwoord(g.item)}` });
        }
        break;
      case 'gemeen':
        delen.push({ tekst: GEMEEN_TEKST[g.item](naam(g.doel), g.buit) });
        break;
      case 'valstrikGelegd':
        delen.push({ tekst: 'legde een valstrik', icoon: 'iconen/valstrik.svg' });
        break;
      case 'valstrik':
        delen.push({ tekst: `trapte in de valstrik van ${naam(g.eigenaar)}: −${g.munten}`, icoon: 'iconen/valstrik.svg' });
        break;
      case 'sterOntdekt':
        delen.push({ tekst: 'vond de ster in de mist!', icoon: 'iconen/ster.svg' });
        break;
      case 'vallendeSterWeg':
        delen.push({ tekst: 'de vallende ster is weg' });
        break;
      case 'mist':
        if (g.aan) delen.push({ tekst: 'ochtendmist!' });
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
  if (rad === 'vleermuis') return `vleermuizen! ${RADEN.vleermuis.vakken[uitkomst].kort.toLowerCase()}`;
  if (uitkomst === 'hertje') return 'een hertje duwde 3 vooruit';
  return 'voerde de herten';
}
