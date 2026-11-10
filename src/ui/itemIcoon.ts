/**
 * Icoontjes voor de items. Waar het design een tekening heeft, gebruiken we die letterlijk:
 * de dubbele dobbelsteen (item_dobbel), de rode d10 (Kies-je-worp), de val (item_val, voor de
 * Valstrik) en het slakje uit dobbel-slakkendobbel.html. De Ratjebel krijgt Ratje zelf.
 * Voor de Wisseltruc, de Zakkenroller en de Achteruitpet heeft het design geen tekening:
 * dan een nette vervanger (cirkel met letter).
 */
import { isNachtItem, itemInfo, type ItemSoort } from '../logic';
import { asset, vervanger } from './asset';
import { maak } from './onderdelen';

/** Het slakje uit dobbel-slakkendobbel.html (letterlijk). */
export const SLAK_SVG = (maat: number) =>
  `<svg width="${maat}" height="${maat}" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="80" rx="44" ry="10" fill="#C9E39A"></ellipse><circle cx="46" cy="52" r="30" fill="#D9AE72"></circle><path d="M46 52 m0 -4 a4 4 0 1 1 -4 4 a9 9 0 0 1 9 -9 a14 14 0 0 1 14 14 a20 20 0 0 1 -20 20 a26 26 0 0 1 -26 -26" fill="none" stroke="#8A5F2E" stroke-width="6" stroke-linecap="round"></path><path d="M76 70 q10 -10 8 -30 M84 40 l-4 -10 M84 40 l8 -6" stroke="#A9C77A" stroke-width="6" stroke-linecap="round" fill="none"></path></svg>`;

const ICOON: Record<ItemSoort, string | null> = {
  dubbel: 'iconen/dubbele-dobbelsteen.svg',
  driedubbel: 'iconen/dubbele-dobbelsteen.svg',
  kiesWorp: 'iconen/dobbelsteen.svg',
  ratjebel: 'personages/ratje.svg',
  wisseltruc: null,
  zakkenroller: null,
  slakkendobbel: null,
  achteruitpet: null,
  valstrik: 'iconen/valstrik.svg',
};

/** Kleur van de vervanger: paars voor de winkel, nachtpaars voor de Nachtwinkel. */
const vervangKleur = (item: ItemSoort) => (isNachtItem(item) ? '#4B3A6B' : '#8E5BD9');

export function itemIcoon(item: ItemSoort, maat: number): HTMLElement {
  const el = maak('span', 'item-icoon');
  el.style.width = el.style.height = `${maat}px`;
  el.style.setProperty('--maat', `${maat}px`);
  const naam = itemInfo(item).naam;
  const pad = ICOON[item];
  if (item === 'slakkendobbel') {
    el.innerHTML = SLAK_SVG(maat);
  } else if (pad) {
    const img = document.createElement('img');
    img.src = asset(pad);
    img.alt = naam;
    img.draggable = false;
    img.addEventListener('error', () => img.replaceWith(vervanger(naam, vervangKleur(item), 'item-vervanger')), { once: true });
    el.append(img);
  } else {
    el.append(vervanger(naam, vervangKleur(item), 'item-vervanger'));
  }
  // De driedubbele dobbelsteen: het dubbele-dobbelsteen-icoon met een ×3-badge.
  if (item === 'driedubbel') el.append(maak('span', 'item-badge', '×3'));
  return el;
}
