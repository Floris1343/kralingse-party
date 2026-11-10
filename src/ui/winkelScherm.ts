/**
 * De winkel bij het Restaurant (design: bord-winkel.html), gevuld met de items uit ONTWERP.md §7.1,
 * de Nachtwinkel bij de jachthaven (§8.1) en Ratje inhuren (§7.2), allemaal in dezelfde stijl.
 * Ook het kiezen van een speler voor een gemeen item gebeurt hier.
 */
import { figuur } from '../data/figuren';
import { zeg } from '../data/teksten';
import { dobbelGeluid, muntTik } from '../audio/geluid';
import { TEMPO } from './tempo';
import {
  ITEM_SOORTEN, itemDoelen, itemInfo, kanItemGebruiken, kanKopen, werktMeteen, kanRatjeDoen, NACHT_ITEM_SOORTEN, ratjeDoelen, ratjePrijs,
  ZAKKENROLLER_BUIT, type DoelItem, type GameState, type ItemSoort, type RatjeKeuze, type RatjeWat,
} from '../logic';
import { asset } from './asset';
import { itemIcoon } from './itemIcoon';
import { brabbelIn } from './pommie';
import { figuurPlaatje, maak } from './onderdelen';

const munt = (maat: number) => `<img src="${asset('iconen/munt.svg')}" alt="" width="${maat}" height="${maat}">`;

function winkelOverlay(
  laag: HTMLElement,
  s: GameState,
  speler: number,
  kop: { icoon: string | HTMLElement; titel: string; uitleg: string; pommie?: string },
) {
  const el = maak('div', 'overlay winkel-overlay');
  const paneel = maak('div', 'winkel-paneel vilt paneel');
  paneel.setAttribute('role', 'dialog');
  paneel.innerHTML = `
    <div class="winkel-kop">
      <div class="winkel-kop-icoon">${typeof kop.icoon === 'string' ? `<img src="${asset(kop.icoon)}" alt="">` : ''}</div>
      <div class="winkel-kop-tekst"><h2></h2><span></span></div>
      <div class="winkel-munten">${munt(30)}<b>${s.spelers[speler].munten}</b></div>
    </div>
    <div class="winkel-kaarten"></div>
    <div class="winkel-voet"><span class="winkel-hint"></span></div>`;
  if (typeof kop.icoon !== 'string') paneel.querySelector('.winkel-kop-icoon')!.append(kop.icoon);
  paneel.querySelector('h2')!.textContent = kop.titel;
  paneel.querySelector('.winkel-kop-tekst span')!.textContent = kop.uitleg;
  el.append(paneel);
  if (kop.pommie) {
    const p = maak('div', 'winkel-pommie');
    p.innerHTML = `<div class="ballon"><div class="ballon-naam">Pommie</div><p></p></div><img src="${asset('personages/pommie.svg')}" alt="Pommie">`;
    brabbelIn(p.querySelector('p')!, kop.pommie);
    el.append(p);
  }
  laag.append(el);
  return {
    el,
    kaarten: paneel.querySelector<HTMLElement>('.winkel-kaarten')!,
    voet: paneel.querySelector<HTMLElement>('.winkel-voet')!,
    hint: paneel.querySelector<HTMLElement>('.winkel-hint')!,
  };
}

/** Een kaart zoals in het design: de hele kaart is een knop, met onderaan het "Koop · 5"-pilletje. */
function kaartKnop(icoonEl: HTMLElement, titel: string, uitleg: string, pil: string, kan: boolean, kies: () => void): HTMLButtonElement {
  const kaart = maak('button', `winkel-kaart${kan ? '' : ' te-duur'}`);
  kaart.type = 'button';
  kaart.disabled = !kan;
  const rond = maak('div', 'winkel-kaart-icoon');
  rond.append(icoonEl);
  const pilEl = maak('span', 'winkel-pil');
  pilEl.innerHTML = pil;
  kaart.append(rond, maak('span', 'winkel-kaart-naam', titel), maak('span', 'winkel-kaart-uitleg', uitleg), pilEl);
  kaart.addEventListener('click', kies, { once: true });
  return kaart;
}

function knop(tekst: string, klasse: string): HTMLButtonElement {
  const b = maak('button', `knop ${klasse}`);
  b.type = 'button';
  b.innerHTML = tekst;
  return b;
}

