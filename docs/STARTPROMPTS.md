# Startprompts voor Claude Code

Werk de fases **op volgorde** af. Begin elke fase met een nieuw gesprek (`/clear`) en plak de prompt.

`CLAUDE.md` en `docs/ONTWERP.md` worden automatisch gelezen, dus de prompts kunnen kort blijven. Test na elke fase op de iPad voordat je verdergaat.

## Eenmalig voorbereiden (op je MacBook)

1. Pak deze map uit, bijvoorbeeld in `~/Projecten/kralingse-party`.
2. Open Terminal in die map en controleer `node -v`. Krijg je een foutmelding of een versie lager dan 20? Installeer dan Node.js LTS via nodejs.org.
3. GitHub-koppeling: `brew install gh` en daarna `gh auth login`. Lukt dat niet, dan kan Claude Code je daar in fase 0 bij helpen.
4. Start Claude Code in de map met `claude`.

---

## Fase 0: project opzetten en online zetten

```
Lees CLAUDE.md en docs/ONTWERP.md. Zet het project op volgens CLAUDE.md:
Vite + TypeScript, Vitest, vite-plugin-pwa, de mapstructuur, een simpel
hoofdmenu ("Kralingse Plas Party" met de knoppen Nieuw spel / Verder spelen),
een git-repo en een GitHub-repo "kralingse-party" via gh, en een GitHub Actions-
workflow naar GitHub Pages. Zet daarna online en geef me de link, plus hoe ik
de app op het beginscherm van mijn iPad zet.
```

## Fase 1: spelregels (zonder grafische weergave)

```
Bouw de spellogica in src/logic/ volgens ONTWERP.md §2–§5 en §10–§14:
GameState, rondes, beurtvolgorde, dobbelen 1–10, munten, ster kopen bij
langslopen en de ster laten verhuizen, de minigame-uitslag verwerken
(10/5/2/0, gelijke plekken), het eindspel en bonussterren, en opslaan/laden
met seed. Gebruik voor nu een simpel testbord. Schrijf Vitest-tests voor alles.
Maak eerst een plan en laat het me zien voordat je begint.
```

## Fase 2: het bord van de Kralingse Plas

```
Maak src/data/board.json volgens ONTWERP.md §6. Gebruik
referentie/kaart-kralingse-plas.png om de route met de klok mee om de plas te
leggen, met alle zones, de bootsplitsing (jachthaven → Restaurant), de
hertenkamp-splitsing, de sterplekken, de winkel en Ratje. Teken een
gestileerd bord (water, oevers, bos, strand, jachthaven, park, restaurant,
hertenkamp) met gekleurde vakjes, in schuin bovenaanzicht met CSS-perspectief.
Zet de figuren erop als rechtopstaande sprites, met een camera die meebeweegt.
Bouw ook de ?editor-modus om vakjes te slepen en de JSON te exporteren.
```

## Fase 3: spelen op de iPad (met tempo)

```
Koppel de logica aan het bord: het opstartscherm (§13), de spelersbalk, dobbelen
met één tik, lopen, keuzes bij splitsingen, het minigame-scherm met de uitslag
in volgorde aantikken, autosave en Verder spelen. Bots volgens §11: een beurt
in ≤ 2 sec, een melding achteraf, en een turboknop. Hierna moet een volledig
potje van 10 rondes speelbaar zijn.
```

## Fase 4: de Kralingse extra's

```
Bouw ONTWERP.md §6.2, §6.3, §7 en de basis van §8 (de dag/nacht-wissel met
zijn effecten en de nachtweergave): de boot, het hertenkamp met de wilde bok
's nachts, de winkel met items, Ratje, en de kans-, pech- en eventvakjes
(inclusief de Zeilwedstrijd). Bots moeten hier slimme maar snelle keuzes maken.
Voeg tests toe.
```

## Fase 5: het nachtleven

```
Bouw ONTWERP.md §8.1 t/m §8.4: de Nachtwinkel met gemene items (inclusief de
valstrik die je op het bord ziet), de vallende ster, de vleermuizen in het bos
en de ochtendmist. Laat de bots ermee omgaan en voeg tests toe.
```

## Fase 6: de host en de afwerking

```
Bouw de host volgens §12 (Pommie, tekstballonnen, berengebrabbel via Web
Audio, alle teksten in src/data/teksten.ts), het eindspel van de laatste
5 rondes (§9), de bonussterren-ceremonie en het statistiekenscherm (§10).
Voeg ook korte geluidjes toe voor dobbelen, munten en de ster.
```

## Fase 7: eigen plaatjes erin

```
Ik heb PNG's in assets/ gezet (zie assets/README.md). Zet ze op de juiste plek,
gebruik ze in het spel, en controleer of alles er goed uitziet en snel blijft
op de iPad.
```

## Fase 8: seizoenen

```
Bouw ONTWERP.md §8.5: de seizoenskeuze in het opstartscherm (Zomer, Winter,
Wisselend), de bevroren plas met het gladde ijspad, de winterweergave en de
aankondiging door Pommie als de plas halverwege bevriest. Voeg tests toe.
```

---

## Tips

- Iets niet zoals je wilt? Zeg gewoon wat je ziet: "de bot loopt te traag", of "het hertenkamp staat te ver naar links". Een schermafbeelding van de iPad meesturen helpt ook.
- Nieuwe regel bedacht? Laat Claude Code die eerst in `docs/ONTWERP.md` zetten en daarna bouwen. Zo blijft het ontwerp kloppen.
- Tijdens het bouwen kun je testen zonder online te zetten: vraag Claude Code om `npm run dev -- --host` te starten. Open dan het getoonde adres op de iPad (hetzelfde wifi-netwerk).
