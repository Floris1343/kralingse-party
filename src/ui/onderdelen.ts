/** Kleine bouwstenen die op meerdere schermen terugkomen (uit het design). */
import type { Figuur } from '../data/figuren';
import { plaatje } from './asset';

/** Kleur van het plaatsrondje: goud, zilver, brons, zand (design: spelersbalk). */
export const PLAATS_KLEUR = ['#FFC928', '#D9DEE6', '#E8A872', '#F1E3CC'];

/** Rondje met "1e", "2e" enz. */
export function plaatsRondje(plaats: number, klasse = ''): HTMLDivElement {
  const el = document.createElement('div');
  el.className = `plaats-rondje ${klasse}`;
  zetPlaats(el, plaats);
  return el;
}

export function zetPlaats(el: HTMLElement, plaats: number): void {
  el.textContent = `${plaats}e`;
  el.style.background = PLAATS_KLEUR[plaats - 1] ?? PLAATS_KLEUR[3];
}

/** Het plaatje van een figuur. Handgetekende figuren krijgen het witte randje uit het design. */
export function figuurPlaatje(f: Figuur, naam: string, klasse = ''): HTMLElement {
  return plaatje(f.bestand, naam, f.kleur, `${klasse}${f.handgetekend ? ' handgetekend' : ' pion'}`);
}

/** Maakt een element met een klasse en (optioneel) tekst. */
export function maak<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  klasse = '',
  tekst?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (klasse) el.className = klasse;
  if (tekst !== undefined) el.textContent = tekst;
  return el;
}

/** Designmaat van elk scherm (iPad Air 11" liggend). */
export const DESIGN_BREEDTE = 1180;
export const DESIGN_HOOGTE = 820;

/**
 * Een "podium" van precies de designmaat dat meeschaalt met het scherm, zodat een scherm er op
 * elke iPad uitziet als in het design. `buiten` vult het hele scherm (voor de achtergrond).
 */
export function maakPodium(klasse: string, tag: 'main' | 'div' = 'div'): { buiten: HTMLElement; podium: HTMLElement } {
  const buiten = maak(tag, `podium-buiten ${klasse}`);
  const podium = maak('div', 'podium');
  buiten.append(podium);
  const meet = () => {
    if (!buiten.isConnected) return window.removeEventListener('resize', meet);
    const w = buiten.clientWidth || window.innerWidth;
    const h = buiten.clientHeight || window.innerHeight;
    podium.style.setProperty('--schaal', String(Math.min(w / DESIGN_BREEDTE, h / DESIGN_HOOGTE)));
  };
  window.addEventListener('resize', meet);
  requestAnimationFrame(meet);
  podium.style.setProperty('--schaal', String(Math.min(window.innerWidth / DESIGN_BREEDTE, window.innerHeight / DESIGN_HOOGTE)));
  return { buiten, podium };
}
