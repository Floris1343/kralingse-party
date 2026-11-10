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

- ~~Eén tik om te dobbelen.~~ *Vervangen in stap 8: een beurt begint nu met "Jouw beurt" en het keuzemenu.*
- **Bots krijgen geen dobbelscherm** tijdens het spel. Hun beurt blijft op het bord (binnen 2 seconden, §11). Alleen bij de startworp gooien ze in het dobbelscherm (stap 8).
- **De uitslag na het dobbelen verdwijnt vanzelf** na ongeveer een seconde, of eerder als je tikt. Hoog (7–10) geeft confetti en een oranje pil, laag (1–3) een donkere pil, de rest een blauwe pil.
- **Bij een splitsing kies je met twee grote knoppen.** Dat gebeurt op het vakje vóór de splitsing, voordat je verder loopt. De keuze telt niet als stap.
  - Heb je minder dan 3 munten, dan krijg je de bootvraag niet (net als bij de ster).
  - Het **ijspad** blijft dicht tot de winter gebouwd is (fase 8). Tot die tijd doet het seizoen nog niets, en vaart de boot ook als je "Winter" kiest.
  - 's Nachts sluit de boot pas als dag en nacht gebouwd zijn (fase 4). *(Gebouwd in stap 5.)*
- **Bots kiezen het zijpad alleen als ze daarmee sneller bij de ster zijn.** Voor de boot moeten ze na het betalen ook nog een ster kunnen kopen. Zo nemen ze de boot als de ster bij Plaszoom of Park Rozenburg staat (§6.2). *(Bij het hertenkamp is sinds stap 10 geen splitsing meer.)*
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
- **Achteruit waaien** gaat over het pad op land, nooit terug de boot op.
- **Aanspoelen na de bok** kan op elk vakje, behalve op de bootroute en het ijspad.
- **Kans:** de rollen kiezen speler A en B uit alle vier de spelers (A en B zijn altijd verschillend). Heeft A te weinig munten, dan geeft A wat hij heeft. Heeft A geen ster, dan gebeurt er niets.
- **Pech "ruil met de laatste":** sta je zelf (gedeeld) laatste, dan gebeurt er niets. **"Iedereen 3 geven":** zolang je munten hebt.
- **Zeilwedstrijd:** iedereen gooit 1–10, ook dubbele getallen; bij gelijkspel winnen ze allemaal.
- **Mensen zien het rad, de kans-rollen en de zeilwedstrijd** en tikken op "Verder". Bij een bot zie je alleen de korte melding, behalve bij de zeilwedstrijd: die duurt 1,5 seconde, want iedereen doet mee (met turbo niet).
- **Bots met items:** de Ratjebel als Ratje een ster kan stelen, anders de beste dobbelsteen; Kies-je-worp als de ster binnen 10 vakjes ligt (en dan eindigen ze het liefst op blauw); de Wisseltruc als de ster meer dan 15 vakjes weg is. Kopen doen ze alleen als ze daarna nog een ster kunnen betalen.
- **Bots en Ratje:** eerst een ster stelen van wie de meeste heeft, anders munten van de rijkste.
- **Icoontjes:** het design heeft geen tekening voor de Wisseltruc, de Driedubbele dobbelsteen en de Ratjebel. De Driedubbele krijgt het icoon van de dubbele met "×3", de Ratjebel krijgt Ratje zelf en de Wisseltruc een tijdelijke paarse cirkel met een W.
- ~~Het waarschuwingsbordje bij het hertenkamp~~ *Vervangen in stap 10: er is nu een bordje bij de ingang.*
- **Opslagversie 3.** Een bewaard spel uit stap 4 (versie 2) kan gewoon verder: het is dan overdag en niemand heeft items.
- **Nog niet in deze stap** (komt in fase 5): de Nachtwinkel, de vallende ster, de vleermuizen en de ochtendmist. 's Nachts is de winkel dus dicht en er is nog niets anders open; de vleermuisvakjes zijn nog gewoon blauw.

