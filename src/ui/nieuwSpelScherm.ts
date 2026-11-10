/**
 * Opstartscherm "Nieuw spel" (design: nieuw-spel.html, §3 en §13): rondes, seizoen,
 * bonussterren en 4 deelnemers met naam, figuur en mens/bot.
 * De laatste keuzes worden onthouden, zodat je de volgende keer alleen op Start hoeft te tikken.
 */
import { FIGUREN, figuur, STANDAARD_NAMEN } from '../data/figuren';
import type { AantalRondes, NieuwSpelKeuzes, Seizoen } from '../logic';
import { asset } from './asset';
import { icoon } from './iconen';
import { toonMelding } from './hoofdmenu';
import { figuurPlaatje, maak, maakPodium } from './onderdelen';

const SLEUTEL = 'kralingse-plas-party/laatste-keuzes';

const WISSEL_ICOON = (kleur: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 L3 8 L7 12 M3 8 H17 M17 12 L21 16 L17 20 M21 16 H7" fill="none" stroke="${kleur}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

export function standaardKeuzes(): NieuwSpelKeuzes {
  return {
    aantalRondes: 10,
    seizoen: 'zomer',
    bonussterren: true,
    spelers: FIGUREN.map((f, i) => ({ naam: STANDAARD_NAMEN[i], figuur: f.id, isBot: i >= 2 })),
  };
}

function laatsteKeuzes(): NieuwSpelKeuzes {
  try {
    const k = JSON.parse(localStorage.getItem(SLEUTEL) ?? 'null') as NieuwSpelKeuzes | null;
    if (k && Array.isArray(k.spelers) && k.spelers.length === 4 && [10, 15, 20].includes(k.aantalRondes)) return k;
  } catch {
    /* kapotte opslag: gewoon de standaard */
  }
  return standaardKeuzes();
}

function pommieTekst(mensen: number): string {
  const bots = 4 - mensen;
  if (mensen === 4) return 'Vier mensen! Dat wordt een echt feestje.';
  if (mensen === 1) return 'Jij tegen drie bots. Ik zorg dat ze razendsnel zijn!';
  const woord = ['', 'Eén', 'Twee', 'Drie'];
  return `${woord[mensen]} ${mensen === 1 ? 'mens' : 'mensen'}, ${woord[bots].toLowerCase()} ${bots === 1 ? 'bot' : 'bots'}. Ik zorg dat de bots razendsnel zijn!`;
}

/** Een rij knoppen waarvan er één aan staat (design: "segment"). */
function segment<T>(opties: { waarde: T; tekst: string; icoon?: string }[], gekozen: T, bijKeuze: (w: T) => void): HTMLElement {
  const el = maak('div', 'segment');
  const knoppen = opties.map((o) => {
    const k = maak('button', 'segment-knop');
    k.type = 'button';
    k.innerHTML = `${o.icoon ? `<img src="${asset(o.icoon)}" alt="" width="20" height="20">` : ''}<span></span>`;
    k.querySelector('span')!.textContent = o.tekst;
    k.addEventListener('click', () => {
      knoppen.forEach((x, i) => x.setAttribute('aria-pressed', String(opties[i].waarde === o.waarde)));
      bijKeuze(o.waarde);
    });
    k.setAttribute('aria-pressed', String(o.waarde === gekozen));
    el.append(k);
    return k;
  });
  return el;
}

export function toonNieuwSpel(root: HTMLElement, acties: { terug: () => void; start: (k: NieuwSpelKeuzes) => void }): void {
  const k = structuredClone(laatsteKeuzes());

  const { buiten, podium: scherm } = maakPodium('nieuw-spel vilt', 'main');
  scherm.innerHTML = `
    <img class="vlaggetjes" src="${asset('iconen/vlaggetjes.svg')}" alt="">
    <div class="nieuw-kop">
      <button type="button" class="hoekknop" data-terug aria-label="Terug">${icoon.terug()}</button>
      <h1>Nieuw spel</h1>
    </div>
    <div class="nieuw-links"></div>
    <div class="nieuw-spelers vilt paneel"><span class="label-hoofdletters">SPELERS</span></div>
    <div class="nieuw-start"><button type="button" class="knop knop-groot" data-start>${icoon.play()}<span>Start!</span></button></div>
    <div class="nieuw-pommie">
      <img src="${asset('personages/pommie.svg')}" alt="Pommie">
      <div class="ballon ballon-links"><div class="ballon-naam">Pommie</div><p></p></div>
    </div>`;
  const links = scherm.querySelector('.nieuw-links')!;
  const spelersPaneel = scherm.querySelector('.nieuw-spelers')!;
  const pommie = scherm.querySelector('.nieuw-pommie p')!;
  const zegIets = () => (pommie.textContent = pommieTekst(k.spelers.filter((s) => !s.isBot).length));

  // ---- rondes, seizoen, bonussterren
  const blok = (titel: string, inhoud: HTMLElement) => {
    const el = maak('div', 'nieuw-blok vilt paneel');
    el.append(maak('span', 'label-hoofdletters nieuw-label', titel), inhoud);
    return el;
  };
  links.append(
    blok('AANTAL RONDES', segment<AantalRondes>(
      [10, 15, 20].map((n) => ({ waarde: n as AantalRondes, tekst: String(n) })), k.aantalRondes, (w) => (k.aantalRondes = w))),
    blok('SEIZOEN', segment<Seizoen>([
      { waarde: 'zomer', tekst: 'Zomer', icoon: 'iconen/zon.svg' },
      { waarde: 'winter', tekst: 'Winter', icoon: 'iconen/sneeuw.svg' },
      { waarde: 'wisselend', tekst: 'Wisselend', icoon: 'iconen/maan.svg' },
    ], k.seizoen, (w) => (k.seizoen = w))),
  );
  const bonus = maak('div', 'nieuw-blok nieuw-bonus vilt paneel');
  bonus.innerHTML = `<img src="${asset('iconen/ster.svg')}" alt="" width="44" height="44">
    <div class="nieuw-bonus-tekst"><span>Bonussterren</span><small>Uitgereikt aan het eind van het spel</small></div>
    <button type="button" class="schakelaar" role="switch" aria-label="Bonussterren"><span></span></button>`;
  const schakelaar = bonus.querySelector('.schakelaar')!;
  schakelaar.setAttribute('aria-checked', String(k.bonussterren));
  schakelaar.addEventListener('click', () => {
    k.bonussterren = !k.bonussterren;
    schakelaar.setAttribute('aria-checked', String(k.bonussterren));
  });
  links.append(bonus);

  // ---- spelers
  const figuurKnoppen: HTMLButtonElement[] = [];
  const tekenFiguur = (i: number) => {
    const f = figuur(k.spelers[i].figuur);
    const knop = figuurKnoppen[i];
    knop.style.background = f.kleurLicht;
    knop.style.borderColor = f.kleur;
    knop.setAttribute('aria-label', `Kies figuur voor ${k.spelers[i].naam}`);
    knop.replaceChildren(figuurPlaatje(f, k.spelers[i].naam, 'nieuw-figuur'));
    const wissel = maak('span', 'nieuw-wissel');
    wissel.style.borderColor = f.kleur;
    wissel.innerHTML = WISSEL_ICOON(f.kleurDonker);
    knop.append(wissel);
  };

  k.spelers.forEach((sp, i) => {
    const rij = maak('div', 'nieuw-speler');
    const fk = maak('button', 'nieuw-figuurknop');
    fk.type = 'button';
    figuurKnoppen.push(fk);
    // Tik = volgende figuur. Heeft iemand anders die al, dan ruilen jullie.
    fk.addEventListener('click', () => {
      const nu = FIGUREN.findIndex((f) => f.id === k.spelers[i].figuur);
      const volgende = FIGUREN[(nu + 1) % FIGUREN.length].id;
      const ander = k.spelers.findIndex((x) => x.figuur === volgende);
      if (ander >= 0) {
        k.spelers[ander].figuur = k.spelers[i].figuur;
        tekenFiguur(ander);
      }
      k.spelers[i].figuur = volgende;
      tekenFiguur(i);
    });

    const naamVak = maak('div', 'nieuw-naamvak');
    const label = maak('label', 'label-hoofdletters', `SPELER ${i + 1}`);
    label.htmlFor = `naam${i}`;
    const invoer = maak('input', 'nieuw-naam');
    invoer.id = `naam${i}`;
    invoer.type = 'text';
    invoer.maxLength = 12;
    invoer.autocomplete = 'off';
    invoer.spellcheck = false;
    invoer.value = sp.naam;
    invoer.addEventListener('input', () => (k.spelers[i].naam = invoer.value));
    invoer.addEventListener('keydown', (e) => e.key === 'Enter' && invoer.blur());
    naamVak.append(label, invoer);

    const soort = maak('div', 'nieuw-soort');
    soort.append(segment([{ waarde: false, tekst: 'Mens' }, { waarde: true, tekst: 'Bot' }], sp.isBot, (bot) => {
      k.spelers[i].isBot = bot;
      zegIets();
    }));
    rij.append(fk, naamVak, soort);
    spelersPaneel.append(rij);
    tekenFiguur(i);
  });
  zegIets();

  scherm.querySelector('[data-terug]')!.addEventListener('click', acties.terug);
  scherm.querySelector('[data-start]')!.addEventListener('click', () => {
    if (k.spelers.every((s) => s.isBot)) {
      toonMelding('Er moet minstens één mens meedoen!', 2000);
      return;
    }
    k.spelers.forEach((s, i) => (s.naam = s.naam.trim() || STANDAARD_NAMEN[i]));
    localStorage.setItem(SLEUTEL, JSON.stringify(k));
    acties.start(k);
  });
  root.replaceChildren(buiten);
}
