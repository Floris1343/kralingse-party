/**
 * Het dobbelscherm voor mensen (design: map 3, dobbel-1 t/m dobbel-4).
 * 1. wachten: links de speler en zijn items, rechts een draaiend dobbelblok;
 * 2. getikt: het blok wordt even platgedrukt, met lichtstralen;
 * 3. resultaat: groot getal, bij een hoge worp confetti;
 * 4. terug naar het bord (het scherm vervaagt, het getal staat dan boven het figuur).
 */
import { figuur } from '../data/figuren';
import { plaatsen, type GameState } from '../logic';
import { asset } from './asset';
import { figuurPlaatje, maak, plaatsRondje } from './onderdelen';
import { MAX_ITEMS } from './spelersbalk';

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

/** Het 3D-dobbelblok van vilt. Vier zijkanten met een getal, bovenop sterretjes. */
function maakBlok(): { el: HTMLElement; zetGetal: (n: number) => void } {
  const el = maak('div', 'blok');
  const draai = maak('div', 'blok-draai');
  const binnen = ['translateZ(140px)', 'rotateY(180deg) translateZ(140px)', 'rotateY(90deg) translateZ(140px)',
    'rotateY(-90deg) translateZ(140px)', 'rotateX(90deg) translateZ(140px)', 'rotateX(-90deg) translateZ(140px)'];
  for (const t of binnen) {
    const v = maak('div', 'blok-vulling');
    v.style.transform = t;
    draai.append(v);
  }
  const onder = maak('div', 'blok-vlak blok-onder');
  const boven = maak('div', 'blok-vlak blok-boven');
  boven.innerHTML = `<div class="blok-stiksel"></div>${[
    [60, 66, 60, -10], [168, 54, 51, 14], [114, 150, 72, 6], [198, 180, 42, -18],
  ].map(([x, y, m, r]) => `<img src="${asset('iconen/ster.svg')}" alt="" style="left:${x}px;top:${y}px;width:${m}px;height:${m}px;transform:rotate(${r}deg)">`).join('')}`;
  draai.append(onder, boven);

  const getallen: HTMLElement[] = [];
  ['translateZ(150px)', 'rotateY(90deg) translateZ(150px)', 'rotateY(180deg) translateZ(150px)', 'rotateY(-90deg) translateZ(150px)']
    .forEach((t, i) => {
      const vlak = maak('div', 'blok-vlak blok-zij');
      vlak.style.transform = t;
      vlak.style.setProperty('--glans', ['28% 22%', '20% 30%', '28% 22%', '20% 30%'][i]);
      const getal = maak('span', 'blok-getal');
      getallen.push(getal);
      vlak.append(maak('div', 'blok-stiksel'), getal, maak('div', 'blok-glans'));
      draai.append(vlak);
    });

  const kantel = maak('div', 'blok-kantel');
  const zweef = maak('div', 'blok-zweef');
  kantel.append(draai);
  zweef.append(kantel);
  el.append(maak('div', 'blok-schaduw'), zweef);

  const zetGetal = (n: number) =>
    getallen.forEach((g, i) => {
      const w = ((n - 1 + i * 3) % 10) + 1; // elke zijkant een ander getal
      g.textContent = String(w);
      g.classList.toggle('twee-cijfers', w === 10);
    });
  return { el, zetGetal };
}