## Stap 6: het nachtleven (Nachtwinkel, vallende ster, vleermuizen, ochtendmist)

- **De Nachtwinkel** krijg je alleen te zien als je iets kunt kopen, net als de gewone winkel. Volgorde op een vakje: ster, winkel, Nachtwinkel, Ratje. Gewone en gemene items tellen samen voor de 3 plekken in je zak.
- **Gemene items gebruik je vóór het dobbelen** en ze tellen als je ene item van die beurt. Bij de Zakkenroller, de Slakkendobbel en de Achteruitpet kies je eerst een speler; met "Terug" kies je toch iets anders.
- **Een gratis item** (itemvakje, herten) is altijd een gewoon item, nooit een gemeen item.
- **Zakkenroller:** heeft iemand minder dan 5 munten, dan steel je wat hij heeft. Iemand zonder munten kun je niet kiezen.
- **Slakkendobbel en Achteruitpet stapelen niet.** Heeft iemand er al een, dan kun je hem die niet nog eens geven. De slak geldt voor elke dobbelsteen van die worp: met de dubbele dobbelsteen gooi je 2× 1–3, met Kies-je-worp kies je 1–3.
- **Achteruit lopen** gaat over het pad op land, zonder splitsingen (dus nooit terug de boot of het ijs op). Achteruit langs de ster, de winkel of Ratje komen telt gewoon als langslopen.
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

## Stap 7: de host en de afwerking

- **Pommie praat met gebrabbel:** per lettergreep een korte, lage brom met een licht wisselende toonhoogte. Aan het eind van een vraag gaat de toon iets omhoog, anders zakt hij wat. De tekst loopt mee met het gebrabbel. Een lange zin heeft hoogstens 22 brommetjes, zodat hij nooit langer dan ongeveer 3 seconden duurt.
- **Elke ballon kun je wegtikken.** Tik je niet, dan verdwijnt hij vanzelf na de leestijd: ongeveer 1,6 s plus een beetje per letter, hoogstens 6 s.
- **Alle tekst van Pommie staat in `src/data/teksten.ts`**, ook die van het opstartscherm, de winkel, de Nachtwinkel, het eindspel en de ceremonie. Tussen {haakjes} vult het spel iets in, zoals de naam.
- **Geluid kan aan of uit** bij Instellingen (standaard aan). Dat geldt voor het gebrabbel en alle geluidjes. Op de iPad begint het geluid pas na de eerste tik; zo werkt Safari.
- **Geluidjes:**
  - een doffe bonk als je op het dobbelblok tikt, en een kort loopje bij de uitslag (hoger bij een hoge worp)
  - twee tingeltjes bij munten erbij en een zakkend toontje bij munten eraf
  - een fonkelend loopje bij een ster
  - een fanfaretje bij de winnaar
  - Met turbo hoor je de bots niet, anders wordt het één brij.
- **Begin van het eindspel:** Pommie zegt dat het eindspel begint. Daarna laat hij de tussenstand zien (een paneel met de ranglijst) en noemt hij de koploper. Daarna draait de laatste speler aan een echt rad met de 5 regels. Een mens tikt op "Draai!"; bij een bot draait het vanzelf. Pommie leest de nieuwe regel daarna voor. Dit moment slaat de turbo niet over, want het hoort bij iedereen.
- **Bonussterren-ceremonie** (alleen direct na de laatste minigame; via "Verder spelen" zie je meteen de uitslag):
  - Het eindscherm uit het design staat klaar, met de bonussterren uit ONTWERP.md: Minigame-ster, Rijkaard-ster en Avonturier-ster (niet de Muntenster en Pechster uit het design).
  - Per bonusster licht de rij op, verschijnt wie hem krijgt (met het getal) en vertelt Pommie het.
  - Daarna noemt Pommie de winnaar, met de naam aan het eind van zijn zin. Pas dan komt de trap omhoog, met een fanfaretje en confetti.
  - Staan de bonussterren uit, dan zegt Pommie dat en gaat hij meteen naar de winnaar. Bij gelijke sterren en munten noemt hij eerst de extra worp.
