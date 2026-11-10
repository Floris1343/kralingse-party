/**
 * Tekent de vakjes in de stijl van het design: dezelfde opbouw en iconen als in board_dag.svg,
 * maar op de plekken uit board.json.
 */
import type { Vakje, VakjeType } from '../logic/bord';
import { vakjeMaat } from './diepte';
import { VAKJE_TEKENINGEN, type VakjeTekening } from './vakjeTekeningen';

/**
 * Het design heeft geen vleermuisvakje (§8.3). Tijdelijke vervanger: de opbouw van het blauwe
 * vakje in nachtpaars, met de maan uit het design (iconen/maan.svg) als icoon.
 */
const VLEERMUIS: VakjeTekening = {
  ...VAKJE_TEKENINGEN.blauw,
  onder: '#3A2A7A',
  kleur: '#6A4FD0',
  icoon:
    '<g transform="scale(.8) translate(-50 -50)"><path d="M62 10 A40 40 0 1 0 90 66 A32 32 0 1 1 62 10 Z" fill="#FFE9A8"/>' +
    '<circle cx="34" cy="60" r="5" fill="#E8CF85"/><circle cx="48" cy="78" r="3.5" fill="#E8CF85"/></g>',
};

const f = (n: number) => Math.round(n * 10) / 10;

/** SVG voor één vakje. (x, y) is het midden van de bovenkant. */
export function vakjeSvg(type: VakjeType, x: number, y: number): string {
  const t = type === 'vleermuis' ? VLEERMUIS : VAKJE_TEKENINGEN[type];
  if (!t) throw new Error(`Geen tekening voor vakje ${type}`);
  const { rx, ry, dikte } = vakjeMaat(y, type === 'start');
  const onderY = y + dikte;
  const el = (k: readonly [number, number], fill: string, extra = '') =>
    `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx * k[0])}" ry="${f(ry * k[1])}" fill="${fill}"${extra}/>`;
  return (
    `<g>` +
    `<ellipse cx="${f(x)}" cy="${f(onderY)}" rx="${f(rx)}" ry="${f(ry)}" fill="${t.onder}"/>` +
    el(t.wit_, t.wit) +
    el(t.kleur_, t.kleur) +
    el(t.ring_, 'none', ' stroke="#fff" stroke-width="1.3" stroke-dasharray="3 3" opacity=".5"') +
    `<g transform="translate(${f(x)} ${f(y)}) scale(${(rx * t.icoon_[0]).toFixed(3)} ${(ry * t.icoon_[1]).toFixed(3)})">${t.icoon}</g>` +
    `</g>`
  );
}

/**
 * Alle vakjes, van achter naar voren (zodat voorste vakjes over achterste vallen).
 * `typeVan` kan het type aanpassen, bijvoorbeeld de bosvakjes die 's nachts rood zijn.
 */
export function vakjesSvg(vakjes: readonly Vakje[], typeVan: (v: Vakje) => VakjeType = (v) => v.type): string {
  return [...vakjes]
    .sort((a, b) => a.y - b.y)
    .map((v) => vakjeSvg(typeVan(v), v.x, v.y))
    .join('');
}
