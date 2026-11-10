/**
 * Alle tekst van Pommie de host. Pas gerust aan!
 * Per moment staan er een paar varianten; het spel kiest er willekeurig één.
 * Tussen {haakjes} vult het spel iets in: {naam} is de naam van de speler, de andere staan
 * bij het moment erbij.
 */
export const teksten = {
  welkom: [
    'Welkom bij de Kralingse Plas! Zin in een feestje?',
    'Hoi hoi! Pommie hier. Pak je munten, we gaan rond de plas!',
    'Welkom, welkom! Wie haalt vandaag de meeste sterren?',
  ],
  /** De startworp (§2). */
  startworp: [
    'Eerst de startworp! Wie het hoogst gooit, mag beginnen!',
    'Iedereen gooit één keer. Wie het hoogst gooit, mag beginnen!',
  ],
  /** Bij de startworp gooiden spelers hetzelfde. */
  startworpGelijk: [
    'Gelijk! {naam} gooien opnieuw.',
    'Oei, dezelfde worp! {naam} gooien nog een keer.',
  ],
  minigame: [
    'Speel nu een minigame op de Switch! Kies er een voor 4 spelers.',
    'Minigame! Pak de controllers en kies een spel voor 4 spelers.',
    'Op naar de Switch! Wie wint deze minigame voor 4 spelers?',
  ],
  /** Op het opstartscherm. {mensen} en {bots}: "Twee mensen", "twee bots". */
  nieuwSpel: [
    '{mensen}, {bots}. Ik zorg dat de bots razendsnel zijn!',
  ],
  nieuwSpelVier: [
    'Vier mensen! Dat wordt een echt feestje.',
  ],
  nieuwSpelEen: [
    'Jij tegen drie bots. Ik zorg dat ze razendsnel zijn!',
  ],
  winkel: [
    'Welkom in mijn winkeltje!',
    'Kijk maar rond! Eén item per bezoek.',
  ],
  nachtwinkel: [
    'Psst… iets gemeens nodig?',
    'Niet verder vertellen, hè? Alles hier is een beetje gemeen.',
  ],
  eindspel: [
    'Nog maar vijf rondes! Nu tellen de vakjes dubbel.',
    'Het eindspel begint! Blauw en rood tellen vanaf nu dubbel.',
  ],
  /** De tussenstand bij het begin van het eindspel. {sterren} = de sterren van de koploper. */
  tussenstand: [
    'Even kijken hoe het staat… {naam} staat eerste met {sterren}!',
    'De tussenstand! {naam} gaat aan kop met {sterren}.',
  ],
  tussenstandGelijk: [
    'Even kijken hoe het staat… Het is spannend: {naam} staan gelijk bovenaan!',
  ],
  eindspelRad: [
    '{naam} staat laatste en mag aan het rad draaien!',
    'Even wat hulp voor {naam}: draai aan het rad!',
  ],
  /** Wat het rad van de laatste speler aan het eindspel toevoegt (§9). */
  regel_munten20: ['+20 munten voor {naam}!'],
  regel_extraSter: ['Er komt een extra ster bij: nu staan er twee op het bord!'],
  regel_goedkopeSter: ['Een ster kost vanaf nu maar 10 munten!'],
  regel_eeuwigeNacht: ['Eeuwige nacht: het blijft nacht tot het einde!'],
  regel_ratjeGratis: ['Ratje werkt vanaf nu helemaal gratis!'],
  /** De bonussterren-ceremonie (§10). */
  bonusIntro: [
    'Het spel is uit! Maar eerst… de bonussterren!',
    'Klaar! Tijd voor de bonussterren. Wie krijgt er nog een ster bij?',
  ],
  bonus_minigame: [
    'De Minigame-ster gaat naar {naam}! Die verdiende de meeste munten met minigames.',
  ],
  bonus_rijkaard: [
    'De Rijkaard-ster gaat naar {naam}! Die had ooit de meeste munten tegelijk.',
  ],
  bonus_avonturier: [
    'De Avonturier-ster gaat naar {naam}! Die kwam het vaakst op een avontuur.',
  ],
  bonusNiemand: [
    'Deze bonusster gaat naar… niemand! Jammer.',
  ],
  bonusUit: [
    'Het spel is uit! De bonussterren staan uit, dus we gaan meteen tellen.',
  ],
  /** Bij gelijke sterren en munten beslist een extra worp. {worpen} = "Floris 8, Bot 1 3". */
  beslisworp: [
    'Gelijk! Een extra worp beslist: {worpen}.',
  ],
  nacht: [
    'Het is donker in het bos… Wie durft langs het hertenkamp?',
    'De nacht valt over de plas! De boot vaart niet meer en de bok is wild.',
    'Lantaarns aan! Het restaurant is dicht, maar Ratje is goedkoper.',
  ],
  dag: [
    'Goedemorgen! De zon is op en de boot vaart weer.',
    'Het wordt dag! De winkel bij het restaurant is weer open.',
    'Daar is de zon weer! De herten zijn weer lief.',
  ],
  vallendeSter: [
    'Een vallende ster! Er staat nu een tweede ster op het bord.',
    'Kijk omhoog! Een vallende ster! Koop hem voor het weer dag wordt.',
    'Een vallende ster! Wie haalt hem voordat de zon opkomt?',
  ],
  mist: [
    'Ochtendmist! De ster staat op een van de zes ?-plekken.',
    'Wat een mist over de plas! Waar is de ster gebleven? Loop erlangs om hem te vinden.',
  ],
  mistWeg: [
    'De mist trekt op! Nu zie je de ster weer.',
    'Daar is de zon door de mist heen. Iedereen ziet de ster weer!',
  ],
  /** De winnaar. Zet de naam aan het eind: het gebrabbel maakt het dan spannend. */
  winnaar: [
    'En de winnaar is… {naam}!',
    'Tromgeroffel… De Plas-kampioen is {naam}!',
  ],
} as const;

export type Moment = keyof typeof teksten;

/**
 * Kiest een willekeurige variant en vult in wat tussen {haakjes} staat.
 * `invullen` is de naam van de speler, of een lijstje zoals { naam: 'Floris', sterren: '3 sterren' }.
 */
export function zeg(moment: Moment, invullen: string | Record<string, string | number> = ''): string {
  const lijst: readonly string[] = teksten[moment];
  const waarden = typeof invullen === 'string' ? { naam: invullen } : invullen;
  let tekst = lijst[Math.floor(Math.random() * lijst.length)];
  for (const [k, v] of Object.entries(waarden)) tekst = tekst.replaceAll(`{${k}}`, String(v));
  return tekst;
}
