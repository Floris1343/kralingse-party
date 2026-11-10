/**
 * Wat er gebeurt als je op een vakje eindigt (§6.3, §6.5, §7.3–§7.5).
 * Alles werkt op een kopie van de state (binnen `metKopie`) en schrijft in het verslag,
 * zodat het scherm daarna het rad, de kans-rollen of de zeilwedstrijd kan laten zien.
 *
 * Wordt je verplaatst (windvlaag, hertje, bok), dan telt het nieuwe vakje niet en loop
 * je ook niet langs de ster of de winkel. Zo blijft één beurt één uitkomst.
 */
import { vakje, volgendVakje, type Bord } from './bord';
import { huidigType, wisselDagNacht } from './dagNacht';
import { isEindspel } from './eindspel';
import type { GameState, KansActie, VerplaatsReden } from './gameState';
import { geefGratisItem } from './items';
import { BLAUW_MUNTEN, kies, plaatsen, ROOD_MUNTEN, trek, wijzigMunten } from './regels';

export const HERTEN_RAD = ['munten5', 'munten10', 'item', 'hertje'] as const;
export const BOK_RAD = ['omver', 'naarStart', 'itemsKwijt', 'plas'] as const;
export const PECH_RAD = ['min10', 'helft', 'iedereen3', 'ruilLaatste'] as const;
/**
 * Het vleermuizenrad (§8.3) heeft 6 even grote vakken: "naar de ster" is dan precies 1 op 6.
 * "2 terug" staat er twee keer op, zodat er 3 goede en 3 nare vakken zijn.
 */
export const VLEERMUIS_RAD = ['terug', 'vooruit', 'munten5', 'terug', 'min5', 'ster'] as const;
export const KANS_ACTIES: readonly KansActie[] = ['geef10', 'geef20', 'ruilMunten', 'geefSter', 'ruilSterren'];

export type HertenUitkomst = (typeof HERTEN_RAD)[number];
export type BokUitkomst = (typeof BOK_RAD)[number];
export type PechUitkomst = (typeof PECH_RAD)[number];
export type VleermuisUitkomst = (typeof VLEERMUIS_RAD)[number];
export const VLEERMUIS_STAPPEN = 2;
export const VLEERMUIS_MUNTEN = 5;

export const STRANDTENT_MUNTEN = 5;
export const KAMPVUUR_MUNTEN = 2;
export const WINDVLAAG_STAPPEN = 3;
export const HERTJE_STAPPEN = 3;
export const ZEILWEDSTRIJD_PRIJS = 10;
export const LAMPIONNEN_PRIJS = 15;
export const ORGANISATOR_MUNTEN = 2;

/** Zijpaden die alleen via een splitsing bereikbaar zijn (daar spoel je niet aan, daar waai je niet heen). */
const ZIJZONES = new Set(['boot', 'ijspad']);

/** Het vakje vóór dit vakje op de route (bij twee wegen: de weg over land, niet de boot of het ijs). */
export function vorigVakje(bord: Bord, id: string): string {
  const ervoor = bord.vakjes.filter((v) => v.next.includes(id));
  if (ervoor.length === 0) throw new Error(`Vakje ${id} heeft geen voorganger`);
  const hoofd = ervoor.filter((v) => !ZIJZONES.has(v.zone));
  return (hoofd[0] ?? ervoor[0]).id;
}

/** `n` vakjes vooruit (n > 0, over het hoofdpad) of achteruit (n < 0). */
export function verschuif(bord: Bord, id: string, n: number): string {
  let v = id;
  for (let i = 0; i < Math.abs(n); i++) v = n > 0 ? volgendVakje(bord, v) : vorigVakje(bord, v);
  return v;
}

function verplaats(s: GameState, speler: number, naar: string, reden: VerplaatsReden): void {
  const sp = s.spelers[speler];
  if (sp.vakje === naar) return;
  s.verslag.push({ soort: 'verplaatst', speler, van: sp.vakje, naar, reden });
  sp.vakje = naar;
}

/** Het effect van het vakje waarop de speler eindigt. */
export function handelVakjeAf(s: GameState, bord: Bord, speler: number): void {
  const sp = s.spelers[speler];
  const v = vakje(bord, sp.vakje);
  const factor = isEindspel(s) ? 2 : 1;
  switch (huidigType(s, v)) {
    case 'blauw':
    case 'ijs':
      wijzigMunten(s, speler, BLAUW_MUNTEN * factor, 'blauw');
      break;
    case 'rood':
      sp.stats.roodVakjes += 1;
      wijzigMunten(s, speler, -ROOD_MUNTEN * factor, 'rood');
      break;
    case 'item':
      geefGratisItem(s, speler);
      break;
    case 'kans':
      kansVakje(s, speler);
      break;
    case 'pech':
      pechVakje(s, speler);
      break;
    case 'hertenkamp':
      sp.stats.avontuurVakjes += 1;
      if (s.nacht) bok(s, bord, speler);
      else herten(s, bord, speler);
      break;
    case 'vleermuis':
      sp.stats.avontuurVakjes += 1;
      vleermuizen(s, bord, speler);
      break;
    case 'event':
      sp.stats.avontuurVakjes += 1;
      eventVakje(s, bord, speler, v.flags ?? []);
      break;
    default:
      // start en de bootsteiger: niets
      break;
  }
}

