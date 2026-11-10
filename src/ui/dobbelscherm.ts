/**
 * Het dobbelscherm voor mensen (design: map 3, dobbel-1 t/m dobbel-4).
 * 1. wachten: links de speler en zijn items, rechts een 3D-dobbelblok dat zweeft en rustig draait;
 * 2. getikt: een klap (indeuken en terugveren), dan snel versnellen met een woesj, afremmen en
 *    vastklikken op de uitkomst met een tok (±1,2 s, bij een bot ±0,5 s; zie dobbelBeweging.ts);
 * 3. resultaat: groot getal, bij een hoge worp confetti;
 * 4. terug naar het bord (het scherm vervaagt, het getal staat dan boven het figuur).
 * Items kies je in het keuzemenu aan het begin van de beurt; hier zie je het gekozen item
 * (map 4: twee of drie blokken, of de getallen van Kies-je-worp). Ook voor de startworp (§2).
 * Heeft iemand je de Slakkendobbel gegeven, dan is het blok bruin en gooit het 1–3 (map 4:
 * dobbel-slakkendobbel). Met de Achteruitpet staat er bovenin dat je achteruit loopt.
 */
import { figuur } from '../data/figuren';
import {
  aantalDobbelstenen, dobbelMax, itemInfo, plaatsen, werktMeteen, type GameState, type ItemSoort,
} from '../logic';
import { dobbelGeluid, tokGeluid, woesjGeluid, worpGeluid } from '../audio/geluid';
import {
  RUST_X, RUST_Y, WORP_BOT, WORP_MENS, hoekOp, naarJeToe, planAs, snelheidOp, worpDuur, type AsPlan, type WorpTijden,
} from './dobbelBeweging';
import { TEMPO } from './tempo';
import { asset } from './asset';
import { icoon } from './iconen';
import { itemIcoon, SLAK_SVG } from './itemIcoon';
import { figuurPlaatje, maak, plaatsRondje } from './onderdelen';


const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Wacht op een tik (of de tijd), wat het eerst komt. */
function tikOfTijd(el: HTMLElement, ms: number): Promise<void> {
  return new Promise((r) => {
    const klaar = () => {
      clearTimeout(t);
      el.removeEventListener('pointerdown', klaar);
      r();
    };
    const t = setTimeout(klaar, ms);
    el.addEventListener('pointerdown', klaar);
  });
}

/** Lichtstralen rond het blok (letterlijk uit dobbel-2-getikt.html). */
const STRALEN = `<svg class="dobbel-stralen" width="560" height="560" viewBox="0 0 560 560" aria-hidden="true">${[
  'M101 215 L45 194', 'M158 134 L119 88', 'M247 93 L237 34', 'M345 101 L366 45', 'M426 158 L472 119',
  'M467 247 L526 237', 'M459 345 L515 366', 'M402 426 L441 472', 'M313 467 L323 526', 'M215 459 L194 515',
  'M134 402 L88 441', 'M93 313 L34 323',
].map((d) => `<path d="${d}" stroke="#FFF3A0" stroke-width="10" stroke-linecap="round"></path>`).join('')}</svg>`;

const FONKEL = (x: number, y: number, maat: number) =>
  `<svg class="fonkel" style="left:${x}px;top:${y}px" width="${maat}" height="${maat}" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0 Z" fill="#FFF3A0"></path></svg>`;

const CONFETTI_KLEUREN = ['#FFFFFF', '#FFC928', '#F47B20', '#2FAE5B', '#2F7DE1', '#E8433A', '#E85AAE'];

/** De zes vlakken van het blok: voor, rechts, achter, links, boven, onder (zie naarJeToe). */
const VLAKKEN = ['translateZ(150px)', 'rotateY(90deg) translateZ(150px)', 'rotateY(180deg) translateZ(150px)',
  'rotateY(-90deg) translateZ(150px)', 'rotateX(90deg) translateZ(150px)', 'rotateX(-90deg) translateZ(150px)'];
const GLANS = ['28% 22%', '20% 30%', '28% 22%', '20% 30%', '34% 26%', '24% 34%'];

