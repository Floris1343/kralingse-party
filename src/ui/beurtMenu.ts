/**
 * Het begin van een beurt (§11, §13):
 * - de aankondiging: je figuur groot links en een brede, licht schuine band "Jouw beurt, Floris!";
 * - het keuzemenu: Dobbelen, Items en Bord bekijken, als schuine banners naast je figuur.
 * De design-map heeft deze schermen niet; ze volgen de Feestvilt-stijl (kleuren, letters,
 * knoppen en panelen uit thema.css).
 */
import { figuur } from '../data/figuren';
import { itemInfo, kanItemAnnuleren, type GameState } from '../logic';
import { asset } from './asset';
import { itemIcoon } from './itemIcoon';
import { figuurPlaatje, maak } from './onderdelen';

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Een vouwkaartje (het design heeft geen kaart-icoon; dit is getekend zoals de andere knop-icoontjes). */
const KAART_ICOON = `<svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5 L8.5 4 L15.5 6.5 L21 4 V17.5 L15.5 20 L8.5 17.5 L3 20 Z" fill="#FFF6E6" stroke="#2B1D14" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 4 V17.5 M15.5 6.5 V20" stroke="#2B1D14" stroke-width="2"/><circle cx="12" cy="11" r="2" fill="#E8433A"/></svg>`;
const DOBBEL_ICOON = `<img src="${asset('iconen/dobbelsteen.svg')}" alt="" width="40" height="40">`;

/** Het grote figuur links, met (in het menu) de sterren en munten eronder. */
function grootFiguur(s: GameState, speler: number, metStand: boolean): HTMLElement {
  const sp = s.spelers[speler];
  const f = figuur(sp.figuur);
  const el = maak('div', 'beurt-figuur');
  el.style.setProperty('--kleur', f.kleur);
  el.style.setProperty('--kleur-licht', f.kleurLicht);
  el.append(maak('div', 'beurt-figuur-gloed'), figuurPlaatje(f, sp.naam, 'beurt-figuur-plaatje'));
  if (metStand) {
    const stand = maak('div', 'beurt-stand vilt');
    stand.innerHTML = `<b></b>
      <span><img src="${asset('iconen/ster.svg')}" alt="" width="30" height="30">${sp.sterren}</span>
      <span><img src="${asset('iconen/munt.svg')}" alt="" width="28" height="28">${sp.munten}</span>`;
    stand.querySelector('b')!.textContent = sp.naam;
    el.append(stand);
  }
  return el;
}

/**
 * "Jouw beurt, Floris!": een mens tikt om verder te gaan. Bij een bot staat "Beurt van Bot 1"
 * ongeveer 0,6 seconde in beeld, zonder tik.
 */
export async function toonAankondiging(laag: HTMLElement, s: GameState, speler: number): Promise<void> {
  const sp = s.spelers[speler];
  const el = maak('div', `beurt-aankondiging${sp.isBot ? ' is-bot' : ''}`);
  const band = maak('div', 'beurt-band vilt');
  band.style.setProperty('--kleur', figuur(sp.figuur).kleur);
  band.append(maak('span', 'beurt-band-tekst', sp.isBot ? `Beurt van ${sp.naam}` : `Jouw beurt, ${sp.naam}!`));
  if (!sp.isBot) band.append(maak('span', 'beurt-band-hint', 'Tik om verder te gaan'));
  el.append(grootFiguur(s, speler, false), band);
  laag.append(el);
  if (sp.isBot) {
    await wacht(600);
  } else {
    await new Promise<void>((r) => el.addEventListener('pointerdown', () => r(), { once: true }));
  }
  el.classList.add('weg');
  await wacht(180);
  el.remove();
}

export type MenuKeuze = 'dobbelen' | 'items' | 'annuleer' | 'bord';

/**
 * Het keuzemenu. Dobbelen staat bovenaan en is opgelicht. Items laat je items zien (grijs als je
 * er geen hebt); heb je een dobbel-item gekozen, dan kun je het hier annuleren.
 */
