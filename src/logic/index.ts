/** Alles wat het scherm van de spellogica nodig heeft. */
export * from './gameState';
export * from './bord';
export { nieuwSpel, type NieuwSpelKeuzes, type SpelerKeuze } from './nieuwSpel';
export { dobbelen, stap, sterKeuze, splitsingKeuze, loopUit } from './beurt';
export { openSplitsing, zijpadOpen, botKiestZijpad, stappenTotSter } from './splitsing';
export { BOOT_PRIJS } from './regels';
export { verwerkMinigame, minigameBeloning, type MinigameUitslag } from './minigame';
export { draaiEindspelRad, isEindspel, eersteEindspelRonde, EINDSPEL_REGELS } from './eindspel';
export { bonusWinnaars } from './eindtelling';
export { sterPrijs, kanSterBetalen } from './ster';
export { plaatsen, spelerAanZet } from './regels';
export { wachtOpBot, botActie, speelBotsAf } from './bot';
export { bewaar, laad, heeftOpgeslagenSpel, wis, type Opslag } from './opslag';
export { nieuweSeed } from './rng';
