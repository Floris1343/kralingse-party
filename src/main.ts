import './ui/thema.css';
import './style.css';
import './render/bord.css';
import './ui/schermen.css';
import { BORD } from './data/bord';
import { bewaar, laad, nieuweSeed, nieuwSpel, type GameState } from './logic';
import { bevestig, toonHoofdmenu } from './ui/hoofdmenu';
import { toonNieuwSpel } from './ui/nieuwSpelScherm';
import { toonSpelscherm } from './ui/spelscherm';
import { startBijwerken, werkBijAlsKlaar } from './ui/bijwerken';

const root = document.querySelector<HTMLElement>('#app')!;

// Voorkom pinch-zoom in iOS Safari (dubbeltik-zoom regelt de CSS).
document.addEventListener('gesturestart', (e) => e.preventDefault());

const SEIZOEN: Record<string, string> = { zomer: 'Zomer', winter: 'Winter', wisselend: 'Wisselend' };

function hoofdmenu() {
  // Staat er een nieuwe versie klaar? Dan nu laden: het spel is al bewaard.
  if (werkBijAlsKlaar()) return;
  const bewaard = laad(localStorage);
  toonHoofdmenu(root, {
    opgeslagenSpel: bewaard
      ? `Ronde ${bewaard.ronde}/${bewaard.instellingen.aantalRondes} · ${SEIZOEN[bewaard.instellingen.seizoen]}`
      : null,
    nieuwSpel: async () => {
      if (bewaard && !(await bevestig(root, 'Het bewaarde spel wordt overschreven. Nieuw spel beginnen?', 'Ja, nieuw spel', 'Nee'))) return;
      toonNieuwSpel(root, {
        terug: hoofdmenu,
        start: (keuzes) => {
          const s = nieuwSpel(BORD, keuzes, nieuweSeed());
          bewaar(localStorage, s);
          spel(s);
        },
      });
    },
    verderSpelen: () => bewaard && spel(bewaard),
  });
}

function spel(s: GameState) {
  toonSpelscherm(root, s, { naarMenu: hoofdmenu });
}

startBijwerken(() => document.querySelector('.hoofdmenu') !== null);

if (new URLSearchParams(location.search).has('editor')) {
  import('./editor/editor').then((m) => m.toonEditor(root));
} else {
  hoofdmenu();
}
