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
