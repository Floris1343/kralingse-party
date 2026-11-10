/**
 * Alle tekst van Pommie de host. Pas gerust aan!
 * Per moment staan er een paar varianten; het spel kiest er willekeurig één.
 * {naam} wordt vervangen door de naam van de speler.
 */
export const teksten = {
  welkom: [
    'Welkom bij de Kralingse Plas! Zin in een feestje?',
    'Hoi hoi! Pommie hier. Pak je munten, we gaan rond de plas!',
    'Welkom, welkom! Wie haalt vandaag de meeste sterren?',
  ],
  minigame: [
    'Speel nu een minigame op de Switch! Kies er een voor 4 spelers.',
    'Minigame! Pak de controllers en kies een spel voor 4 spelers.',
    'Op naar de Switch! Wie wint deze minigame voor 4 spelers?',
  ],
  eindspel: [
    'Nog maar vijf rondes! Nu tellen de vakjes dubbel.',
    'Het eindspel begint! Blauw en rood tellen vanaf nu dubbel.',
  ],
  eindspelRad: [
    '{naam} staat laatste en mag aan het rad draaien!',
    'Even wat hulp voor {naam}: draai aan het rad!',
  ],
  winnaar: [
    '{naam} wint! Wat een feest!',
    'En de winnaar is... {naam}!',
  ],
} as const;

/** Kiest een willekeurige variant en vult de naam in. */
export function zeg(moment: keyof typeof teksten, naam = ''): string {
  const lijst = teksten[moment];
  return lijst[Math.floor(Math.random() * lijst.length)].replaceAll('{naam}', naam);
}
