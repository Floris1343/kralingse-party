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
- **Rendering:** HTML/SVG/CSS.
  - Het bord is één laag. Het schuine bovenaanzicht ontstaat met CSS `perspective` + `rotateX(~50deg)`.
  - Figuren, ster, host en dergelijke zijn rechtopstaande sprites die **niet** mee kantelen: zet ze in een aparte laag en reken posities om.
  - De camera volgt de speler die aan zet is, door de bordlaag te verschuiven.
- **Animaties:** Web Animations API en CSS-transitions. **Geluid:** Web Audio API. Het gebrabbel van de host wordt in de code gemaakt (korte lage blips per lettergreep met een licht wisselende toonhoogte).
- **Spellogica** staat in `src/logic/`. Het zijn pure functies zonder DOM.
  - De hele spelstand is één serialiseerbaar object: `GameState`.
  - Elke actie geeft een nieuwe state terug.
  - De random generator heeft een seed, en die seed zit in de state. Zo gaat een bewaard spel na het herladen precies hetzelfde verder.
- **Tests:** Vitest voor alle logica: bewegen, splitsingen, vakje-effecten, sterren, winkel, Ratje, dag/nacht, eindspel, bonussterren en opslaan/laden.
- **Opslaan:** autosave van `GameState` naar `localStorage` na elke actie. Geef de opslag een versienummer.
- **Bord-data:** `src/data/board.json` bevat de vakjes (`id`, `x`, `y`, `type`, `next[]`, `zone`, `flags`, zoals `nachtRood` en `nachtVleermuis`), de splitsingen (ook de boot en het ijspad, dat alleen in de winter open is), de sterplekken en de plekken voor de winkel, de Nachtwinkel en Ratje. De coördinaten zijn bordcoördinaten 0–1000, gebaseerd op de kaart.
- **Bord-editor:** met `?editor` in de URL kun je vakjes op het bord slepen en de JSON exporteren. Zo kan de eigenaar posities zelf bijschaven.
- **Plaatjes:** eigen PNG's uit `public/assets/` (zie `assets/README.md`). Ontbreekt een PNG, toon dan een nette tijdelijke vervanger (gekleurde cirkel met een letter). De code moet blijven werken zonder de echte plaatjes.
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
  render/     bord, perspectief, sprites, camera, dag/nacht
  audio/      gebrabbel en geluidjes
public/assets/  figuren/, host/, bord/ (PNG's van de eigenaar)
docs/         ONTWERP.md, BESLISSINGEN.md, STARTPROMPTS.md
```
