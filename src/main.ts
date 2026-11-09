import './ui/thema.css';
import './style.css';
import './render/bord.css';
import { BORD } from './data/bord';
import { FIGUREN } from './data/figuren';
import { bewaar, laad, nieuweSeed, nieuwSpel, type GameState } from './logic';
import { bevestig, toonHoofdmenu } from './ui/hoofdmenu';
import { toonSpelscherm } from './ui/spelscherm';

const root = document.querySelector<HTMLElement>('#app')!;

// Voorkom pinch-zoom in iOS Safari (dubbeltik-zoom regelt de CSS).
document.addEventListener('gesturestart', (e) => e.preventDefault());

const SEIZOEN: Record<string, string> = { zomer: 'Zomer', winter: 'Winter', wisselend: 'Wisselend' };

function hoofdmenu() {
  const bewaard = laad(localStorage);
  toonHoofdmenu(root, {
    opgeslagenSpel: bewaard
      ? `Ronde ${bewaard.ronde}/${bewaard.instellingen.aantalRondes} · ${SEIZOEN[bewaard.instellingen.seizoen]}`
      : null,
    nieuwSpel: async () => {
      if (bewaard && !(await bevestig(root, 'Het bewaarde spel wordt overschreven. Nieuw spel beginnen?', 'Ja, nieuw spel', 'Nee'))) return;
      // Het opstartscherm komt in de volgende stap; voor nu: 2 mensen + 2 bots, 10 rondes, zomer.
      const s = nieuwSpel(
        BORD,
        {
          aantalRondes: 10,
          seizoen: 'zomer',
          bonussterren: true,
          spelers: [
            { naam: 'Floris', figuur: FIGUREN[0].id, isBot: false },
            { naam: 'Speler 2', figuur: FIGUREN[1].id, isBot: false },
            { naam: 'Bot 1', figuur: FIGUREN[2].id, isBot: true },
            { naam: 'Bot 2', figuur: FIGUREN[3].id, isBot: true },
          ],
        },
        nieuweSeed(),
      );
      bewaar(localStorage, s);
      spel(s);
    },
    verderSpelen: () => bewaard && spel(bewaard),
  });
}

function spel(s: GameState) {
  toonSpelscherm(root, s, { naarMenu: hoofdmenu });
}

if (new URLSearchParams(location.search).has('editor')) {
  import('./editor/editor').then((m) => m.toonEditor(root));
} else {
  hoofdmenu();
}