// ------------------------------------------------------------------ hertenkamp (§6.3)

function herten(s: GameState, bord: Bord, speler: number): void {
  const uitkomst = kies(s, HERTEN_RAD);
  s.verslag.push({ soort: 'rad', speler, rad: 'hertenkamp', uitkomst });
  switch (uitkomst) {
    case 'munten5':
      wijzigMunten(s, speler, 5, 'hertenkamp');
      break;
    case 'munten10':
      wijzigMunten(s, speler, 10, 'hertenkamp');
      break;
    case 'item':
      geefGratisItem(s, speler);
      break;
    case 'hertje':
      verplaats(s, speler, verschuif(bord, s.spelers[speler].vakje, HERTJE_STAPPEN), 'hertje');
      break;
  }
}

function bok(s: GameState, bord: Bord, speler: number): void {
  const sp = s.spelers[speler];
  sp.stats.bokOntmoetingen += 1;
  const uitkomst = kies(s, BOK_RAD);
  s.verslag.push({ soort: 'rad', speler, rad: 'bok', uitkomst });
  switch (uitkomst) {
    case 'omver':
      wijzigMunten(s, speler, -10, 'hertenkamp');
      break;
    case 'naarStart':
      verplaats(s, speler, bord.start, 'bok');
      break;
    case 'itemsKwijt':
      if (sp.items.length) s.verslag.push({ soort: 'itemsKwijt', speler, items: sp.items });
      sp.items = [];
      break;
    case 'plas': {
      wijzigMunten(s, speler, -5, 'hertenkamp');
      const plekken = bord.vakjes.filter((v) => !ZIJZONES.has(v.zone) && v.id !== sp.vakje).map((v) => v.id);
      verplaats(s, speler, kies(s, plekken), 'plas');
      break;
    }
  }
}

// ------------------------------------------------------------------ vleermuizen (§8.3)

function vleermuizen(s: GameState, bord: Bord, speler: number): void {
  const uitkomst = kies(s, VLEERMUIS_RAD);
  s.verslag.push({ soort: 'rad', speler, rad: 'vleermuis', uitkomst });
  const hier = s.spelers[speler].vakje;
  switch (uitkomst) {
    case 'terug':
      verplaats(s, speler, verschuif(bord, hier, -VLEERMUIS_STAPPEN), 'vleermuis');
      break;
    case 'vooruit':
      verplaats(s, speler, verschuif(bord, hier, VLEERMUIS_STAPPEN), 'vleermuis');
      break;
    case 'munten5':
      wijzigMunten(s, speler, VLEERMUIS_MUNTEN, 'vleermuis');
      break;
    case 'min5':
      wijzigMunten(s, speler, -VLEERMUIS_MUNTEN, 'vleermuis');
      break;
    case 'ster': {
      const doel = vakjeVoorSter(s, bord, hier);
      if (doel) verplaats(s, speler, doel, 'vleermuis');
      break;
    }
  }
}

/**
 * Het vakje vlak vóór de dichtstbijzijnde ster (vooruit gerekend), ook als die in de mist staat:
 * de vleermuizen weten waar hij is. Zo loop je je volgende beurt er meteen langs.
 */
export function vakjeVoorSter(s: GameState, bord: Bord, vanaf: string): string | null {
  let beste: string | null = null;
  let afstand = Infinity;
  for (const st of s.sterren) {
    const plek = bord.sterplekken.find((p) => p.id === st.plek);
    if (!plek) continue;
    const ervoor = vorigVakje(bord, plek.vakje);
    const d = stappenTotPlek(bord, vanaf, ervoor);
    if (d < afstand) [beste, afstand] = [ervoor, d];
  }
  return beste;
}

function stappenTotPlek(bord: Bord, van: string, naar: string): number {
  let id = van;
  for (let n = 0; n <= bord.vakjes.length; n++) {
    if (id === naar) return n;
    id = volgendVakje(bord, id);
  }
  return Infinity;
}

// ------------------------------------------------------------------ kans (§7.3) en pech (§7.4)

