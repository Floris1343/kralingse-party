/**
 * Het bord uit het design is al schuin van bovenaf getekend: verder naar achteren (kleinere y)
 * worden vakjes kleiner en platter. Deze functies rekenen dat na met de formule uit het design.
 */
import { VAKJE_MAAT } from './vakjeTekeningen';

export interface VakjeMaat {
  /** Halve breedte van de onderkant. */
  rx: number;
  /** Halve hoogte van de onderkant. */
  ry: number;
  /** Hoe ver de bovenkant boven de onderkant ligt. */
  dikte: number;
}

const lin = ([a, b]: readonly [number, number], y: number) => a + b * y;

/** Maat van een vakje op diepte y. Het startvakje is iets groter. */
export function vakjeMaat(y: number, isStart = false): VakjeMaat {
  const f = isStart ? VAKJE_MAAT.start : 1;
  return { rx: lin(VAKJE_MAAT.rx, y) * f, ry: lin(VAKJE_MAAT.ry, y) * f, dikte: lin(VAKJE_MAAT.dikte, y) * f };
}

/**
 * Hoe groot rechtopstaande dingen (figuren, ster) op diepte y zijn, vergeleken met vooraan.
 * 1 = onderin het bord (y = 700), kleiner naar achteren.
 */
export function diepteSchaal(y: number): number {
  return lin(VAKJE_MAAT.rx, y) / lin(VAKJE_MAAT.rx, 700);
}
