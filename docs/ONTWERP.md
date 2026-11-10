# Kralingse Plas Party – ontwerpdocument

Werktitel, mag later anders. Dit document beschrijft **wat** het spel is. `CLAUDE.md` beschrijft **hoe** het gebouwd wordt.

---

## 1. Het idee in één alinea

Een bordspel in de stijl van Mario Party dat je speelt op een iPad. Het bord is de Kralingse Plas in Rotterdam, en je ziet het schuin van bovenaf. Op de iPad wordt gedobbeld, gelopen, worden munten verdiend en sterren gekocht. Na elke ronde spelen de spelers **één minigame op de Nintendo Switch**, in een Mario Party-game. Daarna vullen ze op de iPad de uitslag in (1e t/m 4e). De iPad deelt dan munten uit. Wie aan het eind de meeste sterren heeft, wint.

**Doelgroep:** volwassenen (21+), meestal 2 mensen + 2 bots.
**Belangrijkste eis: TEMPO.** De bots mogen nooit het gevoel geven dat je zit te wachten.

---

## 2. Spelers

- Standaard: **4 deelnemers = 2 mensen + 2 bots**. In het opstartscherm moet in te stellen zijn wie mens of bot is (1 t/m 4 mensen).
- Elke bot op de iPad hoort bij een vaste computerspeler op de Switch. Bot 1 op de iPad is dus ook "Bot 1" op de Switch.
- Iedere deelnemer heeft een **naam** en een **figuur** (eigen PNG, zie `assets/README.md`).
- **Startworp:** aan het begin van een nieuw spel gooit iedereen één voor één, in het dobbelscherm. Pommie legt het kort uit ("Wie het hoogst gooit, mag beginnen!").
  - Mensen tikken zelf op het blok. Bots gooien zelf, waarna je tikt om door te gaan.
  - Gooien spelers hetzelfde, dan gooien alleen die spelers opnieuw, tot alles beslist is.
  - Daarna zie je de volgorde 1 t/m 4 in beeld en tik je op "Start!".
  - De hoogste worp begint. De volgorde blijft het hele spel gelijk en wordt opgeslagen.

---

## 3. Verloop van een potje

1. **Opstartscherm:** kies het aantal rondes (**10**, 15 of 20), het seizoen (Zomer, Winter of Wisselend), namen, figuren, wie bot is en of bonussterren aan staan.
2. **Elke ronde:**
   1. Iedere speler is om de beurt aan zet: eventueel een item gebruiken, dan dobbelen (**1–10**), lopen en het vakje afhandelen.
   2. **Minigame-scherm:** "Speel nu een minigame op de Switch!" Daarna vul je de uitslag in, en de munten worden uitgedeeld.
   3. De rondeteller gaat omhoog. Elke **3 rondes wisselen dag en nacht**.
3. **Laatste 5 rondes:** de host kondigt het eindspel aan (zie §8).
4. **Eindtelling:** bonussterren, daarna de winnaar en een korte statistiek.

Het spel bewaart zichzelf **automatisch na elke stap**. Je kunt de app op elk moment sluiten en later via **"Verder spelen"** precies verder gaan waar je was.

---

## 4. Munten en sterren (klassiek)

| Regel | Waarde |
|---|---|
| Startmunten | 10 |
| Prijs van een ster | 20 munten |
| Ster kopen | Gebeurt bij **langslopen** (je hoeft er niet op te eindigen). Je kunt maximaal één ster per keer langslopen kopen. |
| Na aankoop | De ster verhuist naar een willekeurige andere kandidaat-plek (niet dezelfde) |
| Gelijkspel aan het eind | Eerst telt het aantal munten, daarna een extra worp |

---

## 5. Minigames (op de Switch)

