/** Controleert of een bord klopt. Handig na het slepen in de editor. */
import { splitsingBij, volgendVakje, type Bord } from './bord';

/** Geeft een lijst met problemen terug (leeg = alles in orde). */
export function controleerBord(bord: Bord): string[] {
  const fouten: string[] = [];
  const ids = new Set<string>();
  for (const v of bord.vakjes) {
    if (ids.has(v.id)) fouten.push(`Vakje ${v.id} bestaat twee keer`);
    ids.add(v.id);
  }
  const bestaat = (id: string, waar: string) => {
    if (!ids.has(id)) fouten.push(`${waar} verwijst naar onbekend vakje ${id}`);
  };

  bestaat(bord.start, 'Start');
  for (const v of bord.vakjes) {
    if (v.next.length === 0) fouten.push(`Vakje ${v.id} heeft geen vervolg`);
    v.next.forEach((n) => bestaat(n, `Vakje ${v.id}`));
    if (v.next.length > 1 && !splitsingBij(bord, v.id)) fouten.push(`Vakje ${v.id} heeft twee routes maar is geen splitsing`);
  }
  for (const s of bord.splitsingen) {
    bestaat(s.vakje, `Splitsing ${s.soort}`);
    const v = bord.vakjes.find((x) => x.id === s.vakje);
    if (v && !(v.next.includes(s.hoofdpad) && v.next.includes(s.zijpad))) {
      fouten.push(`Splitsing ${s.soort}: ${s.vakje} wijst niet naar ${s.hoofdpad} en ${s.zijpad}`);
    }
  }
  for (const p of bord.sterplekken) bestaat(p.vakje, `Sterplek ${p.id}`);
  for (const [naam, p] of Object.entries(bord.plekken)) bestaat(p.vakje, `Plek ${naam}`);
  if (fouten.length) return fouten;

  // De hoofdroute moet vanaf de start rondlopen en weer bij de start uitkomen.
  const route = hoofdroute(bord);
  if (route.at(-1) !== bord.start) fouten.push('De hoofdroute komt niet terug bij de start');

  // Elk zijpad moet weer op de hoofdroute uitkomen.
  const opRoute = new Set(route);
  for (const s of bord.splitsingen) {
    let id = s.zijpad;
    for (let i = 0; i < bord.vakjes.length && !opRoute.has(id); i++) id = bord.vakjes.find((v) => v.id === id)!.next[0];
    if (!opRoute.has(id)) fouten.push(`Het zijpad bij ${s.vakje} (${s.soort}) komt niet terug op de hoofdroute`);
  }
  return fouten;
}

/** De vakjes van de hoofdroute, vanaf de start tot en met de start (bij splitsingen het hoofdpad). */
export function hoofdroute(bord: Bord): string[] {
  const route = [bord.start];
  let id = bord.start;
  for (let i = 0; i < bord.vakjes.length; i++) {
    id = volgendVakje(bord, id);
    route.push(id);
    if (id === bord.start) break;
  }
  return route;
}