function spelerPaneel(s: GameState, speler: number): HTMLElement {
  const sp = s.spelers[speler];
  const f = figuur(sp.figuur);
  const plaats = plaatsen(s)[speler];

  const paneel = maak('div', 'dobbel-paneel vilt');
  const kaart = maak('div', 'dobbel-kaart');
  kaart.style.background = f.kleurLicht;
  kaart.innerHTML = `<div class="dobbel-kaart-schaduw"></div>
    <svg class="dobbel-wiebellijnen" width="230" height="80" viewBox="0 0 230 80" aria-hidden="true"><path d="M14 60 Q4 40 14 20 M30 66 Q18 40 30 14 M216 60 Q226 40 216 20 M200 66 Q212 40 200 14" fill="none" stroke="#F47B20" stroke-width="4" stroke-linecap="round" opacity="0.7"></path></svg>`;
  const wiebel = maak('div', `dobbel-wiebel${f.handgetekend ? '' : ' is-pion'}`);
  wiebel.append(figuurPlaatje(f, sp.naam, 'dobbel-figuur'));
  kaart.append(wiebel, plaatsRondje(plaats, 'dobbel-plaats'));

  const naam = maak('div', 'dobbel-naam');
  naam.append(maak('span', '', sp.naam));
  if (sp.isBot) naam.append(maak('span', 'bot-label donker', 'BOT'));

  const stand = maak('div', 'dobbel-stand');
  stand.innerHTML = `<span class="dobbel-plaatstekst">${plaats}e plaats</span><span class="punt"></span>
    <span class="dobbel-telling"><img src="${asset('iconen/ster.svg')}" alt="" width="26" height="26">${sp.sterren}</span>
    <span class="dobbel-telling"><img src="${asset('iconen/munt.svg')}" alt="" width="24" height="24">${sp.munten}</span>`;

  const items = maak('div', 'dobbel-items');
  for (let n = 0; n < MAX_ITEMS; n++) items.append(maak('div', 'dobbel-leeg', 'Leeg vak'));

  paneel.append(kaart, naam, stand, maak('div', 'dobbel-lijn'), maak('span', 'label-hoofdletters', 'ITEMS · VÓÓR HET GOOIEN'), items);
  return paneel;
}

function uitslagTekst(worp: number): string {
  if (worp >= 7) return `Super! Je loopt ${worp} stappen`;
  if (worp <= 3) return worp === 1 ? 'Ai… maar 1 stap' : `Ai… maar ${worp} stappen`;
  return `Je loopt ${worp} stappen`;
}

/**
 * Toont het dobbelscherm in `laag`. `gooi` doet de echte worp (in de spellogica) en geeft
 * het getal terug. Klaar zodra het scherm weer weg is.
 */
export async function toonDobbelscherm(laag: HTMLElement, s: GameState, speler: number, gooi: () => number): Promise<void> {
  const scherm = maak('div', 'dobbel');
  const rechts = maak('div', 'dobbel-rechts');
  const midden = maak('div', 'dobbel-midden');
  const blok = maakBlok();
  const knop = maak('button', 'dobbel-knop');
  knop.type = 'button';
  knop.setAttribute('aria-label', 'Tik op het blok om te gooien');
  knop.append(blok.el);
  midden.append(knop);
  const hint = maak('div', 'dobbel-hint');
  hint.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="#FFFFFF"></circle><circle cx="12" cy="12" r="9" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.6"></circle></svg>Tik op het blok!`;
  rechts.append(midden, hint);
  scherm.append(spelerPaneel(s, speler), rechts);
  laag.append(scherm);

  // 1. wachten: de getallen op het blok wisselen snel
  let n = 1;
  blok.zetGetal(n);
  const wissel = setInterval(() => blok.zetGetal((n = (n % 10) + 1)), 60);
  await new Promise<void>((r) => rechts.addEventListener('pointerdown', () => r(), { once: true }));
  clearInterval(wissel);

  // 2. getikt
  const worp = gooi();
  blok.zetGetal(worp);
  scherm.classList.add('getikt');
  hint.remove();
  midden.insertAdjacentHTML('afterbegin', STRALEN);
  await wacht(260);

  // 3. resultaat
  scherm.classList.remove('getikt');
  scherm.classList.add('resultaat', worp >= 7 ? 'hoog' : worp <= 3 ? 'laag' : 'midden');
  midden.querySelector('.dobbel-stralen')?.remove();
  const groot = maak('div', 'dobbel-uitslag', String(worp));
  const pil = maak('div', 'dobbel-pil', uitslagTekst(worp));
  midden.append(groot);
  rechts.append(pil);
  midden.insertAdjacentHTML('beforeend', [FONKEL(-60, 40, 46), FONKEL(330, -20, 38), FONKEL(360, 250, 50), FONKEL(-30, 300, 34)].join(''));
  if (worp >= 7) rechts.append(confetti());
  await tikOfTijd(scherm, 1100);

  // 4. naar het bord
  await scherm.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished;
  scherm.remove();
}

function confetti(): HTMLElement {
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