- **De grafiek "Sterren per ronde"** volgt de stijl van het design: elke speler in zijn eigen kleur, met een merkteken in de vorm van zijn figuur. Lijnen die over elkaar vallen, schuiven 2 px uit elkaar, zodat je ze allemaal ziet. De bonussterren tellen in de grafiek niet mee, want die komen pas na de laatste ronde.
- **Statistiek:** een knop op het eindscherm opent een tabel met per speler sterren, munten, munten met minigames, de hoogste muntenstand, gekochte sterren, hoe vaak op rood, hoe vaak de bok en het aantal avonturen. De hoogste waarde per rij is oranje.
- **Nog niet:** Pommie bij het bevriezen van de plas (dat komt met de seizoenen in fase 8).

## Stap 8: tik om verder te gaan, de startworp en het keuzemenu

- **Na een botbeurt blijft de melding staan** tot iemand tikt, met de hint "Tik om verder te gaan · Volgende: Bot 2". Is de minigame de volgende, dan staat er "Volgende: Minigame".
  - Tikken mag overal, behalve op de knoppen in de spelersbalk: de turboknop blijft werken.
  - Zet je turbo aan terwijl de melding wacht, dan gaat het spel meteen door. Met turbo aan wordt nooit gewacht.
- **Aankondiging bij bots:** "Beurt van Bot 1" staat 0,6 s in beeld, zonder tik. Met turbo slaan de bots die over, anders zou turbo trager worden.
- **Startworp:**
  - Iedereen gooit in de volgorde van het opstartscherm. Bij gelijk gooien alleen die spelers opnieuw, zo vaak als nodig.
  - Wie bij een eerdere worp al hoger gooide, blijft hoger. Voorbeeld: 8, 8, 4, 4 → eerst worden de twee achten beslist, dan de twee vieren.
  - Een bot gooit zelf en daarna tik je door. Een mens tikt op het blok; de uitslag blijft 1,5 s staan, of korter als je tikt.
  - Daarna toont het paneel "De volgorde" iedereen met zijn worpen, en tik je op "Start!".
  - Het spel wordt na elke worp bewaard. Sluit je de app tijdens de startworp, dan ga je precies daar verder.
- **Keuzemenu:** Dobbelen, Items en Bord bekijken zijn licht schuine banners in de Feestvilt-stijl. Het design heeft deze schermen en een kaart-icoon niet. Het kaart-icoon is daarom getekend in de stijl van de andere knop-icoontjes.
- **Items kiezen en annuleren:**
  - Dobbelstenen en Kies-je-worp werken pas bij het gooien. Die kun je annuleren met "Item annuleren" in het menu; het item gaat dan terug in je zak.
  - De Wisseltruc, de Ratjebel en de gemene items werken meteen als je op "Gebruik" tikt. Die kun je niet terugdraaien, want je hebt dan al geruild of gestolen. Op hun knop staat daarom "werkt meteen".
  - Het blijft één item per beurt: na een item is de knop Items grijs, en na een dobbel-item staat er "Item annuleren".
- **Bord bekijken:**
  - Je schuift met één vinger en zoomt met twee (op de Mac met het muiswiel), tot ongeveer 2,6 keer het hele bord. Verder uitzoomen dan het hele bord kan niet.
  - Bij de winkel, de Nachtwinkel en Ratje staat een bordje, met erbij of de winkel open of dicht is.
  - Bovenin staat hoeveel vakjes de ster van je af ligt; bij twee sterren de dichtstbijzijnde. Bij mist staat er "Ochtendmist: waar is de ster?".
- **Opslagversie 5.** Een bewaard spel van versie 4 (en ouder) speelt gewoon verder: de oude startworp wordt omgezet en de startworp komt niet opnieuw.

## Stap 9: aankomen op een vakje en het sterfeest

- **Volgorde van de effecten:**
  - Munten met dezelfde reden die direct na elkaar komen, verschijnen tegelijk. Voorbeelden: de minigame-uitslag bij iedereen, en kans "A geeft B 10" bij A en B samen.
  - Al het andere komt kort na elkaar. Een groep die op nul uitkomt, wordt weggelaten.
