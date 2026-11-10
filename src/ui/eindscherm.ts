/**
 * Het einde van het spel (§10), in het uiterlijk van eindscherm.html uit het design:
 * de bonussterren-ceremonie met Pommie, daarna het podium met de winnaar, de bonussterren,
 * de grafiek "Sterren per ronde" en een statistiekenscherm.
 *
 * De bonussterren zijn die uit ONTWERP.md (Minigame-, Rijkaard- en Avonturier-ster), niet die
 * uit het design (Muntenster, Pechster).
 */
import { figuur } from '../data/figuren';
import { zeg, type Moment } from '../data/teksten';
import { fanfare, sterGeluid } from '../audio/geluid';
import type { BonusSoort, GameState } from '../logic';
import { asset } from './asset';
import { confetti } from './dobbelscherm';
import { grafiekSchaal, sterrenGrafiek } from './grafiek';
import { leestijd, pommieZegt } from './pommie';
import { sterFeest } from './sterFeest';
import { figuurPlaatje, maak, maakPodium, PLAATS_KLEUR } from './onderdelen';

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ster = (maat: number) => `<img src="${asset('iconen/ster.svg')}" alt="" width="${maat}" height="${maat}">`;
const munt = (maat: number) => `<img src="${asset('iconen/munt.svg')}" alt="" width="${maat}" height="${maat}">`;

const BONUS_INFO: Record<BonusSoort, { naam: string; uitleg: string; waarde: (s: GameState, i: number) => string }> = {
  minigame: {
    naam: 'Minigame-ster',
    uitleg: 'Meeste munten verdiend met minigames',
    waarde: (s, i) => `${s.spelers[i].stats.minigameMunten}`,
  },
  rijkaard: {
    naam: 'Rijkaard-ster',
    uitleg: 'Hoogste muntenstand ooit',
    waarde: (s, i) => `${s.spelers[i].stats.hoogsteMunten}`,
  },
  avonturier: {
    naam: 'Avonturier-ster',
    uitleg: 'Vaakst op een event-, hertenkamp- of vleermuisvakje',
    waarde: (s, i) => `${s.spelers[i].stats.avontuurVakjes}×`,
  },
};

/** Namen als "Floris", "Floris en Bot 1" of "Floris, Bot 1 en Bot 2". */
export function namenLijst(namen: string[]): string {
  return namen.length <= 1 ? (namen[0] ?? '') : `${namen.slice(0, -1).join(', ')} en ${namen.at(-1)}`;
}

/** Het speler-pilletje uit het design: rond plaatje en "Naam · waarde" op de lichte kleur van het figuur. */
function spelerPil(s: GameState, i: number, waarde: string): HTMLElement {
  const sp = s.spelers[i];
  const f = figuur(sp.figuur);
  const pil = maak('div', 'eind-pil');
  pil.style.background = f.kleurLicht;
  pil.append(figuurPlaatje(f, sp.naam, 'eind-pil-plaatje'), maak('span', '', `${sp.naam} · ${waarde}`));
  return pil;
}

export interface EindOpties {
  /** Met de ceremonie (net afgelopen) of meteen de uitslag (later via "Verder spelen"). */
  ceremonie: boolean;
  naarMenu: () => void;
}

