/**
 * Het bord op het scherm, in lagen zoals in het design:
 *   grond (gras, plas, pad)  →  vakjes  →  decoratie (bomen, gebouwen)  →  sprites (ster, Ratje, figuren)
 * Het bord is al schuin getekend; rechtopstaande dingen worden naar achteren kleiner (diepteSchaal).
 * De camera verschuift en vergroot de hele wereld met één transform.
 */
import type { Bord, VakjeType } from '../logic/bord';
import { vakje } from '../logic/bord';
import type { Figuur } from '../data/figuren';
import { asset, plaatje } from '../ui/asset';
import { cameraOp, cameraOverzicht, type Afmeting, type CameraStand } from './camera';
import { diepteSchaal, vakjeMaat } from './diepte';
import { vakjesSvg } from './vakjes';
import { SPRITES, VILT_FILTER } from './vakjeTekeningen';

export interface WeergaveSpeler {
  naam: string;
  figuur: Figuur;
}

/** Een ster zoals het bord hem laat zien. Een vallende ster krijgt een gloed (§8.2). */
export interface BordSter {
  plek: string;
  vallend?: boolean;
}

/** Een valstrik op het bord (§8.1), in de kleur van wie hem legde. */
export interface BordValstrik {
  vakje: string;
  kleur: string;
}

type SpriteMeta = { breedte: number; hoogte: number; voetX: number; voetY: number; designY: number };

/** Een losse tekening uit het design (ster, Ratje), met het voetpunt op (x, y) en geschaald naar de diepte. */
export function maakSprite(pad: string, alt: string, meta: SpriteMeta, x: number, y: number): HTMLElement {
  const s = diepteSchaal(y) / diepteSchaal(meta.designY);
  const el = plaatje(pad, alt, '#FFC928', 'bord-sprite');
  el.style.width = `${meta.breedte}px`;
  el.style.height = `${meta.hoogte}px`;
  el.style.transformOrigin = `${meta.voetX}px ${meta.voetY}px`;
  el.style.transform = `translate(${x - meta.voetX}px, ${y - meta.voetY}px) scale(${s})`;
  el.style.zIndex = String(Math.round(y));
  return el;
}

/** Hoeveel de camera inzoomt op de speler die aan zet is. */
export const VOLG_ZOOM = 1.45;

export class BordWeergave {
  readonly el: HTMLDivElement;
  readonly wereld: HTMLDivElement;
  readonly spriteLaag: HTMLDivElement;
  private vakjesLaag: SVGSVGElement;
  /** Nachtlagen die over de daglagen in- en uitvloeien (§8). */
  private nachtLagen: HTMLElement[] = [];
  private nacht = false;
  private typeOverschrijving = new Map<string, VakjeType>();
  private figuren: HTMLDivElement[] = [];
  private figuurPunten: [number, number][] = [];
  private sterren = new Map<string, HTMLElement>();
  /** Bij ochtendmist een vraagteken op de sterplekken waar je geen ster ziet (§8.4). */
  private vraagtekens = new Map<string, HTMLElement>();
  private mistLaag: HTMLElement | null = null;
  private mist = false;
  private valstrikken = new Map<string, HTMLElement>();
  private bovenEl: HTMLDivElement;
  private bovenSpeler = -1;
  cam: CameraStand = { x: 0, y: 0, schaal: 1 };
  private doel: { punt: [number, number] | null } = { punt: null };

