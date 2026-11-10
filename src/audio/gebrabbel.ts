/**
 * Het berengebrabbel van Pommie (§12), zonder audiobestanden: per lettergreep een korte, lage
 * brom met een licht wisselende toonhoogte, zoals in Animal Crossing.
 * Het plan (welke blips, wanneer, hoe hoog) is een pure functie, zodat het te testen is.
 */

export interface Blip {
  /** Starttijd in seconden, vanaf het begin van de zin. */
  start: number;
  duur: number;
  /** Toonhoogte in Hz. */
  toon: number;
  /** Hoeveel letters van de tekst er na deze blip te zien zijn. */
  tekstTot: number;
}

/** Laag, als een beer. */
export const BRABBEL_BASIS = 150;
export const BLIP_DUUR = 0.075;
export const BLIP_PAUZE = 0.04;
/** Een lange zin brabbelt niet eindeloos door: hoogstens zoveel blips. */
export const MAX_BLIPS = 22;

const KLINKERS = /[aeiouyàáâäèéêëìíîïòóôöùúûü]+/gi;

/** De lettergrepen van een tekst, ruw geteld als groepjes klinkers. Geeft de eindpositie van elk. */
export function lettergrepen(tekst: string): number[] {
  const einden: number[] = [];
  for (const m of tekst.matchAll(KLINKERS)) einden.push(m.index! + m[0].length);
  return einden;
}

/**
 * Het plan voor een zin: een blip per lettergreep, met een kleine pauze bij leestekens.
 * `rnd` geeft getallen tussen 0 en 1 (Math.random in het spel, vast in de tests).
 */
export function brabbelPlan(tekst: string, rnd: () => number = Math.random): Blip[] {
  const einden = lettergrepen(tekst);
  if (einden.length === 0) return [];
  // Te lang? Dan neemt elke blip een paar lettergrepen tegelijk.
  const stap = Math.ceil(einden.length / MAX_BLIPS);
  const plan: Blip[] = [];
  let t = 0;
  let vorige = 0;
  for (let i = stap - 1; i < einden.length + stap - 1; i += stap) {
    const tot = i >= einden.length - 1 ? tekst.length : einden[i];
    const stuk = tekst.slice(vorige, tot);
    // Een zin die met een vraag eindigt, gaat omhoog; anders zakt hij aan het eind wat.
    const laatste = tot === tekst.length;
    const buiging = laatste ? (tekst.trim().endsWith('?') ? 1.25 : 0.88) : 1;
    plan.push({ start: t, duur: BLIP_DUUR, toon: BRABBEL_BASIS * (0.85 + rnd() * 0.35) * buiging, tekstTot: tot });
    t += BLIP_DUUR + BLIP_PAUZE + (/[.,!?…:]/.test(stuk) ? 0.12 : 0);
    vorige = tot;
  }
  return plan;
}