export function toonEindscherm(ouder: HTMLElement, s: GameState, opties: EindOpties): void {
  const t = s.eindtelling!;
  const { buiten, podium: scherm } = maakPodium('eindscherm vilt');
  buiten.classList.add('eind-laag');
  scherm.innerHTML = `
    <div class="eind-boog"></div>
    <img class="vlaggetjes" src="${asset('iconen/vlaggetjes.svg')}" alt="">
    <div class="eind-kop">
      <span class="eind-label">EINDE VAN HET SPEL · ${s.instellingen.aantalRondes} RONDES</span>
      <h1></h1>
    </div>
    <div class="eind-knoppen">
      <button type="button" class="knop knop-wit knop-s" data-stats>Statistiek</button>
      <button type="button" class="knop knop-s" data-menu>Hoofdmenu</button>
    </div>
    <div class="eind-rest"></div>
    <div class="eind-trap"></div>
    <div class="eind-bonus vilt paneel">
      <div class="eind-paneel-kop"><h2>Bonussterren</h2><span></span></div>
      <div class="eind-bonus-rijen"></div>
    </div>
    <div class="eind-grafiek vilt paneel">
      <div class="eind-paneel-kop"><h2>Sterren per ronde</h2><div class="eind-legenda"></div></div>
      <div class="eind-grafiek-midden"><div class="eind-y"></div><div class="eind-svg"></div></div>
      <div class="eind-x"></div>
    </div>`;
  const winnaar = s.spelers[t.winnaar];
  scherm.querySelector('h1')!.textContent = `${winnaar.naam} is de Plas-kampioen!`;

  // ---- de trap: 2e, 1e, 3e (zoals in het design); de rest in een pilletje linksboven
  const trap = scherm.querySelector<HTMLElement>('.eind-trap')!;
  const HOOGTE = [210, 150, 110];
  const volgordeOpTrap = [1, 0, 2].filter((k) => k < t.ranglijst.length);
  const treden: HTMLElement[] = [];
  for (const k of volgordeOpTrap) {
    const i = t.ranglijst[k];
    const sp = s.spelers[i];
    const f = figuur(sp.figuur);
    const kolom = maak('div', 'eind-kolom');
    if (k === 0) kolom.insertAdjacentHTML('beforeend', `<img class="eind-kroon" src="${asset('iconen/ster.svg')}" alt="">`);
    const plaatje = figuurPlaatje(f, sp.naam, `eind-figuur${k === 0 ? ' winnaar' : ''}`);
    const trede = maak('div', 'eind-trede vilt');
    trede.style.height = `${HOOGTE[k]}px`;
    trede.style.backgroundColor = PLAATS_KLEUR[k];
    trede.innerHTML = `<span class="eind-plaats">${k + 1}e</span>
      <div class="eind-stand"><span>${ster(22)}<b>${sp.sterren}</b></span><span>${munt(20)}<b class="klein">${sp.munten}</b></span></div>`;
    kolom.append(plaatje, maak('span', 'eind-naam', sp.naam), trede);
    trap.append(kolom);
    treden.push(kolom);
  }
  const rest = scherm.querySelector<HTMLElement>('.eind-rest')!;
  t.ranglijst.slice(3).forEach((i, n) => {
    const sp = s.spelers[i];
    const pil = maak('div', 'eind-rest-pil');
    pil.innerHTML = `<div class="plaats-rondje eind-rest-plaats" style="background:${PLAATS_KLEUR[3]}">${n + 4}e</div>`;
    pil.append(figuurPlaatje(figuur(sp.figuur), sp.naam, 'eind-rest-plaatje'), maak('span', '', `${sp.naam} · ${sp.sterren} ${sp.sterren === 1 ? 'ster' : 'sterren'}`));
    rest.append(pil);
  });

  // ---- bonussterren
  const bonusPaneel = scherm.querySelector<HTMLElement>('.eind-bonus')!;
  const rijen = scherm.querySelector<HTMLElement>('.eind-bonus-rijen')!;
  const uitgereikt = t.bonussterren.filter((b) => b.spelers.length > 0).length;
  bonusPaneel.querySelector('.eind-paneel-kop span')!.textContent = s.instellingen.bonussterren
    ? `${uitgereikt} van 3 uitgereikt`
    : 'staan uit';
  const bonusRijen = t.bonussterren.map((b) => {
    const info = BONUS_INFO[b.soort];
    const rij = maak('div', 'eind-bonus-rij');
    rij.innerHTML = `<div class="eind-bonus-icoon">${ster(40)}</div>
      <div class="eind-bonus-tekst"><span></span><small></small></div>
      <div class="eind-bonus-wie"></div>`;
    rij.querySelector('.eind-bonus-tekst span')!.textContent = info.naam;
    rij.querySelector('.eind-bonus-tekst small')!.textContent = info.uitleg;
    const wie = rij.querySelector<HTMLElement>('.eind-bonus-wie')!;
    if (b.spelers.length === 0) wie.append(maak('span', 'eind-niemand', 'niemand'));
    for (const i of b.spelers) wie.append(spelerPil(s, i, info.waarde(s, i)));
    rijen.append(rij);
    return { rij, wie, b };
  });
  if (!s.instellingen.bonussterren) {
    rijen.append(maak('p', 'eind-bonus-uit', 'De bonussterren stonden uit in dit spel.'));
  }

  // ---- grafiek
  const lijnen = s.spelers.map((sp) => ({ figuur: figuur(sp.figuur), waarden: sp.stats.sterrenPerRonde }));
  const rondes = Math.max(1, ...lijnen.map((l) => l.waarden.length));
  const svg = sterrenGrafiek(lijnen, rondes);
  scherm.querySelector('.eind-svg')!.innerHTML = svg;
  const yAs = scherm.querySelector<HTMLElement>('.eind-y')!;
  for (const v of grafiekSchaal(lijnen).stappen) yAs.append(maak('span', '', String(v)));
  const xAs = scherm.querySelector<HTMLElement>('.eind-x')!;
  for (let r = 1; r <= rondes; r++) xAs.append(maak('span', '', rondes > 12 && r % 2 === 0 && r !== rondes ? '' : String(r)));
  const legenda = scherm.querySelector<HTMLElement>('.eind-legenda')!;
  s.spelers.forEach((sp) => {
    const l = maak('span', 'eind-legenda-item', sp.naam);
    const streep = maak('span', 'eind-streep');
    streep.style.background = figuur(sp.figuur).kleur;
    l.prepend(streep);
    legenda.append(l);
  });

  // ---- knoppen
  scherm.querySelector('[data-menu]')!.addEventListener('click', opties.naarMenu, { once: true });
  scherm.querySelector('[data-stats]')!.addEventListener('click', () => toonStatistiek(scherm, s));

  ouder.append(buiten);

  if (!opties.ceremonie) return;
  void ceremonie();

  async function ceremonie() {
    scherm.classList.add('in-ceremonie');
    const pommie = (tekst: string, ms?: number) => pommieZegt(scherm, tekst, { klasse: 'eind-pommie', autoMs: ms });
    await wacht(500);
    if (!s.instellingen.bonussterren) {
      await pommie(zeg('bonusUit'));
    } else {
      await pommie(zeg('bonusIntro'));
      for (const { rij, b } of bonusRijen) {
        rij.classList.add('uitgelicht');
        await wacht(450);
        rij.classList.add('onthuld');
        if (b.spelers.length) {
          // Een bonusster is ook een feest: stralen, de ster groot in beeld, een fanfaretje.
          const namen = namenLijst(b.spelers.map((i) => s.spelers[i].naam));
          await sterFeest(scherm, {
            tekst: `${namen} ${b.spelers.length > 1 ? 'krijgen' : 'krijgt'} de ${BONUS_INFO[b.soort].naam}!`,
            kort: true,
            bijRaak: sterGeluid,
          });
        }
        const tekst = b.spelers.length
          ? zeg(`bonus_${b.soort}` as Moment, namenLijst(b.spelers.map((i) => s.spelers[i].naam)))
          : zeg('bonusNiemand');
        await pommie(tekst, Math.min(4200, leestijd(tekst)));
        rij.classList.remove('uitgelicht');
      }
    }
    if (t.beslisWorpen.length) {
      const worpen = t.beslisWorpen.map((w) => `${s.spelers[w.speler].naam} ${w.waarde}`).join(', ');
      await pommie(zeg('beslisworp', { worpen }));
    }
    // Pommie noemt de winnaar (de naam komt pas aan het eind van zijn zin), daarna komt de trap
    // omhoog, speelt het fanfaretje en valt er confetti.
    await pommie(zeg('winnaar', winnaar.naam));
    scherm.classList.remove('in-ceremonie');
    scherm.classList.add('onthulling');
    fanfare();
    scherm.append(confetti());
  }
}

