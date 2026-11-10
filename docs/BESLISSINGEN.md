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
- **Het opstartscherm onthoudt je laatste keuzes** (namen, figuren, mens/bot, rondes). Tik je op een figuur, dan zie je alle figuren en kies je er één. Bij elk figuur staat wie het nu heeft; kies je dat, dan ruilen jullie. (Eerst kreeg je bij elke tik het volgende figuur; met 6 figuren voelde dat willekeurig.) Er moet minstens één mens meedoen.
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

## Stap 6: het nachtleven (Nachtwinkel, vallende ster, vleermuizen, ochtendmist)

- **De Nachtwinkel** krijg je alleen te zien als je iets kunt kopen, net als de gewone winkel. Volgorde op een vakje: ster, winkel, Nachtwinkel, Ratje. Gewone en gemene items tellen samen voor de 3 plekken in je zak.
- **Gemene items gebruik je vóór het dobbelen** en ze tellen als je ene item van die beurt. Bij de Zakkenroller, de Slakkendobbel en de Achteruitpet kies je eerst een speler; met "Terug" kies je toch iets anders.
- **Een gratis item** (itemvakje, herten) is altijd een gewoon item, nooit een gemeen item.
- **Zakkenroller:** heeft iemand minder dan 5 munten, dan steel je wat hij heeft. Iemand zonder munten kun je niet kiezen.
- **Slakkendobbel en Achteruitpet stapelen niet.** Heeft iemand er al een, dan kun je hem die niet nog eens geven. De slak geldt voor elke dobbelsteen van die worp: met de dubbele dobbelsteen gooi je 2× 1–3, met Kies-je-worp kies je 1–3.
- **Achteruit lopen** gaat over het pad op land, zonder splitsingen (dus nooit terug de boot, het hertenkamp-pad of het ijs op). Achteruit langs de ster, de winkel of Ratje komen telt gewoon als langslopen.
- **Valstrik:** je legt hem op het vakje waar je staat, en maar één per speler. Op een vakje ligt nooit meer dan één valstrik. Hij gaat af als een ander er zijn beurt **eindigt**: eerst betaalt die 10 munten (of wat hij heeft), daarna telt het vakje gewoon. Langslopen of erheen verplaatst worden (windvlaag, bok, vleermuizen) telt niet. Op je eigen valstrik gebeurt niets.
- **Bots en de Nachtwinkel:** ze kopen alleen als ze daarna nog een ster kunnen betalen, het liefst de Achteruitpet, dan de Slakkendobbel, de Valstrik en de Zakkenroller. Ze gebruiken een gemeen item meteen en richten het op de speler op de 1e plaats (staan ze zelf eerst, dan op de 2e). Met de Achteruitpet gebruiken ze geen extra dobbelstenen; met Kies-je-worp kiezen ze dan 1.
- **De vallende ster** kan alleen komen als er daarna nog een vrije sterplek over is, zodat een gekochte gewone ster altijd kan verhuizen. Hij heeft dezelfde tekening als de gewone ster, met een gloed, zodat je het verschil ziet.
- **Vleermuizen:** het rad heeft 6 even grote vakken, zodat "naar de ster" precies 1 op 6 is: 2 terug, 2 vooruit, +5, 2 terug, −5, naar de ster. "2 terug" staat er twee keer op, zodat er 3 goede en 3 nare vakken zijn. "Naar de ster" brengt je naar het vakje vlak vóór de dichtstbijzijnde ster. De vleermuizen weten ook in de mist waar hij staat.
- **Vleermuisvakje:** het design heeft er geen tekening voor. Tijdelijk is het een paars vakje met de maan uit het design.
- **Ochtendmist:** na een volledige ronde trekt hij op, aan het begin van de ronde daarna. Komt de mist midden in een ronde door een lantaarnpaal, dan blijft hij tot de ronde daarna. Wordt het nacht, dan is de mist meteen weg (mist hoort bij de ochtend).
- **Ster in de mist:** wie erlangs loopt, ontdekt hem, ook zonder genoeg munten. Daarna ziet iedereen hem weer, tot hij verhuist (dan staat hij weer verborgen). Bots weten bij mist niet waar de ster is: geen boot, geen Kies-je-worp en geen Wisseltruc om ernaartoe te gaan.
- **De vraagtekenbordjes en de mistwaas** komen letterlijk uit het design (`board_mist.svg`). Het bordje wordt nu als losse tekening uitgeknipt, zodat het ook op de goede plek staat als je de sterplekken in de editor verschuift.
- **Iconen:**
  - De Valstrik krijgt de val uit het design (`item_val.svg`).
  - De Slakkendobbel krijgt het slakje uit `dobbel-slakkendobbel.html`.
  - De Zakkenroller en de Achteruitpet hebben geen tekening: tijdelijk een nachtpaarse cirkel met een letter.
- **In de spelersbalk** staat een slakje of een pijltje terug bij wie een Slakkendobbel of Achteruitpet van een ander heeft.
- **Pommie** komt in beeld bij de ochtendmist (in plaats van de gewone dag-tekst), als de mist optrekt en bij een vallende ster.
- **Opslagversie 4.** Een bewaard spel uit stap 5 (versie 3) kan gewoon verder: er ligt dan nog geen valstrik en er hangt geen mist.

## Figuren: de kikker en het konijn

- **Twee nieuwe figuren van de eigenaar** voor de computerspelers: de kikker in een eendenband en het konijn met blauwe strikken. Bij een nieuw spel zijn ze standaard Bot 1 en Bot 2. De pionnetjes kun je nog steeds kiezen door op het figuur te tikken.
- **De achtergrond is weggehaald** en de tekening is bijgesneden (PNG met een doorzichtige achtergrond, zoals Floris en Speler 2). Het wit binnen de lijnen van het konijn is gebleven.
- **Kleuren:** de kikker is groen (zoals de groene pion), het konijn paars (de paarse kleur uit het design), zodat het niet botst met het blauw van Floris.
- **Ze zijn breder dan hoog**, dus op het bord iets minder hoog (88 en 92 tegen 105 voor Floris), zodat ze ongeveer even groot lijken.