- **Wanneer:**
  - Wat je onderweg doet (een ster, de winkel, Ratje, de boot), zie je meteen na je keuze; daarna loop je verder.
  - Wat het vakje doet, zie je als je figuur stopt, na het rad of de kans-rollen.
  - De minigame-beloningen zie je direct na de uitslag, boven alle figuren tegelijk.
- **Een ster kopen:** eerst ploft "−20" en tellen je munten af, dan volgt het feest. De ster op het bord blijft tijdens het feest op zijn oude plek staan. Na het feest zoomt de camera uit, vervaagt de oude ster en verschijnt de nieuwe met een "poef" (een paar wolkjes en een gouden ring). Een vallende ster verdwijnt na aankoop alleen met een poef.
- **Ster kwijt:** door Ratje en door kans "A geeft B een ster" zie je de ster vliegen. Bij kans "ruilen alle sterren" springen de getallen in de balk gewoon om, zonder vliegende ster.
- **Items:** een gekregen of gekocht item toont het icoon met "+1". Eet de bok je items op, dan zie je het eerste item met "−2" (of hoeveel het er waren). Een item gebruiken toont niets.
- **Pommie juichend:** het design heeft geen blije pose van Pommie. Hij springt daarom juichend op en neer, met een tekst uit `teksten.ts` (sterFeest).
- **Bonussterren aan het eind:** elke bonusster krijgt een korte viering (stralen, de ster en "Floris krijgt de Minigame-ster!"), zonder vlucht naar een figuur, want het eindscherm heeft geen bord.
- **Overslaan:** met een tik sla je het sterfeest over; de balk en het figuur reageren dan meteen.
- **Soepel op de iPad:** alleen transform en opacity bewegen. Er zijn hoogstens 16 fonkels en 18 confettistukjes per uitbarsting.
- **Getallen in de balk:** de munten en sterren in de spelersbalk wachten tot hun effect komt en tellen dan op of af. Na de effecten staan ze altijd weer precies goed.

## Stap 10: één pad door het hertenkamp

- **Geen splitsing meer bij het hertenkamp.** Het pad langs het hek blijft over: noord7 → herten1 (blauw) → herten2, herten3, herten4 (drie hertenkamp-actievakjes op een rij) → oost1. De vakjes van het onderste pad (hoofdpad1 t/m 3) zijn weg.
- **Het verplaatste vakje:** op het onderste pad lag geen Windvlaag-vakje maar het Pech-vakje (het paarse vakje met het onweerswolkje). Het echte Windvlaag-vakje lag al op de Oostoever. Het Pech-vakje staat nu op oost1, het blauwe vakje direct na het hertenkamp. Zo blijven er 2 Pech-vakjes.
- **De hoofdroute** heeft nu 39 vakjes: 16 blauw, 6 rood, 5 event, 3 item, 2 kans, 2 pech, 3 hertenkamp, de start en de bootsteiger.
- **Het zandpad in de tekening:** de grote lus om de plas liep in het design ook onderlangs. Het script `bord-uit-design.mjs` laat dat stuk weg in alle grondlagen (dag, nacht, winter, mist), met de twee pijltjes erop. Er wordt niets nieuw getekend: het gras eronder komt uit het design. Het script maakt het nieuwe bord ook met `--bord`.
- **Het waarschuwingsbordje** staat bij de ingang (vóór herten1) en is alleen 's nachts te zien. Het design heeft er geen losse tekening voor. Het is samengesteld uit stukken van het design: het paaltje en de ronde plaat van het vraagtekenbordje, in het rood, met het hertenicoon van het hertenkamp-vakje erop. Je kunt het in de bord-editor verschuiven (plek `bokBordje`).
- **Bots** kiezen geen pad meer bij het hertenkamp; ze lopen er gewoon doorheen.
- **Opslagversie 6.** Een bewaard spel speelt gewoon verder. Wie op een verdwenen vakje stond, staat nu op het dichtstbijzijnde vakje van het nieuwe pad: hoofdpad1 → herten1, hoofdpad2 → herten2, hoofdpad3 → herten3. Een valstrik verhuist net zo. Stond iemand bij de oude splitsing te kiezen, dan loopt hij gewoon verder.

