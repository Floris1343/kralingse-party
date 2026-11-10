/**
 * Pommie de pompoenbeer, de host (§12): een tekstballon met berengebrabbel. De tekst loopt mee
 * met het gebrabbel; de ballon houdt meteen zijn volle maat, zodat er niets verspringt.
 * Elke ballon kun je wegtikken (§11).
 */
import { brabbel } from '../audio/geluid';
import { asset } from './asset';
import { maak } from './onderdelen';

/**
 * Laat de tekst in `p` meelopen met het gebrabbel. Geeft een functie terug die het stopt
 * en meteen de hele tekst laat zien.
 */
export function brabbelIn(p: HTMLElement, tekst: string): () => void {
  const zichtbaar = maak('span');
  const nog = maak('span', 'ballon-nog', tekst);
  p.replaceChildren(zichtbaar, nog);
  const toon = (n: number) => {
    zichtbaar.textContent = tekst.slice(0, n);
    nog.textContent = tekst.slice(n);
  };
  const stop = brabbel(tekst, toon);
  return () => {
    stop();
    toon(tekst.length);
  };
}

export interface PommieOpties {
  /** Hoe lang de ballon blijft staan als niemand tikt (standaard: lang genoeg om te lezen). */
  autoMs?: number;
  /** Extra klasse, bijvoorbeeld voor een andere plek op het scherm. */
  klasse?: string;
}

/** Hoe lang je nodig hebt om een tekst te lezen: ongeveer 1,6 s plus 45 ms per teken, hoogstens 6 s. */
export const leestijd = (tekst: string) => Math.min(6000, 1600 + tekst.length * 45);

/** Pommie komt in beeld met een tekstballon. Klaar als hij weg is (getikt of na de leestijd). */
export function pommieZegt(laag: HTMLElement, tekst: string, opties: PommieOpties = {}): Promise<void> {
  const el = maak('div', `pommie-moment${opties.klasse ? ` ${opties.klasse}` : ''}`);
  el.innerHTML = `
    <img class="pommie-plaatje" src="${asset('personages/pommie.svg')}" alt="Pommie">
    <div class="ballon ballon-links"><div class="ballon-naam">Pommie</div><p></p></div>`;
  laag.append(el);
  const stop = brabbelIn(el.querySelector('p')!, tekst);
  return new Promise((r) => {
    const weg = () => {
      clearTimeout(t);
      stop();
      el.remove();
      r();
    };
    const t = setTimeout(weg, opties.autoMs ?? leestijd(tekst));
    el.addEventListener('click', weg, { once: true });
  });
}
