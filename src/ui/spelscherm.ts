/**
 * Het bordscherm met een eenvoudige speelronde: dobbelen, lopen, ster kopen, bots, minigame (tijdelijk)
 * en het eindspel. De spelersbalk, turboknop en het echte minigame-scherm komen in de volgende stap.
 */
import { BORD } from '../data/bord';
import { figuur } from '../data/figuren';
import { zeg } from '../data/teksten';
import {
  bewaar, dobbelen, draaiEindspelRad, spelerAanZet, stap, sterKeuze, sterPrijs, verwerkMinigame,
  type EindspelRegel, type GameState,
} from '../logic';
import { BordWeergave } from '../render/bordWeergave';
import { asset } from './asset';
import { icoon } from './iconen';

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const REGEL_TEKST: Record<EindspelRegel, string> = {
  munten20: '+20 munten voor de laatste!',
  extraSter: 'Er komt een extra ster bij: nu staan er twee op het bord!',
  goedkopeSter: 'Een ster kost vanaf nu maar 10 munten!',
  eeuwigeNacht: 'Eeuwige nacht: het blijft nacht tot het einde!',
  ratjeGratis: 'Ratje werkt vanaf nu helemaal gratis!',
};

export function toonSpelscherm(root: HTMLElement, start: GameState, opties: { naarMenu: () => void }): void {
  let s = start;
  let actief = true;
  let snel = false;

  const scherm = document.createElement('main');
  scherm.className = 'spelscherm';
  const weergave = new BordWeergave(
    BORD,
    s.spelers.map((sp) => ({ naam: sp.naam, figuur: figuur(sp.figuur) })),
  );
  const hud = document.createElement('div');
  hud.className = 'hud';
  const laag = document.createElement('div');
  laag.className = 'overlay-laag';
  scherm.append(weergave.el, hud, laag);
  root.replaceChildren(scherm);

  // Tik op het scherm tijdens het lopen = sneller lopen.
  weergave.el.addEventListener('pointerdown', () => (snel = true));
  const bijResize = () => weergave.meet();
  window.addEventListener('resize', bijResize);

  function stop() {
    actief = false;
    window.removeEventListener('resize', bijResize);
    opties.naarMenu();
  }

  function zet(nieuw: GameState) {
    s = nieuw;
    bewaar(localStorage, s);
    tekenHud();
    weergave.zetSterren(s.sterren.map((st) => st.plek));
  }

  // ------------------------------------------------------------------ HUD
  function tekenHud() {
    hud.innerHTML = `
      <div class="ronde-teller vilt">
        <div class="ronde-kop"><img src="${asset('iconen/zon.svg')}" alt="" width="26" height="26"><span>RONDE</span></div>
        <div class="ronde-getal">${s.ronde}<span>/${s.instellingen.aantalRondes}</span></div>
      </div>
      <button class="iconknop hud-menu" aria-label="Menu">${icoon.menu()}</button>`;
    hud.querySelector('.hud-menu')!.addEventListener('click', stop);
  }

  // ------------------------------------------------------------------ hulpjes voor schermpjes
  function paneel(html: string): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'overlay';
    el.innerHTML = `<div class="overlay-paneel vilt paneel">${html}</div>`;
    laag.replaceChildren(el);
    return el;
  }
  const sluitPaneel = () => laag.replaceChildren();
  const klik = (el: Element, selector: string) =>
    new Promise<void>((r) => el.querySelector(selector)!.addEventListener('click', () => r(), { once: true }));

  /** Pommie met een tekstballon; tik om weg te halen. */
  function pommie(tekst: string): Promise<void> {
    const el = document.createElement('div');
    el.className = 'pommie-moment';
    el.innerHTML = `
      <img class="pommie-plaatje" src="${asset('personages/pommie.svg')}" alt="Pommie">
      <div class="ballon"><div class="ballon-naam">Pommie</div><p></p></div>`;
    el.querySelector('p')!.textContent = tekst;
    laag.append(el);
    return new Promise((r) => {
      const weg = () => {
        el.remove();
        r();
      };
      el.addEventListener('click', weg, { once: true });
      setTimeout(weg, 4000);
    });
  }

  /** Korte melding bovenin (niet blokkerend), zoals "Bot 2 gooide 7 · +3 munten". */
  function melding(spelerIdx: number, delen: string[]) {
    const sp = s.spelers[spelerIdx];
    const f = figuur(sp.figuur);
    const el = document.createElement('div');
    el.className = 'bot-melding';
    el.innerHTML = `<div class="bot-melding-figuur" style="background:${f.kleurLicht}"><img src="${asset(f.bestand)}" alt=""></div><span></span><div class="bot-melding-balk"></div>`;
    el.querySelector('span')!.textContent = delen.join(' · ');
    hud.append(el);
    setTimeout(() => el.remove(), 2500);
  }

  function verslagTekst(spelerIdx: number): string[] {
    const delen: string[] = [];
    let munten = 0;
    let ster = false;
    for (const g of s.verslag) {
      if (g.soort === 'worp') delen.push(`${s.spelers[g.speler].naam} gooide ${g.waarde}`);
      if (g.soort === 'munten' && g.speler === spelerIdx && g.reden !== 'ster') munten += g.verschil;
      if (g.soort === 'sterGekocht') ster = true;
    }
    if (munten) delen.push(`${munten > 0 ? '+' : '−'}${Math.abs(munten)} munten`);
    if (ster) delen.push('kocht een ster!');
    return delen;
  }

  const posities = () => s.spelers.map((sp) => sp.vakje);
  /** De fase van nu (los opgevraagd, omdat elke actie de state vervangt). */
  const fase = (): GameState['fase'] => s.fase;

  // ------------------------------------------------------------------ dobbelknop boven het figuur
  function wachtOpGooi(speler: number): Promise<void> {
    const el = document.createElement('div');
    el.className = 'gooi';
    el.innerHTML = `
      <button type="button" class="gooi-knop" aria-label="Gooi de dobbelsteen">
        <img src="${asset('iconen/dobbelsteen.svg')}" alt="" width="70" height="70"><span>Gooi!</span>
      </button>
      <div class="pil-donker gooi-hint">Tik om te gooien</div>
      <div class="gooi-pijl"></div>`;
    weergave.boven(speler, el);
    return new Promise((r) =>
      el.querySelector('button')!.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          r();
        },
        { once: true },
      ),
    );
  }

  function toonTeller(speler: number, getal: number) {
    const el = document.createElement('div');
    el.className = 'stap-teller';
    el.textContent = String(getal);
    weergave.boven(speler, getal > 0 ? el : null);
  }

  // ------------------------------------------------------------------ een beurt
  async function loopBeurt(speler: number) {
    const bot = s.spelers[speler].isBot;
    snel = false;
    while (actief && (s.fase.soort === 'lopen' || s.fase.soort === 'sterKopen')) {
      if (s.fase.soort === 'sterKopen') {
        weergave.boven(speler, null);
        const kopen = bot ? true : await vraagSter();
        zet(sterKeuze(s, BORD, kopen));
        continue;
      }
      const tempo = bot ? 80 : snel ? 60 : 150;
      zet(stap(s, BORD));
      const na = fase();
      const rest = na.soort === 'lopen' || na.soort === 'sterKopen' ? na.resterend : 0;
      weergave.plaatsFiguren(posities(), speler, tempo);
      toonTeller(speler, rest);
      weergave.volgSpeler(speler, 350);
      await wacht(tempo);
    }
    weergave.boven(speler, null);
  }

  async function vraagSter(): Promise<boolean> {
    const prijs = sterPrijs(s);
    const el = paneel(`
      <img class="overlay-icoon" src="${asset('iconen/ster.svg')}" alt="">
      <h2>Een ster!</h2>
      <p>Wil je een ster kopen voor ${prijs} munten?</p>
      <div class="overlay-knoppen">
        <button class="knop" data-ja><img src="${asset('iconen/munt.svg')}" alt="" width="28" height="28">Koop · ${prijs}</button>
        <button class="knop knop-wit" data-nee>Nee, lopen</button>
      </div>`);
    const antwoord = await Promise.race([klik(el, '[data-ja]').then(() => true), klik(el, '[data-nee]').then(() => false)]);
    sluitPaneel();
    return antwoord;
  }

  // ------------------------------------------------------------------ minigame (tijdelijk), eindspel, einde
  async function minigame() {
    weergave.overzicht();
    await wacht(400);
    const figuren = s.spelers
      .map((sp) => {
        const f = figuur(sp.figuur);
        return `<div class="mini-speler"><div class="mini-figuur" style="background:${f.kleurLicht};border-color:${f.kleur}"><img src="${asset(f.bestand)}" alt=""></div><span></span></div>`;
      })
      .join('');
    const el = paneel(`
      <h2>Minigame!</h2>
      <p>${zeg('minigame')} Kies op de Switch een minigame voor 4 spelers.</p>
      <div class="mini-spelers">${figuren}</div>
      <p class="overlay-klein">Het invullen van de uitslag komt in de volgende stap. Voor nu krijgt iedereen 10 munten.</p>
      <div class="overlay-knoppen"><button class="knop knop-groen" data-verder>${icoon.vinkje()}Verder</button></div>`);
    el.querySelectorAll('.mini-speler span').forEach((sp, i) => (sp.textContent = s.spelers[i].naam));
    await klik(el, '[data-verder]');
    sluitPaneel();
    zet(verwerkMinigame(s, [s.spelers.map((_, i) => i)]));
  }

  async function eindspelRad() {
    if (s.fase.soort !== 'eindspelRad') return;
    const laatste = s.fase.speler;
    weergave.overzicht();
    await pommie(zeg('eindspel'));
    const naam = s.spelers[laatste].naam;
    const el = paneel(`
      <h2>Het eindspel!</h2>
      <p></p>
      <div class="overlay-knoppen"><button class="knop" data-draai>Draai!</button></div>`);
    el.querySelector('p')!.textContent = zeg('eindspelRad', naam);
    if (s.spelers[laatste].isBot) await wacht(1200);
    else await klik(el, '[data-draai]');
    zet(draaiEindspelRad(s, BORD));
    const uitkomst = paneel(`
      <h2>Het rad zegt...</h2>
      <p>${REGEL_TEKST[s.eindspelRegel!]}</p>
      <div class="overlay-knoppen"><button class="knop knop-groen" data-verder>${icoon.vinkje()}Verder</button></div>`);
    await klik(uitkomst, '[data-verder]');
    sluitPaneel();
  }

  function einde() {
    weergave.overzicht();
    const t = s.eindtelling!;
    const rijen = t.ranglijst
      .map((i, k) => {
        const sp = s.spelers[i];
        return `<li><b>${k + 1}e</b> <span></span> <img src="${asset('iconen/ster.svg')}" alt="" width="22"> ${sp.sterren} <img src="${asset('iconen/munt.svg')}" alt="" width="20"> ${sp.munten}</li>`;
      })
      .join('');
    const el = paneel(`
      <h2></h2>
      <ol class="einde-lijst">${rijen}</ol>
      <div class="overlay-knoppen"><button class="knop" data-menu>Naar het hoofdmenu</button></div>`);
    el.querySelector('h2')!.textContent = zeg('winnaar', s.spelers[t.winnaar].naam);
    el.querySelectorAll('.einde-lijst span').forEach((sp, k) => (sp.textContent = s.spelers[t.ranglijst[k]].naam));
    el.querySelector('[data-menu]')!.addEventListener('click', stop, { once: true });
  }

  // ------------------------------------------------------------------ de spelronde
  async function speel() {
    while (actief) {
      const soort = s.fase.soort;
      if (soort === 'einde') return einde();
      if (soort === 'minigame') {
        await minigame();
        continue;
      }
      if (soort === 'eindspelRad') {
        await eindspelRad();
        continue;
      }
      const speler = spelerAanZet(s);
      const bot = s.spelers[speler].isBot;
      weergave.plaatsFiguren(posities(), speler, 0);
      if (soort === 'dobbelen') {
        weergave.volgSpeler(speler);
        if (bot) await wacht(350);
        else await wachtOpGooi(speler);
        if (!actief) return;
        zet(dobbelen(s));
        const gegooid = fase();
        if (gegooid.soort === 'lopen') toonTeller(speler, gegooid.worp);
        await wacht(bot ? 250 : 500);
      }
      await loopBeurt(speler);
      if (bot && actief) melding(speler, verslagTekst(speler));
      if (actief) await wacht(bot ? 300 : 600);
    }
  }

  // ------------------------------------------------------------------ start
  tekenHud();
  weergave.zetSterren(s.sterren.map((st) => st.plek));
  weergave.plaatsFiguren(posities(), s.fase.soort === 'minigame' ? -1 : spelerAanZet(s), 0);
  weergave.overzicht(0);
  const nieuwSpel = s.ronde === 1 && s.aanZet === 0 && s.fase.soort === 'dobbelen' && s.verslag.length === 0;
  (async () => {
    if (nieuwSpel) await pommie(zeg('welkom'));
    else await wacht(300);
    await speel();
  })();
}