/** De winkel: tik op een item om het meteen te kopen, of "Niks kopen". */
export function vraagWinkel(laag: HTMLElement, s: GameState, speler: number): Promise<ItemSoort | null> {
  return winkel(laag, s, speler, ITEM_SOORTEN, {
    icoon: 'iconen/vakje-item.svg',
    titel: 'Winkeltje',
    uitleg: 'Bij het restaurant · kies één item',
    pommie: zeg('winkel'),
  });
}

/** De Nachtwinkel bij de jachthaven: dezelfde winkel in nachtkleuren, met de gemene items. */
export function vraagNachtwinkel(laag: HTMLElement, s: GameState, speler: number): Promise<ItemSoort | null> {
  return winkel(laag, s, speler, NACHT_ITEM_SOORTEN, {
    icoon: 'iconen/maan.svg',
    titel: 'Nachtwinkel',
    uitleg: 'Bij de jachthaven · alleen open in het donker',
    pommie: zeg('nachtwinkel'),
  }, 'nachtwinkel-overlay');
}

function winkel(
  laag: HTMLElement,
  s: GameState,
  speler: number,
  soorten: readonly ItemSoort[],
  kop: Parameters<typeof winkelOverlay>[3],
  klasse = '',
): Promise<ItemSoort | null> {
  const { el, kaarten, voet, hint } = winkelOverlay(laag, s, speler, kop);
  if (klasse) el.classList.add(klasse);
  if (soorten.length === 4) kaarten.classList.add('vier');
  hint.textContent = s.spelers[speler].items.length >= 2 ? 'Je hebt plek voor nog 1 item.' : 'Tik op een item om het meteen te kopen.';
  return new Promise((r) => {
    const klaar = (item: ItemSoort | null) => {
      el.remove();
      r(item);
    };
    for (const item of soorten) {
      const info = itemInfo(item);
      kaarten.append(
        kaartKnop(itemIcoon(item, 62), info.naam, info.uitleg, `${munt(26)}Koop · ${info.prijs}`, kanKopen(s, speler, item), () => klaar(item)),
      );
    }
    const niks = knop('Niks kopen', 'knop-wit');
    niks.addEventListener('click', () => klaar(null), { once: true });
    voet.append(niks);
  });
}

/**
 * Je items (keuzemenu): elk met icoon, naam, uitleg en "Gebruik". Items die meteen werken (de
 * Wisseltruc, de Ratjebel en de gemene items) zeggen dat erbij, want die kun je niet annuleren.
 */
export function vraagItem(laag: HTMLElement, s: GameState, speler: number): Promise<ItemSoort | null> {
  const sp = s.spelers[speler];
  const { el, kaarten, voet, hint } = winkelOverlay(laag, s, speler, {
    icoon: 'iconen/vakje-item.svg',
    titel: 'Je items',
    uitleg: 'Eén item per beurt, vóór het dobbelen',
  });
  el.classList.add('items-overlay');
  kaarten.classList.add(`aantal-${Math.max(1, sp.items.length)}`);
  hint.textContent = 'Dobbelstenen en Kies-je-worp kun je nog annuleren; de rest werkt meteen.';
  return new Promise((r) => {
    const klaar = (item: ItemSoort | null) => {
      el.remove();
      r(item);
    };
    sp.items.forEach((item) => {
      const info = itemInfo(item);
      const kan = kanItemGebruiken(s, item);
      const pil = werktMeteen(item) ? 'Gebruik · werkt meteen' : 'Gebruik';
      kaarten.append(kaartKnop(itemIcoon(item, 62), info.naam, info.uitleg, pil, kan, () => klaar(item)));
    });
    const terug = knop('Terug', 'knop-wit');
    terug.addEventListener('click', () => klaar(null), { once: true });
    voet.append(terug);
  });
}