- **Versie 1: altijd ieder voor zich (1 tegen 1 tegen 1 tegen 1).** Teamspellen (1 tegen 3, 2 tegen 2) komen later misschien.
- Het minigame-scherm laat zien: "Minigame! Kies op de Switch een minigame voor 4 spelers", met de 4 figuren en hun namen.
- **Uitslag invoeren:** tik de figuren aan in de volgorde waarin ze geëindigd zijn. Gelijke plekken moeten mogelijk zijn. Daarna volgt een bevestigingsknop, en een knop om te herstellen bij een vergissing.
- **Beloning:** 1e = **10**, 2e = **5**, 3e = **2**, 4e = **0** munten. Bij een gelijke plek krijgt iedereen de beloning van de hoogste van die plekken.
- Houd per speler bij hoeveel munten die met minigames heeft verdiend (voor de bonusster).

---

## 6. Het bord: de Kralingse Plas

Referentie: `referentie/kaart-kralingse-plas.png`. Het noorden is boven. De hoofdroute loopt **met de klok mee** om de plas.

### 6.1 Zones (met de klok mee, beginnend bij het strand)

| # | Zone | Plek op de kaart | Ongeveer aantal vakjes | Bijzonder |
|---|---|---|---|---|
| 1 | **Strand** | linksboven/west-noordwest (het zandstrand) | 5 (incl. start) | Startvakje, eventvakje "Strandtent" |
| 2 | **Noordoever** | langs het bos en de grasvelden boven | 7 | Lantaarnpaal (wissel dag/nacht); 's nachts vleermuizen (§8.3) |
| 3 | **Splitsing hertenkamp** | rechtsboven/noordoost | hoofdpad 3, hertenkamp-pad 4 | Keuze welk pad, zie §6.3 |
| 4 | **Oostoever** | het lange rechte pad aan de rechterkant | 6 | Eventvakje "Windvlaag" |
| 5 | **Restaurant** | Restaurant De Tuin van de Vier Windstreken (oost) | 1 | **Winkel**; aankomst van de boot |
| 6 | **Plaszoom** | rechtsonder/zuidoost | 4 | Lantaarnpaal (wissel dag/nacht) |
| 7 | **Zuidoever / Park Rozenburg** | onderkant, richting de stad | 6 | **Ratje** (de kerstrat) woont hier |
| 8 | **Jachthaven** | linksonder/zuidwest (de bootjes) | 3 | **Bootsplitsing** (§6.2); **Nachtwinkel** (§8.1) |
| 9 | **Westoever** | links, terug naar het strand | 4 | Eventvakje "Zeilwedstrijd" (§7.5) |

De hoofdroute heeft in totaal ongeveer **38 vakjes**, plus 4 op het hertenkamp-pad en 4 op de bootroute.

### 6.2 De boot (kortere route)

- Bij de jachthaven staat een **steiger met een splitsing**: je kiest tussen gewoon doorlopen en de boot nemen.
- De boot kost **3 munten** en vaart over het water via **4 bootvakjes** (gewone blauwe vakjes op het water) naar de **steiger bij het Restaurant** aan de oostkant. Je slaat daarmee het hele noordelijke stuk over.
- **'s Nachts vaart de boot niet.** De splitsing is dan dicht en je loopt automatisch door.
- Bots nemen de boot als de ster aan de oostkant of zuidkant ligt en ze genoeg munten hebben.

### 6.3 Het hertenkamp

- Rechtsboven splitst het pad: het **hoofdpad** (3 vakjes) of het **hertenkamp-pad** (4 vakjes, één daarvan is het **hertenkamp-actievakje**). Daarna komen de paden weer samen.
- **Overdag: herten voeren.** Wie op het actievakje eindigt, draait een rad: +5 munten, +10 munten, een gratis item, of een hertje dat je 3 vakjes vooruit duwt.
- **'s Nachts: het mannetjeshert (de bok) is wild!** Wie 's nachts op het actievakje eindigt, zit in de problemen. Het rad heeft dan alleen nare uitkomsten:
  - de bok rent je omver: **−10 munten**
  - de bok jaagt je terug naar het **Strand** (start)
  - de bok eet je spullen op: **je verliest al je items**
  - de bok gooit je in de plas: **−5 munten**, en je spoelt aan op een **willekeurig vakje**
- 's Nachts staat bij de splitsing een waarschuwingsbordje (een rood bokkenhoofd). Bots kiezen 's nachts altijd het hoofdpad.
- Visueel: overdag rustige herten. 's Nachts staat er een grote bok met gloeiende rode ogen.

