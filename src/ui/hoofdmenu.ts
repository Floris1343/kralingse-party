export interface HoofdmenuActies {
  heeftOpgeslagenSpel: boolean;
  nieuwSpel: () => void;
  verderSpelen: () => void;
}

export function toonHoofdmenu(root: HTMLElement, acties: HoofdmenuActies): void {
  root.innerHTML = `
    <main class="hoofdmenu">
      <div class="water" aria-hidden="true"></div>
      <h1 class="titel">Kralingse Plas <span>Party</span></h1>
      <nav class="knoppen">
        ${acties.heeftOpgeslagenSpel ? '<button class="knop knop-groot" data-actie="verder">Verder spelen</button>' : ''}
        <button class="knop knop-groot ${acties.heeftOpgeslagenSpel ? 'knop-tweede' : ''}" data-actie="nieuw">Nieuw spel</button>
      </nav>
    </main>
  `;
  root.querySelector('[data-actie="nieuw"]')?.addEventListener('click', acties.nieuwSpel);
  root.querySelector('[data-actie="verder"]')?.addEventListener('click', acties.verderSpelen);
}

/** Korte, niet-blokkerende melding onderin beeld. */
export function toonMelding(tekst: string, duurMs = 1500): void {
  const el = document.createElement('div');
  el.className = 'melding';
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