  constructor(
    private bord: Bord,
    private spelers: WeergaveSpeler[],
    opties: { decor?: boolean; tijd?: 'dag'; nacht?: boolean } = {},
  ) {
    const tijd = opties.tijd ?? 'dag';
    const laag = (pad: string, klasse = '') => {
      const img = document.createElement('img');
      img.className = `bord-laag ${klasse}`;
      img.src = asset(pad);
      img.alt = '';
      img.draggable = false;
      return img;
    };
    this.el = document.createElement('div');
    this.el.className = 'bord';
    this.wereld = document.createElement('div');
    this.wereld.className = 'bord-wereld';
    this.wereld.style.width = `${bord.breedte}px`;
    this.wereld.style.height = `${bord.hoogte}px`;

    const grond = laag(`bord/grond-${tijd}.svg`);

    this.vakjesLaag = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.vakjesLaag.classList.add('bord-laag');
    this.vakjesLaag.setAttribute('viewBox', `0 0 ${bord.breedte} ${bord.hoogte}`);
    this.tekenVakjes();

    const metNacht = opties.nacht === true;
    const grondNacht = metNacht ? [laag('bord/grond-nacht.svg', 'nacht-laag')] : [];
    this.wereld.append(grond, ...grondNacht, this.vakjesLaag);
    this.nachtLagen.push(...grondNacht);
    if (opties.decor !== false) {
      this.wereld.append(laag(`bord/decor-${tijd}.svg`));
      if (metNacht) {
        const decorNacht = laag('bord/decor-nacht.svg', 'nacht-laag');
        const effect = laag('bord/effect-nacht.svg', 'nacht-laag');
        this.wereld.append(decorNacht, effect);
        this.nachtLagen.push(decorNacht, effect);
        // De witte waas van de ochtendmist (§8.4) ligt klaar en vloeit in met opacity.
        this.mistLaag = laag('bord/effect-mist.svg', 'mist-laag');
        this.wereld.append(this.mistLaag);
      }
    }

    this.spriteLaag = document.createElement('div');
    this.spriteLaag.className = 'bord-sprites';
    this.wereld.append(this.spriteLaag);

    this.zetRatje();
    for (const l of bord.labels) {
      const el = document.createElement('div');
      el.className = `bord-label${l.onder ? ' onder' : ''}`;
      el.textContent = l.tekst;
      el.style.left = `${l.x}px`;
      el.style.top = `${l.y}px`;
      this.spriteLaag.append(el);
    }
    spelers.forEach((sp, i) => this.maakFiguur(sp, i));

    this.bovenEl = document.createElement('div');
    this.bovenEl.className = 'bord-boven';
    this.spriteLaag.append(this.bovenEl);

    const vignet = document.createElement('div');
    vignet.className = 'bord-vignet';
    this.el.append(this.wereld, vignet);
  }

  /** Tekent de vakjes opnieuw (bijvoorbeeld na slepen in de editor). */
  tekenVakjes(verberg: (zone: string) => boolean = (zone) => zone === 'ijspad'): void {
    this.vakjesLaag.innerHTML =
      `<defs>${VILT_FILTER}</defs>` +
      `<g filter="url(#kp-vilt2)">${vakjesSvg(
        this.bord.vakjes.filter((v) => !verberg(v.zone)),
        (v) => this.typeOverschrijving.get(v.id) ?? v.type,
      )}</g>`;
  }

  /**
   * Dag of nacht. De nachtlagen vloeien in ongeveer een seconde in of uit (alleen opacity,
   * dus soepel op de iPad). `typen` = vakjes die nu een ander type hebben (de rode bosvakjes).
   */
  zetNacht(nacht: boolean, typen: Map<string, VakjeType>, duurMs = 1000): void {
    const typenGelijk =
      typen.size === this.typeOverschrijving.size && [...typen].every(([k, v]) => this.typeOverschrijving.get(k) === v);
    if (!typenGelijk) {
      this.typeOverschrijving = typen;
      this.tekenVakjes();
    }
    if (nacht === this.nacht) return;
    this.nacht = nacht;
    this.el.classList.toggle('is-nacht', nacht);
    for (const l of this.nachtLagen) {
      l.style.transition = duurMs > 0 ? `opacity ${duurMs}ms ease-in-out` : 'none';
      l.style.opacity = nacht ? '1' : '0';
    }
  }

  // ------------------------------------------------------------------ figuren

  private maakFiguur(sp: WeergaveSpeler, i: number): void {
    const f = sp.figuur;
    const el = document.createElement('div');
    el.className = 'figuur';
    const breedte = f.hoogte * f.verhouding;
    const ring = document.createElement('div');
    ring.className = 'figuur-ring';
    el.append(ring);
    if (f.handgetekend) {
      const schaduw = document.createElement('div');
      schaduw.className = 'figuur-schaduw';
      el.append(schaduw);
    }
    const img = plaatje(f.bestand, sp.naam, f.kleur, `figuur-plaatje${f.handgetekend ? ' handgetekend' : ''}`);
    img.style.width = `${breedte}px`;
    img.style.height = `${f.hoogte}px`;
    img.style.left = `${-breedte / 2}px`;
    img.style.top = `${-f.hoogte + 4}px`;
    el.append(img);
    this.spriteLaag.append(el);
    this.figuren[i] = el;
    this.figuurPunten[i] = [0, 0];
  }

