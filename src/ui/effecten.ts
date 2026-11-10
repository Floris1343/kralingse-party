/**
 * Speelt de effecten af die de spellogica net opleverde (§11): boven het hoofd van het figuur
 * ploft "+3" of "−3" (of een item met "+1"), de munten in de spelersbalk tellen zichtbaar op of
 * af, het figuur springt of deukt in en er klinkt een geluidje. Een ster kopen is een feest;
 * een ster kwijtraken de sippe versie. Bots krijgen alles korter; met turbo niets.
 */
import { zeg } from '../data/teksten';
import { muntGeluid, muntTik, sterGeluid } from '../audio/geluid';
import type { GameState } from '../logic';
import type { BordWeergave } from '../render/bordWeergave';
import { asset } from './asset';
import { betrokken, effectenUit, nieuwInVerslag, type Effect } from './effectPlan';
import { itemIcoon } from './itemIcoon';
import { maak } from './onderdelen';
import type { Spelersbalk } from './spelersbalk';
import { sterFeest, sterWegAnimatie } from './sterFeest';

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface EffectOmgeving {
  weergave: BordWeergave;
  balk: Spelersbalk;
  laag: HTMLElement;
  state: () => GameState;
  /** Wordt er nu niets geanimeerd (turbo bij een bot)? */
  overslaan: (bot: boolean) => boolean;
  /** Na een sterfeest: de camera uit, de ster verhuist met een "poef", de camera terug. */
  naSter: (speler: number) => Promise<void>;
}

/** Het getal of item dat boven het hoofd ploft. */
function zweefInhoud(soort: 'munten' | 'item' | 'ster', verschil: number, item?: Parameters<typeof itemIcoon>[0]): HTMLElement {
  const el = maak('span', `effect-getal ${verschil >= 0 ? 'plus' : 'min'}`);
  if (soort === 'munten') el.innerHTML = `<img src="${asset('iconen/munt.svg')}" alt="">`;
  else if (soort === 'ster') el.innerHTML = `<img src="${asset('iconen/ster.svg')}" alt="">`;
  else if (item) el.append(itemIcoon(item, 44));
  el.append(`${verschil >= 0 ? '+' : '−'}${Math.abs(verschil)}`);
  return el;
}

export class EffectSpeler {
  private wachtrij: Effect[] = [];
  /** Moet het bord de sterren nog even laten staan (tot na het sterfeest)? */
  sterrenVast = false;

  constructor(private o: EffectOmgeving) {}

  /** Na elke actie: wat is er nieuw in het verslag? Dat komt in de wachtrij. */
  plan(oud: GameState, nieuw: GameState, bot: boolean): void {
    if (this.o.overslaan(bot)) return;
    const effecten = effectenUit(nieuwInVerslag(oud.verslag, nieuw.verslag));
    if (!effecten.length) return;
    this.wachtrij.push(...effecten);
    this.o.balk.houdVast(betrokken(effecten));
    if (effecten.some((e) => e.soort === 'ster')) this.sterrenVast = true;
  }

  get leeg(): boolean {
    return this.wachtrij.length === 0;
  }

  /** Speelt alles uit de wachtrij af, kort na elkaar. Bots korter. */
  async speel(bot: boolean): Promise<void> {
    const { weergave, balk, laag } = this.o;
    while (this.wachtrij.length) {
      const e = this.wachtrij.shift()!;
      const s = this.o.state();
      const naam = (i: number) => s.spelers[i].naam;
      if (this.o.overslaan(bot)) continue;
      const kort = bot;
      switch (e.soort) {
        case 'munten': {
          const regels = Object.entries(e.verschil).map(([k, v]) => [Number(k), v] as const);
          muntGeluid(regels.some(([, v]) => v > 0));
          for (const [i, v] of regels) {
            weergave.zweef(i, zweefInhoud('munten', v), kort ? 900 : 1400);
            weergave.reageer(i, v >= 0 ? 'spring' : 'deuk');
            balk.telMunten(i, balk.getoondVoor(i).munten + v, kort ? 400 : 650, muntTik);
          }
          await wacht(kort ? 600 : 1000);
          break;
        }
        case 'item': {
          weergave.zweef(e.speler, zweefInhoud('item', e.aantal, e.item), kort ? 900 : 1400);
          weergave.reageer(e.speler, e.aantal > 0 ? 'spring' : 'deuk');
          balk.wiebel(e.speler, e.aantal > 0);
          muntGeluid(e.aantal > 0);
          await wacht(kort ? 600 : 1000);
          break;
        }
        case 'ster': {
          await sterFeest(laag, {
            tekst: `${naam(e.speler)} heeft een ster!`,
            pommie: zeg('sterFeest', naam(e.speler)),
            doel: () => weergave.figuurOpScherm(e.speler),
            kort,
            bijRaak: () => {
              sterGeluid();
              balk.stuiterSter(e.speler, balk.getoondVoor(e.speler).sterren + 1);
              weergave.reageer(e.speler, 'spring');
            },
          });
          this.sterrenVast = false;
          await this.o.naSter(e.speler);
          break;
        }
        case 'sterWeg': {
          weergave.overzicht(350);
          await wacht(380);
          await sterWegAnimatie(laag, {
            tekst: `${naam(e.van)} raakt een ster kwijt…`,
            van: weergave.figuurOpScherm(e.van),
            naar: weergave.figuurOpScherm(e.naar),
            kort,
            bijVertrek: () => {
              balk.stuiterSter(e.van, balk.getoondVoor(e.van).sterren - 1);
              balk.wiebel(e.van, false);
              weergave.reageer(e.van, 'deuk');
            },
            bijAankomst: () => {
              balk.stuiterSter(e.naar, balk.getoondVoor(e.naar).sterren + 1);
              weergave.reageer(e.naar, 'spring');
            },
          });
          break;
        }
      }
    }
    this.sterrenVast = false;
    balk.laatLos(this.o.state());
  }

  /** Alles meteen afronden, zonder animatie (bijvoorbeeld als turbo aangaat). */
  wis(): void {
    this.wachtrij = [];
    this.sterrenVast = false;
    this.o.balk.laatLos(this.o.state());
  }
}
