/**
 * Alle tijden van het spel op één plek (in milliseconden). Pas gerust aan:
 * groter = rustiger, kleiner = sneller. Met turbo spelen de bots altijd direct.
 *
 * Op verzoek van de eigenaar (stap 11) zijn lopen, de effecten na een vakje (ook het sterfeest),
 * het dobbelen en de camera ongeveer 1,5× zo rustig als eerst. Pommie en de raderen bleven gelijk.
 * Bots gooien in het dobbelscherm en lopen daarna iets vlotter dan een mens. Een bot die een item
 * koopt, gaat direct door.
 */
export const TEMPO = {
  // ---- lopen
  /** Eén vakje lopen voor een mens (eerst 150). */
  mensStap: 225,
  /** Eén vakje lopen als je tikt om te versnellen (eerst 60). */
  mensStapSnel: 90,
  /** Eén vakje lopen voor een bot: iets vlotter dan een mens (eerst 80). */
  botStap: 170,
  /** Een figuur dat verplaatst wordt (windvlaag, bok, hertje). */
  verplaatsMens: 600,
  verplaatsBot: 300,

  // ---- camera
  /** De camera naar je figuur aan het begin van je beurt (eerst 400). */
  cameraBeurt: 600,
  /** De camera volgt het lopen (eerst 350). */
  cameraLopen: 525,
  /** Na het lopen: inzoomen op het vakje en even wachten terwijl het oplicht (eerst 350 en 300). */
  aankomstMens: 525,
  aankomstMensWacht: 450,
  aankomstBot: 400,
  aankomstBotWacht: 330,

  // ---- dobbelen
  /** De uitslag van je worp blijft zo lang staan, of korter als je tikt (eerst 1100). */
  worpUitslag: 1650,
  /** De uitslag van de worp van een bot (die tikt niet). */
  botWorpUitslag: 1500,
  /** Bij de startworp (eerst 1500). */
  startworpUitslag: 2250,
  /** Een bot gooit na zo lang zelf (eerst 750). */
  botGooit: 1000,
  /** "Beurt van Bot 1" in beeld (eerst 600). */
  botAankondiging: 900,
  /** Na het dobbelscherm, voor het lopen begint (eerst 250). */
  naDobbelen: 375,
  /** Na een mensenbeurt, voor de volgende speler (eerst 500). */
  naMensBeurt: 750,

  // ---- effecten na een vakje (§11)
  /** Hoe lang een effect duurt voor het volgende komt (eerst 1000 en 600). */
  effectMens: 1500,
  effectBot: 900,
  /** Hoe lang "+3" boven het hoofd blijft (eerst 1400 en 900). */
  zweefMens: 2100,
  zweefBot: 1350,
  /** Hoe lang de munten in de balk tellen (eerst 650 en 400). */
  tellenMens: 975,
  tellenBot: 600,
  /** Het sterfeest duurt zo veel keer zijn basisduur (±2,5 s voor een mens, ±1,5 s voor een bot). */
  sterFeest: 1.5,
  /** Na het sterfeest: uitzoomen, de "poef" en terug naar je figuur (eerst 420, 700 en 450). */
  naSterUit: 630,
  naSterPoef: 1050,
  naSterTerug: 675,

  // ---- Ratje bij een bot: de spanning
  /** Hoe lang Ratje langs de kandidaten gaat voor hij stopt. */
  ratjeSpanning: 2800,
  /** Hoe lang de uitslag van Ratje in beeld blijft. */
  ratjeUitslag: 1800,
} as const;
