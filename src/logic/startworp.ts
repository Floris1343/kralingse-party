/**
 * De startworp (§2): iedereen gooit één voor één. De hoogste begint. Gooien spelers hetzelfde,
 * dan gooien alleen die spelers opnieuw, tot alles beslist is. De volgorde blijft het hele spel.
 */
import type { GameState } from './gameState';
import { metKopie, spelerAanZet, trek, vereisFase } from './regels';

/** Wie er nu moet gooien bij de startworp. */
export function startwerper(state: GameState): number {
  const fase = vereisFase(state, 'startworp');
  return fase.teGooien[0];
}

/** Vergelijkt de worpen van twee spelers: eerst de eerste worp, bij gelijk de tweede, enzovoort. */
function vergelijk(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (b[i] ?? 0) - (a[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** De speler die aan de beurt is, gooit 1–10. Als iedereen van dit rondje gegooid heeft, wordt het beslist. */
export function gooiStartworp(state: GameState): GameState {
  const fase = vereisFase(state, 'startworp');
  return metKopie(state, (s) => {
    const speler = fase.teGooien[0];
    const waarde = trek(s, 1, 10);
    s.startworpen[speler].push(waarde);
    s.verslag.push({ soort: 'startworp', speler, waarde });
    const rest = fase.teGooien.slice(1);
    if (rest.length) {
      s.fase = { soort: 'startworp', teGooien: rest };
      return;
    }
    beslis(s);
  });
}

/** Iedereen van het rondje heeft gegooid: wie staat er nog gelijk? Anders ligt de volgorde vast. */
function beslis(s: GameState): void {
  const alle = s.spelers.map((_, i) => i);
  const gelijk = alle.filter((i) => alle.some((j) => j !== i && vergelijk(s.startworpen[i], s.startworpen[j]) === 0));
  if (gelijk.length) {
    s.verslag.push({ soort: 'startworpGelijk', spelers: gelijk });
    s.fase = { soort: 'startworp', teGooien: gelijk };
    return;
  }
  s.volgorde = alle.sort((a, b) => vergelijk(s.startworpen[a], s.startworpen[b]));
  s.fase = { soort: 'startVolgorde' };
}

/** "Start!": ronde 1 begint met de eerste in de volgorde. */
export function startSpel(state: GameState): GameState {
  vereisFase(state, 'startVolgorde');
  return metKopie(state, (s) => {
    s.aanZet = 0;
    s.verslag = [];
    s.fase = { soort: 'dobbelen' };
  });
}

/** Wie is er aan zet in de startworp of het spel? (Voor het scherm.) */
export function wieGooit(state: GameState): number {
  return state.fase.soort === 'startworp' ? state.fase.teGooien[0] : spelerAanZet(state);
}
