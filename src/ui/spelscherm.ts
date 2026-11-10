/**
 * Het bordscherm: een volledige speelronde. Mensen dobbelen op het dobbelscherm, lopen en kiezen
 * bij splitsingen en sterren. Bots spelen hun beurt in ≤ 2 seconden (of direct met turbo).
 * Daarna de minigame-uitslag, het eindspel en de einduitslag.
 */
import { BORD } from '../data/bord';
import { figuur } from '../data/figuren';
import { zeg } from '../data/teksten';
import {
  BOOT_PRIJS, botActie, bewaar, dobbelen, draaiEindspelRad, gebruikItem, nachtTypen, nachtwinkelKeuze, ratjeKeuze,
  spelerAanZet, splitsingKeuze, stap, sterKeuze, sterPrijs, verwerkMinigame, wachtOpBot, winkelKeuze, zichtbareSterren,
  EINDSPEL_REGELS, plaatsen, type EindspelRegel, type GameState, type Gebeurtenis, type Splitsing,
} from '../logic';
import { BordWeergave } from '../render/bordWeergave';
import { asset } from './asset';
import { toonDobbelscherm } from './dobbelscherm';
import { draaiRad, toonKans, toonRad, toonZeilwedstrijd } from './gebeurtenissen';
import { namenLijst, toonEindscherm } from './eindscherm';
import { vraagMinigameUitslag } from './minigameUitslag';
import { maak, plaatsRondje } from './onderdelen';
import { Spelersbalk } from './spelersbalk';
import { EINDSPEL_VAKKEN, meldingDelen } from './uitkomsten';
import { muntGeluid, sterGeluid } from '../audio/geluid';
import { pommieZegt } from './pommie';
import { vraagItemDoel, vraagNachtwinkel, vraagRatje, vraagWinkel } from './winkelScherm';

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const TURBO_SLEUTEL = 'kralingse-plas-party/turbo';

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
    speelGeluid(s, nieuw);
    s = nieuw;
    bewaar(localStorage, s);
    balk.werkBij(s);
    tekenBord();
  }

  /**
   * Geluidjes bij een nieuwe stand: een ster, of munten erbij of eraf. Met turbo hoor je de bots
   * niet (dat zou één brij worden); mensen en de minigame-uitslag hoor je altijd.
   */
  function speelGeluid(oud: GameState, nieuw: GameState) {
    const botBezig = nieuw.fase.soort !== 'minigame' && wachtOpBot(oud) && turbo;
    if (botBezig) return;
    const sterren = nieuw.spelers.reduce((n, sp) => n + sp.sterren, 0) - oud.spelers.reduce((n, sp) => n + sp.sterren, 0);
    if (nieuw.verslag.length !== oud.verslag.length && nieuw.verslag.some((g) => g.soort === 'sterGekocht') && sterren !== 0) {
      sterGeluid();
      return;
    }
    const verschil = nieuw.spelers.map((sp, i) => sp.munten - (oud.spelers[i]?.munten ?? sp.munten));
    if (verschil.some((d) => d > 0)) muntGeluid(true);
    else if (verschil.some((d) => d < 0)) muntGeluid(false);
  }

  /** Sterren (of vraagtekens in de mist), valstrikken, dag/nacht en mist op het bord. */
  function tekenBord(duurMs = 1000) {
    weergave.zetSterren(zichtbareSterren(s), s.mist !== null);
    weergave.zetValstrikken(s.valstrikken.map((v) => ({ vakje: v.vakje, kleur: figuur(s.spelers[v.speler].figuur).kleur })));
    weergave.zetNacht(s.nacht, nachtTypen(s.nacht, BORD), duurMs);
    weergave.zetMist(s.mist !== null, duurMs);
  }

  /**
   * Pommie bij de wissel van dag en nacht, de ochtendmist, het optrekken van de mist en een
   * vallende ster (§12). Hoogstens twee ballonnen achter elkaar, elk weg te tikken.
   */
  async function pommieMomenten(verslag: Gebeurtenis[]) {
    const wissel = [...verslag].reverse().find((g) => g.soort === 'dagNacht');
    const mistAan = verslag.some((g) => g.soort === 'mist' && g.aan);
    const mistWeg = verslag.some((g) => g.soort === 'mist' && !g.aan);
    if (wissel?.soort === 'dagNacht') await pommie(zeg(wissel.nacht ? 'nacht' : mistAan ? 'mist' : 'dag'));
    else if (mistAan) await pommie(zeg('mist'));
    else if (mistWeg) await pommie(zeg('mistWeg'));
    if (actief && verslag.some((g) => g.soort === 'vallendeSter')) await pommie(zeg('vallendeSter'));
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

  /** Pommie met een tekstballon en gebrabbel; tik om weg te halen. */
  const pommie = (tekst: string) => pommieZegt(laag, tekst);

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
  const beurtBezig = () => ['lopen', 'splitsing', 'sterKopen', 'winkel', 'nachtwinkel', 'ratje'].includes(s.fase.soort);

  // ------------------------------------------------------------------ een beurt
  async function loopBeurt(speler: number) {
    snel = false;
    while (actief && s.spelers[speler].isBot === false && beurtBezig()) {
      const f = s.fase;
      if (f.soort === 'sterKopen' || f.soort === 'winkel' || f.soort === 'nachtwinkel' || f.soort === 'ratje') {
        weergave.boven(speler, null);
        if (f.soort === 'sterKopen') zet(sterKeuze(s, BORD, await vraagSter()));
        else if (f.soort === 'winkel') zet(winkelKeuze(s, BORD, await vraagWinkel(laag, s, speler)));
        else if (f.soort === 'nachtwinkel') zet(nachtwinkelKeuze(s, BORD, await vraagNachtwinkel(laag, s, speler)));
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
    // Een mens die in een valstrik trapt, ziet dat in de korte melding.
    if (mens && verslag.some((g) => g.soort === 'valstrik')) melding(speler);
    await pommieMomenten(verslag);
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
        kiesDoel: (item) => vraagItemDoel(laag, s, speler, item),
        gebruik: (item, doel) => {
          zet(gebruikItem(s, item, doel));
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
  /** Is het spel in deze sessie afgelopen? Dan komt de ceremonie; bij "Verder spelen" later niet. */
  let zojuistAfgelopen = false;

  async function minigame() {
    weergave.overzicht();
    await wacht(300);
    const uitslag = await vraagMinigameUitslag(laag, s);
    zet(verwerkMinigame(s, uitslag, BORD));
    if (s.fase.soort === 'einde') {
      zojuistAfgelopen = true;
      return;
    }
    const iets = s.verslag.some((g) => ['dagNacht', 'mist', 'vallendeSter'].includes(g.soort));
    if (iets && actief) {
      await wacht(700); // eerst de overgang zien
      await pommieMomenten(s.verslag);
    }
  }

  /**
   * Begin van het eindspel (§9): Pommie maakt de tussenstand bekend, daarna draait de speler op de
   * laatste plaats aan het rad. Een mens tikt op "Draai!", bij een bot draait het vanzelf.
   */
  async function eindspelRad() {
    if (s.fase.soort !== 'eindspelRad') return;
    const laatste = s.fase.speler;
    const naam = s.spelers[laatste].naam;
    weergave.overzicht();
    await pommie(zeg('eindspel'));
    if (!actief) return;
    await tussenstand();
    if (!actief) return;
    await pommie(zeg('eindspelRad', naam));
    let regel: EindspelRegel = 'munten20';
    await draaiRad(laag, {
      klasse: 'rad-eindspel',
      titel: 'Het eindspel!',
      uitleg: `${naam} draait aan het rad`,
      vakken: EINDSPEL_REGELS.map((r) => EINDSPEL_VAKKEN[r]),
      draai: s.spelers[laatste].isBot ? 'vanzelf' : 'knop',
      uitkomst: () => {
        zet(draaiEindspelRad(s, BORD));
        regel = s.eindspelRegel!;
        return EINDSPEL_REGELS.indexOf(regel);
      },
    });
    if (actief) await pommie(zeg(`regel_${regel}`, naam));
  }

  /** De tussenstand: een paneel met de ranglijst, terwijl Pommie de koploper noemt. */
  async function tussenstand() {
    const p = plaatsen(s);
    const volgorde = s.spelers.map((_, i) => i).sort((a, b) => p[a] - p[b]);
    const el = maak('div', 'tussenstand');
    const paneel = maak('div', 'tussenstand-paneel vilt paneel');
    paneel.append(maak('h2', '', 'Tussenstand'));
    for (const i of volgorde) {
      const sp = s.spelers[i];
      const rij = maak('div', 'tussenstand-rij');
      rij.append(plaatsRondje(p[i]), maak('b', '', sp.naam));
      rij.insertAdjacentHTML('beforeend', `<span><img src="${asset('iconen/ster.svg')}" alt="" width="24" height="24">${sp.sterren}</span><span><img src="${asset('iconen/munt.svg')}" alt="" width="22" height="22">${sp.munten}</span>`);
      paneel.append(rij);
    }
    el.append(paneel);
    laag.append(el);
    const koplopers = volgorde.filter((i) => p[i] === 1);
    const sterren = s.spelers[koplopers[0]].sterren;
    const tekst = koplopers.length > 1
      ? zeg('tussenstandGelijk', namenLijst(koplopers.map((i) => s.spelers[i].naam)))
      : zeg('tussenstand', { naam: s.spelers[koplopers[0]].naam, sterren: `${sterren} ${sterren === 1 ? 'ster' : 'sterren'}` });
    await pommie(tekst);
    el.remove();
  }

  /** Het eindscherm. Is het spel net afgelopen, dan eerst de bonussterren-ceremonie. */
  function einde(ceremonie: boolean) {
    weergave.overzicht();
    sluitPaneel();
    toonEindscherm(scherm, s, { ceremonie, naarMenu: stop });
  }

  // ------------------------------------------------------------------ de spelronde
  async function speel() {
    while (actief) {
      const soort = s.fase.soort;
      if (soort === 'einde') return einde(zojuistAfgelopen);
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
  tekenBord(0);
  weergave.plaatsFiguren(posities(), s.fase.soort === 'minigame' ? -1 : spelerAanZet(s), 0);
  weergave.overzicht(0);
  const nieuwSpel = s.ronde === 1 && s.aanZet === 0 && s.fase.soort === 'dobbelen' && s.verslag.length === 0;
  (async () => {
    if (nieuwSpel) await pommie(zeg('welkom'));
    else await wacht(300);
    await speel();
  })();
}
