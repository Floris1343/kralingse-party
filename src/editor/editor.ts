/**
 * Bord-editor: open de app met ?editor in de adresbalk.
 * Sleep vakjes, sterplekken, de winkel, de Nachtwinkel en Ratje naar de goede plek,
 * en kopieer of download daarna de nieuwe board.json.
 */
import { BORD } from '../data/bord';
import type { Bord, VakjeType } from '../logic/bord';
import { controleerBord } from '../logic/bordControle';
import { vakjesSvg } from '../render/vakjes';
import { maakSprite } from '../render/bordWeergave';
import { SPRITES, VILT_FILTER } from '../render/vakjeTekeningen';
import { asset } from '../ui/asset';
import './editor.css';

const OPSLAG = 'kralingse-plas-party/editor-bord';
const TYPES: VakjeType[] = ['start', 'blauw', 'rood', 'event', 'item', 'kans', 'pech', 'hertenkamp', 'boot', 'ijs'];

type Punt = { soort: 'vakje' | 'ster' | 'plek'; id: string; x: number; y: number };

export function toonEditor(root: HTMLElement): void {
  let bord: Bord = laadBewerking() ?? structuredClone(BORD);
  let gekozen: Punt | null = null;
  let decor = true;

  root.innerHTML = `
    <main class="editor">
      <div class="editor-balk vilt">
        <strong>Bord-editor</strong>
        <button class="knop knop-s" data-kopieer>Kopieer JSON</button>
        <button class="knop knop-s knop-blauw" data-download>Download</button>
        <button class="knop knop-s knop-wit" data-decor>Decoratie</button>
        <button class="knop knop-s knop-wit" data-herstel>Herstel</button>
        <a class="knop knop-s knop-wit" href="./">Naar het spel</a>
        <span class="editor-status"></span>
      </div>
      <div class="editor-veld">
        <div class="editor-wereld" style="width:${bord.breedte}px;height:${bord.hoogte}px">
          <img class="bord-laag" src="${asset('bord/grond-dag.svg')}" alt="" draggable="false">
          <svg class="bord-laag editor-vakjes" viewBox="0 0 ${bord.breedte} ${bord.hoogte}"></svg>
          <img class="bord-laag editor-decor" src="${asset('bord/decor-dag.svg')}" alt="" draggable="false">
          <div class="bord-laag editor-sprites"></div>
          <svg class="bord-laag editor-punten" viewBox="0 0 ${bord.breedte} ${bord.hoogte}"></svg>
        </div>
      </div>
      <div class="editor-info vilt"></div>
    </main>`;

  const veld = root.querySelector<HTMLElement>('.editor-veld')!;
  const wereld = root.querySelector<HTMLElement>('.editor-wereld')!;
  const vakjesSvgEl = root.querySelector<SVGSVGElement>('.editor-vakjes')!;
  const puntenSvg = root.querySelector<SVGSVGElement>('.editor-punten')!;
  const info = root.querySelector<HTMLElement>('.editor-info')!;
  const sprites = root.querySelector<HTMLElement>('.editor-sprites')!;
  const status = root.querySelector<HTMLElement>('.editor-status')!;
  let schaal = 1;

  function pasAan() {
    schaal = Math.min(veld.clientWidth / bord.breedte, veld.clientHeight / bord.hoogte);
    wereld.style.transform = `scale(${schaal})`;
  }

  function punten(): Punt[] {
    return [
      ...bord.vakjes.map((v) => ({ soort: 'vakje' as const, id: v.id, x: v.x, y: v.y })),
      ...bord.sterplekken.map((p) => ({ soort: 'ster' as const, id: p.id, x: p.x, y: p.y })),
      ...Object.entries(bord.plekken).map(([id, p]) => ({ soort: 'plek' as const, id, x: p.x, y: p.y })),
    ];
  }

  function teken() {
    vakjesSvgEl.innerHTML = `<defs>${VILT_FILTER}</defs><g filter="url(#kp-vilt2)">${vakjesSvg(bord.vakjes)}</g>`;
    const pos = new Map(bord.vakjes.map((v) => [v.id, v]));
    const lijnen = bord.vakjes
      .flatMap((v) => v.next.map((n) => [v, pos.get(n)!] as const))
      .filter(([, b]) => b)
      .map(([a, b]) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="editor-lijn"/>`)
      .join('');
    const sterLijnen = bord.sterplekken
      .map((p) => {
        const v = pos.get(p.vakje);
        return v ? `<line x1="${p.x}" y1="${p.y}" x2="${v.x}" y2="${v.y}" class="editor-lijn ster"/>` : '';
      })
      .join('');
    const merk = punten()
      .map((p) => {
        const kies = gekozen && gekozen.soort === p.soort && gekozen.id === p.id ? ' gekozen' : '';
        const label = p.soort === 'vakje' ? p.id : p.soort === 'ster' ? `★ ${p.id}` : p.id;
        return `<g class="editor-punt ${p.soort}${kies}" data-soort="${p.soort}" data-id="${p.id}">
          <circle cx="${p.x}" cy="${p.y}" r="${p.soort === 'vakje' ? 9 : 12}"/>
          <text x="${p.x}" y="${p.y - 15}">${label}</text></g>`;
      })
      .join('');
    puntenSvg.innerHTML = lijnen + sterLijnen + merk;
    // Op elke sterplek de echte ster, en Ratje op zijn plek: zo zie je of ze ergens tegenaan botsen.
    sprites.replaceChildren(
      ...bord.sterplekken.map((p) => maakSprite('bord/ster.svg', 'Ster', SPRITES.ster, p.x, p.y)),
      maakSprite('bord/ratje.svg', 'Ratje', SPRITES.ratje, bord.plekken.ratje.x, bord.plekken.ratje.y),
    );
    toonInfo();
    const fouten = controleerBord(bord);
    status.textContent = fouten.length ? `⚠️ ${fouten[0]}` : '✓ Bord in orde';
  }

  function toonInfo() {
    if (!gekozen) {
      info.innerHTML = '<p>Sleep een punt om het te verplaatsen. Tik een vakje aan om de soort te veranderen.</p>';
      return;
    }
    const p = gekozen;
    if (p.soort === 'vakje') {
      const v = bord.vakjes.find((x) => x.id === p.id)!;
      info.innerHTML = `
        <p><b>${v.id}</b> · zone ${v.zone}${v.flags?.length ? ` · ${v.flags.join(', ')}` : ''}</p>
        <p>Daarna: ${v.next.join(' of ')}</p>
        <label>Soort <select>${TYPES.map((t) => `<option ${t === v.type ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <p>x ${v.x} · y ${v.y}</p>`;
      info.querySelector('select')!.addEventListener('change', (e) => {
        v.type = (e.target as HTMLSelectElement).value as VakjeType;
        bewaarBewerking();
        teken();
      });
    } else {
      info.innerHTML = `<p><b>${p.soort === 'ster' ? 'Sterplek' : 'Plek'} ${p.id}</b></p><p>x ${p.x} · y ${p.y}</p>`;
    }
  }

  function verplaats(p: Punt, x: number, y: number) {
    x = Math.round(Math.max(0, Math.min(bord.breedte, x)) * 10) / 10;
    y = Math.round(Math.max(0, Math.min(bord.hoogte, y)) * 10) / 10;
    const doel =
      p.soort === 'vakje'
        ? bord.vakjes.find((v) => v.id === p.id)
        : p.soort === 'ster'
          ? bord.sterplekken.find((s) => s.id === p.id)
          : bord.plekken[p.id as keyof Bord['plekken']];
    if (!doel) return;
    doel.x = x;
    doel.y = y;
    p.x = x;
    p.y = y;
  }

  // Slepen met vinger of muis
  puntenSvg.addEventListener('pointerdown', (e) => {
    const g = (e.target as Element).closest<SVGGElement>('.editor-punt');
    if (!g) return;
    const p = punten().find((q) => q.soort === g.dataset.soort && q.id === g.dataset.id)!;
    gekozen = p;
    const start = { x: e.clientX, y: e.clientY, px: p.x, py: p.y };
    puntenSvg.setPointerCapture(e.pointerId);
    const beweeg = (m: PointerEvent) => {
      verplaats(p, start.px + (m.clientX - start.x) / schaal, start.py + (m.clientY - start.y) / schaal);
      teken();
    };
    const los = () => {
      puntenSvg.removeEventListener('pointermove', beweeg);
      bewaarBewerking();
      teken();
    };
    puntenSvg.addEventListener('pointermove', beweeg);
    puntenSvg.addEventListener('pointerup', los, { once: true });
    teken();
  });

  const json = () => JSON.stringify({ versie: 1, ...bord }, null, 2) + '\n';
  root.querySelector('[data-kopieer]')!.addEventListener('click', async () => {
    await navigator.clipboard.writeText(json());
    status.textContent = '📋 Gekopieerd!';
  });
  root.querySelector('[data-download]')!.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json()], { type: 'application/json' }));
    a.download = 'board.json';
    a.click();
  });
  root.querySelector('[data-decor]')!.addEventListener('click', () => {
    decor = !decor;
    root.querySelector<HTMLElement>('.editor-decor')!.style.opacity = decor ? '0.55' : '0';
  });
  root.querySelector('[data-herstel]')!.addEventListener('click', () => {
    if (!confirm('Alle wijzigingen in de editor weggooien?')) return;
    localStorage.removeItem(OPSLAG);
    bord = structuredClone(BORD);
    gekozen = null;
    teken();
  });

  function bewaarBewerking() {
    localStorage.setItem(OPSLAG, JSON.stringify(bord));
  }

  window.addEventListener('resize', pasAan);
  pasAan();
  teken();
}

function laadBewerking(): Bord | null {
  try {
    const ruw = localStorage.getItem(OPSLAG);
    return ruw ? (JSON.parse(ruw) as Bord) : null;
  } catch {
    return null;
  }
}