/** Bewegingsvervaging: een zachte gloed met witte vegen, alleen opacity en rotate. */
const VEEG = `<svg width="380" height="380" viewBox="0 0 380 380" aria-hidden="true">${[0, 120, 240].map((r) =>
  `<path d="M190 22 A168 168 0 0 1 335 106" transform="rotate(${r} 190 190)" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" opacity=".55"></path>`).join('')}</svg>`;

interface Blok {
  el: HTMLElement;
  /** Start het rustige draaien (als het blok in beeld staat). */
  start(): void;
  /** Gooi: versnellen, afremmen en vastklikken op `worp`. Klaar als het blok stilligt. */
  gooi(worp: number, tijden: WorpTijden): Promise<void>;
  /** Meteen stil, met `worp` naar je toe (zonder animatie). */
  zet(worp: number): void;
}

const rustig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Het 3D-dobbelblok van vilt: een echte kubus met zes vlakken met een getal. Hij zweeft en draait
 * rustig rond om twee assen (requestAnimationFrame, alleen transform). Een vlak dat van je af
 * draait, krijgt stiekem een nieuw getal. Bij een worp krijgt het voorvlak de uitkomst zodra het
 * uit beeld is, en daar klikt het blok op vast.
 * `tempo` maakt het ene blok wat sneller of trager dan het andere; de slakkendobbel is trager.
 */