/** Een grote knop per speler (figuur, naam, sterren en munten), zoals bij Ratje. */
function doelKnoppen(s: GameState, doelen: number[], kies: (doel: number) => void): HTMLButtonElement[] {
  return doelen.map((i) => {
    const sp = s.spelers[i];
    const f = figuur(sp.figuur);
    const b = maak('button', 'ratje-doel');
    b.type = 'button';
    const rond = maak('div', 'ratje-doel-figuur');
    rond.style.background = f.kleurLicht;
    rond.append(figuurPlaatje(f, sp.naam, 'ratje-doel-plaatje'));
    const naam = maak('b', '', sp.naam);
    const stand = maak('span', 'ratje-doel-stand');
    stand.innerHTML = `<img src="${asset('iconen/ster.svg')}" alt="" width="22" height="22">${sp.sterren} ${munt(20)}${sp.munten}`;
    b.append(rond, naam, stand);
    b.addEventListener('click', () => kies(i), { once: true });
    return b;
  });
}

const DOEL_VRAAG: Record<DoelItem, string> = {
  zakkenroller: `Van wie steel je ${ZAKKENROLLER_BUIT} munten?`,
  slakkendobbel: 'Wie gooit volgende beurt maar 1 tot 3?',
  achteruitpet: 'Wie loopt volgende beurt achteruit?',
};

/** Op wie richt je een gemeen item? null = toch niet ("Terug"). */
export function vraagItemDoel(laag: HTMLElement, s: GameState, speler: number, item: DoelItem): Promise<number | null> {
  const info = itemInfo(item);
  const { el, kaarten, voet, hint } = winkelOverlay(laag, s, speler, {
    icoon: itemIcoon(item, 62),
    titel: info.naam,
    uitleg: info.uitleg,
  });
  el.classList.add('ratje-overlay', 'nachtwinkel-overlay');
  hint.textContent = DOEL_VRAAG[item];
  kaarten.className = 'winkel-kaarten doelen';
  return new Promise((r) => {
    const klaar = (doel: number | null) => {
      el.remove();
      r(doel);
    };
    kaarten.replaceChildren(...doelKnoppen(s, itemDoelen(s, speler, item), klaar));
    const terug = knop('Terug', 'knop-wit');
    terug.addEventListener('click', () => klaar(null), { once: true });
    voet.replaceChildren(hint, terug);
  });
}

/**
 * Een bot huurt Ratje in: je ziet wat hij laat stelen, en dan gaat Ratje langs de kandidaten,
 * steeds langzamer, tot hij stopt bij wie het wordt. Zo bouwt de spanning op.
 * `voor` = de stand vóór het stelen (zodat je ziet wie er nog iets had).
 */
export async function toonBotRatje(laag: HTMLElement, voor: GameState, g: Extract<GameState['verslag'][number], { soort: 'ratje' }>): Promise<void> {
  const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const bot = voor.spelers[g.speler];
  const { el, kaarten, voet, hint } = winkelOverlay(laag, voor, g.speler, {
    icoon: 'personages/ratje.svg',
    titel: `${bot.naam} huurt Ratje in`,
    uitleg: g.wat === 'ster' ? 'Ratje gaat een ster stelen…' : 'Ratje gaat munten stelen…',
  });
  el.classList.add('ratje-overlay', 'bot-ratje');
  voet.replaceChildren(hint);

  // 1. Wat steelt Ratje?
  hint.textContent = `Wat laat ${bot.naam} stelen?`;
  kaarten.className = 'winkel-kaarten twee';
  const opties = (['munten', 'ster'] as const).map((wat) => {
    const img = document.createElement('img');
    img.src = asset(wat === 'ster' ? 'iconen/ster.svg' : 'iconen/munt.svg');
    img.alt = '';
    img.width = img.height = 62;
    const k = kaartKnop(img, wat === 'ster' ? 'Ster stelen' : 'Munten stelen', wat === 'ster' ? 'Ratje steelt 1 ster.' : 'Ratje steelt 5 tot 15 munten.', '', true, () => {});
    k.disabled = true;
    kaarten.append(k);
    return { wat, k };
  });
  await wacht(500);
  for (const o of opties) o.k.classList.add(o.wat === g.wat ? 'gekozen' : 'niet-gekozen');
  muntTik(true);
  await wacht(1000);

  // 2. Van wie? Ratje gaat langs de kandidaten, steeds langzamer.
  const doelen = ratjeDoelen(voor, g.speler, g.wat);
  hint.textContent = g.wat === 'ster' ? 'Van wie steelt Ratje een ster?' : 'Van wie steelt Ratje munten?';
  kaarten.className = 'winkel-kaarten doelen';
  const knoppen = doelKnoppen(voor, doelen, () => {});
  knoppen.forEach((b) => (b.disabled = true));
  kaarten.replaceChildren(...knoppen);
  const stops: number[] = [];
  // Een paar rondjes, en dan precies op het doel uitkomen.
  const eind = doelen.indexOf(g.doel);
  const stappen = doelen.length * 3 + eind + 1;
  for (let i = 0; i < stappen; i++) stops.push(i % doelen.length);
  // De tussentijden worden steeds langer (samen ±TEMPO.ratjeSpanning).
  const gewichten = stops.map((_, i) => 1 + (i / stops.length) ** 2 * 6);
  const totaal = gewichten.reduce((a, b) => a + b, 0);
  for (let i = 0; i < stops.length; i++) {
    knoppen.forEach((b, k) => b.classList.toggle('ratje-wijst', k === stops[i]));
    muntTik(true);
    await wacht((TEMPO.ratjeSpanning * gewichten[i]) / totaal);
  }
  knoppen[eind].classList.add('ratje-raak');
  dobbelGeluid();

  // 3. De uitslag.
  const doel = voor.spelers[g.doel].naam;
  hint.textContent = g.wat === 'ster' ? `Ratje steelt een ster van ${doel}!` : `Ratje steelt ${g.buit} munten van ${doel}!`;
  hint.classList.add('ratje-uitslag');
  await wacht(TEMPO.ratjeUitslag);
  el.remove();
}

