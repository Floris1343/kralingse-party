/**
 * Haalt de tekeningen uit het design (docs/design/) en zet ze in het project.
 *
 *   node scripts/bord-uit-design.mjs          tekeningen, bordlagen en vakje-iconen
 *   node scripts/bord-uit-design.mjs --bord   ook src/data/board.json opnieuw maken
 *                                             (overschrijft wat in de editor is bijgeschaafd!)
 *
 * Alles wordt letterlijk overgenomen: de bord-SVG wordt alleen in lagen geknipt.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESIGN = join(ROOT, 'docs/design');
const BORD_ASSETS = join(DESIGN, 'kralingse-plas-party-1-bordscherm/assets');
const SYSTEEM_ASSETS = join(DESIGN, 'kralingse-plas-party-5-designsysteem/assets');
const SCHERMEN_ASSETS = join(DESIGN, 'kralingse-plas-party-2-schermen/assets');
const PUBLIC = join(ROOT, 'public/assets');

function schrijf(pad, inhoud) {
  mkdirSync(dirname(pad), { recursive: true });
  writeFileSync(pad, inhoud);
}
function kopieer(van, naar) {
  mkdirSync(dirname(naar), { recursive: true });
  copyFileSync(van, naar);
}

// ---------------------------------------------------------------- losse tekeningen
const tekeningen = [
  [SYSTEEM_ASSETS, 'pommie.svg', 'personages/pommie.svg'],
  [SYSTEEM_ASSETS, 'ratje.svg', 'personages/ratje.svg'],
  [SYSTEEM_ASSETS, 'floris.png', 'figuren/floris.png'],
  [SYSTEEM_ASSETS, 'speler2.png', 'figuren/speler2.png'],
  [SYSTEEM_ASSETS, 'pawn3.svg', 'figuren/pion-groen.svg'],
  [SYSTEEM_ASSETS, 'pawn4.svg', 'figuren/pion-geel.svg'],
  [SYSTEEM_ASSETS, 'coin.svg', 'iconen/munt.svg'],
  [SYSTEEM_ASSETS, 'star.svg', 'iconen/ster.svg'],
  [SYSTEEM_ASSETS, 'sun.svg', 'iconen/zon.svg'],
  [SYSTEEM_ASSETS, 'moon.svg', 'iconen/maan.svg'],
  [SYSTEEM_ASSETS, 'snow.svg', 'iconen/sneeuw.svg'],
  [SYSTEEM_ASSETS, 'd10.svg', 'iconen/dobbelsteen.svg'],
  [SYSTEEM_ASSETS, 'item_dobbel.svg', 'iconen/dubbele-dobbelsteen.svg'],
  [SYSTEEM_ASSETS, 'bunting.svg', 'iconen/vlaggetjes.svg'],
  [SYSTEEM_ASSETS, 'felt_tex.svg', 'iconen/vilt.svg'],
  [SCHERMEN_ASSETS, 'chart.svg', 'iconen/grafiek.svg'],
];
for (const [map, van, naar] of tekeningen) kopieer(join(map, van), join(PUBLIC, naar));
// Het complete bord (achtergrond van het hoofdmenu).
kopieer(join(BORD_ASSETS, 'board_dag.svg'), join(PUBLIC, 'bord/bord-dag-compleet.svg'));
for (const soort of ['blauw', 'rood', 'event', 'item', 'kans', 'pech', 'hert', 'boot', 'ijs', 'start']) {
  kopieer(join(SYSTEEM_ASSETS, `tile_${soort}.svg`), join(PUBLIC, `iconen/vakje-${soort}.svg`));
}

// ---------------------------------------------------------------- bord-SVG in lagen
/** Splitst een stuk SVG in elementen op het bovenste niveau. */
function elementen(s) {
  const uit = [];
  let diepte = 0;
  let start = 0;
  for (const m of s.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
    const [, sluit, , , zelf] = m;
    if (sluit) {
      diepte--;
      if (diepte === 0) uit.push(s.slice(start, m.index + m[0].length));
      continue;
    }
    if (diepte === 0) start = m.index;
    if (zelf) {
      if (diepte === 0) uit.push(s.slice(start, m.index + m[0].length));
    } else diepte++;
  }
  return uit;
}

