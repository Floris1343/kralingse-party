/**
 * De balk bovenin het bordscherm (design: bord-dag.html): rondeteller, de 4 spelers met
 * plaats, sterren, munten en items, de turboknop en de menuknop.
 * De balk wordt één keer gebouwd; `werkBij` past alleen de getallen aan.
 */
import { figuur } from '../data/figuren';
import { plaatsen, spelerAanZet, type GameState } from '../logic';
import { asset } from './asset';
import { itemIcoon, SLAK_SVG } from './itemIcoon';
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
  /** Klein teken bij het figuur: de Slakkendobbel of de Achteruitpet van iemand anders (§8.1). */
  vloek: HTMLElement;
}

/** Pijltje terug, voor wie de Achteruitpet heeft. */
const ACHTERUIT_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L3 11 L9 17 M4 11 H15 A5 5 0 0 1 15 21 H12" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export class Spelersbalk {
  readonly el = maak('div', 'spelersbalk');
  private rondeGetal = maak('div', 'ronde-getal');
  private ronde = maak('div', 'ronde-teller vilt');
  private rondeIcoon!: HTMLImageElement;
  private itemsSleutel: string[] = [];
  /** Spelers bij wie een effect nog moet komen: hun munten en sterren blijven even staan (§11). */
  private vast = new Set<number>();
  /** De getallen die nu in beeld staan. */
  private getoond: { munten: number; sterren: number }[] = [];
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
      const vloek = maak('div', 'balk-vloek');
      rond.append(binnen, plaats, vloek);

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
      this.kaarten.push({ el, plaats, sterren, munten, items, vloek });
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
    const beurtFase = ['dobbelen', 'lopen', 'splitsing', 'sterKopen', 'winkel', 'nachtwinkel', 'ratje'].includes(s.fase.soort);
    const aanZet = beurtFase ? spelerAanZet(s) : -1;
    s.spelers.forEach((sp, i) => {
      const k = this.kaarten[i];
      zetPlaats(k.plaats, plek[i]);
      if (!this.vast.has(i)) {
        k.sterren.textContent = String(sp.sterren);
        k.munten.textContent = String(sp.munten);
        this.getoond[i] = { munten: sp.munten, sterren: sp.sterren };
      }
      k.el.classList.toggle('actief', i === aanZet);
      const vloek = `${sp.slak ? 's' : ''}${sp.achteruit ? 'a' : ''}`;
      if (k.vloek.dataset.v !== vloek) {
        k.vloek.dataset.v = vloek;
        k.vloek.innerHTML =
          (sp.slak ? `<span class="balk-vloek-slak" title="Slakkendobbel">${SLAK_SVG(22)}</span>` : '') +
          (sp.achteruit ? `<span class="balk-vloek-pet" title="Achteruitpet">${ACHTERUIT_SVG}</span>` : '');
      }
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

  /** De munten en sterren die nu in de balk staan. */
  getoondVoor(i: number): { munten: number; sterren: number } {
    return this.getoond[i] ?? { munten: 0, sterren: 0 };
  }

  /** Houd de getallen van deze spelers vast tot hun effect komt. */
  houdVast(spelers: number[]): void {
    for (const i of spelers) this.vast.add(i);
  }

  /** Laat de getallen weer gewoon meelopen met de spelstand. */
  laatLos(s: GameState, spelers: number[] = [...this.vast]): void {
    for (const i of spelers) this.vast.delete(i);
    this.werkBij(s);
  }

  /** De munten tellen zichtbaar op of af (tik, tik, tik) en het vakje wiebelt. `tik` speelt een tikje. */
  telMunten(i: number, naar: number, duurMs: number, tik?: (erbij: boolean) => void): void {
    const k = this.kaarten[i];
    const van = this.getoond[i]?.munten ?? naar;
    this.getoond[i] = { ...(this.getoond[i] ?? { sterren: 0 }), munten: naar };
    this.wiebel(i, naar >= van);
    const stappen = Math.min(Math.abs(naar - van), 12);
    if (stappen === 0) return void (k.munten.textContent = String(naar));
    for (let n = 1; n <= stappen; n++) {
      setTimeout(() => {
        k.munten.textContent = String(Math.round(van + ((naar - van) * n) / stappen));
        tik?.(naar > van);
      }, (duurMs * n) / stappen);
    }
  }

  /** Het aantal sterren springt met een stuiter naar het nieuwe getal. */
  stuiterSter(i: number, naar: number): void {
    const k = this.kaarten[i];
    this.getoond[i] = { ...(this.getoond[i] ?? { munten: 0 }), sterren: naar };
    k.sterren.textContent = String(naar);
    k.sterren.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.9) translateY(-4px)', offset: 0.35 }, { transform: 'scale(.9)', offset: 0.7 }, { transform: 'scale(1)' }],
      { duration: 600, easing: 'ease-out' },
    );
    this.wiebel(i, true);
  }

  /** Het vakje van een speler in de balk wiebelt even (groen bij winst, rood bij verlies). */
  wiebel(i: number, winst: boolean): void {
    const el = this.kaarten[i].el;
    el.classList.remove('winst', 'verlies');
    void el.offsetWidth;
    el.classList.add(winst ? 'winst' : 'verlies');
    el.animate(
      [{ transform: 'rotate(0)' }, { transform: 'rotate(-2.5deg)', offset: 0.25 }, { transform: 'rotate(2.5deg)', offset: 0.5 }, { transform: 'rotate(-1deg)', offset: 0.75 }, { transform: 'rotate(0)' }],
      { duration: 450, easing: 'ease-in-out' },
    );
    setTimeout(() => el.classList.remove('winst', 'verlies'), 700);
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
