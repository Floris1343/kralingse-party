# Beslissingen

Keuzes die niet in `ONTWERP.md` stonden, met een korte reden.

- **Het spel staat in een openbare GitHub-repo.** GitHub Pages is alleen gratis voor openbare repo's. Er staat niets geheims in; de kaart in `referentie/` gaat niet mee naar GitHub.
- **De knop "Verder spelen" verschijnt alleen als er een bewaard spel is** (zoals in §13 van het ontwerp). Bij de eerste keer zie je dus alleen "Nieuw spel".
- **Opgeslagen spellen met een ander versienummer worden genegeerd** in plaats van omgezet. Zolang het spel nog in aanbouw is, houdt dat de code simpel.
- **Startworp: iedereen gooit een ander getal.** Net als bij dobbelblokken in Mario Party is elk getal maar één keer te gooien. Zo is er nooit een gelijkspel bij de start en hoeft niemand opnieuw te gooien.
- **Te weinig munten voor een ster? Dan krijg je de vraag niet** en loop je gewoon door. Dat scheelt een tik.
- **Bots kopen altijd een ster als ze genoeg munten hebben.**
- **Gedeelde laatste plaats bij het eindspel-rad:** het lot wijst aan wie van hen het rad draait.
- **Eindspel-rad "eeuwige nacht" en "Ratje gratis"** worden al onthouden, maar doen pas iets zodra dag/nacht en Ratje gebouwd zijn. *(Werken sinds stap 5.)*
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
  - 's Nachts sluit de boot pas als dag en nacht gebouwd zijn (fase 4). *(Gebouwd in stap 5.)*
- **Bots kiezen het zijpad alleen als ze daarmee sneller bij de ster zijn.** Voor de boot moeten ze na het betalen ook nog een ster kunnen kopen. Zo nemen ze de boot als de ster bij Plaszoom of Park Rozenburg staat (§6.2), en kiezen ze bij het hertenkamp het kortere hoofdpad.
- **De turboknop blijft aan** tot je hem weer uitzet, ook na het herladen. Met turbo zijn de bots in één keer klaar, zonder lopen. Je ziet daarna alleen de korte melding.
- **Minigame-uitslag:** tik de figuren op volgorde aan. "Gelijk met vorige" zet de volgende die je aantikt op dezelfde plek als de vorige. Heeft iedereen al een plek, dan schuift de laatste een plek op, naar de plek erboven. De laatste krijgt vanzelf de laatste plek. De knop "Bevestigen" is de bevestiging, en met "Opnieuw" begin je opnieuw.
- **Het opstartscherm onthoudt je laatste keuzes** (namen, figuren, mens/bot, rondes). Tik je op een figuur, dan krijg je het volgende figuur. Heeft iemand anders dat figuur al, dan ruilen jullie. Er moet minstens één mens meedoen.
- **Kleuren van de figuren zoals in het design:** Floris is blauw en Speler 2 is rood.
- **Nieuw spel en de minigame-uitslag zijn precies op designmaat (1180 × 820) gebouwd** en schalen mee met het scherm. Zo zien ze er op elke iPad hetzelfde uit.

## Stap 5: dag en nacht, winkel, Ratje en de vakjes

- **Dag en nacht:** ronde 1–3 dag, 4–6 nacht, 7–9 dag, enzovoort. De wissel gebeurt na de minigame, aan het begin van de nieuwe ronde. Een lantaarnpaal zet het meteen om; daarna gaat het ritme van 3 rondes gewoon verder.
- **Eeuwige nacht** maakt het meteen nacht, en dan doet ook de lantaarnpaal niets meer.
- **Pommie zegt iets bij elke wissel van dag en nacht**, ook als een bot op de lantaarnpaal komt (§12). Je kunt hem wegtikken.
- **Eén item per beurt.** Dat houdt de beurt kort. Gebruik je de Wisseltruc of de Ratjebel, dan gooi je daarna gewoon met één dobbelsteen.
- **De Ratjebel** kun je alleen gebruiken als Ratje ook echt iets kan doen (genoeg munten en iemand met munten of een ster).
- **De winkel en Ratje krijg je alleen te zien als je iets kunt doen**, net als bij de ster. Volgorde op een vakje: eerst de ster, dan de winkel, dan Ratje.
- **De winkel verkoopt alle 5 items tegelijk**, in 5 kaarten in de stijl van het winkelscherm uit het design. Muizenval en Gouden sleutel uit het design zitten er niet in (ONTWERP.md is leidend).
- **Ratje:** eerst kies je wat hij steelt, daarna van wie. Je kunt alleen iemand kiezen die munten (of een ster) heeft. Ratje steelt nooit meer munten dan iemand heeft.
- **Verplaatst worden** (windvlaag, hertje, bok, aanspoelen) telt niet als langslopen of landen. Je koopt dan dus geen ster en het nieuwe vakje doet niets. Zo blijft één beurt één uitkomst (net als bij de vleermuizen in §8.3).
- **Achteruit waaien** gaat over het pad op land, nooit terug de boot of het hertenkamp-pad op.
- **Aanspoelen na de bok** kan op elk vakje, behalve op de bootroute en het ijspad.
- **Kans:** de rollen kiezen speler A en B uit alle vier de spelers (A en B zijn altijd verschillend). Heeft A te weinig munten, dan geeft A wat hij heeft. Heeft A geen ster, dan gebeurt er niets.
- **Pech "ruil met de laatste":** sta je zelf (gedeeld) laatste, dan gebeurt er niets. **"Iedereen 3 geven":** zolang je munten hebt.
- **Zeilwedstrijd:** iedereen gooit 1–10, ook dubbele getallen; bij gelijkspel winnen ze allemaal.
- **Mensen zien het rad, de kans-rollen en de zeilwedstrijd** en tikken op "Verder". Bij een bot zie je alleen de korte melding, behalve bij de zeilwedstrijd: die duurt 1,5 seconde, want iedereen doet mee (met turbo niet).
- **Bots met items:** de Ratjebel als Ratje een ster kan stelen, anders de beste dobbelsteen; Kies-je-worp als de ster binnen 10 vakjes ligt (en dan eindigen ze het liefst op blauw); de Wisseltruc als de ster meer dan 15 vakjes weg is. Kopen doen ze alleen als ze daarna nog een ster kunnen betalen.
- **Bots en Ratje:** eerst een ster stelen van wie de meeste heeft, anders munten van de rijkste.
- **Icoontjes:** het design heeft geen tekening voor de Wisseltruc, de Driedubbele dobbelsteen en de Ratjebel. De Driedubbele krijgt het icoon van de dubbele met "×3", de Ratjebel krijgt Ratje zelf en de Wisseltruc een tijdelijke paarse cirkel met een W.
- **Het waarschuwingsbordje bij het hertenkamp** staat in het design niet als losse tekening. In de plaats daarvan waarschuwt de keuze bij de splitsing 's nachts: "Pas op! 's Nachts is de bok wild."
- **Opslagversie 3.** Een bewaard spel uit stap 4 (versie 2) kan gewoon verder: het is dan overdag en niemand heeft items.
- **Nog niet in deze stap** (komt in fase 5): de Nachtwinkel, de vallende ster, de vleermuizen en de ochtendmist. 's Nachts is de winkel dus dicht en er is nog niets anders open; de vleermuisvakjes zijn nog gewoon blauw.