### 6.4 Plekken waar de ster kan staan

Zes kandidaat-plekken, verspreid over het bord: Strand-noord, Noordoever-midden, Oostoever-midden, Plaszoom, Park Rozenburg en Westoever. De ster staat **naast** het pad. Je koopt hem bij het langslopen.

### 6.5 Verdeling van de vakjes (hoofdroute, ±38)

| Type | Aantal | Effect |
|---|---|---|
| Start | 1 | – |
| Blauw | 19 | +3 munten (laatste 5 rondes: +6). Op 3 ervan staat de vlag `nachtRood`, op 2 andere de vlag `nachtVleermuis` (§8). |
| Rood | 6 | −3 munten (laatste 5 rondes: −6), nooit onder 0 |
| Event | 5 | Effect hangt af van de plek: 2 lantaarnpalen (wissel dag/nacht), Strandtent, Windvlaag, Zeilwedstrijd |
| Item | 3 | Je krijgt een gratis willekeurig item (heb je er al 3, dan krijg je 5 munten) |
| Kans | 2 | Kans-rad, zie §7.3 |
| Pech | 2 | Pech-rad, zie §7.4 (vervangt het Bowser-vakje; het thema volgt later) |

Op het hertenkamp-pad: 3 blauwe vakjes en het hertenkamp-actievakje. Op de bootroute: 4 blauwe vakjes.

---

## 7. Speciale plekken en vakjes

### 7.1 Winkel (bij het Restaurant), bij het langslopen, alleen overdag

Je mag maximaal **3 items** tegelijk hebben. Je mag één item per bezoek kopen. **'s Nachts is het Restaurant dicht**; dan is de Nachtwinkel bij de jachthaven open (§8.1).

| Item | Prijs | Effect |
|---|---|---|
| Dubbele dobbelsteen | 5 | Gooi 2× en tel op |
| Driedubbele dobbelsteen | 10 | Gooi 3× en tel op |
| Kies-je-worp | 6 | Kies zelf een getal van 1 tot 10 |
| Wisseltruc | 7 | Ruil van plek met een willekeurige andere speler |
| Ratjebel | 8 | Ratje komt naar je toe (je betaalt wel nog de gewone prijs) |

Items gebruik je **vóór** het dobbelen.

### 7.2 Ratje de kerstrat (vervangt Boo), bij Park Rozenburg

Bij het langslopen kun je Ratje inhuren:
- **Munten stelen:** 5 munten. Ratje steelt 5–15 willekeurige munten van een speler die je kiest.
- **Ster stelen:** 30 munten. Ratje steelt 1 ster van een speler die je kiest.
- **'s Nachts** sluipt hij makkelijker. Munten stelen is dan **gratis** en een ster stelen kost **25**.

### 7.3 Kans-vakje (zoals Chance Time)

Er draaien drie rollen na elkaar: **speler A**, **actie** en **speler B**. De acties zijn:
- A geeft B 10 munten
- A geeft B 20 munten
- A en B ruilen al hun munten
- A geeft B 1 ster
- A en B ruilen al hun sterren

### 7.4 Pech-vakje

Er draait een rad met de volgende uitkomsten: −10 munten, de helft van je munten kwijt (maximaal 20), iedereen 3 munten geven, of munten ruilen met de speler op de laatste plaats.

### 7.5 Eventvakjes

- **Lantaarnpaal** (2×): zet dag en nacht direct om.
- **Strandtent:** overdag een gratis drankje (+5 munten). 's Nachts brandt er een kampvuur: iedereen geeft jou 2 munten.
- **Windvlaag:** er waait een windvlaag over de plas. Je wordt 3 vakjes vooruit of 3 vakjes achteruit geblazen (50/50).
- **Zeilwedstrijd** (Westoever): alle 4 spelers gooien tegelijk een dobbelsteen van 1 tot 10. Dat gebeurt automatisch, met één korte animatie van 4 bootjes die over de plas racen. De hoogste worp wint **10 munten**; bij gelijkspel krijgen alle winnaars 10. Wie op het vakje landde, krijgt daarnaast **+2 munten** als organisator. 's Nachts is het een **lampionnenrace**: de prijs wordt 15 munten.

