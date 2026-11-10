/**
 * De balk bovenin het bordscherm (design: bord-dag.html): rondeteller, de 4 spelers met
 * plaats, sterren, munten en items, de turboknop en de menuknop.
 * De balk wordt één keer gebouwd; `werkBij` past alleen de getallen aan.
 */
import { figuur } from '../data/figuren';
import { plaatsen, spelerAanZet, type GameState } from '../logic';
import { asset } from './asset';
import { itemIcoon } from './itemIcoon';
import { icoon } from './iconen';
import { figuurPlaatje, maak, plaatsRondje, zetPlaats } from './onderdelen';

export { MAX_ITEMS } from '../logic';
import { MAX_ITEMS } from '../logic';

interface Kaart {
  el: HTMLElement;
  plaats: HTMLElement;
  sterren: HTMLElement;
  munten: HTMLElement;
  items: HTMLElement;
}

export class Spelersbalk {
  readonly el = maak('div', 'spelersbalk');
  private rondeGetal = maak('div', 'ronde-getal');
  private ronde = maak('div', 'ronde-teller vilt');
  private rondeIcoon!: HTMLImageElement;
  private itemsSleutel: string[] = [];
  private kaarten: Kaart[] = [];
  private turboKnop: HTMLButtonElement;

  constructor(
    state: GameState,
    acties: { turbo: () => void; menu: () => void },
  ) {
    const ronde = this.ronde;
    const kop = maak('div', 'ronde-kop');
    kop.innerHTML = `<img src="${asset('iconen/zon.svg')}" alt="" width="26" height="26"><span>RONDE</span>`;
    this.rondeIcoon = kop.querySelector('img')!;
    ronde.append(kop, this.rondeGetal);

    const spelers = maak('div', 'balk-spelers');
    state.spelers.forEach((sp) => {
      const f = figuur(sp.figuur);
      const el = maak('div', 'balk-speler vilt');
      el.style.setProperty('--speler-kleur', f.kleur);

      const rond = maak('div', 'balk-figuur');
      const binnen = maak('div', 'balk-figuur-binnen');
      binnen.style.background = f.kleurLicht;
      binnen.append(figuurPlaatje(f, sp.naam, 'balk-figuur-plaatje'));
      const plaats = plaatsRondje(1, 'balk-plaats');
      rond.append(binnen, plaats);

      const info = maak('div', 'balk-info');
      const naamRij = maak('div', 'balk-naamrij');
      naamRij.append(maak('span', 'balk-naam', sp.naam));
      if (sp.isBot) naamRij.append(maak('span', 'bot-label', 'BOT'));
      const getallen = maak('div', 'balk-getallen');
      const sterren = maak('span');
      const munten = maak('span');
      getallen.append(telling('iconen/ster.svg', sterren, 22), telling('iconen/munt.svg', munten, 20));
      info.append(naamRij, getallen);

      const items = maak('div', 'balk-items');
      el.append(rond, info, items, maak('div', 'aan-de-beurt', 'AAN DE BEURT'));
      spelers.append(el);
      this.kaarten.push({ el, plaats, sterren, munten, items });
    });

    this.turboKnop = maak('button', 'hoekknop');
    this.turboKnop.type = 'button';
    this.turboKnop.setAttribute('aria-label', 'Turbo: bots overslaan');
    this.turboKnop.innerHTML = icoon.turbo();
    this.turboKnop.addEventListener('click', acties.turbo);
    const menu = maak('button', 'hoekknop');
    menu.type = 'button';
    menu.setAttribute('aria-label', 'Menu');
    menu.innerHTML = icoon.menu();
    menu.addEventListener('click', acties.menu);
    const knoppen = maak('div', 'balk-knoppen');
    knoppen.append(this.turboKnop, menu);

    this.el.append(ronde, spelers, knoppen);
    this.werkBij(state);
  }

  werkBij(s: GameState): void {
    this.rondeGetal.innerHTML = `${s.ronde}<span>/${s.instellingen.aantalRondes}</span>`;
    const plek = plaatsen(s);
    this.ronde.classList.toggle('nacht', s.nacht);
    const icoonPad = asset(s.nacht ? 'iconen/maan.svg' : 'iconen/zon.svg');
    if (this.rondeIcoon.getAttribute('src') !== icoonPad) this.rondeIcoon.src = icoonPad;
    const beurtFase = ['dobbelen', 'lopen', 'splitsing', 'sterKopen', 'winkel', 'ratje'].includes(s.fase.soort);
    const aanZet = beurtFase ? spelerAanZet(s) : -1;
    s.spelers.forEach((sp, i) => {
      const k = this.kaarten[i];
      zetPlaats(k.plaats, plek[i]);
      k.sterren.textContent = String(sp.sterren);
      k.munten.textContent = String(sp.munten);
      k.el.classList.toggle('actief', i === aanZet);
      // Alleen opnieuw tekenen als de items veranderd zijn.
      const sleutel = sp.items.join(',');
      if (this.itemsSleutel[i] === sleutel) return;
      this.itemsSleutel[i] = sleutel;
      const vakjes: HTMLElement[] = [];
      for (let n = 0; n < MAX_ITEMS; n++) {
        const item = sp.items[n];
        const vak = maak('div', item ? 'balk-item' : 'balk-item leeg');
        if (item) vak.append(itemIcoon(item, 18));
        vakjes.push(vak);
      }
      k.items.replaceChildren(...vakjes);
    });
  }

  zetTurbo(aan: boolean): void {
    this.turboKnop.classList.toggle('aan', aan);
    this.turboKnop.setAttribute('aria-pressed', String(aan));
  }
}

function telling(icoonPad: string, getal: HTMLElement, maat: number): HTMLElement {
  const el = maak('div', 'balk-telling');
  el.innerHTML = `<img src="${asset(icoonPad)}" alt="" width="${maat}" height="${maat}">`;
  el.append(getal);
  return el;
}