/** Binnenkant van een <g ...>...</g>, opgesplitst in kinderen. */
function kinderen(g) {
  const open = g.indexOf('>') + 1;
  return { open: g.slice(0, open), lijst: elementen(g.slice(open, g.lastIndexOf('</g>'))) };
}

function leesBord(naam) {
  const t = readFileSync(join(BORD_ASSETS, `board_${naam}.svg`), 'utf8');
  const kop = t.slice(0, t.indexOf('<defs>'));
  const defs = t.slice(t.indexOf('<defs>'), t.indexOf('</defs>') + 7);
  const lagen = elementen(t.slice(t.indexOf('</defs>') + 7, t.lastIndexOf('</svg>')));
  // [0] grond, [1] vakjes, [2] rechtopstaande decoratie, [3..] effecten (vignet, mist, sneeuw ...)
  return { kop, defs, grond: lagen[0], vakjes: lagen[1], decor: lagen[2], effecten: lagen.slice(3) };
}

const isSter = (g) => g.includes('#8E5BD9') && g.includes('#B48AF0');
const isRatje = (g) => g.includes('#FBF6EC') && g.length > 3000;

const sprites = {};
for (const naam of ['dag', 'nacht', 'winter', 'mist']) {
  const b = leesBord(naam);
  schrijf(join(PUBLIC, `bord/grond-${naam}.svg`), `${b.kop}${b.defs}${b.grond}</svg>`);
  const d = kinderen(b.decor);
  const rest = d.lijst.filter((g) => {
    if (isSter(g)) return (sprites[`ster-${naam}`] = g), false;
    if (isRatje(g)) return (sprites[`ratje-${naam}`] = g), false;
    return true;
  });
  schrijf(join(PUBLIC, `bord/decor-${naam}.svg`), `${b.kop}${b.defs}${d.open}${rest.join('')}</g></svg>`);
  // Effecten (behalve het vignet, dat doet de camera zelf) apart, zodat ze over alles heen liggen.
  const effecten = b.effecten.filter((e) => !e.includes('url(#vign)'));
  if (effecten.length) schrijf(join(PUBLIC, `bord/effect-${naam}.svg`), `${b.kop}${b.defs}${effecten.join('')}</svg>`);
}

/** Losse sprite (ster, Ratje op het bord): zelfde tekening, voetpunt op (0,0). */
function spriteBestand(g, defs, kop, vak) {
  const m = g.match(/^<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)">/);
  const schaal = Number(m[3]);
  const binnen = g.slice(m[0].length, g.lastIndexOf('</g>'));
  const [x, y, w, h] = vak;
  const svg = kop
    .replace(/width="[^"]*"/, `width="${w * schaal}"`)
    .replace(/height="[^"]*"/, `height="${h * schaal}"`)
    .replace(/viewBox="[^"]*"/, `viewBox="${x * schaal} ${y * schaal} ${w * schaal} ${h * schaal}"`);
  return {
    svg: `${svg}${defs}<g filter="url(#felt2)"><g transform="scale(${schaal})">${binnen}</g></g></svg>`,
    // maat van het bestand en waar het voetpunt zit, plus waar het in het design stond
    meta: { breedte: w * schaal, hoogte: h * schaal, voetX: -x * schaal, voetY: -y * schaal, designX: Number(m[1]), designY: Number(m[2]) },
  };
}
const spriteMeta = {};
let viltFilter = '';
{
  const dag = leesBord('dag');
  // Kaders in de eigen coördinaten van de tekening (voetpunt = 0,0), ruim genomen.
  const ster = spriteBestand(sprites['ster-dag'], dag.defs, dag.kop, [-60, -110, 120, 125]);
  schrijf(join(PUBLIC, 'bord/ster.svg'), ster.svg);
  const ratje = spriteBestand(sprites['ratje-dag'], dag.defs, dag.kop, [-60, -112, 125, 122]);
  schrijf(join(PUBLIC, 'bord/ratje.svg'), ratje.svg);
  spriteMeta.ster = ster.meta;
  spriteMeta.ratje = ratje.meta;
  viltFilter = dag.defs.match(/<filter id="felt2".*?<\/filter>/s)[0].replace('id="felt2"', 'id="kp-vilt2"');
}