/** Ratje inhuren: eerst wat hij steelt, dan bij wie. */
export function vraagRatje(laag: HTMLElement, s: GameState, speler: number): Promise<RatjeKeuze | null> {
  const nacht = s.nacht;
  const { el, kaarten, voet, hint } = winkelOverlay(laag, s, speler, {
    icoon: 'personages/ratje.svg',
    titel: 'Ratje de kerstrat',
    uitleg: nacht ? "'s Nachts sluipt Ratje makkelijker: hij is goedkoper!" : 'Ratje steelt voor je, als je hem betaalt.',
  });
  el.classList.add('ratje-overlay');
  const prijsTekst = (wat: RatjeWat) => (ratjePrijs(s, wat) === 0 ? 'Gratis' : `${munt(26)}${ratjePrijs(s, wat)}`);
  const OPTIES: { wat: RatjeWat; titel: string; uitleg: string; icoon: string }[] = [
    { wat: 'munten', titel: 'Munten stelen', uitleg: 'Ratje steelt 5 tot 15 munten van een speler.', icoon: 'iconen/munt.svg' },
    { wat: 'ster', titel: 'Ster stelen', uitleg: 'Ratje steelt 1 ster van een speler.', icoon: 'iconen/ster.svg' },
  ];

  return new Promise((r) => {
    const klaar = (k: RatjeKeuze | null) => {
      el.remove();
      r(k);
    };
    const niks = knop('Niets, lopen', 'knop-wit');
    niks.addEventListener('click', () => klaar(null), { once: true });

    const kiesWat = () => {
      hint.textContent = 'Wat moet Ratje stelen?';
      kaarten.className = 'winkel-kaarten twee';
      kaarten.replaceChildren(
        ...OPTIES.map((o) => {
          const img = document.createElement('img');
          img.src = asset(o.icoon);
          img.alt = '';
          img.width = img.height = 62;
          return kaartKnop(img, o.titel, o.uitleg, prijsTekst(o.wat), kanRatjeDoen(s, speler, o.wat), () => kiesDoel(o.wat));
        }),
      );
      voet.replaceChildren(hint, niks);
    };

    const kiesDoel = (wat: RatjeWat) => {
      hint.textContent = wat === 'ster' ? 'Van wie steelt Ratje een ster?' : 'Van wie steelt Ratje munten?';
      kaarten.className = 'winkel-kaarten doelen';
      kaarten.replaceChildren(...doelKnoppen(s, ratjeDoelen(s, speler, wat), (doel) => klaar({ wat, doel })));
      const terug = knop('Terug', 'knop-wit');
      terug.addEventListener('click', kiesWat, { once: true });
      voet.replaceChildren(hint, terug);
    };

    kiesWat();
  });
}
