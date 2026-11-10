/**
 * Een ster kopen is een feest (§11): het bord wordt donker, achter de ster draaien gouden
 * lichtstralen, er fonkelen sterretjes, de ster zweeft groot in het midden en vliegt dan in een
 * boog naar je figuur. Bij het raken een uitbarsting van glitters en confetti.
 * En de sippe versie: een ster vliegt van je figuur weg naar de ander.
 *
 * Alleen transform en opacity worden geanimeerd, en er zijn niet meer dan ±30 deeltjes tegelijk,
 * zodat het soepel blijft op de iPad. Met een tik sla je het over.
 */
import { brabbel, sterFanfare, sterKwijtGeluid } from '../audio/geluid';
import { asset } from './asset';
import { maak } from './onderdelen';
import { TEMPO } from './tempo';

/** Alle tijden van het feest worden met deze factor vermenigvuldigd (zie tempo.ts). */
const F = TEMPO.sterFeest;

const wacht = (ms: number, stop: { af: boolean; tik?: () => void }) =>
  new Promise<void>((r) => {
    const t = setTimeout(r, ms * F);
    stop.tik = () => {
      clearTimeout(t);
      r();
    };
  });

type Punt = [number, number];

export interface FeestOpties {
  /** Grote tekst, bijvoorbeeld "Floris heeft een ster!". */
  tekst: string;
  /** Wat Pommie juichend roept (met gebrabbel). Leeg = geen Pommie. */
  pommie?: string;
  /** Waar de ster heen vliegt (het figuur op het scherm). Leeg = hij blijft in het midden. */
  doel?: () => Punt | null;
  /** Korter, voor een bot (±1,5 s in plaats van ±2,5 s). */
  kort?: boolean;
  /** Als de ster het figuur raakt (of als je het overslaat): de balk stuitert, het figuur springt. */
  bijRaak?: () => void;
}

/** Lichtstralen: één SVG met brede gouden punten die langzaam ronddraait. */
function stralen(): string {
  const n = 14;
  const punten = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const b = a + Math.PI / n;
    const r = 700;
    return `<path d="M0 0 L${(Math.cos(a) * r).toFixed(0)} ${(Math.sin(a) * r).toFixed(0)} L${(Math.cos(b) * r).toFixed(0)} ${(Math.sin(b) * r).toFixed(0)} Z"/>`;
  }).join('');
  return `<svg class="feest-stralen" viewBox="-700 -700 1400 1400" aria-hidden="true"><defs><radialGradient id="feest-goud"><stop offset="0" stop-color="#FFF3A0" stop-opacity=".95"/><stop offset=".6" stop-color="#FFC928" stop-opacity=".45"/><stop offset="1" stop-color="#FFC928" stop-opacity="0"/></radialGradient></defs><g fill="url(#feest-goud)">${punten}</g></svg>`;
}

/** Fonkelende sterretjes en glitters verspreid over het scherm. */
function fonkels(aantal: number): HTMLElement {
  const el = maak('div', 'feest-fonkels');
  for (let i = 0; i < aantal; i++) {
    const f = maak('i', i % 3 === 0 ? 'ster' : '');
    f.style.left = `${5 + Math.random() * 90}%`;
    f.style.top = `${8 + Math.random() * 84}%`;
    f.style.setProperty('--maat', `${10 + Math.random() * 22}px`);
    f.style.animationDelay = `${Math.round(Math.random() * 900)}ms`;
    el.append(f);
  }
  return el;
}

/** Een uitbarsting van glitters en confetti op één punt. */
function uitbarsting(laag: HTMLElement, [x, y]: Punt): void {
  const el = maak('div', 'feest-burst');
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  const kleuren = ['#FFC928', '#FFFFFF', '#F47B20', '#2FAE5B', '#2F7DE1', '#E8433A', '#E85AAE'];
  for (let i = 0; i < 18; i++) {
    const d = maak('i', i % 4 === 0 ? 'ster' : '');
    const hoek = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
    const afstand = 70 + Math.random() * 90;
    d.style.setProperty('--x', `${(Math.cos(hoek) * afstand).toFixed(0)}px`);
    d.style.setProperty('--y', `${(Math.sin(hoek) * afstand).toFixed(0)}px`);
    d.style.setProperty('--r', `${Math.round(Math.random() * 360)}deg`);
    d.style.background = kleuren[i % kleuren.length];
    el.append(d);
  }
  laag.append(el);
  setTimeout(() => el.remove(), 900);
}

