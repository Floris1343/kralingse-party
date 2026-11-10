/**
 * De figuren. Floris en Speler 2 komen uit het design (docs/design/.../designsysteem: "Personages"),
 * de kikker en het konijn zijn tekeningen van de eigenaar voor de computerspelers. Allemaal handgetekend
 * (PNG). De pionnetjes (SVG) uit het design kun je ook nog kiezen.
 */

export interface Figuur {
  id: string;
  /** Pad onder public/assets/. */
  bestand: string;
  /** Kleur en vorm horen bij de spelersplek (zie thema.css). */
  kleur: string;
  kleurDonker: string;
  /** Lichte achtergrond voor het rondje in de spelersbalk. */
  kleurLicht: string;
  vorm: 'cirkel' | 'driehoek' | 'vierkant' | 'ruit';
  /** Breedte / hoogte van de tekening. */
  verhouding: number;
  /** Hoogte op het bord vooraan (y = 700), in bordpixels. */
  hoogte: number;
  /** Handgetekend: krijgt in het design een dun wit randje en een schaduw eronder. */
  handgetekend: boolean;
}

export const FIGUREN: Figuur[] = [
  {
    id: 'floris', bestand: 'figuren/floris.png', kleur: '#2F7DE1', kleurDonker: '#1E5BB0', kleurLicht: '#D6E7FC',
    vorm: 'driehoek', verhouding: 659 / 1112, hoogte: 105, handgetekend: true,
  },
  {
    id: 'speler2', bestand: 'figuren/speler2.png', kleur: '#E8433A', kleurDonker: '#B42A23', kleurLicht: '#FFD9D4',
    vorm: 'cirkel', verhouding: 727 / 1051, hoogte: 105, handgetekend: true,
  },
  {
    id: 'kikker', bestand: 'figuren/kikker.png', kleur: '#2FAE5B', kleurDonker: '#1F8344', kleurLicht: '#D3F1DC',
    vorm: 'vierkant', verhouding: 937 / 924, hoogte: 88, handgetekend: true,
  },
  {
    id: 'konijn', bestand: 'figuren/konijn.png', kleur: '#8E5BD9', kleurDonker: '#6A3FB5', kleurLicht: '#E9DDFB',
    vorm: 'ruit', verhouding: 978 / 984, hoogte: 92, handgetekend: true,
  },
  {
    id: 'pion-groen', bestand: 'figuren/pion-groen.svg', kleur: '#2FAE5B', kleurDonker: '#1F8344', kleurLicht: '#D3F1DC',
    vorm: 'vierkant', verhouding: 100 / 130, hoogte: 93, handgetekend: false,
  },
  {
    id: 'pion-geel', bestand: 'figuren/pion-geel.svg', kleur: '#F2B705', kleurDonker: '#A87F00', kleurLicht: '#FFF0BF',
    vorm: 'ruit', verhouding: 100 / 130, hoogte: 93, handgetekend: false,
  },
];

/** Standaardnamen bij een nieuw spel. */
export const STANDAARD_NAMEN = ['Floris', 'Speler 2', 'Bot 1', 'Bot 2'];
/** Standaardfiguren bij een nieuw spel: de bots zijn de kikker en het konijn. */
export const STANDAARD_FIGUREN = ['floris', 'speler2', 'kikker', 'konijn'];

export function figuur(id: string): Figuur {
  return FIGUREN.find((f) => f.id === id) ?? FIGUREN[0];
}
