/**
 * Korte schermpjes voor wat er op een vakje gebeurt: het rad (herten, bok, pech), de drie
 * kans-rollen en de zeilwedstrijd. De uitkomst staat al vast in de spellogica; deze schermen
 * laten hem alleen zien. Elk scherm is in ongeveer 2 seconden klaar en met één tik weg.
 */
import { figuur } from '../data/figuren';
import { BOK_RAD, HERTEN_RAD, PECH_RAD, VLEERMUIS_RAD, type GameState, type Gebeurtenis, type RadSoort } from '../logic';
import { asset } from './asset';
import { icoon } from './iconen';
import { figuurPlaatje, maak } from './onderdelen';
import { KANS_TEKST, RADEN, type RadVak } from './uitkomsten';
import { TEMPO } from './tempo';
import { dobbelGeluid, muntTik } from '../audio/geluid';

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const VOLGORDE: Record<RadSoort, readonly string[]> = { hertenkamp: HERTEN_RAD, bok: BOK_RAD, pech: PECH_RAD, vleermuis: VLEERMUIS_RAD };

/** Een overlay met een vilten paneel. `klaar` wacht op "Verder" of een tik ernaast (of de tijd, voor bots). */
function overlay(laag: HTMLElement, klasse: string): { el: HTMLElement; paneel: HTMLElement; klaar: (autoMs?: number) => Promise<void> } {
  const el = maak('div', `overlay gebeurtenis-overlay ${klasse}`);
  const paneel = maak('div', 'gebeurtenis-paneel vilt paneel');
  el.append(paneel);
  laag.append(el);
  const klaar = (autoMs?: number) =>
    new Promise<void>((r) => {
      let t: ReturnType<typeof setTimeout> | undefined;
      const weg = () => {
        clearTimeout(t);
        el.remove();
        r();
      };
      if (autoMs !== undefined) {
        t = setTimeout(weg, autoMs);
        el.addEventListener('pointerdown', weg, { once: true });
        return;
      }
      const knop = maak('button', 'knop knop-groen gebeurtenis-verder');
      knop.type = 'button';
      knop.innerHTML = `${icoon.vinkje()}Verder`;
      paneel.append(knop);
      knop.addEventListener('click', weg, { once: true });
      el.addEventListener('pointerdown', (e) => e.target === el && weg());
    });
  return { el, paneel, klaar };
}

const f = (n: number) => n.toFixed(1);

/** Het rad als SVG: N gekleurde taartpunten met een korte tekst. */
function radSvg(vakken: { kort: string; kleur: string }[], straal = 150): string {
  const n = vakken.length;
  const stuk = (Math.PI * 2) / n;
  const punt = (hoek: number, r: number) => [straal + r * Math.sin(hoek), straal - r * Math.cos(hoek)];
  const delen = vakken.map((v, i) => {
    const [x1, y1] = punt(i * stuk, straal - 6);
    const [x2, y2] = punt((i + 1) * stuk, straal - 6);
    const midden = (i + 0.5) * stuk;
    const [tx, ty] = punt(midden, straal * 0.6);
    const graden = (midden * 180) / Math.PI;
    return `<path d="M${straal} ${straal} L${f(x1)} ${f(y1)} A${straal - 6} ${straal - 6} 0 0 1 ${f(x2)} ${f(y2)} Z" fill="${v.kleur}" stroke="#FFF6E6" stroke-width="5"/>
      <text x="${f(tx)}" y="${f(ty)}" transform="rotate(${f(graden)} ${f(tx)} ${f(ty)})" text-anchor="middle" dominant-baseline="middle">${v.kort}</text>`;
  });
  const d = straal * 2;
  return `<svg class="rad-schijf" width="${d}" height="${d}" viewBox="0 0 ${d} ${d}" aria-hidden="true">
    <circle cx="${straal}" cy="${straal}" r="${straal - 2}" fill="#FFF6E6"/>
    ${delen.join('')}
    <circle cx="${straal}" cy="${straal}" r="${straal - 8}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6 6" opacity=".6"/>
    <circle cx="${straal}" cy="${straal}" r="22" fill="#FFF6E6" stroke="#D9C29C" stroke-width="4"/></svg>`;
}

/** Het rad draait en stopt op de uitkomst. */
export async function toonRad(laag: HTMLElement, s: GameState, g: Extract<Gebeurtenis, { soort: 'rad' }>): Promise<void> {
  const info = RADEN[g.rad];
  const volgorde = VOLGORDE[g.rad];
  await draaiRad(laag, {
    klasse: `rad-${g.rad}`,
    titel: info.titel,
    uitleg: `${s.spelers[g.speler].naam} · ${info.uitleg}`,
    vakken: volgorde.map((k) => info.vakken[k]),
    uitkomst: () => volgorde.indexOf(g.uitkomst),
  });
}