export function vraagMenuKeuze(laag: HTMLElement, s: GameState, speler: number): Promise<MenuKeuze> {
  const sp = s.spelers[speler];
  const fase = s.fase.soort === 'dobbelen' ? s.fase : null;
  const gekozen = fase?.gebruikt;
  const el = maak('div', 'beurt-menu');
  const knoppen = maak('div', 'beurt-knoppen');

  const banner = (klasse: string, icoon: string, titel: string, onder: HTMLElement | string | null, keuze: MenuKeuze, uit = false) => {
    const b = maak('button', `beurt-knop ${klasse}`);
    b.type = 'button';
    b.disabled = uit;
    const binnen = maak('span', 'beurt-knop-binnen');
    binnen.innerHTML = `<span class="beurt-knop-icoon">${icoon}</span>`;
    const tekst = maak('span', 'beurt-knop-tekst');
    tekst.append(maak('span', 'beurt-knop-titel', titel));
    if (onder) tekst.append(typeof onder === 'string' ? maak('span', 'beurt-knop-onder', onder) : onder);
    binnen.append(tekst);
    b.append(binnen);
    b.addEventListener('click', () => kies(keuze), { once: true });
    knoppen.append(b);
    return b;
  };

  // Dobbelen, met het gekozen item erop.
  let dobbelOnder: HTMLElement | string | null = null;
  if (gekozen) {
    const chip = maak('span', 'beurt-knop-item');
    chip.append(itemIcoon(gekozen, 26), maak('span', '', `met ${itemInfo(gekozen).naam.toLowerCase()}`));
    dobbelOnder = chip;
  }
  banner('beurt-dobbelen', DOBBEL_ICOON, 'Dobbelen', dobbelOnder, 'dobbelen');

  // Items: de icoontjes van je zak, of annuleren als je al een dobbel-item koos.
  if (gekozen && kanItemAnnuleren(s)) {
    banner('beurt-items', '<span class="beurt-kruis">×</span>', 'Item annuleren', 'Terug in je zak', 'annuleer');
  } else {
    const zak = maak('span', 'beurt-knop-zak');
    for (const item of sp.items) zak.append(itemIcoon(item, 30));
    const geen = sp.items.length === 0;
    const al = !!gekozen;
    banner(
      'beurt-items',
      `<img src="${asset('iconen/vakje-item.svg')}" alt="" width="40" height="40">`,
      'Items',
      geen ? 'Je hebt geen items' : al ? 'Al een item gebruikt' : zak,
      'items',
      geen || al,
    );
  }
  banner('beurt-bord', KAART_ICOON, 'Bord bekijken', 'Waar staat iedereen?', 'bord');

  el.append(grootFiguur(s, speler, true), knoppen);
  laag.append(el);
  let kies: (k: MenuKeuze) => void = () => {};
  return new Promise((r) => {
    kies = (k) => {
      el.classList.add('weg');
      setTimeout(() => el.remove(), 160);
      r(k);
    };
  });
}

/**
 * Bord bekijken: bovenin hoe ver de ster is (niet bij mist) en een knop "Terug".
 * Het schuiven en zoomen doet de bordweergave.
 */
export function toonBordBekijken(laag: HTMLElement, sterAfstand: number | null): Promise<void> {
  const el = maak('div', 'bord-bekijken');
  const kop = maak('div', 'bord-bekijken-kop vilt');
  kop.innerHTML = `<img src="${asset('iconen/ster.svg')}" alt="" width="34" height="34"><span></span>`;
  kop.querySelector('span')!.textContent =
    sterAfstand === null
      ? 'Ochtendmist: waar is de ster?'
      : sterAfstand === 0
        ? 'Je staat bij de ster!'
        : `De ster is ${sterAfstand} ${sterAfstand === 1 ? 'vakje' : 'vakjes'} van je af`;
  const hint = maak('div', 'bord-bekijken-hint', 'Schuif met één vinger · zoom met twee vingers');
  const terug = maak('button', 'knop bord-bekijken-terug', 'Terug');
  terug.type = 'button';
  el.append(kop, hint, terug);
  laag.append(el);
  return new Promise((r) =>
    terug.addEventListener('click', () => {
      el.remove();
      r();
    }, { once: true }),
  );
}
