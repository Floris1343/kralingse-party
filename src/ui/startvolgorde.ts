/**
 * Na de startworp (§2): de volgorde 1 t/m 4 in beeld, met de worpen, en de knop "Start!".
 * In de stijl van de minigame-uitslag: vilten paneel, plaatsrondjes en de figuren op hun kleur.
 */
import { figuur } from '../data/figuren';
import type { GameState } from '../logic';
import { icoon } from './iconen';
import { figuurPlaatje, maak, plaatsRondje } from './onderdelen';

export function toonStartvolgorde(laag: HTMLElement, s: GameState): Promise<void> {
  const el = maak('div', 'overlay startvolgorde');
  const paneel = maak('div', 'startvolgorde-paneel vilt paneel');
  paneel.setAttribute('role', 'dialog');
  paneel.append(maak('h2', 'startvolgorde-titel', 'De volgorde'), maak('p', 'startvolgorde-uitleg', 'Zo spelen jullie het hele spel.'));
  const rij = maak('div', 'startvolgorde-rij');
  s.volgorde.forEach((i, k) => {
    const sp = s.spelers[i];
    const f = figuur(sp.figuur);
    const kaart = maak('div', 'startvolgorde-kaart');
    kaart.style.setProperty('--kleur', f.kleur);
    kaart.style.animationDelay = `${k * 120}ms`;
    const rond = maak('div', 'startvolgorde-figuur');
    rond.style.background = f.kleurLicht;
    rond.append(figuurPlaatje(f, sp.naam, 'startvolgorde-plaatje'));
    const worpen = s.startworpen[i];
    kaart.append(
      plaatsRondje(k + 1, 'startvolgorde-plaats'),
      rond,
      maak('b', 'startvolgorde-naam', sp.naam),
      maak('span', 'startvolgorde-worp', `gooide ${worpen.join(' · ')}`),
    );
    rij.append(kaart);
  });
  const start = maak('button', 'knop knop-groot startvolgorde-start');
  start.type = 'button';
  start.innerHTML = `${icoon.play()}<span>Start!</span>`;
  paneel.append(rij, start);
  el.append(paneel);
  laag.append(el);
  return new Promise((r) =>
    start.addEventListener('click', () => {
      el.remove();
      r();
    }, { once: true }),
  );
}