function kansVakje(s: GameState, speler: number): void {
  const alle = s.spelers.map((_, i) => i);
  const a = kies(s, alle);
  const actie = kies(s, KANS_ACTIES);
  const b = kies(s, alle.filter((i) => i !== a));
  const A = s.spelers[a];
  const B = s.spelers[b];
  let gelukt = true;
  switch (actie) {
    case 'geef10':
    case 'geef20': {
      const bedrag = Math.min(A.munten, actie === 'geef10' ? 10 : 20);
      gelukt = bedrag > 0;
      wijzigMunten(s, a, -bedrag, 'kans');
      wijzigMunten(s, b, bedrag, 'kans');
      break;
    }
    case 'ruilMunten': {
      const [ma, mb] = [A.munten, B.munten];
      wijzigMunten(s, a, mb - ma, 'kans');
      wijzigMunten(s, b, ma - mb, 'kans');
      break;
    }
    case 'geefSter':
      gelukt = A.sterren > 0;
      if (gelukt) {
        A.sterren -= 1;
        B.sterren += 1;
      }
      break;
    case 'ruilSterren':
      [A.sterren, B.sterren] = [B.sterren, A.sterren];
      break;
  }
  s.verslag.push({ soort: 'kans', speler, a, b, actie, gelukt });
}

function pechVakje(s: GameState, speler: number): void {
  const uitkomst = kies(s, PECH_RAD);
  s.verslag.push({ soort: 'rad', speler, rad: 'pech', uitkomst });
  const sp = s.spelers[speler];
  switch (uitkomst) {
    case 'min10':
      wijzigMunten(s, speler, -10, 'pech');
      break;
    case 'helft':
      wijzigMunten(s, speler, -Math.min(20, Math.floor(sp.munten / 2)), 'pech');
      break;
    case 'iedereen3':
      s.spelers.forEach((_, i) => {
        if (i === speler) return;
        const geef = -wijzigMunten(s, speler, -3, 'pech');
        wijzigMunten(s, i, geef, 'pech');
      });
      break;
    case 'ruilLaatste': {
      // Met de speler op de laatste plaats. Sta je zelf (gedeeld) laatst, dan gebeurt er niets.
      const p = plaatsen(s);
      const laatste = Math.max(...p);
      if (p[speler] === laatste) break;
      const ander = kies(s, p.map((pl, i) => (pl === laatste ? i : -1)).filter((i) => i >= 0));
      const [m1, m2] = [sp.munten, s.spelers[ander].munten];
      wijzigMunten(s, speler, m2 - m1, 'pech');
      wijzigMunten(s, ander, m1 - m2, 'pech');
      break;
    }
  }
}

// ------------------------------------------------------------------ eventvakjes (§7.5)

function eventVakje(s: GameState, bord: Bord, speler: number, flags: readonly string[]): void {
  if (flags.includes('lantaarnpaal')) {
    wisselDagNacht(s, 'lantaarnpaal');
  } else if (flags.includes('strandtent')) {
    s.verslag.push({ soort: 'strandtent', speler, kampvuur: s.nacht });
    if (s.nacht) {
      s.spelers.forEach((_, i) => {
        if (i === speler) return;
        const geef = -wijzigMunten(s, i, -KAMPVUUR_MUNTEN, 'event');
        wijzigMunten(s, speler, geef, 'event');
      });
    } else {
      wijzigMunten(s, speler, STRANDTENT_MUNTEN, 'event');
    }
  } else if (flags.includes('windvlaag')) {
    const stappen = trek(s, 0, 1) === 0 ? WINDVLAAG_STAPPEN : -WINDVLAAG_STAPPEN;
    s.verslag.push({ soort: 'windvlaag', speler, stappen });
    verplaats(s, speler, verschuif(bord, s.spelers[speler].vakje, stappen), 'windvlaag');
  } else if (flags.includes('zeilwedstrijd')) {
    zeilwedstrijd(s, speler);
  }
}

function zeilwedstrijd(s: GameState, speler: number): void {
  const worpen = s.spelers.map(() => trek(s, 1, 10));
  const hoogste = Math.max(...worpen);
  const winnaars = worpen.map((w, i) => (w === hoogste ? i : -1)).filter((i) => i >= 0);
  const prijs = s.nacht ? LAMPIONNEN_PRIJS : ZEILWEDSTRIJD_PRIJS;
  s.verslag.push({ soort: 'zeilwedstrijd', speler, worpen, winnaars, prijs, lampionnen: s.nacht });
  for (const w of winnaars) wijzigMunten(s, w, prijs, 'event');
  wijzigMunten(s, speler, ORGANISATOR_MUNTEN, 'event');
}