function maakBlok(max: number, tempo: number): Blok {
  const el = maak('div', 'blok');
  const draai = maak('div', 'blok-draai');
  // De kern: dichte binnenvlakken, zodat je in de ronde hoeken niet door het blok heen kijkt.
  for (const t of ['translateZ(128px)', 'rotateY(180deg) translateZ(128px)', 'rotateY(90deg) translateZ(128px)',
    'rotateY(-90deg) translateZ(128px)', 'rotateX(90deg) translateZ(128px)', 'rotateX(-90deg) translateZ(128px)']) {
    const v = maak('div', 'blok-vulling');
    v.style.transform = t;
    draai.append(v);
  }
  const getallen = VLAKKEN.map((t, i) => {
    const vlak = maak('div', 'blok-vlak blok-zij');
    vlak.style.transform = t;
    vlak.style.setProperty('--glans', GLANS[i]);
    const getal = maak('span', 'blok-getal');
    vlak.append(maak('div', 'blok-stiksel'), getal, maak('div', 'blok-glans'));
    draai.append(vlak);
    return getal;
  });
  const kantel = maak('div', 'blok-kantel');
  const klap = maak('div', 'blok-klap');
  const zweef = maak('div', 'blok-zweef');
  const veeg = maak('div', 'blok-veeg');
  veeg.innerHTML = VEEG;
  kantel.append(draai);
  klap.append(kantel, veeg);
  zweef.append(klap);
  el.append(maak('div', 'blok-schaduw'), zweef);

  const toon = (vlak: number, n: number) => {
    getallen[vlak].textContent = String(n);
    getallen[vlak].classList.toggle('twee-cijfers', n >= 10);
  };
  const willekeurig = (niet: number) => {
    if (max < 2) return 1;
    let n = niet;
    while (n === niet) n = 1 + Math.floor(Math.random() * max);
    return n;
  };
  // Elk vlak begint met een ander getal.
  const begin = Math.floor(Math.random() * max);
  getallen.forEach((_, i) => toon(i, ((begin + i * (max === 10 ? 3 : 1)) % max) + 1));

  // Rustig: ±1 keer rond per 3 s om de Y-as, wat trager voorover om de X-as.
  const slak = max < 10;
  const rustY = rustig() ? 0 : (slak ? 55 : 120) * tempo;
  const rustX = rustY * 0.55;
  let y = Math.random() * 360;
  let x = -20 + Math.random() * 60;
  let zichtbaar = naarJeToe(x, y).map((z) => z > 0);
  let worp: { getal: number; tijden: WorpTijden; t0: number; py: AsPlan; px: AsPlan; klaar: () => void } | null = null;
  let vast = false; // de uitkomst staat op het voorvlak
  let vorigeTijd = 0;
  let frame = 0;
  let veegZicht = -1;

  const teken = () => {
    draai.style.transform = `rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
    // Stiekem nieuwe getallen op de vlakken die van je af draaien.
    const z = naarJeToe(x, y);
    z.forEach((v, i) => {
      if (zichtbaar[i] && v < -0.08) {
        zichtbaar[i] = false;
        if (worp && i === 0) {
          toon(0, worp.getal);
          vast = true;
        } else if (!(vast && i === 0)) {
          // Na de tik nooit de uitkomst op een ander vlak, dat zou verwarren.
          let n = willekeurig(Number(getallen[i].textContent));
          while (worp && max > 2 && n === worp.getal) n = willekeurig(n);
          toon(i, n);
        }
      } else if (!zichtbaar[i] && v > 0) zichtbaar[i] = true;
    });
  };

  const stap = (nu: number) => {
    if (!el.isConnected) return; // het scherm is weg
    const dt = Math.min(0.05, (nu - (vorigeTijd || nu)) / 1000);
    vorigeTijd = nu;
    if (!worp) {
      y += rustY * dt;
      x += rustX * dt;
      teken();
      frame = requestAnimationFrame(stap);
      return;
    }
    const t = Math.max(0, (nu - worp.t0) / 1000);
    y = hoekOp(worp.py, t, worp.tijden);
    x = hoekOp(worp.px, t, worp.tijden);
    teken();
    // Vervaging: hoe sneller, hoe zichtbaarder.
    const v = Math.abs(snelheidOp(worp.py, t, worp.tijden));
    const o = Math.round(Math.min(1, Math.max(0, (v - 350) / 900)) * 20) / 20;
    if (o !== veegZicht) {
      veegZicht = o;
      veeg.style.opacity = String(o * 0.8);
    }
    veeg.style.transform = `rotate(${(y * 0.6).toFixed(1)}deg)`;
    if (t >= worpDuur(worp.tijden)) {
      if (!vast) toon(0, worp.getal); // (komt niet voor: het voorvlak is altijd een keer weggedraaid)
      vast = true;
      veeg.style.opacity = '0';
      worp.klaar();
      return;
    }
    frame = requestAnimationFrame(stap);
  };

  return {
    el,
    start() {
      cancelAnimationFrame(frame);
      teken();
      frame = requestAnimationFrame(stap);
    },
    gooi(getal, tijden) {
      return new Promise<void>((klaar) => {
        const extra = (slak ? 900 : 1300) * tempo;
        worp = {
          getal, tijden, klaar, t0: performance.now(),
          py: planAs(y, rustY, extra, RUST_Y, 11, tijden),
          px: planAs(x, rustX, extra * 0.55, RUST_X, 6, tijden),
        };
        // De klap: even indeuken en terugveren.
        klap.animate([
          { transform: 'scale(1, 1)' },
          { transform: 'scale(1.14, .8)', offset: 0.3 },
          { transform: 'scale(.95, 1.07)', offset: 0.65 },
          { transform: 'scale(1, 1)' },
        ], { duration: 260, easing: 'ease-out' });
        // Vastklikken: een klein tikje als hij op zijn plek valt.
        const naar = worpDuur(tijden) - tijden.veer;
        klap.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
          { duration: tijden.veer * 1000 + 80, delay: naar * 1000, easing: 'ease-out' });
        if (rustig()) {
          cancelAnimationFrame(frame);
          this.zet(getal);
          setTimeout(klaar, 300);
        }
      });
    },
    zet(getal) {
      cancelAnimationFrame(frame);
      worp = null;
      x = RUST_X;
      y = RUST_Y;
      toon(0, getal);
      vast = true;
      teken();
    },
  };
}

/** Wat het dobbelscherm aan het spelscherm vraagt. */
export interface DobbelActies {
  /** De spelstand van nu. */
  state(): GameState;
  /** Doe de worp in de spellogica; geeft de losse worpen terug. */
  gooi(gekozen?: number): number[];
}

export interface DobbelOpties {
  /** Bovenin, bijvoorbeeld "Startworp · wie het hoogst gooit, begint". */
  titel?: string;
  /** Een bot: het blok gooit zelf. */
  vanzelf?: boolean;
  /** Na de uitslag wachten op een tik ("Tik om verder te gaan"), zoals bij de startworp van een bot. */
  wachtOpTik?: boolean;
  /** De tekst in de pil onder de uitslag (standaard: "Je loopt 7 stappen"). */
  uitslag?: (worp: number) => string;
  /** Hoe lang de uitslag blijft staan (standaard: TEMPO.worpUitslag, bij een bot TEMPO.botWorpUitslag). */
  uitslagMs?: number;
}

/** Het gekozen item, zoals in map 4: groen en "ACTIEF". */
function itemRij(item: ItemSoort): HTMLElement {
  const rij = maak('div', 'dobbel-item actief');
  const rond = maak('div', 'dobbel-item-icoon');
  rond.append(itemIcoon(item, 34));
  const rechts = maak('div', 'dobbel-item-rechts');
  rechts.append(maak('span', 'dobbel-item-naam', itemInfo(item).naam));
  const b = maak('span', 'knop knop-s knop-groen dobbel-item-knop');
  b.innerHTML = `${icoon.vinkje('#FFFFFF', 22)}ACTIEF`;
  rechts.append(b);
  rij.append(rond, rechts);
  return rij;
}

function spelerPaneel(s: GameState, speler: number, startworp: boolean): HTMLElement {
  const sp = s.spelers[speler];
  const f = figuur(sp.figuur);
  const plaats = plaatsen(s)[speler];

  const paneel = maak('div', 'dobbel-paneel vilt');
  const kaart = maak('div', 'dobbel-kaart');
  kaart.style.background = f.kleurLicht;
  kaart.innerHTML = `<div class="dobbel-kaart-schaduw"></div>
    <svg class="dobbel-wiebellijnen" width="230" height="80" viewBox="0 0 230 80" aria-hidden="true"><path d="M14 60 Q4 40 14 20 M30 66 Q18 40 30 14 M216 60 Q226 40 216 20 M200 66 Q212 40 200 14" fill="none" stroke="#F47B20" stroke-width="4" stroke-linecap="round" opacity="0.7"></path></svg>`;
  const wiebel = maak('div', `dobbel-wiebel${f.handgetekend ? '' : ' is-pion'}`);
  // Elke tekening in zijn eigen verhouding (de kikker en het konijn zijn breder dan Floris).
  if (f.handgetekend) wiebel.style.aspectRatio = String(f.verhouding);
  wiebel.append(figuurPlaatje(f, sp.naam, 'dobbel-figuur'));
  kaart.append(wiebel, plaatsRondje(plaats, 'dobbel-plaats'));

  const naam = maak('div', 'dobbel-naam');
  naam.append(maak('span', '', sp.naam));
  if (sp.isBot) naam.append(maak('span', 'bot-label donker', 'BOT'));

  const stand = maak('div', 'dobbel-stand');
  stand.innerHTML = `<span class="dobbel-plaatstekst">${plaats}e plaats</span><span class="punt"></span>
    <span class="dobbel-telling"><img src="${asset('iconen/ster.svg')}" alt="" width="26" height="26">${sp.sterren}</span>
    <span class="dobbel-telling"><img src="${asset('iconen/munt.svg')}" alt="" width="24" height="24">${sp.munten}</span>`;

  paneel.append(kaart, naam, stand);
  // Het gekozen item (een dobbelsteen of Kies-je-worp); kiezen doe je in het keuzemenu.
  const fase = s.fase.soort === 'dobbelen' ? s.fase : null;
  if (fase?.gebruikt && !werktMeteen(fase.gebruikt)) {
    const items = maak('div', 'dobbel-items');
    items.append(itemRij(fase.gebruikt));
    paneel.append(maak('div', 'dobbel-lijn'), maak('span', 'label-hoofdletters', 'GEKOZEN ITEM'), items);
  }
  if (startworp) {
    const worpen = s.startworpen[speler];
    paneel.append(maak('div', 'dobbel-lijn'), maak('span', 'label-hoofdletters', 'STARTWORP'));
    paneel.append(maak('p', 'dobbel-startuitleg', worpen.length ? `Gelijk gegooid! Eerder gooide je ${worpen.join(', ')}.` : 'Wie het hoogst gooit, mag beginnen.'));
  }
  return paneel;
}

/** Kies-je-worp: tien grote knoppen (design: dobbel-kies-je-worp.html). */
function kiesGetal(rechts: HTMLElement, max: number): Promise<number> {
  return new Promise((r) => {
    const kop = maak('div', 'kies-kop');
    kop.innerHTML = `<h2 class="kies-titel">Kies je worp</h2><p class="kies-uitleg">${
      max < 10 ? `Met de slakkendobbel kies je 1 tot ${max}.` : 'Tik op het aantal stappen dat je wilt lopen.'
    }</p>`;
    const raster = maak('div', 'kies-raster');
    for (let n = 1; n <= max; n++) {
      const b = maak('button', 'kies-getal', String(n));
      b.type = 'button';
      b.addEventListener('click', () => r(n), { once: true });
      raster.append(b);
    }
    rechts.replaceChildren(kop, raster);
  });
}

function uitslagTekst(worp: number): string {
  if (worp >= 7) return `Super! Je loopt ${worp} stappen`;
  if (worp <= 3) return worp === 1 ? 'Ai… maar 1 stap' : `Ai… maar ${worp} stappen`;
  return `Je loopt ${worp} stappen`;
}

/**
 * Toont het dobbelscherm in `laag`. Links de speler en zijn items, rechts het blok (of twee of
 * drie blokken, of de getallen van Kies-je-worp). Klaar zodra het scherm weer weg is.
 */
export async function toonDobbelscherm(laag: HTMLElement, speler: number, acties: DobbelActies, opties: DobbelOpties = {}): Promise<void> {
  const scherm = maak('div', 'dobbel');
  const rechts = maak('div', 'dobbel-rechts');
  laag.append(scherm);

  let einde: (() => void) | null = null;

  const bouw = () => {
    const s = acties.state();
    const startworp = s.fase.soort === 'startworp';
    const fase = s.fase.soort === 'dobbelen' ? s.fase : null;
    const max = startworp ? 10 : dobbelMax(s, speler);
    scherm.classList.toggle('slak', max < 10);
    scherm.replaceChildren(spelerPaneel(s, speler, startworp), rechts);
    rechts.replaceChildren();
    const sp = s.spelers[speler];
    if (opties.titel) {
      const banner = maak('div', 'dobbel-banner', opties.titel);
      scherm.append(banner);
    } else if (sp.slak || sp.achteruit) {
      const banner = maak('div', 'dobbel-banner');
      banner.innerHTML = sp.slak ? `${SLAK_SVG(30)}Iemand gaf je de slakkendobbel…` : 'Iemand gaf je de achteruitpet… je loopt achteruit!';
      scherm.append(banner);
    }
    if (fase?.gebruikt === 'kiesWorp' && !opties.vanzelf) {
      void kiesGetal(rechts, max).then((n) => {
        dobbelGeluid();
        return gooiEnToon(acties.gooi(n));
      });
      return;
    }
    wachtOpTik(aantalDobbelstenen(fase?.gebruikt), max);
  };

  // 1. wachten: het blok zweeft en draait rustig rond
  const wachtOpTik = (aantal: number, max: number) => {
    const midden = maak('div', `dobbel-midden blokken-${aantal}`);
    // Elk blok draait op zijn eigen snelheid.
    const blokken = Array.from({ length: aantal }, (_, i) => maakBlok(max, [1, 0.82, 1.17][i]));
    const knop = maak('button', 'dobbel-knop');
    knop.type = 'button';
    knop.setAttribute('aria-label', 'Tik op het blok om te gooien');
    knop.append(...blokken.map((b) => b.el));
    midden.append(knop);
    const hint = maak('div', `dobbel-hint${opties.vanzelf ? ' vanzelf' : ''}`);
    hint.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="#FFFFFF"></circle><circle cx="12" cy="12" r="9" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.6"></circle></svg>${opties.vanzelf ? 'Gooit…' : aantal > 1 ? 'Tik op de blokken!' : 'Tik op het blok!'}`;
    const hintEl = max < 10 ? maak('div', 'dobbel-hint-rij') : hint;
    if (max < 10) hintEl.append(maak('div', 'dobbel-slak-pil', `Alleen 1 t/m ${max}`), hint);
    rechts.append(midden, hintEl);
    blokken.forEach((b) => b.start());

    // 2. getikt: een klap, versnellen, afremmen en vastklikken
    const tik = async () => {
      dobbelGeluid();
      const worpen = acties.gooi();
      const basis = opties.vanzelf ? WORP_BOT : WORP_MENS;
      hintEl.remove();
      midden.insertAdjacentHTML('afterbegin', STRALEN);
      const stralen = midden.querySelector<SVGElement>('.dobbel-stralen');
      stralen?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 140, fill: 'forwards' })
        .finished.then(() => stralen.remove(), () => {});
      // De blokken stoppen kort na elkaar.
      const tijden = blokken.map((_, i) => ({ ...basis, top: basis.top + i * (opties.vanzelf ? 0.07 : 0.11) }));
      woesjGeluid(basis.versnel, basis.top + basis.rem + (blokken.length - 1) * 0.11);
      await Promise.all(blokken.map((b, i) =>
        b.gooi(worpen[i], tijden[i]).then(() => tokGeluid())));
      void gooiEnToon(worpen, midden);
    };
    // Een bot gooit zelf, na een korte tel; een mens tikt.
    if (opties.vanzelf) setTimeout(() => void tik(), TEMPO.botGooit);
    else rechts.addEventListener('pointerdown', () => void tik(), { once: true });
  };

  const gooiEnToon = async (worpen: number[], midden?: HTMLElement) => {
    const worp = worpen.reduce((a, b) => a + b, 0);
    if (!midden) {
      // Kies-je-worp: geen blok, alleen de stralen
      midden = maak('div', 'dobbel-midden');
      rechts.replaceChildren(midden);
      scherm.classList.add('getikt');
      midden.insertAdjacentHTML('afterbegin', STRALEN);
      await wacht(260);
    }

    // 3. resultaat
    const hoog = worpen.length > 1 ? worp >= 7 * worpen.length - 2 : worp >= 7;
    const laag = worpen.length > 1 ? false : worp <= 3;
    scherm.classList.remove('getikt');
    scherm.classList.add('resultaat', hoog ? 'hoog' : laag ? 'laag' : 'midden');
    midden.querySelector('.dobbel-stralen')?.remove();
    if (worpen.length > 1) {
      const som = maak('div', 'dobbel-som');
      som.innerHTML = `${worpen.map((w) => `<span>${w}</span>`).join('<span class="teken">+</span>')}<span class="teken">=</span><b>${worp}</b>`;
      rechts.append(som);
    } else {
      midden.append(maak('div', 'dobbel-uitslag', String(worp)));
    }
    rechts.append(maak('div', 'dobbel-pil', (opties.uitslag ?? uitslagTekst)(worp)));
    midden.insertAdjacentHTML('beforeend', [FONKEL(-60, 40, 46), FONKEL(330, -20, 38), FONKEL(360, 250, 50), FONKEL(-30, 300, 34)].join(''));
    worpGeluid(hoog);
    if (hoog) rechts.append(confetti());
    if (opties.wachtOpTik) {
      // Bij de startworp van een bot blijft de uitslag staan tot iemand tikt.
      rechts.append(maak('div', 'dobbel-hint dobbel-verder', 'Tik om verder te gaan'));
      await new Promise<void>((r) => scherm.addEventListener('pointerdown', () => r(), { once: true }));
    } else {
      await tikOfTijd(scherm, opties.uitslagMs ?? (opties.vanzelf ? TEMPO.botWorpUitslag : TEMPO.worpUitslag));
    }

    // 4. naar het bord
    await scherm.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished;
    scherm.remove();
    einde?.();
  };

  return new Promise<void>((r) => {
    einde = r;
    bouw();
  });
}

export function confetti(): HTMLElement {
  const el = maak('div', 'confetti');
  const delen: string[] = [];
  for (let i = 0; i < 34; i++) {
    const kleur = CONFETTI_KLEUREN[i % CONFETTI_KLEUREN.length];
    const x = 8 + Math.random() * 84;
    const y = 4 + Math.random() * 80;
    const rond = i % 4 === 0;
    const w = rond ? 14 : 6 + Math.random() * 4;
    const h = rond ? 14 : 14 + Math.random() * 6;
    delen.push(
      `<i style="left:${x}%;top:${y}%;width:${w}px;height:${h}px;background:${kleur};border-radius:${rond ? '50%' : '3px'};--r:${Math.round(Math.random() * 180)}deg;animation-delay:${Math.round(Math.random() * 120)}ms"></i>`,
    );
  }
  el.innerHTML = delen.join('');
  return el;
}
