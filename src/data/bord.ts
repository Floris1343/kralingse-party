/** Het echte speelbord van de Kralingse Plas (src/data/board.json). */
import type { Bord } from '../logic/bord';
import data from './board.json';

export const BORD = data as unknown as Bord;
