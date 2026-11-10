# Beslissingen

Keuzes die niet in `ONTWERP.md` stonden, met een korte reden.

- **Het spel staat in een openbare GitHub-repo.** GitHub Pages is alleen gratis voor openbare repo's. Er staat niets geheims in; de kaart in `referentie/` gaat niet mee naar GitHub.
- **De knop "Verder spelen" verschijnt alleen als er een bewaard spel is** (zoals in §13 van het ontwerp). Bij de eerste keer zie je dus alleen "Nieuw spel".
- **Opgeslagen spellen met een ander versienummer worden genegeerd** in plaats van omgezet. Zolang het spel nog in aanbouw is, houdt dat de code simpel.
- **Startworp: iedereen gooit een ander getal.** Net als bij dobbelblokken in Mario Party is elk getal maar één keer te gooien. Zo is er nooit een gelijkspel bij de start en hoeft niemand opnieuw te gooien.
- **Te weinig munten voor een ster? Dan krijg je de vraag niet** en loop je gewoon door. Dat scheelt een tik.
- **Bots kopen altijd een ster als ze genoeg munten hebben.**
- **Gedeelde laatste plaats bij het eindspel-rad:** het lot wijst aan wie van hen het rad draait.
- **Eindspel-rad "eeuwige nacht" en "Ratje gratis"** worden al onthouden, maar doen pas iets zodra dag/nacht en Ratje gebouwd zijn.
- **Bonussterren:** een bonusster gaat alleen naar iemand die er echt iets voor deed (hoger dan 0). Staat iedereen gelijk, bijvoorbeeld bij de Rijkaard-ster, dan krijgt iedereen hem (zoals §10 zegt).
- **Gelijkspel na sterren én munten:** de gelijke spelers gooien opnieuw, elk een ander getal. Dat geldt voor alle plaatsen, niet alleen de eerste.
- **Sterren per ronde** (voor de grafiek) worden genoteerd na de minigame van elke ronde, vóór de bonussterren.
- **Opslagversie 2.** Een bewaard spel uit stap 1 wordt genegeerd; dat was nog geen echt spel.

## Stap 3: design en bord

- **Het bord uit het design is de basis.** De vorm van de plas, het pad en alle decoratie komen letterlijk uit `board_dag.svg`. Alleen de vakjes worden uit `board.json` getekend, met precies dezelfde tekenformule als het design.
- **Geen extra CSS-kanteling.** Het design-bord is al schuin getekend (ovale vakjes, kleiner naar achteren). Nog eens kantelen zou het platdrukken. De camera schuift en zoomt wel mee.
- **Aantal vakjes per zone volgt de vorm van het design-bord.** De oostkant is in het design korter dan de rest. Zodat het restaurantvakje naast het restaurant ligt, is de verdeling: Oostoever 3, Plaszoom 5, Zuidoever 7 (in plaats van 6, 4, 6). De hoofdroute heeft precies 38 vakjes.
- **De bootsteiger is een eigen vakje** met het boot-icoon uit het design. Het geeft geen munten, net als het startvakje. Daarom zijn er 18 blauwe vakjes op de hoofdroute in plaats van 19.
- **Het ijspad loopt van het Strand naar Plaszoom** (zoals in ONTWERP.md), niet van noord naar zuid zoals op het winterbord van het design. Het staat al in `board.json`, maar wordt pas getekend als de winter gebouwd wordt.
- **Bij een splitsing loopt iedereen voorlopig over het hoofdpad.** Kiezen (en de boot betalen) komt in een latere stap. *(Gebouwd in stap 4.)*
- **De sterren staan in de plas naast het pad**, zodat ze geen vakjes bedekken. De ster bij Plaszoom staat precies waar het design hem heeft.
- **Spelers 1 en 2 zijn de handgetekende figuren uit het design** ("Floris" en "Speler 2"), de bots zijn het groene en het gele pionnetje. Het rode en het blauwe pionnetje uit de PDF zitten niet in de HTML-bestanden en worden niet gebruikt.
- **Tijdelijk in deze stap:** "Nieuw spel" start meteen met 2 mensen en 2 bots, 10 rondes, zomer. Bij de minigame krijgt iedereen 10 munten. Het opstartscherm en het invullen van de uitslag komen in de volgende stap. *(Vervangen in stap 4.)*

## Stap 4: spelen op de iPad

- **Eén tik om te dobbelen.** In het design staat eerst een "Gooi!"-knop op het bord en daarna het dobbelscherm met "Tik op het blok!". Dat zijn twee tikken. Volgens §11 is het er één: als je aan de beurt bent, schuift de camera naar je figuur en verschijnt meteen het dobbelscherm.
- **Bots krijgen geen dobbelscherm.** Hun beurt blijft op het bord (binnen 2 seconden, §11). Het bot-dobbelscherm uit het design (map 4) bewaren we voor later.
- **De uitslag na het dobbelen verdwijnt vanzelf** na ongeveer een seconde, of eerder als je tikt. Hoog (7–10) geeft confetti en een oranje pil, laag (1–3) een donkere pil, de rest een blauwe pil.
- **Bij een splitsing kies je met twee grote knoppen.** Dat gebeurt op het vakje vóór de splitsing, voordat je verder loopt. De keuze telt niet als stap.
  - Heb je minder dan 3 munten, dan krijg je de bootvraag niet (net als bij de ster).
  - Het **ijspad** blijft dicht tot de winter gebouwd is (fase 8). Tot die tijd doet het seizoen nog niets, en vaart de boot ook als je "Winter" kiest.
  - 's Nachts sluit de boot pas als dag en nacht gebouwd zijn (fase 4).
- **Bots kiezen het zijpad alleen als ze daarmee sneller bij de ster zijn.** Voor de boot moeten ze na het betalen ook nog een ster kunnen kopen. Zo nemen ze de boot als de ster bij Plaszoom of Park Rozenburg staat (§6.2), en kiezen ze bij het hertenkamp het kortere hoofdpad.
- **De turboknop blijft aan** tot je hem weer uitzet, ook na het herladen. Met turbo zijn de bots in één keer klaar, zonder lopen. Je ziet daarna alleen de korte melding.
- **Minigame-uitslag:** tik de figuren op volgorde aan. "Gelijk met vorige" zet de volgende die je aantikt op dezelfde plek als de vorige. Heeft iedereen al een plek, dan schuift de laatste een plek op, naar de plek erboven. De laatste krijgt vanzelf de laatste plek. De knop "Bevestigen" is de bevestiging, en met "Opnieuw" begin je opnieuw.
- **Het opstartscherm onthoudt je laatste keuzes** (namen, figuren, mens/bot, rondes). Tik je op een figuur, dan krijg je het volgende figuur. Heeft iemand anders dat figuur al, dan ruilen jullie. Er moet minstens één mens meedoen.
- **Kleuren van de figuren zoals in het design:** Floris is blauw en Speler 2 is rood.
- **Nieuw spel en de minigame-uitslag zijn precies op designmaat (1180 × 820) gebouwd** en schalen mee met het scherm. Zo zien ze er op elke iPad hetzelfde uit.