---

## 8. Dag en nacht

- Het spel begint overdag. **Elke 3 rondes** wisselen dag en nacht, en de **lantaarnpaal-eventvakjes** zetten het ook direct om.
- **Wat er 's nachts verandert:**
  - de boot vaart niet
  - de bok in het hertenkamp is wild (§6.3)
  - **3 vaste blauwe vakjes in het donkere bos** (aan de Noordoever) worden rood
  - Ratje is goedkoper (§7.2)
  - bij de Strandtent brandt een kampvuur (§7.5)
  - het Restaurant is dicht en de **Nachtwinkel** is open (§8.1)
  - er kan een **vallende ster** verschijnen (§8.2)
  - in het bos fladderen **vleermuizen** (§8.3)
  - de Zeilwedstrijd wordt een lampionnenrace (§7.5)
- **Wat er verandert als het weer dag wordt:** er kan **ochtendmist** hangen (§8.4).
- **Zo ziet de nacht eruit:** donkerblauwe laag over het bord, lantaarns die gloeien, sterretjes in het water en de bok met rode ogen. De overgang duurt ongeveer 1 seconde en wordt niet traag.

### 8.1 Nachtwinkel (bij de jachthaven), alleen 's nachts

De Nachtwinkel staat naast de bootsteiger. Je bezoekt hem bij het langslopen. Hij verkoopt gemene items. Dezelfde regels gelden als bij de gewone winkel: maximaal 3 items en één aankoop per bezoek. Deze items gebruik je ook **vóór** het dobbelen.

| Item | Prijs | Effect |
|---|---|---|
| Zakkenroller | 6 | Steel direct 5 munten van een speler naar keuze |
| Slakkendobbel | 5 | Kies een speler. Die gooit zijn volgende beurt maar 1–3. |
| Achteruitpet | 7 | Kies een speler. Die loopt zijn volgende beurt achteruit. |
| Valstrik | 6 | Leg een valstrik op het vakje waar je nu staat. De eerstvolgende andere speler die erop **eindigt**, geeft jou 10 munten. Er kan maar één valstrik per speler liggen. Je ziet hem op het bord. |

Bots kopen hier alleen iets als ze genoeg munten overhouden om een ster te kunnen kopen. Ze richten hun items op de speler op de 1e plaats.

### 8.2 Vallende ster

- Aan het begin van elke nachtronde is er **20% kans** op een vallende ster. Pommie roept: "Een vallende ster!" en er komt een tweede ster op een willekeurige andere sterplek.
- Die tweede ster koop je voor de gewone prijs. Na aankoop is hij weg; hij verhuist niet.
- Wordt hij niet gekocht, dan verdwijnt hij als het weer dag wordt.
- Er staat nooit meer dan één vallende ster tegelijk op het bord.

### 8.3 Vleermuizen in het Kralingse Bos

- **2 vaste blauwe vakjes aan de Noordoever** (vlag `nachtVleermuis`) worden 's nachts vleermuisvakjes. Overdag zijn het gewone blauwe vakjes.
- Wie er 's nachts op eindigt, wordt opgepakt door een zwerm vleermuizen. Er draait een rad dat **zowel goed als slecht** kan uitpakken:
  - fladderen je **2 vakjes terug**
  - dragen je **2 vakjes vooruit**
  - laten iets glimmends vallen: **+5 munten**
  - vliegen je naar het vakje **vlak vóór de ster**: de beste uitkomst, met een kleine kans (1 op 6)
  - pikken een munt per vleugelslag: **−5 munten**
- De effecten van een nieuw vakje na het verplaatsen (zoals blauw of rood) tellen niet. Je krijgt alleen de vleermuis-uitkomst.

### 8.4 Ochtendmist