// ---------------------------------------------------------------- vakje-tekeningen
/**
 * De vakjes in het design volgen één formule: een donkere onderkant, een witte rand,
 * het gekleurde vlak, een gestippelde ring en een platgedrukt icoon. We bewaren per soort
 * de kleuren en het icoon letterlijk; de maten rekent het spel uit met dezelfde verhoudingen.
 */
const KLEUR_NAAR_SOORT = {
  '#FFC928': 'start', '#2F7DE1': 'blauw', '#E8433A': 'rood', '#2FAE5B': 'event', '#F39A1E': 'item',
  '#E352A0': 'kans', '#4B3A6B': 'pech', '#16457A': 'boot', '#A86A35': 'hertenkamp', '#A9E1F7': 'ijs',
};
const vakjeRe =
  /^<g><ellipse cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)" fill="(#\w+)"\/><ellipse cx="[\d.]+" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)" fill="(#\w+)"\/><ellipse [^>]*rx="([\d.]+)" ry="([\d.]+)" fill="(#\w+)"\/><ellipse [^>]*rx="([\d.]+)" ry="([\d.]+)"[^>]*\/><g transform="translate\([\d.]+ [\d.]+\) scale\(([\d.]+) ([\d.]+)\)">(.*)<\/g><\/g>$/;

const designVakjes = [];
const iconen = {};
for (const naam of ['dag', 'winter']) {
  for (const g of kinderen(leesBord(naam).vakjes).lijst) {
    const m = g.match(vakjeRe);
    if (!m) throw new Error(`Vakje niet herkend: ${g.slice(0, 120)}`);
    const n = m.slice(1).map((v) => (v.startsWith('#') || v.includes('<') ? v : Number(v)));
    const [cx, cy, rx, ry, onder, cyBoven, rxWit, ryWit, wit, rxKleur, ryKleur, kleur, rxRing, ryRing, sx, sy, icoon] = n;
    const soort = KLEUR_NAAR_SOORT[kleur];
    if (!soort) throw new Error(`Onbekende vakjekleur ${kleur}`);
    if (naam === 'dag') designVakjes.push({ cx, cy, rx, ry, soort, dikte: cy - cyBoven });
    iconen[soort] ??= {
      onder, wit, kleur, icoon,
      // verhoudingen t.o.v. rx/ry van de onderkant
      wit_: [rxWit / rx, ryWit / ry], kleur_: [rxKleur / rx, ryKleur / ry], ring_: [rxRing / rx, ryRing / ry],
      icoon_: [sx / rx, sy / ry],
    };
  }
}

// Maat van een vakje hangt af van de diepte (y): fit uit de vakjes van het design (zonder start).
function lineaireFit(punten) {
  const n = punten.length;
  const sx = punten.reduce((a, p) => a + p[0], 0), sy = punten.reduce((a, p) => a + p[1], 0);
  const sxx = punten.reduce((a, p) => a + p[0] * p[0], 0), sxy = punten.reduce((a, p) => a + p[0] * p[1], 0);
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return [(sy - b * sx) / n, b];
}
const gewoon = designVakjes.filter((v) => v.soort !== 'start');
const rxFit = lineaireFit(gewoon.map((v) => [v.cy, v.rx]));
const ryFit = lineaireFit(gewoon.map((v) => [v.cy, v.ry]));
const dikteFit = lineaireFit(gewoon.map((v) => [v.cy, v.dikte]));
const startVak = designVakjes.find((v) => v.soort === 'start');
const startSchaal = startVak.rx / (rxFit[0] + rxFit[1] * startVak.cy);
const r = (x) => Math.round(x * 10000) / 10000;

schrijf(
  join(ROOT, 'src/render/vakjeTekeningen.ts'),
  `/**
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

export const VAKJE_TEKENINGEN: Record<string, VakjeTekening> = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(iconen).map(([k, v]) => [
        k,
        { ...v, wit_: v.wit_.map(r), kleur_: v.kleur_.map(r), ring_: v.ring_.map(r), icoon_: v.icoon_.map(r) },
      ]),
    ),
    null,
    2,
  )};

/** Ster en Ratje als losse tekening: maat van het bestand, voetpunt, en waar ze in het design stonden. */
export const SPRITES = ${JSON.stringify(spriteMeta, null, 2)} as const;

/** Het viltfilter van het bord (voor de vakjes). */
export const VILT_FILTER = ${JSON.stringify(viltFilter)};

/** Breedte (rx) en hoogte (ry) van een vakje op diepte y, zoals in het design. */
export const VAKJE_MAAT = {
  rx: [${r(rxFit[0])}, ${r(rxFit[1])}],
  ry: [${r(ryFit[0])}, ${r(ryFit[1])}],
  /** Hoe ver de bovenkant boven de onderkant ligt. */
  dikte: [${r(dikteFit[0])}, ${r(dikteFit[1])}],
  start: ${r(startSchaal)},
} as const;
`,
);

// ---------------------------------------------------------------- board.json
if (process.argv.includes('--bord')) maakBordJson();

function punten(d) {
  return [...d.matchAll(/([-\d.]+) ([-\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

function maakBordJson() {
  const dag = leesBord('dag');
  const grond = dag.grond;
  const pad = (re) => {
    const m = grond.match(re);
    if (!m) throw new Error(`Pad niet gevonden: ${re}`);
    return punten(m[1]);
  };
  const hoofd = pad(/<path d="([^"]+)" fill="none" stroke="#F4E2B6" stroke-width="22"/);
  const herten = pad(/<path d="(M718\.2 216\.2[^"]+)"[^>]*stroke="#F4E2B6"/);
  const boot = pad(/<path d="(M276\.5 549\.3[^"]+)"/);

  const rxOp = (y) => rxFit[0] + rxFit[1] * y;
  const afstand = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const rond = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];

  /** Lengte langs een lijn, gecorrigeerd voor diepte (achteraan zijn vakjes kleiner, dus dichter op elkaar). */
  function metLengte(lijn) {
    const s = [0];
    for (let i = 1; i < lijn.length; i++) {
      const midY = (lijn[i][1] + lijn[i - 1][1]) / 2;
      s.push(s[i - 1] + afstand(lijn[i], lijn[i - 1]) / rxOp(midY));
    }
    return s;
  }
  function puntOp(lijn, s, doel) {
    for (let i = 1; i < lijn.length; i++) {
      if (s[i] >= doel) {
        const t = (doel - s[i - 1]) / (s[i] - s[i - 1] || 1);
        return [lijn[i - 1][0] + t * (lijn[i][0] - lijn[i - 1][0]), lijn[i - 1][1] + t * (lijn[i][1] - lijn[i - 1][1])];
      }
    }
    return lijn[lijn.length - 1];
  }
  const dichtstbij = (lijn, p) => lijn.reduce((best, q, i) => (afstand(q, p) < afstand(lijn[best], p) ? i : best), 0);
  /** n punten gelijk verdeeld tussen twee plekken op de lijn (zonder de eindpunten). */
  function tussen(lijn, s, van, tot, n) {
    return Array.from({ length: n }, (_, k) => puntOp(lijn, s, van + ((tot - van) * (k + 1)) / (n + 1)));
  }

  // Hoofdroute is een gesloten lus die bij het startvakje begint.
  const lus = [...hoofd, hoofd[0]];
  const s = metLengte(lus);
  const totaal = s[s.length - 1];
  const sBij = (p) => s[dichtstbij(lus, p)];
  const A = { split: sBij(herten[0]), samen: sBij(herten[herten.length - 1]), rest: sBij([1001.7, 427]), steiger: sBij([237.8, 631.5]) };

  // Volgorde van de zones met de klok mee (ONTWERP §6.1) en de soorten per vakje (§6.5).
  const B = 'blauw', R = 'rood', E = 'event', I = 'item', K = 'kans', P = 'pech';
  // De aantallen per zone volgen de vorm van het design-bord (zie docs/BESLISSINGEN.md).
  const zones = [
    { zone: 'strand', soorten: ['start', B, B, [E, 'strandtent'], I] },
    { zone: 'noordoever', soorten: [[B, 'nachtRood'], [B, 'nachtVleermuis'], R, [E, 'lantaarnpaal'], [B, 'nachtRood'], [B, 'nachtVleermuis'], [B, 'nachtRood']] },
    { zone: 'hertenkamp', soorten: [B, P, B] },
    { zone: 'oostoever', soorten: [B, [E, 'windvlaag'], R] },
    { zone: 'restaurant', soorten: [B] },
    { zone: 'plaszoom', soorten: [B, [E, 'lantaarnpaal'], K, R, B] },
    { zone: 'zuidoever', soorten: [B, R, I, B, P, B, I] },
    { zone: 'jachthaven', soorten: [R, 'boot', B] },
    { zone: 'westoever', soorten: [B, [E, 'zeilwedstrijd'], R, K] },
  ];
  const ids = { strand: 'strand', noordoever: 'noord', hertenkamp: 'hoofdpad', oostoever: 'oost', restaurant: 'restaurant', plaszoom: 'plaszoom', zuidoever: 'zuid', jachthaven: 'haven', westoever: 'west' };

  // Plaatsen: strand+noord van start tot splitsing (12 vakjes, laatste óp de splitsing),
  // 3 op het hoofdpad, oost begint óp het samenkomen, restaurant (naast het gebouw) en steiger vast.
  const strandNoord = [lus[0], ...tussen(lus, s, 0, A.split, 10), puntOp(lus, s, A.split)];
  const hoofdpad = tussen(lus, s, A.split, A.samen, 3);
  const oost = [puntOp(lus, s, A.samen), ...tussen(lus, s, A.samen, A.rest, 2)];
  const rest = [puntOp(lus, s, A.rest)];
  const naRest = tussen(lus, s, A.rest, A.steiger, 13); // plaszoom 5, zuid 7, haven 1
  const steiger = [puntOp(lus, s, A.steiger)];
  const terug = tussen(lus, s, A.steiger, totaal, 5); // haven 1, west 4
  const reeks = [...strandNoord, ...hoofdpad, ...oost, ...rest, ...naRest, ...steiger, ...terug];

  const vakjes = [];
  let i = 0;
  for (const { zone, soorten } of zones) {
    soorten.forEach((sd, k) => {
      const [type, vlag] = Array.isArray(sd) ? sd : [sd];
      const p = rond(reeks[i++]);
      const v = { id: `${ids[zone]}${k + 1}`, x: p[0], y: p[1], type, next: [], zone };
      if (vlag) v.flags = [vlag];
      vakjes.push(v);
    });
  }
  if (i !== reeks.length) throw new Error(`Aantal klopt niet: ${i} soorten, ${reeks.length} plekken`);
  vakjes.forEach((v, k) => v.next.push(vakjes[(k + 1) % vakjes.length].id));
  const vind = (id) => vakjes.find((v) => v.id === id);

  // Hertenkamp-pad: 4 vakjes tussen de splitsing (noord7) en het samenkomen (oost1).
  const hs = metLengte(herten);
  const hertPos = tussen(herten, hs, 0, hs[hs.length - 1], 4);
  const hertSoorten = [B, B, 'hertenkamp', B];
  const hertVakjes = hertPos.map((p, k) => ({ id: `herten${k + 1}`, ...xy(p), type: hertSoorten[k], next: [], zone: 'hertenkamp-pad' }));
  // Bootroute: 4 blauwe vakjes op het water, van de steiger naar het restaurant.
  const bs = metLengte(boot);
  const bootVakjes = tussen(boot, bs, 0, bs[bs.length - 1], 4).map((p, k) => ({ id: `boot${k + 1}`, ...xy(p), type: B, next: [], zone: 'boot' }));
  // IJspad (alleen in de winter): 5 ijsvakjes in een rechte lijn van strand3 naar plaszoom2.
  const ijsVan = vind('strand3'), ijsNaar = vind('plaszoom2');
  const ijsLijn = [[ijsVan.x, ijsVan.y], [ijsNaar.x, ijsNaar.y]];
  const ijsS = metLengte(ijsLijn);
  const ijsVakjes = tussen(ijsLijn, ijsS, 0, ijsS[1], 5).map((p, k) => ({ id: `ijs${k + 1}`, ...xy(p), type: 'ijs', next: [], zone: 'ijspad' }));
  function xy(p) { const q = rond(p); return { x: q[0], y: q[1] }; }

  const keten = (lijst, van, naar) => {
    vind(van).next.push(lijst[0].id);
    lijst.forEach((v, k) => v.next.push(k + 1 < lijst.length ? lijst[k + 1].id : naar));
  };
  keten(hertVakjes, 'noord7', 'oost1');
  keten(bootVakjes, 'haven2', 'restaurant1');
  keten(ijsVakjes, 'strand3', 'plaszoom2');
  vakjes.push(...hertVakjes, ...bootVakjes, ...ijsVakjes);

  // Sterplekken (§6.4): in de plas naast het pad, zo dat de ster geen vakjes bedekt.
  // Plaszoom staat precies waar het design de ster heeft.
  const sterplekken = [
    { id: 'strand-noord', naam: 'Strand-noord', vakje: 'strand4', x: 310, y: 340 },
    { id: 'noordoever', naam: 'Noordoever', vakje: 'noord4', x: 575, y: 320 },
    { id: 'oostoever', naam: 'Oostoever', vakje: 'oost2', x: 895, y: 410 },
    { id: 'plaszoom', naam: 'Plaszoom', vakje: 'plaszoom4', x: 910.5, y: 619.3 },
    { id: 'park-rozenburg', naam: 'Park Rozenburg', vakje: 'zuid4', x: 602, y: 648 },
    { id: 'westoever', naam: 'Westoever', vakje: 'west2', x: 250, y: 440 },
  ];

  const dichtsteVakje = (p, zone) =>
    vakjes.filter((v) => v.zone === zone).reduce((a, b) => (afstand([a.x, a.y], p) < afstand([b.x, b.y], p) ? a : b)).id;
  const bord = {
    versie: 1,
    breedte: 1180,
    hoogte: 820,
    start: 'strand1',
    vakjes,
    splitsingen: [
      { vakje: 'noord7', soort: 'hertenkamp', hoofdpad: 'hoofdpad1', zijpad: 'herten1' },
      { vakje: 'haven2', soort: 'boot', hoofdpad: 'haven3', zijpad: 'boot1' },
      { vakje: 'strand3', soort: 'ijspad', hoofdpad: 'strand4', zijpad: 'ijs1' },
    ],
    sterplekken,
    plekken: {
      winkel: { vakje: 'restaurant1', x: 1074.8, y: 490.2 },
      nachtwinkel: { vakje: 'haven2', x: 165.7, y: 677.4 },
      ratje: { vakje: dichtsteVakje([653.9, 764.6], 'zuidoever'), x: 653.9, y: 764.6 },
    },
    labels: [
      { tekst: 'Start · Strand', x: 192, y: 207, onder: false },
      { tekst: 'Hertenkamp', x: 915, y: 129, onder: false },
      { tekst: 'Restaurant & winkel', x: 1098, y: 392, onder: false },
      { tekst: 'Molen De Ster · Plaszoom', x: 1038, y: 708, onder: true },
      { tekst: 'Park Rozenburg · Ratje', x: 654, y: 773, onder: true },
      { tekst: 'Jachthaven', x: 318, y: 478, onder: false },
    ],
  };
  schrijf(join(ROOT, 'src/data/board.json'), JSON.stringify(bord, null, 2) + '\n');
  console.log(`board.json: ${vakjes.length} vakjes`);
}

console.log('Klaar. Vakjesoorten:', Object.keys(iconen).join(', '));
if (!existsSync(join(ROOT, 'src/data/board.json'))) console.log('Let op: nog geen board.json; draai met --bord.');
