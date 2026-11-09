# Kralingse Plas Party

Een bordspel in Mario Party-stijl voor de iPad: een webapp die je op het beginscherm zet. De minigames worden op de Nintendo Switch gespeeld; de iPad doet de rest.

Het volledige spelontwerp staat hier en is leidend:
@docs/ONTWERP.md

## Werkafspraken

- De eigenaar is geen programmeur. Leg keuzes kort uit in het Nederlands en vraag niet om technische beslissingen die je zelf kunt maken.
- Alle tekst in het spel is **Nederlands**.
- Bouw in kleine stappen die je meteen kunt spelen. Sluit elke stap af met: tests groen, build werkt en een korte uitleg van wat je op de iPad kunt testen.
- Zet na elke afgeronde stap een commit met een duidelijke Nederlandse omschrijving.
- Twijfel je over een spelregel? Volg dan `docs/ONTWERP.md`. Staat het daar niet in, kies dan wat de meeste vaart in het spel houdt, en zet de keuze in `docs/BESLISSINGEN.md`.
- `referentie/` staat niet in git. Gebruik `referentie/kaart-kralingse-plas.png` alleen als hulp om de route en de vakjes op het bord te plaatsen. Neem het plaatje nooit op in het spel zelf.

## Techniek

- **Vite + TypeScript**, zonder game-engine.
- **Uiterlijk: het design is leidend voor hoe het eruitziet** (`docs/design/`, gemaakt in Claude Design). `docs/ONTWERP.md` blijft leidend voor de spelregels: toont het design andere items, bonussterren of regels (zoals Muizenval, Gouden sleutel of Pechster), volg dan ONTWERP.md, maar wel in het uiterlijk van het design. Het winkelscherm (`bord-winkel.html`) en het bonusster-/eindscherm (`eindscherm.html`) gebruik je dus wél, gevuld met de items en bonussterren uit ONTWERP.md.
  - Stijl "Feestvilt": alle kleuren, lettertypes (Fredoka en Nunito, lokaal in `src/ui/fonts/`), knoppen en panelen staan als variabelen in `src/ui/thema.css`. Gebruik die in elk scherm.
  - Tekeningen (Pommie, Ratje, de figuren, iconen, de bordlagen) worden **letterlijk** uit het design gekopieerd met `node scripts/bord-uit-design.mjs`. Teken ze nooit zelf opnieuw.
- **Rendering:** HTML/SVG/CSS.
  - Het bord uit het design is al schuin van bovenaf getekend (vakjes zijn ovaal en worden naar achteren kleiner). Er komt dus **geen** extra CSS-kanteling bij; dat zou het design platdrukken.
  - Lagen zoals in het design: grond (gras, plas, pad) → vakjes (getekend uit `board.json` met de vakjesformule van het design) → decoratie (bomen, gebouwen) → sprites (ster, Ratje, figuren, labels).
  - Rechtopstaande dingen worden naar achteren kleiner volgens dezelfde diepteformule (`src/render/diepte.ts`).
  - De camera volgt de speler die aan zet is: de hele wereld wordt met één transform verschoven en vergroot.
- **Animaties:** Web Animations API en CSS-transitions. **Geluid:** Web Audio API. Het gebrabbel van de host wordt in de code gemaakt (korte lage blips per lettergreep met een licht wisselende toonhoogte).
- **Spellogica** staat in `src/logic/`. Het zijn pure functies zonder DOM.
  - De hele spelstand is één serialiseerbaar object: `GameState`.
  - Elke actie geeft een nieuwe state terug.
  - De random generator heeft een seed, en die seed zit in de state. Zo gaat een bewaard spel na het herladen precies hetzelfde verder.
- **Tests:** Vitest voor alle logica: bewegen, splitsingen, vakje-effecten, sterren, winkel, Ratje, dag/nacht, eindspel, bonussterren en opslaan/laden.
- **Opslaan:** autosave van `GameState` naar `localStorage` na elke actie. Geef de opslag een versienummer.
- **Bord-data:** `src/data/board.json` bevat de vakjes (`id`, `x`, `y`, `type`, `next[]`, `zone`, `flags`, zoals `nachtRood` en `nachtVleermuis`), de splitsingen (ook de boot en het ijspad, dat alleen in de winter open is), de sterplekken en de plekken voor de winkel, de Nachtwinkel en Ratje. De coördinaten zijn pixels van het design-bord (1180 × 820); (x, y) is het midden van de bovenkant van een vakje. De kaart is alleen gebruikt om te controleren dat de zones in de goede volgorde liggen.
- **Bord-editor:** met `?editor` in de URL kun je vakjes, sterplekken, de winkel, de Nachtwinkel en Ratje slepen en de JSON kopiëren of downloaden. Zo kan de eigenaar posities zelf bijschaven. `node scripts/bord-uit-design.mjs --bord` maakt `board.json` opnieuw en overschrijft dat werk.
- **Plaatjes:** de tekeningen uit het design staan in `public/assets/` (zie `assets/README.md`). Ontbreekt er een, toon dan een nette tijdelijke vervanger (gekleurde cirkel met een letter). De code moet blijven werken zonder de plaatjes.
- **iPad:**
  - liggend, alleen aanraken, geen hover
  - knoppen minimaal 48 px
  - houd rekening met de safe-area insets
  - voorkom inzoomen door dubbel tikken, tekstselectie en pull-to-refresh
  - 60 fps op een gewone iPad: liever weinig DOM-elementen en `transform`/`opacity`-animaties
- **PWA:** `vite-plugin-pwa`, met een manifest (naam, icoon, `orientation: landscape`, `display: standalone`). De app moet offline werken na het eerste bezoek.
- **Online zetten:** een GitHub Actions-workflow die bij elke push naar `main` naar **GitHub Pages** zet. Zet `base` in `vite.config.ts` op de repo-naam.
- **Testen op de iPad tijdens het bouwen:** `npm run dev -- --host`. Open daarna op de iPad (hetzelfde wifi-netwerk) `http://<ip-van-de-mac>:5173`.

## Mapstructuur (doel)

```
src/
  logic/      spelregels (puur, getest)
  data/       board.json, items, teksten.ts (alle hosttekst)
  ui/         schermen en componenten
  render/     bord, diepte, sprites, camera, dag/nacht
  editor/     de bord-editor (?editor)
  audio/      gebrabbel en geluidjes
public/assets/  figuren/, personages/, iconen/, bord/ (uit het design)
scripts/        bord-uit-design.mjs (haalt de tekeningen uit docs/design/)
docs/         ONTWERP.md, BESLISSINGEN.md, STARTPROMPTS.md, design/ (Claude Design)
```
