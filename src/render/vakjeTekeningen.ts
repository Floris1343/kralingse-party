/**
 * Vakje-tekeningen, letterlijk uit het design (docs/design/.../board_dag.svg en board_winter.svg).
 * GEMAAKT DOOR scripts/bord-uit-design.mjs. Niet met de hand aanpassen.
 */

export interface VakjeTekening {
  onder: string;
  wit: string;
  kleur: string;
  /** Het icoon, getekend rond (0,0). */
  icoon: string;
  wit_: [number, number];
  kleur_: [number, number];
  ring_: [number, number];
  icoon_: [number, number];
}

export const VAKJE_TEKENINGEN: Record<string, VakjeTekening> = {
  "start": {
    "onder": "#E39A00",
    "wit": "#FFFFFF",
    "kleur": "#FFC928",
    "icoon": "<rect x=\"-16\" y=\"-36\" width=\"6\" height=\"70\" rx=\"3\" fill=\"#2B1D14\"/><path d=\"M-10 -34 C4 -40 16 -28 30 -32 L30 0 C16 4 4 -8 -10 -2 Z\" fill=\"#E8433A\"/><path d=\"M-10 -34 C4 -40 16 -28 30 -32\" fill=\"none\" stroke=\"#fff\" stroke-width=\"3\"/>",
    "wit_": [
      0.9601,
      0.9607
    ],
    "kleur_": [
      0.8152,
      0.8202
    ],
    "ring_": [
      0.7101,
      0.7135
    ],
    "icoon_": [
      0.016,
      0.0161
    ]
  },
  "blauw": {
    "onder": "#1E5BB0",
    "wit": "#FFFFFF",
    "kleur": "#2F7DE1",
    "icoon": "<rect x=\"-9\" y=\"-30\" width=\"18\" height=\"60\" rx=\"9\" fill=\"#FFFFFF\"/><rect x=\"-30\" y=\"-9\" width=\"60\" height=\"18\" rx=\"9\" fill=\"#FFFFFF\"/>",
    "wit_": [
      0.962,
      0.9667
    ],
    "kleur_": [
      0.8186,
      0.82
    ],
    "ring_": [
      0.7131,
      0.7133
    ],
    "icoon_": [
      0.016,
      0.0161
    ]
  },
  "event": {
    "onder": "#1F8344",
    "wit": "#FFFFFF",
    "kleur": "#2FAE5B",
    "icoon": "<rect x=\"-9.5\" y=\"-36\" width=\"19\" height=\"46\" rx=\"9.5\" fill=\"#FFFFFF\"/><circle cx=\"0\" cy=\"26\" r=\"10\" fill=\"#FFFFFF\"/>",
    "wit_": [
      0.9609,
      0.9577
    ],
    "kleur_": [
      0.8174,
      0.8169
    ],
    "ring_": [
      0.713,
      0.7113
    ],
    "icoon_": [
      0.016,
      0.016
    ]
  },
  "rood": {
    "onder": "#B42A23",
    "wit": "#FFFFFF",
    "kleur": "#E8433A",
    "icoon": "<rect x=\"-30\" y=\"-9\" width=\"60\" height=\"18\" rx=\"9\" fill=\"#FFFFFF\"/>",
    "wit_": [
      0.9607,
      0.964
    ],
    "kleur_": [
      0.8166,
      0.8201
    ],
    "ring_": [
      0.7118,
      0.7122
    ],
    "icoon_": [
      0.016,
      0.016
    ]
  },
  "item": {
    "onder": "#C47208",
    "wit": "#FFFFFF",
    "kleur": "#F39A1E",
    "icoon": "<rect x=\"-25\" y=\"-10\" width=\"50\" height=\"38\" rx=\"6\" fill=\"#FFFFFF\"/><rect x=\"-30\" y=\"-22\" width=\"60\" height=\"15\" rx=\"5\" fill=\"#FFFFFF\"/><rect x=\"-5\" y=\"-22\" width=\"10\" height=\"50\" fill=\"#F39A1E\" opacity=\".85\"/><ellipse cx=\"-11\" cy=\"-30\" rx=\"11\" ry=\"7\" fill=\"#FFFFFF\" transform=\"rotate(-20 -11 -30)\"/><ellipse cx=\"11\" cy=\"-30\" rx=\"11\" ry=\"7\" fill=\"#FFFFFF\" transform=\"rotate(20 11 -30)\"/>",
    "wit_": [
      0.9605,
      0.9638
    ],
    "kleur_": [
      0.8158,
      0.8188
    ],
    "ring_": [
      0.7105,
      0.7101
    ],
    "icoon_": [
      0.016,
      0.0161
    ]
  },
  "kans": {
    "onder": "#B03478",
    "wit": "#FFFFFF",
    "kleur": "#E352A0",
    "icoon": "<path d=\"M-16 -14 C-16 -38 20 -40 20 -16 C20 -2 0 -2 0 12\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"0\" cy=\"30\" r=\"9\" fill=\"#FFFFFF\"/>",
    "wit_": [
      0.961,
      0.9648
    ],
    "kleur_": [
      0.8182,
      0.8169
    ],
    "ring_": [
      0.71,
      0.7113
    ],
    "icoon_": [
      0.016,
      0.0161
    ]
  },
  "pech": {
    "onder": "#2F2347",
    "wit": "#FFFFFF",
    "kleur": "#4B3A6B",
    "icoon": "<circle cx=\"-14\" cy=\"-6\" r=\"15\" fill=\"#E9E4F2\"/><circle cx=\"8\" cy=\"-14\" r=\"19\" fill=\"#E9E4F2\"/><circle cx=\"24\" cy=\"-2\" r=\"12\" fill=\"#E9E4F2\"/><rect x=\"-28\" y=\"-6\" width=\"62\" height=\"16\" rx=\"8\" fill=\"#E9E4F2\"/><path d=\"M2 8 L-10 28 L2 26 L-4 42 L14 20 L4 22 L12 8 Z\" fill=\"#FFD23F\"/>",
    "wit_": [
      0.9644,
      0.9649
    ],
    "kleur_": [
      0.8182,
      0.8187
    ],
    "ring_": [
      0.7115,
      0.7135
    ],
    "icoon_": [
      0.016,
      0.016
    ]
  },
  "boot": {
    "onder": "#0C2B50",
    "wit": "#FFFFFF",
    "kleur": "#16457A",
    "icoon": "<path d=\"M-34 8 L34 8 L22 28 L-22 28 Z\" fill=\"#FFFFFF\" stroke=\"#FFFFFF\" stroke-width=\"4\" stroke-linejoin=\"round\"/><rect x=\"-2.5\" y=\"-36\" width=\"5\" height=\"44\" fill=\"#FFFFFF\"/><path d=\"M5 -34 L5 2 L30 2 Z\" fill=\"#FFFFFF\" stroke=\"#FFFFFF\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M-5 -24 L-5 2 L-24 2 Z\" fill=\"#FFFFFF\" stroke=\"#FFFFFF\" stroke-width=\"3\" stroke-linejoin=\"round\"/>",
    "wit_": [
      0.9617,
      0.9635
    ],
    "kleur_": [
      0.8153,
      0.8174
    ],
    "ring_": [
      0.7108,
      0.7123
    ],
    "icoon_": [
      0.016,
      0.016
    ]
  },
  "hertenkamp": {
    "onder": "#7E4C22",
    "wit": "#FFFFFF",
    "kleur": "#A86A35",
    "icoon": "<path d=\"M-6 -4 C-14 -16 -18 -26 -18 -38 M-15 -18 L-30 -24 M-17 -30 L-28 -40 M6 -4 C14 -16 18 -26 18 -38 M15 -18 L30 -24 M17 -30 L28 -40\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"7\" stroke-linecap=\"round\"/><ellipse cx=\"0\" cy=\"12\" rx=\"14\" ry=\"19\" fill=\"#FFFFFF\"/><ellipse cx=\"-18\" cy=\"0\" rx=\"9\" ry=\"5\" fill=\"#FFFFFF\" transform=\"rotate(25 -18 0)\"/><ellipse cx=\"18\" cy=\"0\" rx=\"9\" ry=\"5\" fill=\"#FFFFFF\" transform=\"rotate(-25 18 0)\"/><circle cx=\"0\" cy=\"26\" r=\"4\" fill=\"#A86A35\"/>",
    "wit_": [
      0.9623,
      0.9655
    ],
    "kleur_": [
      0.8159,
      0.8207
    ],
    "ring_": [
      0.7113,
      0.7103
    ],
    "icoon_": [
      0.016,
      0.0161
    ]
  },
  "ijs": {
    "onder": "#6FBEDF",
    "wit": "#FFFFFF",
    "kleur": "#A9E1F7",
    "icoon": "<g transform=\"rotate(0)\"><path d=\"M0 -34 V34 M-10 -26 L0 -18 L10 -26 M-10 26 L0 18 L10 26\" fill=\"none\" stroke=\"#1F6E9E\" stroke-width=\"7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></g><g transform=\"rotate(60)\"><path d=\"M0 -34 V34 M-10 -26 L0 -18 L10 -26 M-10 26 L0 18 L10 26\" fill=\"none\" stroke=\"#1F6E9E\" stroke-width=\"7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></g><g transform=\"rotate(120)\"><path d=\"M0 -34 V34 M-10 -26 L0 -18 L10 -26 M-10 26 L0 18 L10 26\" fill=\"none\" stroke=\"#1F6E9E\" stroke-width=\"7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></g>",
    "wit_": [
      0.9598,
      0.962
    ],
    "kleur_": [
      0.8153,
      0.8165
    ],
    "ring_": [
      0.7108,
      0.7089
    ],
    "icoon_": [
      0.016,
      0.016
    ]
  }
};

