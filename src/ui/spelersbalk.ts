/**
 * De balk bovenin het bordscherm (design: bord-dag.html): rondeteller, de 4 spelers met
 * plaats, sterren, munten en items, de turboknop en de menuknop.
 * De balk wordt één keer gebouwd; `werkBij` past alleen de getallen aan.
 */
import { figuur } from '../data/figuren';
import { plaatsen, spelerAanZet, type GameState } from '../logic';
import { asset } from './asset';
import { icoon } from './iconen';
import { figuurPlaatje, maak, plaatsRondje, zetPlaats } from './onderdelen';

export const MAX_ITEMS = 3;

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
  private kaarten: Kaart[] = [];
  private turboKnop: HTMLButtonElement;

  constructor(
    state: GameState,
    acties: { turbo: () => void; menu: () => void },
  ) {
    const ronde = maak('div', 'ronde-teller vilt');
    const kop = maak('div', 'ronde-kop');
    kop.innerHTML = `<img src="${asset('iconen/zon.svg')}" alt="" width="26" height="26"><span>RONDE</span>`;
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
    const beurtFase = ['dobbelen', 'lopen', 'splitsing', 'sterKopen'].includes(s.fase.soort);
    const aanZet = beurtFase ? spelerAanZet(s) : -1;
    s.spelers.forEach((sp, i) => {
      const k = this.kaarten[i];
      zetPlaats(k.plaats, plek[i]);
      k.sterren.textContent = String(sp.sterren);
      k.munten.textContent = String(sp.munten);
      k.el.classList.toggle('actief', i === aanZet);
      const vakjes = [];
      for (let n = 0; n < MAX_ITEMS; n++) {
        const item = sp.items[n];
        vakjes.push(
          item
            ? `<div class="balk-item"><img src="${asset(`iconen/${item}.svg`)}" alt=""></div>`
            : '<div class="balk-item leeg"></div>',
        );
      }
      k.items.innerHTML = vakjes.join('');
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
