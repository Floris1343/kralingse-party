import { zeg } from '../data/teksten';
import { geluidAan, muntGeluid, zetGeluid } from '../audio/geluid';
import { asset } from './asset';
import { icoon } from './iconen';

export interface HoofdmenuActies {
  /** Bijvoorbeeld "Ronde 3/10 · Zomer", of null als er geen bewaard spel is. */
  opgeslagenSpel: string | null;
  nieuwSpel: () => void;
  verderSpelen: () => void;
}

/** Hoofdmenu zoals in het design (docs/design/.../hoofdmenu.html). */
export function toonHoofdmenu(root: HTMLElement, acties: HoofdmenuActies): void {
  root.innerHTML = `
    <main class="hoofdmenu">
      <img class="hoofdmenu-bord" src="${asset('bord/bord-dag-compleet.svg')}" alt="">
      <div class="hoofdmenu-waas"></div>
      <img class="hoofdmenu-vlaggetjes" src="${asset('iconen/vlaggetjes.svg')}" alt="">
      <h1 class="titel">
        <span class="titel-boven">Muppel</span>
        <span class="titel-onder"><span>PARTY</span><img src="${asset('iconen/ster.svg')}" alt=""></span>
      </h1>
      <nav class="hoofdmenu-knoppen vilt paneel">
        ${
          acties.opgeslagenSpel
            ? `<button class="knop knop-verder" data-actie="verder">
                 <span class="knop-verder-rond">${icoon.play()}</span>
                 <span class="knop-verder-tekst"><span>Verder spelen</span><small></small></span>
               </button>`
            : ''
        }
        <button class="knop knop-blauw knop-links" data-actie="nieuw">${icoon.plus()}<span>Nieuw spel</span></button>
        <button class="knop knop-wit knop-links" data-actie="instellingen">${icoon.tandwiel()}<span>Instellingen</span></button>
      </nav>
      <div class="hoofdmenu-pommie">
        <div class="ballon"><div class="ballon-naam">Pommie</div><p></p></div>
        <img src="${asset('personages/pommie.svg')}" alt="Pommie, de host">
      </div>
      <img class="hoofdmenu-ratje" src="${asset('personages/ratje.svg')}" alt="Ratje">
    </main>
  `;
  root.querySelector('.hoofdmenu-pommie p')!.textContent = zeg('welkom');
  const klein = root.querySelector('.knop-verder small');
  if (klein) klein.textContent = acties.opgeslagenSpel;
  root.querySelector('[data-actie="nieuw"]')?.addEventListener('click', acties.nieuwSpel);
  root.querySelector('[data-actie="verder"]')?.addEventListener('click', acties.verderSpelen);
  root.querySelector('[data-actie="instellingen"]')?.addEventListener('click', () => toonInstellingen(root));
}

/** Instellingen: het geluid (gebrabbel en geluidjes) aan of uit. */
function toonInstellingen(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `
    <div class="overlay-paneel vilt paneel instellingen" role="dialog">
      <h2>Instellingen</h2>
      <div class="instelling">
        <div class="instelling-tekst"><span>Geluid</span><small>Het gebrabbel van Pommie en de geluidjes</small></div>
        <button type="button" class="schakelaar" role="switch" aria-label="Geluid"><span></span></button>
      </div>
      <div class="overlay-knoppen"><button class="knop" data-klaar>Klaar</button></div>
    </div>`;
  const schakelaar = el.querySelector('.schakelaar')!;
  schakelaar.setAttribute('aria-checked', String(geluidAan()));
  schakelaar.addEventListener('click', () => {
    zetGeluid(!geluidAan());
    schakelaar.setAttribute('aria-checked', String(geluidAan()));
    if (geluidAan()) muntGeluid(true);
  });
  el.querySelector('[data-klaar]')!.addEventListener('click', () => el.remove(), { once: true });
  root.append(el);
}

/** Vraagt in de stijl van het spel om bevestiging. */
export function bevestig(root: HTMLElement, vraag: string, ja: string, nee: string): Promise<boolean> {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `
    <div class="overlay-paneel vilt paneel">
      <h2></h2>
      <div class="overlay-knoppen">
        <button class="knop" data-ja></button>
        <button class="knop knop-wit" data-nee></button>
      </div>
    </div>`;
  el.querySelector('h2')!.textContent = vraag;
  el.querySelector('[data-ja]')!.textContent = ja;
  el.querySelector('[data-nee]')!.textContent = nee;
  root.append(el);
  return new Promise((r) => {
    const klaar = (antwoord: boolean) => {
      el.remove();
      r(antwoord);
    };
    el.querySelector('[data-ja]')!.addEventListener('click', () => klaar(true));
    el.querySelector('[data-nee]')!.addEventListener('click', () => klaar(false));
  });
}

/** Korte, niet-blokkerende melding onderin beeld. */
export function toonMelding(tekst: string, duurMs = 1500): void {
  const el = document.createElement('div');
  el.className = 'melding pil-donker';
  el.textContent = tekst;
  document.body.appendChild(el);
  el.animate(
    [
      { opacity: 0, transform: 'translate(-50%, 12px)' },
      { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.12 },
      { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.85 },
      { opacity: 0, transform: 'translate(-50%, 0)' },
    ],
    { duration: duurMs, easing: 'ease-out' },
  ).onfinish = () => el.remove();
}