## De naam en het logo

- **De app heet Muppel Party.** De naam staat in de titel van de pagina, in het manifest (naam en korte naam onder het icoon) en in het hoofdmenu ("Muppel" boven "PARTY"). Het bord blijft de Kralingse Plas, en Pommie zegt dus nog steeds "Welkom bij de Kralingse Plas!".
- **Het logo** van de eigenaar is het app-icoon. Het is bijgesneden tot het roze vierkant en de zwarte hoekjes zijn roze gemaakt, want de iPad rondt de hoeken zelf af. De kleur van de app (statusbalk, achtergrond bij het opstarten) is het roze van het logo.
- **Niet veranderd, zodat niets kapotgaat:** het adres (`…/kralingse-party/`) en de namen waaronder het spel en de instellingen bewaard worden.
- **Het oude script `scripts/maak-iconen.mjs`** (dat zelf een icoon met een ster tekende) is weg, zodat het het logo niet per ongeluk overschrijft.

## Stap 11: alles wat rustiger

- **Op verzoek van de eigenaar** zijn het lopen, de effecten na een vakje (ook het sterfeest), het dobbelen en de camera ongeveer 1,5 keer zo rustig als eerst. Pommie, de raderen, de kans-rollen en de zeilwedstrijd zijn even snel gebleven.
- **Alle tijden staan in `src/ui/tempo.ts`**, met bij elke tijd wat die eerst was. Wil je iets sneller of rustiger, dan pas je het daar aan.
- **Lopen:** een mens loopt 225 ms per vakje (eerst 150), 90 ms als je tikt om te versnellen (eerst 60). Een bot loopt 170 ms per vakje (eerst 80): rustiger dan eerst, maar iets vlotter dan een mens.
- **Bots gooien in het dobbelscherm.** Het blok gooit vanzelf na 1 seconde, en de uitslag ("Bot 1 loopt 6 stappen") blijft 1,5 s staan, zonder tik. Daarna loopt de bot. Met een dubbele dobbelsteen zie je twee blokken. Met Kies-je-worp gooit het blok gewoon het gekozen getal. Met turbo is er geen dobbelscherm.
- **Een bot die een item koopt, gaat direct door.** Je ziet dan geen "−5" en geen "+1"; het staat alleen in de melding na zijn beurt. Een item dat een bot krijgt (een itemvakje of de herten) zie je wel.
- **Een bot huurt Ratje in.** Eerst zie je wat hij laat stelen (de gekozen kaart licht op), dan gaat Ratje een paar rondjes langs de spelers die iets te stelen hebben, steeds langzamer, tot hij stopt bij wie het wordt (±2,8 s). Daarna staat de uitslag ±1,8 s in beeld. Heeft maar één speler iets, dan wijst Ratje alleen die aan.
- **De zeilwedstrijd duurt langer:**
  - Eerst liggen de bootjes ±1,1 s klaar bij de start ("Klaar…", dan "Af!").
  - Dan varen ze ±2,8 s (eerst 1,2 s). Elk bootje vaart in een eigen tempo, zodat ze elkaar kunnen inhalen, maar nooit terug. Aan het eind staat elk bootje precies waar zijn worp hoort.
  - Bij een bot blijft de uitslag ±2,2 s staan (eerst 1,5 s).
- **Het Kans-rad duurt langer:** alle drie de rollen draaien tegelijk. Elke rol loopt steeds langzamer (van 70 ms tot ±320 ms per stap, met een tikje), en stopt met een bonk. Eerst speler A na ±1,7 s, dan de actie na ±3 s, dan speler B na ±4,3 s (eerst stonden ze na 0,6, 1 en 1,4 s stil). De tijden staan in `src/ui/tempo.ts`.