/** Een boog van `van` naar `naar` als keyframes (translate en scale). */
function boog(van: Punt, naar: Punt, schaalVan: number, schaalNaar: number, hoogte: number): Keyframe[] {
  const frames: Keyframe[] = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10;
    const x = van[0] + (naar[0] - van[0]) * t;
    const y = van[1] + (naar[1] - van[1]) * t - Math.sin(Math.PI * t) * hoogte;
    const s = schaalVan + (schaalNaar - schaalVan) * t;
    frames.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${s.toFixed(3)})`, offset: t });
  }
  return frames;
}

/** Het grote sterfeest. Klaar na ±2,5 s (bot ±1,5 s), of meteen na een tik. */
export async function sterFeest(laag: HTMLElement, opties: FeestOpties): Promise<void> {
  const kort = opties.kort ?? false;
  const stop: { af: boolean; tik?: () => void } = { af: false };
  const el = maak('div', 'ster-feest');
  el.innerHTML = stralen();
  el.append(fonkels(kort ? 10 : 16));
  const midden: Punt = [laag.clientWidth / 2, laag.clientHeight * 0.44];
  const ster = maak('img', 'feest-ster');
  ster.src = asset('iconen/ster.svg');
  ster.alt = '';
  ster.style.transform = `translate(${midden[0]}px, ${midden[1]}px) translate(-50%, -50%) scale(0)`;
  const tekst = maak('div', 'feest-tekst', opties.tekst);
  el.append(ster, tekst);
  let stopBrabbel = () => {};
  if (opties.pommie) {
    const p = maak('div', 'feest-pommie');
    p.innerHTML = `<img src="${asset('personages/pommie.svg')}" alt="Pommie"><div class="ballon ballon-links"><div class="ballon-naam">Pommie</div><p></p></div>`;
    p.querySelector('p')!.textContent = opties.pommie;
    el.append(p);
    stopBrabbel = brabbel(opties.pommie);
  }
  laag.append(el);
  sterFanfare();

  let geraakt = false;
  const raak = () => {
    if (geraakt) return;
    geraakt = true;
    opties.bijRaak?.();
  };
  el.addEventListener('pointerdown', () => {
    stop.af = true;
    stop.tik?.();
  });

  // 1. De ster ploft groot in het midden.
  ster.animate(
    [
      { transform: `translate(${midden[0]}px, ${midden[1]}px) translate(-50%, -50%) scale(0) rotate(-40deg)` },
      { transform: `translate(${midden[0]}px, ${midden[1]}px) translate(-50%, -50%) scale(1.15) rotate(8deg)`, offset: 0.7 },
      { transform: `translate(${midden[0]}px, ${midden[1]}px) translate(-50%, -50%) scale(1) rotate(0deg)` },
    ],
    { duration: 420 * F, easing: 'ease-out', fill: 'forwards' },
  );
  await wacht(kort ? 750 : 1450, stop);

  // 2. De ster vliegt in een boog naar het figuur.
  const doel = opties.doel?.() ?? null;
  if (!stop.af && doel) {
    el.classList.add('vlucht');
    const vlucht = ster.animate(boog(midden, doel, 1, 0.22, 160), { duration: (kort ? 420 : 620) * F, easing: 'ease-in', fill: 'forwards' });
    await Promise.race([vlucht.finished.catch(() => {}), wacht(kort ? 450 : 650, stop)]);
    if (!stop.af) {
      ster.style.opacity = '0';
      uitbarsting(el, doel);
      raak();
      await wacht(kort ? 330 : 480, stop);
    }
  } else if (!stop.af) {
    raak();
    await wacht(kort ? 300 : 600, stop);
  }

  // 3. Weg.
  raak();
  stopBrabbel();
  el.classList.add('weg');
  await new Promise((r) => setTimeout(r, 260));
  el.remove();
}

/** De sippe versie: de ster vliegt van het ene figuur naar het andere, met een dalend geluid. */
export async function sterWegAnimatie(
  laag: HTMLElement,
  opties: { tekst: string; van: Punt; naar: Punt; kort?: boolean; bijVertrek?: () => void; bijAankomst?: () => void },
): Promise<void> {
  const stop: { af: boolean; tik?: () => void } = { af: false };
  const el = maak('div', 'ster-weg');
  const ster = maak('img', 'feest-ster klein');
  ster.src = asset('iconen/ster.svg');
  ster.alt = '';
  const tekst = maak('div', 'feest-tekst sip', opties.tekst);
  el.append(ster, tekst);
  laag.append(el);
  el.addEventListener('pointerdown', () => {
    stop.af = true;
    stop.tik?.();
  });
  sterKwijtGeluid();
  opties.bijVertrek?.();
  const duur = (opties.kort ? 700 : 1100) * F;
  const vlucht = ster.animate(boog(opties.van, opties.naar, 0.55, 0.4, 120), { duration: duur, easing: 'ease-in-out', fill: 'forwards' });
  await Promise.race([vlucht.finished.catch(() => {}), wacht(duur / F + 30, stop)]);
  opties.bijAankomst?.();
  if (!stop.af) await wacht(opties.kort ? 250 : 500, stop);
  el.classList.add('weg');
  await new Promise((r) => setTimeout(r, 220));
  el.remove();
}