/**
 * Een rad met vakken. Met `draai` staat het rad eerst stil: een mens tikt op "Draai!", bij een bot
 * draait het vanzelf (`draai: 'vanzelf'`). `uitkomst` wordt pas bij het draaien gevraagd, zodat de
 * spellogica dan pas beslist. Klaar na "Verder".
 */
export async function draaiRad(
  laag: HTMLElement,
  opties: {
    klasse?: string;
    titel: string;
    uitleg: string;
    vakken: RadVak[];
    uitkomst: () => number;
    draai?: 'knop' | 'vanzelf';
  },
): Promise<void> {
  const { vakken } = opties;
  const { paneel, klaar } = overlay(laag, `rad-overlay ${opties.klasse ?? ''}`);
  paneel.innerHTML = `
    <div class="gebeurtenis-kop"><h2></h2><p></p></div>
    <div class="rad"><div class="rad-draai">${radSvg(vakken)}</div><div class="rad-wijzer"></div></div>
    <p class="gebeurtenis-uitslag"></p>`;
  paneel.querySelector('h2')!.textContent = opties.titel;
  paneel.querySelector('.gebeurtenis-kop p')!.textContent = opties.uitleg;
  const uitslag = paneel.querySelector<HTMLElement>('.gebeurtenis-uitslag')!;

  if (opties.draai === 'knop') {
    const knop = maak('button', 'knop gebeurtenis-verder');
    knop.type = 'button';
    knop.textContent = 'Draai!';
    paneel.append(knop);
    await new Promise<void>((r) => knop.addEventListener('click', () => r(), { once: true }));
    knop.remove();
  } else if (opties.draai === 'vanzelf') {
    await wacht(900);
  }

  const i = opties.uitkomst();
  const midden = ((i + 0.5) * 360) / vakken.length;
  const eind = 360 * 4 - midden;
  const draai = paneel.querySelector<HTMLElement>('.rad-draai')!;
  await draai.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${eind}deg)` }], {
    duration: 1500,
    easing: 'cubic-bezier(.15,.7,.25,1)',
    fill: 'forwards',
  }).finished.catch(() => {});
  uitslag.textContent = vakken[i].zin;
  uitslag.style.color = vakken[i].kleur;
  uitslag.classList.add('zichtbaar');
  await klaar();
}

function figuurRondje(s: GameState, i: number): HTMLElement {
  const f = figuur(s.spelers[i].figuur);
  const el = maak('div', 'kans-figuur');
  el.style.background = f.kleurLicht;
  el.append(figuurPlaatje(f, s.spelers[i].naam, 'kans-figuur-plaatje'));
  return el;
}

/** Kans: drie rollen (speler A, actie, speler B) die na elkaar stoppen. */
export async function toonKans(laag: HTMLElement, s: GameState, g: Extract<Gebeurtenis, { soort: 'kans' }>): Promise<void> {
  const { paneel, klaar } = overlay(laag, 'kans-overlay');
  paneel.innerHTML = `
    <div class="gebeurtenis-kop"><h2>Kans!</h2><p></p></div>
    <div class="kans-rollen"><div class="kans-rol" data-a></div><div class="kans-rol kans-actie" data-actie></div><div class="kans-rol" data-b></div></div>
    <p class="gebeurtenis-uitslag"></p>`;
  paneel.querySelector('.gebeurtenis-kop p')!.textContent = `${s.spelers[g.speler].naam} draait aan de rollen…`;
  const [rolA, rolActie, rolB] = ['[data-a]', '[data-actie]', '[data-b]'].map((q) => paneel.querySelector<HTMLElement>(q)!);
  const acties = Object.values(KANS_TEKST).map((k) => k.kort);
  const zet = (rol: HTMLElement, inhoud: HTMLElement | string) => {
    if (typeof inhoud === 'string') rol.textContent = inhoud;
    else rol.replaceChildren(inhoud);
  };
  /**
   * Eén rol draait en loopt steeds langzamer, tot hij na `duur` ms stilstaat op de uitkomst.
   * Elke stap tikt even; bij het stoppen klinkt een bonk.
   */
  const draai = async (rol: HTMLElement, toon: (n: number) => HTMLElement | string, uitkomst: HTMLElement | string, duur: number, begin: number) => {
    const start = performance.now();
    let n = begin;
    for (;;) {
      const verstreken = performance.now() - start;
      if (verstreken >= duur) break;
      zet(rol, toon(n++));
      muntTik(true);
      // Eerst snel (70 ms per stap), op het eind steeds langzamer (tot ±320 ms).
      const t = verstreken / duur;
      await wacht(70 + 250 * t * t * t);
    }
    zet(rol, uitkomst);
    rol.classList.add('vast');
    dobbelGeluid();
  };
  await Promise.all([
    draai(rolA, (n) => figuurRondje(s, n % s.spelers.length), figuurRondje(s, g.a), TEMPO.kansA, 0),
    draai(rolActie, (n) => acties[n % acties.length], KANS_TEKST[g.actie].kort, TEMPO.kansActie, 1),
    draai(rolB, (n) => figuurRondje(s, n % s.spelers.length), figuurRondje(s, g.b), TEMPO.kansB, 2),
  ]);
  const uitslag = paneel.querySelector<HTMLElement>('.gebeurtenis-uitslag')!;
  uitslag.textContent = g.gelukt
    ? KANS_TEKST[g.actie].zin(s.spelers[g.a].naam, s.spelers[g.b].naam)
    : `${s.spelers[g.a].naam} heeft niets om te geven. Geluk gehad!`;
  uitslag.classList.add('zichtbaar');
  await klaar();
}

/**
 * De zeilwedstrijd: vier bootjes racen over de plas, de hoogste worp wint.
 * `autoMs` = vanzelf weg (voor bots); anders wacht het op "Verder".
 */
export async function toonZeilwedstrijd(
  laag: HTMLElement,
  s: GameState,
  g: Extract<Gebeurtenis, { soort: 'zeilwedstrijd' }>,
  autoMs?: number,
): Promise<void> {
  const { paneel, klaar } = overlay(laag, `zeil-overlay${g.lampionnen ? ' lampionnen' : ''}`);
  paneel.innerHTML = `
    <div class="gebeurtenis-kop"><h2>${g.lampionnen ? 'Lampionnenrace!' : 'Zeilwedstrijd!'}</h2><p></p></div>
    <div class="zeil-water"><div class="zeil-finish"></div></div>
    <p class="gebeurtenis-uitslag"></p>`;
  paneel.querySelector('.gebeurtenis-kop p')!.textContent =
    `${s.spelers[g.speler].naam} organiseert een race over de plas. De winnaar krijgt ${g.prijs} munten!`;
  const water = paneel.querySelector<HTMLElement>('.zeil-water')!;
  const boten = s.spelers.map((sp, i) => {
    const baan = maak('div', 'zeil-baan');
    const boot = maak('div', 'zeil-boot');
    boot.innerHTML = `<img class="zeil-bootje" src="${asset('iconen/vakje-boot.svg')}" alt="">`;
    boot.append(figuurRondje(s, i));
    const worp = maak('span', 'zeil-worp', String(g.worpen[i]));
    boot.append(worp);
    baan.append(boot);
    water.append(baan);
    return { boot, baan, sp };
  });
  // Eerst liggen de bootjes klaar bij de start: "Klaar… Af!"
  const start = maak('div', 'zeil-start', 'Klaar…');
  water.append(start);
  await wacht(TEMPO.zeilStart * 0.6);
  start.textContent = 'Af!';
  start.classList.add('af');
  await wacht(TEMPO.zeilStart * 0.4);
  start.remove();
  // De snelste boot haalt precies de finish; de rest naar verhouding van hun worp.
  // Onderweg varen ze niet allemaal even hard, zodat ze elkaar kunnen inhalen; de uitslag
  // blijft die van de worpen.
  const breedte = water.clientWidth - 170;
  const hoogste = Math.max(...g.worpen);
  await Promise.all(
    boten.map(({ boot }, i) => {
      const eind = (breedte * g.worpen[i]) / hoogste;
      // Elk bootje heeft zijn eigen tempo (soms eerst snel, soms een eindsprint), maar vaart nooit terug.
      const vorm = Math.sin(i * 2.1 + 1);
      const frames: Keyframe[] = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => ({
        transform: `translateX(${(eind * (t + 0.18 * Math.sin(Math.PI * t) * vorm)).toFixed(1)}px)`,
        offset: t,
      }));
      return boot.animate(frames, { duration: TEMPO.zeilRace, easing: 'ease-in-out', fill: 'forwards' }).finished.catch(() => {});
    }),
  );
  boten.forEach(({ baan }, i) => {
    baan.classList.add('klaar');
    if (g.winnaars.includes(i)) baan.classList.add('winnaar');
  });
  const uitslag = paneel.querySelector<HTMLElement>('.gebeurtenis-uitslag')!;
  const namen = g.winnaars.map((i) => s.spelers[i].naam).join(' en ');
  uitslag.textContent = `${namen} ${g.winnaars.length > 1 ? 'winnen' : 'wint'} ${g.prijs} munten! ${s.spelers[g.speler].naam} krijgt +2 als organisator.`;
  uitslag.classList.add('zichtbaar');
  await klaar(autoMs);
}
