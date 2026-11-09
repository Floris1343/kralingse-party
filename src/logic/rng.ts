/**
 * Random generator met seed (mulberry32).
 * De stand van de generator is één getal dat in de GameState wordt bewaard,
 * zodat een herladen spel precies hetzelfde verdergaat.
 */

/** Geeft een getal in [0, 1) en de nieuwe rng-stand terug. */
export function volgende(stand: number): [waarde: number, nieuweStand: number] {
  const nieuweStand = (stand + 0x6d2b79f5) | 0;
  let t = nieuweStand;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const waarde = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [waarde, nieuweStand];
}

/** Geheel getal van min t/m max (beide inclusief). */
export function geheelGetal(stand: number, min: number, max: number): [number, number] {
  const [w, nieuw] = volgende(stand);
  return [min + Math.floor(w * (max - min + 1)), nieuw];
}

/** Een dobbelsteen van 1 t/m 10. */
export function dobbel(stand: number): [number, number] {
  return geheelGetal(stand, 1, 10);
}

/** Maakt een nieuwe seed (alleen bij het starten van een nieuw spel). */
export function nieuweSeed(): number {
  return (Math.random() * 4294967296) | 0;
}
