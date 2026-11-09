/** Bonussterren en de winnaar (§4, §10). */
import type { BonusSoort, Eindtelling, GameState, SpelerStats } from './gameState';
import { verschillendeWorpen } from './regels';

const BONUS_STAT: Record<BonusSoort, keyof Omit<SpelerStats, 'sterrenPerRonde'>> = {
  minigame: 'minigameMunten',
  rijkaard: 'hoogsteMunten',
  avonturier: 'avontuurVakjes',
};

/** Wie de bonusster krijgt: iedereen met de hoogste waarde, maar alleen als die hoger dan 0 is. */
export function bonusWinnaars(state: GameState, soort: BonusSoort): number[] {
  const waarden = state.spelers.map((sp) => sp.stats[BONUS_STAT[soort]]);
  const max = Math.max(...waarden);
  if (max <= 0) return [];
  return waarden.map((w, i) => (w === max ? i : -1)).filter((i) => i >= 0);
}

/**
 * Deelt de bonussterren uit (als ze aan staan) en bepaalt de ranglijst:
 * eerst sterren, dan munten, dan een extra worp. Werkt op een kopie van de state.
 */
export function doeEindtelling(s: GameState): void {
  const bonussterren: Eindtelling['bonussterren'] = [];
  if (s.instellingen.bonussterren) {
    for (const soort of Object.keys(BONUS_STAT) as BonusSoort[]) {
      const spelers = bonusWinnaars(s, soort);
      for (const i of spelers) s.spelers[i].sterren += 1;
      bonussterren.push({ soort, spelers });
    }
  }

  const sp = s.spelers;
  const groepen = new Map<string, number[]>();
  for (let i = 0; i < sp.length; i++) {
    const sleutel = `${sp[i].sterren}/${sp[i].munten}`;
    groepen.set(sleutel, [...(groepen.get(sleutel) ?? []), i]);
  }

  // Bij gelijke sterren én munten: extra worp (altijd verschillende getallen).
  const beslisWorp = new Map<number, number>();
  const beslisWorpen: Eindtelling['beslisWorpen'] = [];
  for (const groep of groepen.values()) {
    if (groep.length < 2) continue;
    const worpen = verschillendeWorpen(s, groep.length);
    groep.forEach((speler, k) => {
      beslisWorp.set(speler, worpen[k]);
      beslisWorpen.push({ speler, waarde: worpen[k] });
    });
  }

  const ranglijst = sp
    .map((_, i) => i)
    .sort(
      (a, b) =>
        sp[b].sterren - sp[a].sterren ||
        sp[b].munten - sp[a].munten ||
        (beslisWorp.get(b) ?? 0) - (beslisWorp.get(a) ?? 0),
    );

  s.eindtelling = { bonussterren, ranglijst, winnaar: ranglijst[0], beslisWorpen };
  s.fase = { soort: 'einde' };
}
