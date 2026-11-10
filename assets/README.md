# Plaatjes

Alle tekeningen komen uit het design (`docs/design/`, gemaakt in Claude Design). Je hoeft dus zelf geen PNG's meer aan te leveren.

Het script `node scripts/bord-uit-design.mjs` kopieert ze letterlijk naar `public/assets/`. Draai het opnieuw als het design verandert. Met `--bord` maakt het ook `src/data/board.json` opnieuw, maar dan gaat wat je in de bord-editor hebt bijgeschaafd verloren.

## Wat waar staat

| Map in `public/assets/` | Wat | Uit het design |
|---|---|---|
| `figuren/` | `floris.png` en `speler2.png` (handgetekend), `pion-groen.svg` (Bot 1) en `pion-geel.svg` (Bot 2) | `floris.png`, `speler2.png`, `pawn3.svg`, `pawn4.svg` |
| `personages/` | `pommie.svg` (host) en `ratje.svg` (de kerstrat) | `pommie.svg`, `ratje.svg` |
| `iconen/` | munt, ster, zon, maan, sneeuw, dobbelsteen, valstrik, vlaggetjes, vilttextuur en de vakje-iconen | gelijknamige SVG's |
| `bord/` | het bord in lagen: `grond-*.svg`, `decor-*.svg` en `effect-*.svg` voor dag, nacht, winter en mist, plus de losse `ster.svg`, `ratje.svg` en `vraagteken.svg` (ochtendmist) op het bord | `board_dag.svg`, `board_nacht.svg`, enz. |

## Een figuur vervangen

Wil je een andere tekening voor een figuur? Vervang dan het bestand in `public/assets/figuren/` door een nieuwe tekening met dezelfde naam. Zorg voor een transparante achtergrond, de voeten onderaan en de voorkant naar je toe. Ontbreekt een plaatje, dan toont het spel een gekleurde cirkel met een letter.
