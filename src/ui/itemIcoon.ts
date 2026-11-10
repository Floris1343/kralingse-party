/**
 * Icoontjes voor de items. Waar het design een tekening heeft, gebruiken we die letterlijk:
 * de dubbele dobbelsteen (item_dobbel) en de rode d10 (Kies-je-worp). De Ratjebel krijgt Ratje
 * zelf. Voor de Wisseltruc heeft het design geen tekening: dan een nette vervanger (cirkel met letter).
 */
import { WINKEL_ITEMS, type ItemSoort } from '../logic';
import { asset, vervanger } from './asset';
import { maak } from './onderdelen';

const ICOON: Record<ItemSoort, string | null> = {
  dubbel: 'iconen/dubbele-dobbelsteen.svg',
  driedubbel: 'iconen/dubbele-dobbelsteen.svg',
  kiesWorp: 'iconen/dobbelsteen.svg',
  ratjebel: 'personages/ratje.svg',
  wisseltruc: null,
};

export function itemIcoon(item: ItemSoort, maat: number): HTMLElement {
  const el = maak('span', 'item-icoon');
  el.style.width = el.style.height = `${maat}px`;
  el.style.setProperty('--maat', `${maat}px`);
  const pad = ICOON[item];
  if (pad) {
    const img = document.createElement('img');
    img.src = asset(pad);
    img.alt = WINKEL_ITEMS[item].naam;
    img.draggable = false;
    img.addEventListener('error', () => img.replaceWith(vervanger(WINKEL_ITEMS[item].naam, '#8E5BD9', 'item-vervanger')), { once: true });
    el.append(img);
  } else {
    el.append(vervanger(WINKEL_ITEMS[item].naam, '#8E5BD9', 'item-vervanger'));
  }
  // De driedubbele dobbelsteen: het dubbele-dobbelsteen-icoon met een ×3-badge.
  if (item === 'driedubbel') el.append(maak('span', 'item-badge', '×3'));
  return el;
}
