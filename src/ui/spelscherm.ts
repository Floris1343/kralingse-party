/**
 * Het bordscherm: een volledige speelronde. Mensen dobbelen op het dobbelscherm, lopen en kiezen
 * bij splitsingen en sterren. Bots spelen hun beurt in ≤ 2 seconden (of direct met turbo).
 * Daarna de minigame-uitslag, het eindspel en de einduitslag.
 */
import { BORD } from '../data/bord';
import { figuur } from '../data/figuren';
import { zeg } from '../data/teksten';
import {
  BOOT_PRIJS, botActie, bewaar, dobbelen, draaiEindspelRad, gebruikItem, nachtTypen, ratjeKeuze, spelerAanZet,
  splitsingKeuze, stap, sterKeuze, sterPrijs, verwerkMinigame, wachtOpBot, winkelKeuze,
  type EindspelRegel, type GameState, type Gebeurtenis, type Splitsing,
} from '../logic';
import { BordWeergave } from '../render/bordWeergave';
import { asset } from './asset';
import { toonDobbelscherm } from './dobbelscherm';
import { toonKans, toonRad, toonZeilwedstrijd } from './gebeurtenissen';
import { icoon } from './iconen';
import { vraagMinigameUitslag } from './minigameUitslag';
import { maak } from './onderdelen';
import { Spelersbalk } from './spelersbalk';
import { meldingDelen } from './uitkomsten';
import { vraagRatje, vraagWinkel } from './winkelScherm';

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const TURBO_SLEUTEL = 'kralingse-plas-party/turbo';

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
  let turbo = localStorage.getItem(TURBO_SLEUTEL) === 'aan';

  const scherm = maak('main', 'spelscherm');
  const weergave = new BordWeergave(
    BORD,
    s.spelers.map((sp) => ({ naam: sp.naam, figuur: figuur(sp.figuur) })),
    { nacht: true },
  );
  const hud = maak('div', 'hud');
  const laag = maak('div', 'overlay-laag');
  const balk = new Spelersbalk(s, {
    turbo: () => {
      turbo = !turbo;
      localStorage.setItem(TURBO_SLEUTEL, turbo ? 'aan' : 'uit');
      balk.zetTurbo(turbo);
    },
    menu: stop,
  });
  balk.zetTurbo(turbo);
  hud.append(balk.el);
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
    balk.werkBij(s);
    weergave.zetSterren(s.sterren.map((st) => st.plek));
    weergave.zetNacht(s.nacht, nachtTypen(s.nacht, BORD));
  }

  // ------------------------------------------------------------------ hulpjes voor schermpjes
  function paneel(html: string, klasse = ''): HTMLDivElement {
    const el = maak('div', `overlay ${klasse}`);
    el.innerHTML = `<div class="overlay-paneel vilt paneel">${html}</div>`;
    laag.replaceChildren(el);
    return el;
  }
  const sluitPaneel = () => laag.replaceChildren();
  const klik = (el: Element, selector: string) =>
    new Promise<void>((r) => el.querySelector(selector)!.addEventListener('click', () => r(), { once: true }));
  const kies = (el: Element) =>
    Promise.race([klik(el, '[data-ja]').then(() => true), klik(el, '[data-nee]').then(() => false)]);

  /** Pommie met een tekstballon; tik om weg te halen. */
  function pommie(tekst: string): Promise<void> {
    const el = maak('div', 'pommie-moment');
    el.innerHTML = `
      <img class="pommie-plaatje" src="${asset('personages/pommie.svg')}" alt="Pommie">
      <div class="ballon ballon-links"><div class="ballon-naam">Pommie</div><p></p></div>`;
    el.querySelector('p')!.textContent = tekst;
    laag.append(el);
    return new Promise((r) => {
      const weg = () => {
        clearTimeout(t);
        el.remove();
        r();
      };
      const t = setTimeout(weg, 4000);
      el.addEventListener('click', weg, { once: true });
    });
  }

  /** Korte melding bovenin (niet blokkerend), zoals "Bot 2 gooide 7 · +3 munten · kocht een ster!". */
  function melding(spelerIdx: number) {
    const f = figuur(s.spelers[spelerIdx].figuur);
    hud.querySelector('.bot-melding')?.remove();
    const el = maak('div', 'bot-melding');
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="bot-melding-figuur" style="background:${f.kleurLicht}"><img src="${asset(f.bestand)}" alt=""></div>`;
    meldingDelen(s, spelerIdx).forEach((deel, i) => {
      if (i > 0) el.append(maak('span', 'bot-melding-punt'));
      const span = maak('span', 'bot-melding-deel');
      span.innerHTML = deel.icoon ? `<img src="${asset(deel.icoon)}" alt="" width="22" height="22">` : '';
      span.append(deel.tekst);
      el.append(span);
    });
    // Ongeveer 1,5 s; een langere melding blijft iets langer staan.
    const duur = el.querySelectorAll('.bot-melding-deel').length > 3 ? 2200 : 1500;
    const balkje = maak('div', 'bot-melding-balk');
    balkje.style.animationDuration = `${duur}ms`;
    el.append(balkje);
    hud.append(el);
    setTimeout(() => el.remove(), duur);
  }

  const posities = () => s.spelers.map((sp) => sp.vakje);

  /**
   * Waar de figuren stonden vóór ze verplaatst werden (windvlaag, hertje, bok). Zo landt het
   * figuur eerst op het vakje van de worp, en zie je daarna pas het waaien of wegrennen.
   */
  const landingsPosities = () => {
    const p = posities();
    for (const g of [...s.verslag].reverse()) if (g.soort === 'verplaatst' && g.reden !== 'wisseltruc') p[g.speler] = g.van;
    return p;
  };

  function toonTeller(speler: number, getal: number) {
    const el = maak('div', 'stap-teller', String(getal));
    weergave.boven(speler, getal > 0 ? el : null);
  }
  const resterend = () => ('resterend' in s.fase ? s.fase.resterend : 0);
  const beurtBezig = () => ['lopen', 'splitsing', 'sterKopen', 'winkel', 'ratje'].includes(s.fase.soort);

  // ------------------------------------------------------------------ een beurt
  async function loopBeurt(speler: number) {
    snel = false;
    while (actief && s.spelers[speler].isBot === false && beurtBezig()) {
      const f = s.fase;
      if (f.soort === 'sterKopen' || f.soort === 'winkel' || f.soort === 'ratje') {
        weergave.boven(speler, null);
        if (f.soort === 'sterKopen') zet(sterKeuze(s, BORD, await vraagSter()));
        else if (f.soort === 'winkel') zet(winkelKeuze(s, BORD, await vraagWinkel(laag, s, speler)));
        else zet(ratjeKeuze(s, BORD, await vraagRatje(laag, s, speler)));
        snel = false;
        toonTeller(speler, resterend());
        continue;
      }
      if (f.soort === 'splitsing') {
        const splitsing = BORD.splitsingen.find((x) => x.vakje === f.vakje)!;
        zet(splitsingKeuze(s, BORD, await vraagSplitsing(splitsing)));
        snel = false;
      } else {
        zet(stap(s, BORD));
      }
      if (s.fase.soort === 'splitsing') continue; // geen stap gezet: eerst kiezen
      await toonStap(speler, snel ? 60 : 150);
    }
    weergave.boven(speler, null);
  }

  async function toonStap(speler: number, tempo: number) {
    weergave.plaatsFiguren(landingsPosities(), speler, tempo);
    toonTeller(speler, resterend());
    weergave.volgSpeler(speler, 350);
    await wacht(tempo);
  }

  /**
   * Wat er na het lopen gebeurde: het rad, de kans-rollen, de zeilwedstrijd, daarna de figuren
   * naar hun nieuwe plek en Pommie als het dag of nacht wordt.
   * Een mens ziet alles; bij een bot alleen de zeilwedstrijd (kort) en de wissel van dag en nacht.
   */
  async function toonGevolgen(speler: number, verslag: Gebeurtenis[], mens: boolean) {
    for (const g of verslag) {
      if (!actief) return;
      if (mens && g.soort === 'rad') await toonRad(laag, s, g);
      else if (mens && g.soort === 'kans') await toonKans(laag, s, g);
      else if (g.soort === 'zeilwedstrijd' && (mens || !turbo)) await toonZeilwedstrijd(laag, s, g, mens ? undefined : 1500);
    }
    if (verslag.some((g) => g.soort === 'verplaatst' && g.reden !== 'wisseltruc')) {
      weergave.plaatsFiguren(posities(), speler, mens ? 400 : 150);
      if (mens) weergave.volgSpeler(speler, 400);
      await wacht(mens ? 450 : 150);
    }
    const wissel = [...verslag].reverse().find((g) => g.soort === 'dagNacht');
    if (wissel && wissel.soort === 'dagNacht') await pommie(zeg(wissel.nacht ? 'nacht' : 'dag'));
  }

  /** Een botbeurt: alles direct, ongeveer 80 ms per vakje. Met turbo zonder animatie. */
  async function botBeurt(speler: number) {
    const beurt = s.aanZet;
    const bezig = () => actief && s.aanZet === beurt && s.fase.soort !== 'minigame' && wachtOpBot(s);
    const naBeurt = async () => {
      weergave.boven(speler, null);
      const verslag = s.verslag;
      if (!turbo) weergave.plaatsFiguren(landingsPosities(), -1, 80);
      melding(speler);
      await toonGevolgen(speler, verslag, false);
      weergave.plaatsFiguren(posities(), -1, turbo ? 0 : 80);
    };
    if (turbo) {
      while (bezig()) zet(botActie(s, BORD)!);
      return naBeurt();
    }
    weergave.volgSpeler(speler, 300);
    await wacht(300);
    // Eventueel een item, dan dobbelen.
    while (bezig() && s.fase.soort === 'dobbelen') {
      zet(botActie(s, BORD)!);
      if (s.verslag.some((g) => g.soort === 'verplaatst' && g.reden === 'wisseltruc')) {
        weergave.plaatsFiguren(posities(), speler, 300);
        weergave.volgSpeler(speler, 300);
        await wacht(300);
      }
    }
    toonTeller(speler, resterend());
    await wacht(250);
    while (bezig()) {
      zet(botActie(s, BORD)!);
      if (turbo) continue; // turbo tijdens de beurt aangezet: rest direct
      await toonStap(speler, 80);
    }
    await naBeurt();
    if (!turbo) await wacht(250);
  }

  /** Het dobbelscherm voor een mens, met items. Na de Ratjebel komt eerst Ratje, daarna weer het dobbelscherm. */
  async function mensDobbelt(speler: number) {
    for (;;) {
      const einde = await toonDobbelscherm(laag, speler, {
        state: () => s,
        gebruik: (item) => {
          zet(gebruikItem(s, item));
          if (item === 'wisseltruc') {
            weergave.plaatsFiguren(posities(), speler, 400);
            weergave.volgSpeler(speler, 400);
          }
        },
        gooi: (gekozen) => {
          zet(dobbelen(s, gekozen));
          const w = s.verslag.find((g) => g.soort === 'worp');
          return w && w.soort === 'worp' ? w.worpen : [];
        },
      });
      if (einde === 'gegooid' || !actief) return;
      zet(ratjeKeuze(s, BORD, await vraagRatje(laag, s, speler)));
    }
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
    const antwoord = await kies(el);
    sluitPaneel();
    return antwoord;
  }

  /** Keuze bij een splitsing (design: bord-boot-keuze.html). true = zijpad. */
  async function vraagSplitsing(splitsing: Splitsing): Promise<boolean> {
    const speler = spelerAanZet(s);
    const boot = splitsing.soort === 'boot';
    const tekst = boot
      ? { icoon: 'iconen/vakje-boot.svg', kop: 'Boot nemen?', uitleg: 'Vaar in één keer naar het restaurant.', ja: 'Ja, varen!', nee: 'Nee, lopen' }
      : s.nacht
        ? { icoon: 'iconen/vakje-hert.svg', kop: 'Door het hertenkamp?', uitleg: "Pas op! 's Nachts is de bok wild.", ja: 'Ja, ik durf!', nee: 'Nee, hoofdpad' }
        : { icoon: 'iconen/vakje-hert.svg', kop: 'Door het hertenkamp?', uitleg: 'Een vakje langer, langs de herten.', ja: 'Ja, herten!', nee: 'Nee, hoofdpad' };
    const el = maak('div', 'overlay splitsing-overlay');
    el.innerHTML = `
      <div class="splitsing-paneel vilt paneel" role="dialog">
        <div class="splitsing-kop"><img src="${asset(tekst.icoon)}" alt="" width="64" height="64">
          <div><span class="splitsing-titel">${tekst.kop}</span><span class="splitsing-uitleg">${tekst.uitleg}</span></div></div>
        ${boot ? `<div class="splitsing-kosten"><span>Kosten</span><div><img src="${asset('iconen/munt.svg')}" alt="" width="26" height="26"><b>${BOOT_PRIJS}</b><small>van je ${s.spelers[speler].munten}</small></div></div>` : ''}
        <div class="splitsing-knoppen">
          <button type="button" class="knop knop-blauw" data-ja>${tekst.ja}</button>
          <button type="button" class="knop knop-wit" data-nee>${tekst.nee}</button>
        </div>
      </div>`;
    laag.replaceChildren(el);
    const antwoord = await kies(el);
    sluitPaneel();
    return antwoord;
  }

  // ------------------------------------------------------------------ minigame, eindspel, einde
  async function minigame() {
    weergave.overzicht();
    await wacht(300);
    const uitslag = await vraagMinigameUitslag(laag, s);
    zet(verwerkMinigame(s, uitslag));
    const wissel = s.verslag.find((g) => g.soort === 'dagNacht');
    if (wissel?.soort === 'dagNacht' && actief) {
      await wacht(700); // eerst de overgang zien
      await pommie(zeg(wissel.nacht ? 'nacht' : 'dag'));
    }
  }

  async function eindspelRad() {
    if (s.fase.soort !== 'eindspelRad') return;
    const laatste = s.fase.speler;
    weergave.overzicht();
    await pommie(zeg('eindspel'));
    const el = paneel(`
      <h2>Het eindspel!</h2>
      <p></p>
      <div class="overlay-knoppen"><button class="knop" data-draai>Draai!</button></div>`);
    el.querySelector('p')!.textContent = zeg('eindspelRad', s.spelers[laatste].naam);
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
      if (s.spelers[speler].isBot) {
        await botBeurt(speler);
        continue;
      }
      weergave.plaatsFiguren(posities(), speler, 0);
      if (soort === 'dobbelen') {
        weergave.volgSpeler(speler, 400);
        await wacht(400);
        if (!actief) return;
        await mensDobbelt(speler);
        toonTeller(speler, resterend());
        await wacht(250);
      } else {
        // Verder spelen midden in een beurt.
        weergave.volgSpeler(speler, 0);
        toonTeller(speler, resterend());
      }
      await loopBeurt(speler);
      if (actief) await toonGevolgen(speler, s.verslag, true);
      if (actief) await wacht(500);
    }
  }

  // ------------------------------------------------------------------ start
  weergave.zetSterren(s.sterren.map((st) => st.plek));
  weergave.zetNacht(s.nacht, nachtTypen(s.nacht, BORD), 0);
  weergave.plaatsFiguren(posities(), s.fase.soort === 'minigame' ? -1 : spelerAanZet(s), 0);
  weergave.overzicht(0);
  const nieuwSpel = s.ronde === 1 && s.aanZet === 0 && s.fase.soort === 'dobbelen' && s.verslag.length === 0;
  (async () => {
    if (nieuwSpel) await pommie(zeg('welkom'));
    else await wacht(300);
    await speel();
  })();
}
