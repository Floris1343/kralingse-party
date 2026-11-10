/**
 * Minigame-scherm met het invoeren van de uitslag (design: minigame-uitslag.html, §5).
 * Tik de figuren aan in de volgorde van finish. "Gelijk met vorige" zet de volgende (of, als
 * iedereen al een plek heeft, de laatste) op dezelfde plek als de vorige. De laatste krijgt
 * vanzelf de laatste plek.
 */
import { figuur } from '../data/figuren';
import { zeg } from '../data/teksten';
import type { GameState, MinigameUitslag } from '../logic';
import { asset } from './asset';
import { icoon } from './iconen';
import { figuurPlaatje, maak, maakPodium, PLAATS_KLEUR } from './onderdelen';

const SEIZOEN: Record<string, [string, string]> = {
  zomer: ['Zomer', 'iconen/zon.svg'],
  winter: ['Winter', 'iconen/sneeuw.svg'],
  wisselend: ['Wisselend', 'iconen/maan.svg'],
};

const OPNIEUW_ICOON = `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 L4 11 L9 15 M4 11 H14 A6 6 0 0 1 14 23" fill="none" stroke="#2B1D14" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -3)"></path></svg>`;

/** Laat het scherm zien en geeft de bevestigde uitslag terug. */
export function vraagMinigameUitslag(laag: HTMLElement, s: GameState): Promise<MinigameUitslag> {
  const aantal = s.spelers.length;
  let groepen: number[][] = [];
  let gelijkKlaar = false;

  const { buiten, podium: scherm } = maakPodium('minigame vilt');
  const nogTeGaan = s.instellingen.aantalRondes - s.ronde;
  const [seizoen, seizoenIcoon] = SEIZOEN[s.instellingen.seizoen];
  scherm.innerHTML = `
    <div class="minigame-boog"></div>
    <img class="vlaggetjes" src="${asset('iconen/vlaggetjes.svg')}" alt="">
    <div class="minigame-pommie">
      <img src="${asset('personages/pommie.svg')}" alt="Pommie">
      <div class="ballon ballon-links"><div class="ballon-naam">Pommie</div><p></p></div>
    </div>
    <div class="minigame-ronde">
      <span class="label-hoofdletters">NA RONDE ${s.ronde}</span>
      <span class="minigame-seizoen"><img src="${asset(seizoenIcoon)}" alt="" width="24" height="24">${seizoen} · ${
        nogTeGaan === 0 ? 'laatste ronde!' : nogTeGaan === 1 ? 'nog 1 ronde' : `${nogTeGaan} rondes te gaan`
      }</span>
    </div>
    <div class="minigame-paneel vilt paneel">
      <div class="minigame-kop"><h1>Wie won?</h1><span>Tik de figuren aan in de volgorde waarin ze eindigden.</span></div>
      <div class="minigame-figuren"></div>
      <div class="minigame-knoppen">
        <button type="button" class="knop knop-wit knop-s" data-gelijk><span class="is-teken">=</span><span>Gelijk met vorige</span></button>
        <button type="button" class="knop knop-wit knop-s" data-opnieuw>${OPNIEUW_ICOON}<span>Opnieuw</span></button>
        <span class="minigame-uitleg"></span>
        <button type="button" class="knop knop-groen" data-bevestig>${icoon.vinkje()}<span>Bevestigen</span></button>
      </div>
    </div>`;
  scherm.querySelector('.minigame-pommie p')!.textContent = zeg('minigame');

  const rij = scherm.querySelector('.minigame-figuren')!;
  const gelijkKnop = scherm.querySelector<HTMLButtonElement>('[data-gelijk]')!;
  const bevestig = scherm.querySelector<HTMLButtonElement>('[data-bevestig]')!;
  const uitleg = scherm.querySelector('.minigame-uitleg')!;

  const kaarten = s.spelers.map((sp, i) => {
    const f = figuur(sp.figuur);
    const knop = maak('button', 'minigame-figuur');
    knop.type = 'button';
    knop.setAttribute('aria-label', sp.naam);
    knop.style.setProperty('--kleur', f.kleur);
    knop.style.setProperty('--kleur-d', f.kleurDonker);
    knop.style.background = f.kleurLicht;
    knop.append(figuurPlaatje(f, sp.naam, 'minigame-plaatje'), maak('span', 'minigame-naam', sp.naam));
    knop.addEventListener('click', () => tik(i));
    rij.append(knop);
    return knop;
  });

  const geplaatst = () => groepen.flat();

  function tik(i: number) {
    if (geplaatst().includes(i)) return;
    if (gelijkKlaar && groepen.length > 0) groepen[groepen.length - 1].push(i);
    else groepen.push([i]);
    gelijkKlaar = false;
    // De laatste krijgt vanzelf de laatste plek.
    const rest = s.spelers.map((_, k) => k).filter((k) => !geplaatst().includes(k));
    if (rest.length === 1) groepen.push(rest);
    teken();
  }

  gelijkKnop.addEventListener('click', () => {
    if (groepen.length === 0) return;
    if (geplaatst().length === aantal) {
      // Iedereen heeft een plek: de laatste schuift bij de vorige plek.
      const laatste = groepen[groepen.length - 1];
      if (groepen.length < 2) return;
      const wie = laatste.pop()!;
      if (laatste.length === 0) groepen.pop();
      groepen[groepen.length - 1].push(wie);
    } else {
      gelijkKlaar = !gelijkKlaar;
    }
    teken();
  });
  scherm.querySelector('[data-opnieuw]')!.addEventListener('click', () => {
    groepen = [];
    gelijkKlaar = false;
    teken();
  });

  function teken() {
    let plaats = 1;
    const plekVan = new Map<number, { plaats: number; gelijk: boolean }>();
    for (const g of groepen) {
      for (const i of g) plekVan.set(i, { plaats, gelijk: g.length > 1 });
      plaats += g.length;
    }
    kaarten.forEach((k, i) => {
      k.querySelector('.minigame-plek')?.remove();
      k.querySelector('.minigame-gelijk')?.remove();
      const p = plekVan.get(i);
      k.classList.toggle('gekozen', !!p);
      if (!p) return;
      const rond = maak('div', 'plaats-rondje minigame-plek', `${p.plaats}e`);
      rond.style.background = PLAATS_KLEUR[p.plaats - 1];
      k.append(rond);
      if (p.gelijk) k.append(maak('span', 'minigame-gelijk', 'GELIJK'));
    });
    const klaar = geplaatst().length === aantal;
    bevestig.disabled = !klaar;
    gelijkKnop.classList.toggle('aan', gelijkKlaar);
    gelijkKnop.disabled = groepen.length === 0 || (klaar && groepen.length < 2);
    uitleg.textContent = gelijkKlaar
      ? 'Tik wie gelijk eindigde met de vorige'
      : klaar
        ? 'Klopt het? Tik op Bevestigen'
        : 'Laatste figuur krijgt vanzelf de laatste plek';
  }
  teken();
  laag.append(buiten);

  return new Promise((r) =>
    bevestig.addEventListener('click', () => {
      if (geplaatst().length !== aantal) return;
      buiten.remove();
      r(groepen);
    }),
  );
}
