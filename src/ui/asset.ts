/** Adres van een plaatje in public/assets/ (werkt ook onder /kralingse-party/ op GitHub Pages). */
export function asset(pad: string): string {
  return `${import.meta.env.BASE_URL}assets/${pad}`;
}

/**
 * Een <img> die bij een ontbrekend plaatje een nette vervanger toont:
 * een gekleurde cirkel met een letter.
 */
export function plaatje(pad: string, alt: string, kleur: string, klasse = ''): HTMLElement {
  const img = document.createElement('img');
  img.src = asset(pad);
  img.alt = alt;
  img.draggable = false;
  if (klasse) img.className = klasse;
  img.addEventListener(
    'error',
    () => {
      const v = vervanger(alt, kleur, klasse);
      v.style.cssText = img.style.cssText;
      v.style.background = kleur;
      img.replaceWith(v);
    },
    { once: true },
  );
  return img;
}

export function vervanger(naam: string, kleur: string, klasse = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `vervanger ${klasse}`;
  el.style.background = kleur;
  el.textContent = (naam.trim()[0] ?? '?').toUpperCase();
  return el;
}
