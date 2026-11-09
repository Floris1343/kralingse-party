/**
 * De volledige spelstand. Wordt in latere stappen uitgebreid
 * (spelers, bord, ster, dag/nacht, enzovoort).
 * Moet altijd serialiseerbaar blijven (alleen JSON-waarden).
 */
export interface GameState {
  /** Huidige stand van de random generator. */
  rng: number;
  ronde: number;
  aantalRondes: 10 | 15 | 20;
}
