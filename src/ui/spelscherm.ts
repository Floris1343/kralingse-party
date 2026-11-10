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
  EINDSPEL_REGELS, plaatsen, huidigType, vakje, annuleerItem, gooiStartworp, heeftDoel, startSpel, startwerper, stappenTotSter, type EindspelRegel, type GameState, type Gebeurtenis, type Splitsing,
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
import { EffectSpeler } from './effecten';
import { nieuwInVerslag } from './effectPlan';
import { TEMPO } from './tempo';
import { vakjeKleur } from '../render/vakjes';
import { pommieZegt } from './pommie';
import { toonBotRatje, vraagItem, vraagItemDoel, vraagNachtwinkel, vraagRatje, vraagWinkel } from './winkelScherm';
import { toonAankondiging, toonBordBekijken, vraagMenuKeuze } from './beurtMenu';
import { toonStartvolgorde } from './startvolgorde';

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const TURBO_SLEUTEL = 'kralingse-plas-party/turbo';

export function toonSpelscherm(root: HTMLElement, start: GameState, opties: { naarMenu: () => void }): void {
  let s = start;
  let actief = true;
  let snel = false;
  let turbo = localStorage.getItem(TURBO_SLEUTEL) === 'aan';
  /** Wacht het spel op een tik na een botbeurt? Dan gaat deze functie door. */
  let wachtOpTik: (() => void) | null = null;

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
      // Turbo aan terwijl we op een tik wachten: dan meteen door.
      if (turbo) wachtOpTik?.();
    },
    menu: stop,
  });
  balk.zetTurbo(turbo);
  hud.append(balk.el);

  /** De effecten na een actie: "+3" boven het hoofd, tellende munten, het sterfeest (§11). */
  const effecten = new EffectSpeler({
    weergave,
    balk,
    laag,
    state: () => s,
    overslaan: (bot) => bot && turbo,
    naSter: async (speler) => {
      // De camera uit, de ster verhuist met een "poef", en de camera weer terug.
      weergave.overzicht(TEMPO.naSterUit - 20);
      await wacht(TEMPO.naSterUit);
      tekenBord(1000, true);
      await wacht(TEMPO.naSterPoef);
      weergave.volgSpeler(speler, TEMPO.naSterTerug);
      await wacht(TEMPO.naSterTerug);
    },
  });
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
    effecten.plan(s, nieuw, wachtOpBot(s));
    s = nieuw;
    bewaar(localStorage, s);
    balk.werkBij(s);
    tekenBord();
  }

  /** Sterren (of vraagtekens in de mist), valstrikken, dag/nacht en mist op het bord. */
  function tekenBord(duurMs = 1000, poef = false) {
    // Tijdens het sterfeest blijft de ster nog even op zijn oude plek.
    if (!effecten.sterrenVast) weergave.zetSterren(zichtbareSterren(s), s.mist !== null, poef);
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

  /**
   * De melding bovenin, zoals "Bot 2 gooide 7 · +3 munten · kocht een ster!" (§11). Met
   * `volgende` blijft hij staan tot iemand tikt, met de hint "Tik om verder te gaan · Volgende: …";
   * zonder `volgende` verdwijnt hij na ongeveer 1,5 seconde.
   */
  function melding(spelerIdx: number, volgende?: string): Promise<void> {
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
    if (volgende !== undefined) {
      const hint = maak('div', 'bot-melding-hint');
      hint.innerHTML = `<span class="bot-melding-tik"></span><span></span>`;
      hint.lastElementChild!.textContent = `Tik om verder te gaan · Volgende: ${volgende}`;
      el.classList.add('wacht');
      el.append(hint);
      hud.append(el);
      // Een tik waar dan ook gaat door. De vanger ligt onder de spelersbalk, zodat de turboknop werkt.
      const vanger = maak('div', 'tik-vanger');
      hud.prepend(vanger);
      return new Promise((r) => {
        const door = () => {
          wachtOpTik = null;
          vanger.remove();
          el.remove();
          r();
        };
        wachtOpTik = door;
        vanger.addEventListener('pointerdown', door, { once: true });
      });
    }
    // Ongeveer 1,5 s; een langere melding blijft iets langer staan.
    const duur = el.querySelectorAll('.bot-melding-deel').length > 3 ? 2200 : 1500;
    const balkje = maak('div', 'bot-melding-balk');
    balkje.style.animationDuration = `${duur}ms`;
    el.append(balkje);
    hud.append(el);
    setTimeout(() => el.remove(), duur);
    return Promise.resolve();
  }

  /** Wie er na deze beurt aan de beurt is: een naam, of "Minigame". */
  const volgendeNaam = () =>
    s.fase.soort === 'minigame' ? 'Minigame' : s.fase.soort === 'eindspelRad' || s.fase.soort === 'einde' ? 'Minigame' : s.spelers[spelerAanZet(s)].naam;

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
        // Een ster gekocht, een item of Ratje: eerst het effect, dan verder lopen.
        if (beurtBezig()) await effecten.speel(false);
        snel = false;
        toonTeller(speler, resterend());
        continue;
      }
      if (f.soort === 'splitsing') {
        const splitsing = BORD.splitsingen.find((x) => x.vakje === f.vakje)!;
        zet(splitsingKeuze(s, BORD, await vraagSplitsing(splitsing)));
        if (beurtBezig()) await effecten.speel(false);
        snel = false;
      } else {
        zet(stap(s, BORD));
      }
      if (s.fase.soort === 'splitsing') continue; // geen stap gezet: eerst kiezen
      await toonStap(speler, snel ? TEMPO.mensStapSnel : TEMPO.mensStap);
    }
    weergave.boven(speler, null);
  }

  async function toonStap(speler: number, tempo: number) {
    weergave.plaatsFiguren(landingsPosities(), speler, tempo);
    toonTeller(speler, resterend());
    weergave.volgSpeler(speler, TEMPO.cameraLopen);
    await wacht(tempo);
  }

  /**
   * Wat er na het lopen gebeurde: het rad, de kans-rollen, de zeilwedstrijd, daarna de figuren
   * naar hun nieuwe plek en Pommie als het dag of nacht wordt.
   * Een mens ziet alles; bij een bot alleen de zeilwedstrijd (kort) en de wissel van dag en nacht.
   */
  async function toonGevolgen(speler: number, verslag: Gebeurtenis[], mens: boolean) {
    // Aankomen op het vakje: de camera zoomt iets in en het vakje licht op in zijn eigen kleur.
    if (mens || !turbo) {
      const vakjeId = landingsPosities()[speler];
      weergave.volgSpeler(speler, mens ? TEMPO.aankomstMens : TEMPO.aankomstBot, 1.2);
      weergave.gloed(vakjeId, vakjeKleur(huidigType(s, vakje(BORD, vakjeId))));
      await wacht(mens ? TEMPO.aankomstMensWacht : TEMPO.aankomstBotWacht);
    }
    for (const g of verslag) {
      if (!actief) return;
      if (mens && g.soort === 'rad') await toonRad(laag, s, g);
      else if (mens && g.soort === 'kans') await toonKans(laag, s, g);
      else if (g.soort === 'zeilwedstrijd' && (mens || !turbo)) await toonZeilwedstrijd(laag, s, g, mens ? undefined : 1500);
    }
    if (verslag.some((g) => g.soort === 'verplaatst' && g.reden !== 'wisseltruc')) {
      weergave.plaatsFiguren(posities(), speler, mens ? TEMPO.verplaatsMens : TEMPO.verplaatsBot);
      if (mens) weergave.volgSpeler(speler, TEMPO.verplaatsMens);
      await wacht((mens ? TEMPO.verplaatsMens : TEMPO.verplaatsBot) + 50);
    }
    // Een mens die in een valstrik trapt, ziet dat in de korte melding.
    if (mens && verslag.some((g) => g.soort === 'valstrik')) melding(speler);
    await effecten.speel(!mens);
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
      // Met turbo verdwijnt de melding vanzelf; anders blijft hij staan tot iemand tikt.
      const klaar = melding(speler, turbo ? undefined : volgendeNaam());
      await toonGevolgen(speler, verslag, false);
      weergave.plaatsFiguren(posities(), -1, turbo ? 0 : 80);
      await klaar;
    };
    if (turbo) {
      while (bezig()) zet(botActie(s, BORD)!);
      return naBeurt();
    }
    weergave.volgSpeler(speler, TEMPO.cameraBeurt);
    await toonAankondiging(laag, s, speler);
    // Eventueel een item (dat gaat direct), dan gooit de bot in het dobbelscherm.
    while (bezig() && (s.fase.soort === 'dobbelen' || s.fase.soort === 'ratje')) {
      const volgende = botActie(s, BORD)!;
      if (s.fase.soort === 'dobbelen' && volgende.fase.soort === 'lopen' && !turbo) {
        await toonDobbelscherm(laag, speler, {
          state: () => s,
          gooi: () => {
            zet(volgende);
            const w = s.verslag.find((g) => g.soort === 'worp');
            return w && w.soort === 'worp' ? w.worpen : [];
          },
        }, { vanzelf: true, uitslag: (w) => `${s.spelers[speler].naam} loopt ${w} ${w === 1 ? 'stap' : 'stappen'}` });
        break;
      }
      await zetBot(volgende);
      if (s.verslag.some((g) => g.soort === 'verplaatst' && g.reden === 'wisseltruc')) {
        weergave.plaatsFiguren(posities(), speler, TEMPO.cameraLopen);
        weergave.volgSpeler(speler, TEMPO.cameraLopen);
        await wacht(TEMPO.cameraLopen);
      }
    }
    toonTeller(speler, resterend());
    await wacht(TEMPO.naDobbelen);
    while (bezig()) {
      await zetBot(botActie(s, BORD)!);
      if (turbo) continue; // turbo tijdens de beurt aangezet: rest direct
      await toonStap(speler, TEMPO.botStap);
    }
    await naBeurt();
  }

  /**
   * Een botactie uitvoeren. Huurt de bot Ratje in, dan zie je wie hij kiest, met wat spanning.
   */
  async function zetBot(volgende: GameState) {
    const voor = s;
    zet(volgende);
    if (turbo) return;
    const ratje = nieuwInVerslag(voor.verslag, s.verslag).find((g) => g.soort === 'ratje');
    if (ratje?.soort === 'ratje') {
      weergave.boven(spelerAanZet(voor), null);
      // Tijdens de spanning blijft de balk nog even zoals het was.
      balk.werkBij(voor);
      await toonBotRatje(laag, voor, ratje);
      balk.werkBij(s);
    }
  }

  /**
   * Het begin van een mensenbeurt (§11, §13): "Jouw beurt, Floris!", daarna het keuzemenu.
   * Items kies je in het menu; Dobbelen gaat naar het dobbelscherm.
   */
  async function mensBeurtBegin(speler: number) {
    await toonAankondiging(laag, s, speler);
    while (actief && s.fase.soort === 'dobbelen') {
      const keuze = await vraagMenuKeuze(laag, s, speler);
      if (!actief) return;
      if (keuze === 'dobbelen') {
        await mensDobbelt(speler);
        return;
      }
      if (keuze === 'annuleer') zet(annuleerItem(s));
      else if (keuze === 'items') await kiesItem(speler);
      else await bordBekijken(speler);
    }
  }

  /** Het itempaneel: een item kiezen (met een speler erbij voor een gemeen item). */
  async function kiesItem(speler: number) {
    const item = await vraagItem(laag, s, speler);
    if (!item || !actief) return;
    let doel: number | undefined;
    if (heeftDoel(item)) {
      const d = await vraagItemDoel(laag, s, speler, item);
      if (d === null) return;
      doel = d;
    }
    zet(gebruikItem(s, item, doel));
    if (item === 'wisseltruc') {
      weergave.plaatsFiguren(posities(), speler, 400);
      weergave.volgSpeler(speler, 400);
      await wacht(450);
    } else if (item === 'ratjebel' && s.fase.soort === 'ratje') {
      zet(ratjeKeuze(s, BORD, await vraagRatje(laag, s, speler)));
    } else if (heeftDoel(item) || item === 'valstrik') {
      // Laat even zien wat het gemene item deed.
      void melding(speler);
    }
    await effecten.speel(false);
  }

  /** Bord bekijken: vrij schuiven en zoomen; "Terug" zet de camera weer op je figuur. */
  async function bordBekijken(speler: number) {
    weergave.overzicht(400);
    const p = BORD.plekken;
    const stopVrij = weergave.vrijBekijken([
      { x: p.winkel.x, y: p.winkel.y, tekst: s.nacht ? 'Winkel · dicht' : 'Winkel · open' },
      { x: p.nachtwinkel.x, y: p.nachtwinkel.y, tekst: s.nacht ? 'Nachtwinkel · open' : 'Nachtwinkel · dicht' },
      { x: p.ratje.x, y: p.ratje.y, tekst: 'Ratje' },
    ]);
    const afstand = s.mist ? null : stappenTotSter(s, BORD, s.spelers[speler].vakje);
    await toonBordBekijken(laag, afstand === null || Number.isFinite(afstand) ? afstand : null);
    stopVrij();
    weergave.volgSpeler(speler, 450);
    await wacht(450);
  }

  /** Het dobbelscherm voor een mens. Met een gekozen dobbel-item zie je dat daar (twee blokken enz.). */
  async function mensDobbelt(speler: number) {
    await toonDobbelscherm(laag, speler, {
      state: () => s,
      gooi: (gekozen) => {
        zet(dobbelen(s, gekozen));
        const w = s.verslag.find((g) => g.soort === 'worp');
        return w && w.soort === 'worp' ? w.worpen : [];
      },
    });
  }

  /**
   * De startworp (§2): Pommie legt het uit, iedereen gooit om de beurt in het dobbelscherm
   * (bots vanzelf, daarna tik je door), bij gelijk gooien alleen die opnieuw. Daarna de volgorde.
   */
  async function startworpen() {
    weergave.overzicht(0);
    if (!s.verslag.some((g) => g.soort === 'startworp')) await pommie(zeg('startworp'));
    while (actief && s.fase.soort === 'startworp') {
      const speler = startwerper(s);
      const sp = s.spelers[speler];
      const opnieuw = s.startworpen[speler].length > 0;
      await toonDobbelscherm(laag, speler, {
        state: () => s,
        gooi: () => {
          zet(gooiStartworp(s));
          return [s.startworpen[speler].at(-1)!];
        },
      }, {
        titel: opnieuw ? 'Startworp · opnieuw gooien' : 'Startworp · wie het hoogst gooit, begint',
        vanzelf: sp.isBot,
        wachtOpTik: sp.isBot,
        uitslag: (w) => `${sp.naam} gooide ${w}`,
        uitslagMs: TEMPO.startworpUitslag,
      });
      const gelijk = s.verslag.at(-1);
      if (actief && gelijk?.soort === 'startworpGelijk') {
        await pommie(zeg('startworpGelijk', namenLijst(gelijk.spelers.map((i) => s.spelers[i].naam))));
      }
    }
    if (actief && s.fase.soort === 'startVolgorde') {
      await toonStartvolgorde(laag, s);
      zet(startSpel(s));
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
      : { icoon: 'iconen/vakje-ijs.svg', kop: 'Over het ijs?', uitleg: 'Een kortere weg, maar het is glad!', ja: 'Ja, over het ijs!', nee: 'Nee, lopen' };
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
    // De beloningen van de minigame: bij iedereen tegelijk.
    await wacht(250);
    await effecten.speel(false);
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
    await effecten.speel(false);
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
      if (soort === 'startworp' || soort === 'startVolgorde') {
        await startworpen();
        continue;
      }
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
        weergave.volgSpeler(speler, TEMPO.cameraBeurt);
        await wacht(TEMPO.cameraBeurt);
        if (!actief) return;
        await mensBeurtBegin(speler);
        if (!actief || !beurtBezig()) continue;
        toonTeller(speler, resterend());
        await wacht(TEMPO.naDobbelen);
      } else {
        // Verder spelen midden in een beurt.
        weergave.volgSpeler(speler, 0);
        toonTeller(speler, resterend());
      }
      await loopBeurt(speler);
      if (actief) await toonGevolgen(speler, s.verslag, true);
      if (actief) await wacht(TEMPO.naMensBeurt);
    }
  }

  // ------------------------------------------------------------------ start
  tekenBord(0);
  const geenBeurt = ['minigame', 'startworp', 'startVolgorde', 'einde'].includes(s.fase.soort);
  weergave.plaatsFiguren(posities(), geenBeurt ? -1 : spelerAanZet(s), 0);
  weergave.overzicht(0);
  const nieuwSpel = s.fase.soort === 'startworp' && !s.verslag.some((g) => g.soort === 'startworp');
  (async () => {
    if (nieuwSpel) await pommie(zeg('welkom'));
    else await wacht(300);
    await speel();
  })();
}