- Elke keer dat het **dag wordt**, is er **50% kans** op ochtendmist over de plas.
- Bij mist verdwijnt de ster uit beeld. Op alle 6 sterplekken staat dan een vraagteken. Je ontdekt pas waar de ster is als je er langsloopt, en dan kun je hem gewoon kopen.
- Bots weten het bij mist ook niet en lopen gewoon hun route.
- De mist trekt op **na één volledige ronde**. Er hangt een witte waas over het water en de oevers zijn wat vager.

### 8.5 Seizoenen: zomer en winter

In het opstartscherm kies je een seizoen: **Zomer** (standaard), **Winter** of **Wisselend**. Bij Wisselend bevriest de plas halverwege het spel: Pommie kondigt dat aan en het wordt winter.

**In de winter is de plas bevroren:**
- Er verschijnt een **ijspad dwars over de plas**, van het Strand (noordwest) naar Plaszoom (zuidoost). Het pad heeft **5 ijsvakjes** en begint met een splitsing bij het Strand.
- Het ijspad is gratis, maar **glad**: op elk ijsvakje waar je eindigt, is er 1/3 kans dat je **2 vakjes doorglijdt**.
- **De boot vaart niet**, want het water is ijs. De bootsplitsing is dan dicht.
- **De Strandtent schenkt warme chocolademelk** (+5 munten). 's Nachts blijft het kampvuur zoals het is.
- **Zo ziet de winter eruit:** sneeuw op de oevers en witte bomen, de plas lichtblauw-wit met scheuren in het ijs, en af en toe dwarrelende sneeuw (licht, zonder het tempo te remmen).
- **Bots** nemen het ijspad als de ster aan de zuid- of oostkant ligt.
- Dag en nacht, de bok, de vleermuizen en de rest werken in de winter gewoon hetzelfde.

---

## 9. Laatste 5 rondes (eindspel)

- Bij het begin van de 5e ronde voor het einde komt de host in beeld, maakt de tussenstand bekend en zegt dat het eindspel begint.
- **Standaard:** blauwe en rode vakjes tellen dubbel (+6/−6).
- De speler op **de laatste plaats draait aan een rad**. Dat voegt één regel toe voor de rest van het spel:
  - +20 munten voor de laatste
  - een **extra sterplek** (er staan dan twee sterren tegelijk)
  - een ster kost voor iedereen 10 munten
  - **eeuwige nacht**: het blijft nacht tot het einde
  - Ratje is helemaal gratis

---

## 10. Eindtelling

Bonussterren (aan/uit in het opstartscherm, standaard **aan**). Er zijn er 3, en bij gelijkspel krijgt iedereen die gelijk staat hem:
- **Minigame-ster:** de meeste munten verdiend met minigames
- **Rijkaard-ster:** de hoogste muntenstand die iemand ooit tijdens het spel had
- **Avonturier-ster:** het vaakst op een event-, hertenkamp- of vleermuisvakje beland

Daarna maakt de host de winnaar bekend. Tot slot volgt een kort statistiekenscherm: een grafiek van de sterren per ronde, munten verdiend met minigames, en hoe vaak iemand op rood belandde of de bok tegenkwam.

---

## 11. Tempo (heel belangrijk)

- **Botbeurt in ≤ 2 seconden:** een korte aankondiging ("Beurt van Bot 1", ±0,6 s), dan dobbelsteen, lopen (ongeveer 80 ms per vakje) en alle keuzes direct. Er hoeft niets bevestigd te worden.
- **Na een botbeurt** blijft de melding met wat er gebeurd is in beeld, bijvoorbeeld "Bot 2 gooide 7 · +3 munten · kocht een ster!", met de hint "Tik om verder te gaan · Volgende: Bot 1". Pas na een tik begint de volgende beurt, ook als dat een mens is. Zo zie je wat de bots deden.
- Een **turboknop** (⏩) die altijd zichtbaar is: de bots worden dan **direct** afgehandeld, zonder animatie en zonder te wachten op een tik.
- **Mensen:**
  - Een beurt begint met een aankondiging: de camera staat op je figuur, je figuur staat groot links in beeld en over het midden loopt een brede, licht schuine band: "Jouw beurt, Floris!". Tik om verder te gaan.
  - Daarna komt het **keuzemenu** (zie §13): Dobbelen, Items of Bord bekijken.
  - Het lopen gaat snel (ongeveer 150 ms per vakje), en met een tik op het scherm gaat het nog sneller. Keuzes maak je met grote knoppen.
