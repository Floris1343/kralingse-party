import './style.css';
import { heeftOpgeslagenSpel } from './logic/opslag';
import { toonHoofdmenu, toonMelding } from './ui/hoofdmenu';

const root = document.querySelector<HTMLElement>('#app')!;

// Voorkom pinch-zoom in iOS Safari (dubbeltik-zoom regelt de CSS).
document.addEventListener('gesturestart', (e) => e.preventDefault());

toonHoofdmenu(root, {
  heeftOpgeslagenSpel: heeftOpgeslagenSpel(localStorage),
  nieuwSpel: () => toonMelding('Het opstartscherm komt in de volgende stap!'),
  verderSpelen: () => toonMelding('Verder spelen komt in een volgende stap!'),
});