/** Het statistiekenscherm (§10): per speler wat er gebeurde, naast de grafiek op het eindscherm. */
function toonStatistiek(scherm: HTMLElement, s: GameState): void {
  const RIJEN: { naam: string; waarde: (i: number) => number }[] = [
    { naam: 'Sterren', waarde: (i) => s.spelers[i].sterren },
    { naam: 'Munten', waarde: (i) => s.spelers[i].munten },
    { naam: 'Munten met minigames', waarde: (i) => s.spelers[i].stats.minigameMunten },
    { naam: 'Hoogste muntenstand', waarde: (i) => s.spelers[i].stats.hoogsteMunten },
    { naam: 'Sterren gekocht', waarde: (i) => s.spelers[i].stats.sterrenGekocht },
    { naam: 'Op rood beland', waarde: (i) => s.spelers[i].stats.roodVakjes },
    { naam: 'De bok tegengekomen', waarde: (i) => s.spelers[i].stats.bokOntmoetingen },
    { naam: 'Avonturen', waarde: (i) => s.spelers[i].stats.avontuurVakjes },
  ];
  const el = maak('div', 'eind-stats');
  const paneel = maak('div', 'eind-stats-paneel vilt paneel');
  paneel.setAttribute('role', 'dialog');
  const tabel = maak('table', 'eind-tabel');
  const kop = maak('tr');
  kop.append(maak('th'));
  s.spelers.forEach((sp) => {
    const th = maak('th');
    const f = figuur(sp.figuur);
    const rond = maak('div', 'eind-tabel-figuur');
    rond.style.background = f.kleurLicht;
    rond.append(figuurPlaatje(f, sp.naam, 'eind-pil-plaatje'));
    th.append(rond, maak('span', '', sp.naam));
    kop.append(th);
  });
  tabel.append(kop);
  for (const r of RIJEN) {
    const tr = maak('tr');
    tr.append(maak('td', 'eind-tabel-naam', r.naam));
    const waarden = s.spelers.map((_, i) => r.waarde(i));
    const hoogste = Math.max(...waarden);
    waarden.forEach((w) => tr.append(maak('td', w === hoogste && w > 0 ? 'hoogste' : '', String(w))));
    tabel.append(tr);
  }
  const terug = maak('button', 'knop knop-wit', 'Terug');
  terug.type = 'button';
  paneel.append(maak('h2', 'eind-stats-titel', 'Statistiek'), tabel, terug);
  el.append(paneel);
  const sluit = () => el.remove();
  terug.addEventListener('click', sluit, { once: true });
  el.addEventListener('click', (e) => e.target === el && sluit());
  scherm.append(el);
}
