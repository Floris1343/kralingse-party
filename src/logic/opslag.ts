import type { GameState } from './gameState';

/** Verhoog dit als de vorm van GameState verandert. */
export const OPSLAG_VERSIE = 6;
export const OPSLAG_SLEUTEL = 'kralingse-plas-party/spel';

interface Opgeslagen {
  versie: number;
  state: GameState;
}

/** Minimale opslag-interface, zodat tests geen echte localStorage nodig hebben. */
export interface Opslag {
  getItem(sleutel: string): string | null;
  setItem(sleutel: string, waarde: string): void;
  removeItem(sleutel: string): void;
}

export function bewaar(opslag: Opslag, state: GameState): void {
  const data: Opgeslagen = { versie: OPSLAG_VERSIE, state };
  opslag.setItem(OPSLAG_SLEUTEL, JSON.stringify(data));
}

/** Geeft het bewaarde spel terug, of null als er niets (bruikbaars) is. */
export function laad(opslag: Opslag): GameState | null {
  const ruw = opslag.getItem(OPSLAG_SLEUTEL);
  if (!ruw) return null;
  try {
    const data = JSON.parse(ruw) as Opgeslagen;
    if (!data?.state || !Array.isArray(data.state.spelers)) return null;
    if (data.versie === 2) return vanVersie5(vanVersie4(vanVersie3(vanVersie2(data.state))));
    if (data.versie === 3) return vanVersie5(vanVersie4(vanVersie3(data.state)));
    if (data.versie === 4) return vanVersie5(vanVersie4(data.state));
    if (data.versie === 5) return vanVersie5(data.state);
    if (data.versie !== OPSLAG_VERSIE) return null;
    return data.state;
  } catch {
    return null;
  }
}

/** Een spel uit stap 4 (versie 2) kan gewoon verder: het was overdag en niemand had items. */
function vanVersie2(state: GameState): GameState {
  const s = structuredClone(state);
  s.nacht = false;
  for (const sp of s.spelers) sp.items = [];
  for (const g of s.verslag) if (g.soort === 'worp' && !g.worpen) g.worpen = [g.waarde];
  return s;
}

/** Een spel uit stap 5 (versie 3): nog geen valstrikken, geen mist en niemand heeft een slak of pet. */
function vanVersie3(state: GameState): GameState {
  const s = structuredClone(state);
  s.valstrikken ??= [];
  s.mist ??= null;
  for (const sp of s.spelers) {
    sp.slak ??= false;
    sp.achteruit ??= false;
  }
  return s;
}

/** Een spel uit stap 6/7 (versie 4): de startworp was één getal per speler, nu een lijstje. */
function vanVersie4(state: GameState): GameState {
  const s = structuredClone(state);
  const oud = s.startworpen as unknown as (number | number[])[];
  s.startworpen = oud.map((w) => (Array.isArray(w) ? w : [w]));
  return s;
}

/**
 * Het onderste pad bij het hertenkamp is weg (stap 10). Wie op een van die vakjes stond (of daar
 * een valstrik had), staat nu op het dichtstbijzijnde vakje van het pad langs het hek.
 */
export const VERDWENEN_VAKJES: Record<string, string> = {
  hoofdpad1: 'herten1',
  hoofdpad2: 'herten2',
  hoofdpad3: 'herten3',
};

function vanVersie5(state: GameState): GameState {
  const s = structuredClone(state);
  const nieuw = (id: string) => VERDWENEN_VAKJES[id] ?? id;
  for (const sp of s.spelers) sp.vakje = nieuw(sp.vakje);
  for (const v of s.valstrikken) v.vakje = nieuw(v.vakje);
  // Twee valstrikken op één vakje kan niet: de tweede vervalt.
  s.valstrikken = s.valstrikken.filter((v, i) => s.valstrikken.findIndex((w) => w.vakje === v.vakje) === i);
  // Stond iemand bij de oude splitsing te kiezen, dan loopt hij gewoon verder.
  if (s.fase.soort === 'splitsing' && s.fase.vakje === 'noord7') {
    s.fase = { soort: 'lopen', worp: s.fase.worp, resterend: s.fase.resterend };
  }
  return s;
}

export function heeftOpgeslagenSpel(opslag: Opslag): boolean {
  return laad(opslag) !== null;
}

export function wis(opslag: Opslag): void {
  opslag.removeItem(OPSLAG_SLEUTEL);
}