- De host en zijn gebrabbel zijn kort, en elke tekstballon kun je wegtikken.
- Er zijn geen onnodige "Weet je het zeker?"-schermen, behalve bij het invoeren van de uitslag en bij "Nieuw spel" (want dan wordt het oude spel overschreven).

---

## 12. Host: Pommie de pompoenbeer

- De host is **Pommie**, een pompoenbeer. Jullie leveren de PNG aan; tot die er is, gebruikt het spel een tijdelijk plaatje.
- Hij praat met **tekstballonnen in het Nederlands** en een **berengebrabbel**: korte, lage brom-geluidjes per lettergreep, zoals in Animal Crossing. Dat geluid wordt in de code gemaakt, er zijn geen audiobestanden nodig.
- **Wanneer hij in beeld komt:** de start van het spel, de wissel tussen dag en nacht (ook bij mist), een vallende ster, het bevriezen van de plas, het minigame-scherm, het begin van de laatste 5 rondes, de bonussterren en de winnaar. **Niet** bij gewone beurten, want dat haalt het tempo eruit.
- Alle teksten van de host staan in één bestand (`src/data/teksten.ts`), zodat jullie ze makkelijk zelf kunnen aanpassen. Voor elk moment zijn er een paar varianten, waarvan het spel er willekeurig één kiest.

---

## 13. Schermen

1. **Hoofdmenu:** Verder spelen (alleen als er een opgeslagen spel is), Nieuw spel, Instellingen.
2. **Nieuw spel:** het aantal rondes, het seizoen, 4 deelnemers (naam, figuur, mens of bot) en bonussterren aan/uit.
3. **Bord:** het grootste deel van het scherm. Bovenin staat een balk met de 4 spelers: figuur, sterren, munten, items en de huidige plaats. Verder is er een rondeteller ("Ronde 3/10 · ☀️"), de turboknop en een menuknop.
   - **Keuzemenu aan het begin van je beurt:** je figuur staat groot linksonder, met je sterren en munten. Ernaast staan drie grote, licht schuine knoppen onder elkaar:
     - **Dobbelen** staat bovenaan en is opgelicht als standaardkeuze. Je gaat naar het dobbelscherm; een gekozen item zie je daar (bijvoorbeeld twee blokken bij de dubbele dobbelsteen). Items kies je niet meer in het dobbelscherm, alleen in dit menu.
     - **Items** laat je items als kleine icoontjes zien, ook op de knop zelf, en is grijs als je geen items hebt. Er opent een paneel met je items (hoogstens 3), elk met icoon, naam, korte uitleg en een knop "Gebruik". Daarna ga je terug naar het menu, met het gekozen item op de knop Dobbelen. Zolang je nog niet gedobbeld hebt, kun je het item weer annuleren. Hoogstens één item per beurt.
     - **Bord bekijken:** het menu schuift weg en je kunt vrij over het bord bewegen (schuiven met één vinger, zoomen met twee vingers). Je ziet waar iedereen staat, waar de ster staat, en waar de winkel, de Nachtwinkel, Ratje en de valstrikken zijn. Bovenin staat hoeveel vakjes de ster van je af ligt (bij ochtendmist niet). "Terug" brengt de camera naar je figuur en opent het menu weer.
   - Het bord blijft op de achtergrond zichtbaar.
4. **Minigame-uitslag:** de 4 figuren, die je in volgorde van finish aantikt.
5. **Eindspel en uitslag.**

De app draait **liggend** op de iPad en is volledig met aanraken te bedienen.

---

## 14. Opslaan

- Het spel wordt automatisch bewaard na **elke** actie, dus na een worp, een stap, een aankoop of een ingevoerde uitslag.
- Er wordt één opgeslagen spel bewaard. "Nieuw spel" vraagt eerst of het oude spel overschreven mag worden.
- Handig voor later: een knop om het opgeslagen spel te exporteren of importeren als backup.