  /**
   * Zet alle figuren op hun vakje. Staan er meer op één vakje, dan schuiven ze naast elkaar.
   * `duurMs` = hoe lang het lopen naar de nieuwe plek duurt (0 = direct).
   */
  plaatsFiguren(vakjes: string[], actief: number, duurMs = 0): void {
    const perVakje = new Map<string, number[]>();
    vakjes.forEach((id, i) => perVakje.set(id, [...(perVakje.get(id) ?? []), i]));
    vakjes.forEach((id, i) => {
      const v = vakje(this.bord, id);
      const samen = perVakje.get(id)!;
      const k = samen.indexOf(i);
      const { rx } = vakjeMaat(v.y);
      const uit = samen.length === 1 ? 0 : (k - (samen.length - 1) / 2) * rx * 0.85;
      this.zetFiguur(i, v.x + uit, v.y, i === actief, duurMs);
    });
    this.figuren.forEach((el, i) => el.classList.toggle('actief', i === actief));
    if (this.bovenSpeler >= 0) this.zetBoven();
  }

  private zetFiguur(i: number, x: number, y: number, actief: boolean, duurMs: number): void {
    const el = this.figuren[i];
    const d = diepteSchaal(y);
    el.style.transition = duurMs > 0 ? `transform ${duurMs}ms linear` : 'none';
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${d})`;
    el.style.zIndex = String(Math.round(y) + (actief ? 2000 : 0));
    this.figuurPunten[i] = [x, y];
  }

  figuurPunt(i: number): [number, number] {
    return this.figuurPunten[i];
  }

  /** Hoogte van een figuur op het scherm van het bord (in bordpixels), op zijn huidige plek. */
  figuurHoogte(i: number): number {
    return this.spelers[i].figuur.hoogte * diepteSchaal(this.figuurPunten[i][1]);
  }

  // ------------------------------------------------------------------ ster en Ratje

  /**
   * Zet de sterren die je ziet op hun sterplekken (alle andere sterren verdwijnen).
   * Met `mist` staat er op elke andere sterplek een vraagteken.
   */
  zetSterren(sterren: BordSter[], mist = false): void {
    const sleutel = (st: BordSter) => `${st.plek}${st.vallend ? '*' : ''}`;
    const gewenst = new Set(sterren.map(sleutel));
    for (const [k, el] of this.sterren) {
      if (!gewenst.has(k)) {
        el.remove();
        this.sterren.delete(k);
      }
    }
    for (const st of sterren) {
      const k = sleutel(st);
      if (this.sterren.has(k)) continue;
      const p = this.bord.sterplekken.find((s) => s.id === st.plek);
      if (!p) continue;
      const el = this.sprite('bord/ster.svg', st.vallend ? 'Vallende ster' : 'Ster', SPRITES.ster, p.x, p.y);
      el.classList.add('bord-ster');
      if (st.vallend) el.classList.add('vallend');
      this.sterren.set(k, el);
    }
    const metSter = new Set(sterren.map((st) => st.plek));
    for (const p of this.bord.sterplekken) {
      const nodig = mist && !metSter.has(p.id);
      const el = this.vraagtekens.get(p.id);
      if (nodig && !el) {
        const v = this.sprite('bord/vraagteken.svg', 'Hier kan de ster staan', SPRITES.vraagteken, p.x, p.y);
        v.classList.add('bord-vraagteken');
        this.vraagtekens.set(p.id, v);
      } else if (!nodig && el) {
        el.remove();
        this.vraagtekens.delete(p.id);
      }
    }
  }

  /** Ochtendmist aan of uit: de waas vloeit in ongeveer een seconde in of uit. */
  zetMist(mist: boolean, duurMs = 1000): void {
    if (mist === this.mist || !this.mistLaag) return;
    this.mist = mist;
    this.el.classList.toggle('is-mist', mist);
    this.mistLaag.style.transition = duurMs > 0 ? `opacity ${duurMs}ms ease-in-out` : 'none';
    this.mistLaag.style.opacity = mist ? '1' : '0';
  }

  /** Zet de valstrikken op hun vakje: de val uit het design, op een ring in de kleur van de eigenaar. */
  zetValstrikken(strikken: BordValstrik[]): void {
    const sleutel = (v: BordValstrik) => `${v.vakje}|${v.kleur}`;
    const gewenst = new Set(strikken.map(sleutel));
    for (const [k, el] of this.valstrikken) {
      if (!gewenst.has(k)) {
        el.remove();
        this.valstrikken.delete(k);
      }
    }
    for (const v of strikken) {
      const k = sleutel(v);
      if (this.valstrikken.has(k)) continue;
      const vak = vakje(this.bord, v.vakje);
      const d = diepteSchaal(vak.y);
      const el = document.createElement('div');
      el.className = 'bord-valstrik';
      el.style.setProperty('--kleur', v.kleur);
      el.style.transform = `translate(${vak.x}px, ${vak.y}px) scale(${d})`;
      el.style.zIndex = String(Math.round(vak.y) + 1);
      el.append(plaatje('iconen/valstrik.svg', 'Valstrik', v.kleur, 'bord-valstrik-plaatje'));
      this.spriteLaag.append(el);
      this.valstrikken.set(k, el);
    }
  }

  private zetRatje(): void {
    const p = this.bord.plekken.ratje;
    this.sprite('bord/ratje.svg', 'Ratje', SPRITES.ratje, p.x, p.y);
  }

  private sprite(pad: string, alt: string, meta: SpriteMeta, x: number, y: number): HTMLElement {
    const el = maakSprite(pad, alt, meta, x, y);
    this.spriteLaag.append(el);
    return el;
  }

  // ------------------------------------------------------------------ boven het figuur (dobbelknop)

  /** Een element dat boven het figuur van een speler zweeft, op vaste schermgrootte. */
  boven(speler: number, inhoud: HTMLElement | null): void {
    this.bovenEl.replaceChildren(...(inhoud ? [inhoud] : []));
    this.bovenSpeler = inhoud ? speler : -1;
    this.bovenEl.style.display = inhoud ? '' : 'none';
    if (inhoud) this.zetBoven();
  }

  private zetBoven(): void {
    const [x, y] = this.figuurPunten[this.bovenSpeler];
    const top = y - this.figuurHoogte(this.bovenSpeler) - 12;
    this.bovenEl.style.transition = this.figuren[this.bovenSpeler].style.transition;
    this.bovenEl.style.transform = `translate3d(${x}px, ${top}px, 0) scale(${1 / this.cam.schaal})`;
  }

  // ------------------------------------------------------------------ camera

  private scherm(): Afmeting {
    return { breedte: this.el.clientWidth || window.innerWidth, hoogte: this.el.clientHeight || window.innerHeight };
  }

  private zetCamera(cam: CameraStand, duurMs: number): void {
    this.cam = cam;
    this.wereld.style.transition = duurMs > 0 ? `transform ${duurMs}ms cubic-bezier(.25,.8,.3,1)` : 'none';
    this.wereld.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.schaal})`;
    if (this.bovenSpeler >= 0) this.zetBoven();
  }

  /** Breng een punt van het bord in beeld, ingezoomd. */
  volg(x: number, y: number, duurMs = 450): void {
    this.doel.punt = [x, y];
    this.zetCamera(cameraOp(x, y, this.scherm(), this.bord, VOLG_ZOOM), duurMs);
  }

  volgSpeler(i: number, duurMs = 450): void {
    const [x, y] = this.figuurPunten[i];
    this.volg(x, y - this.figuurHoogte(i) / 3, duurMs);
  }

  /** Het hele bord in beeld. */
  overzicht(duurMs = 600): void {
    this.doel.punt = null;
    this.zetCamera(cameraOverzicht(this.scherm(), this.bord), duurMs);
  }

  /** Opnieuw uitrekenen na draaien of een ander schermformaat. */
  meet(): void {
    if (this.doel.punt) this.volg(this.doel.punt[0], this.doel.punt[1], 0);
    else this.overzicht(0);
  }
}