/** Ster en Ratje als losse tekening: maat van het bestand, voetpunt, en waar ze in het design stonden. */
export const SPRITES = {
  "ster": {
    "breedte": 149.64000000000001,
    "hoogte": 155.875,
    "voetX": 74.82000000000001,
    "voetY": 137.17000000000002,
    "designX": 910.5,
    "designY": 619.3
  },
  "ratje": {
    "breedte": 129.75,
    "hoogte": 126.63600000000001,
    "voetX": 62.28,
    "voetY": 116.256,
    "designX": 653.9,
    "designY": 764.6
  }
} as const;

/** Het viltfilter van het bord (voor de vakjes). */
export const VILT_FILTER = "<filter id=\"kp-vilt2\" x=\"0\" y=\"0\" width=\"100%\" height=\"100%\" filterUnits=\"objectBoundingBox\">\n<feTurbulence type=\"fractalNoise\" baseFrequency=\"0.55\" numOctaves=\"3\" seed=\"9\" result=\"n\"/>\n<feColorMatrix in=\"n\" type=\"matrix\" values=\"0.22 0 0 0 0.8  0.22 0 0 0 0.8  0.22 0 0 0 0.8  0 0 0 0 1\" result=\"g\"/>\n<feBlend in=\"SourceGraphic\" in2=\"g\" mode=\"multiply\" result=\"b\"/>\n<feComposite in=\"b\" in2=\"SourceGraphic\" operator=\"in\"/>\n</filter>";

/** Breedte (rx) en hoogte (ry) van een vakje op diepte y, zoals in het design. */
export const VAKJE_MAAT = {
  rx: [20.6483, 0.0126],
  ry: [10.5101, 0.0179],
  /** Hoe ver de bovenkant boven de onderkant ligt. */
  dikte: [4.4478, 0.0028],
  start: 1.13,
} as const;
