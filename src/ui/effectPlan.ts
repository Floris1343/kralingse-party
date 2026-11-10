/**
 * Welke effecten er in beeld komen na een actie (§11): munten erbij of eraf, een item, een ster
 * gekocht of een ster kwijt. Uit het verslag van de spellogica; puur, zodat het te testen is.
 *
 * Munten met dezelfde reden die direct na elkaar komen, staan samen in één groep (zoals de
 * minigame-uitslag, of kans waarbij A aan B geeft): die verschijnen tegelijk. Al het andere komt
 * kort na elkaar.
 */
import type { Gebeurtenis, ItemSoort, MuntReden } from '../logic';

export type Effect =
  | { soort: 'munten'; reden: MuntReden; verschil: Record<number, number> }
  | { soort: 'item'; speler: number; item: ItemSoort; aantal: number }
  | { soort: 'ster'; speler: number; vallend: boolean }
  | { soort: 'sterWeg'; van: number; naar: number };

export function effectenUit(verslag: readonly Gebeurtenis[]): Effect[] {
  const uit: Effect[] = [];
  for (const g of verslag) {
    const vorige = uit.at(-1);
    switch (g.soort) {
      case 'munten':
        if (vorige?.soort === 'munten' && vorige.reden === g.reden) {
          vorige.verschil[g.speler] = (vorige.verschil[g.speler] ?? 0) + g.verschil;
        } else {
          uit.push({ soort: 'munten', reden: g.reden, verschil: { [g.speler]: g.verschil } });
        }
        break;
      case 'item':
        if (g.actie !== 'gebruikt') uit.push({ soort: 'item', speler: g.speler, item: g.item, aantal: 1 });
        break;
      case 'itemsKwijt':
        if (g.items.length) uit.push({ soort: 'item', speler: g.speler, item: g.items[0], aantal: -g.items.length });
        break;
      case 'sterGekocht':
        uit.push({ soort: 'ster', speler: g.speler, vallend: g.nieuwePlek === '' });
        break;
      case 'ratje':
        if (g.wat === 'ster' && g.buit > 0) uit.push({ soort: 'sterWeg', van: g.doel, naar: g.speler });
        break;
      case 'kans':
        if (g.actie === 'geefSter' && g.gelukt) uit.push({ soort: 'sterWeg', van: g.a, naar: g.b });
        break;
    }
  }
  // Een groep die op nul uitkomt (iemand geeft en krijgt evenveel), laten we weg.
  return uit.filter((e) => e.soort !== 'munten' || Object.values(e.verschil).some((v) => v !== 0));
}

/** Wie er in deze effecten munten of sterren ziet veranderen (voor de spelersbalk). */
export function betrokken(effecten: readonly Effect[]): number[] {
  const s = new Set<number>();
  for (const e of effecten) {
    if (e.soort === 'munten') Object.keys(e.verschil).forEach((k) => s.add(Number(k)));
    else if (e.soort === 'sterWeg') (s.add(e.van), s.add(e.naar));
    else s.add(e.speler);
  }
  return [...s];
}

/**
 * Het deel van het verslag dat nieuw is. Is het verslag opnieuw begonnen (een nieuwe beurt,
 * een minigame), dan is alles nieuw.
 */
export function nieuwInVerslag(oud: readonly Gebeurtenis[], nieuw: readonly Gebeurtenis[]): Gebeurtenis[] {
  if (nieuw.length < oud.length) return [...nieuw];
  for (let i = 0; i < oud.length; i++) if (JSON.stringify(oud[i]) !== JSON.stringify(nieuw[i])) return [...nieuw];
  return nieuw.slice(oud.length);
}
