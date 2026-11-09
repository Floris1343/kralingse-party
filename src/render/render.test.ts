import { describe, expect, it } from 'vitest';
import { basisSchaal, cameraOp, cameraOverzicht, naarScherm } from './camera';
import { diepteSchaal, vakjeMaat } from './diepte';
import { vakjeSvg, vakjesSvg } from './vakjes';
import { VAKJE_TEKENINGEN } from './vakjeTekeningen';
import { BORD } from '../data/bord';

const ipad = { breedte: 1180, hoogte: 820 };
const bord = { breedte: 1180, hoogte: 820 };

describe('diepte', () => {
  it('vakjes zijn achteraan kleiner en platter, zoals in het design', () => {
    const achter = vakjeMaat(188);
    const voor = vakjeMaat(692);
    // Gemeten in board_dag.svg: rx 22.8 / ry 13.8 achteraan, rx 29.4 / ry 23.1 vooraan.
    expect(achter.rx).toBeCloseTo(22.8, 0);
    expect(voor.rx).toBeCloseTo(29.4, 0);
    expect(achter.ry / achter.rx).toBeLessThan(voor.ry / voor.rx);
    expect(vakjeMaat(300, true).rx).toBeGreaterThan(vakjeMaat(300).rx);
  });

  it('figuren worden kleiner naar achteren', () => {
    expect(diepteSchaal(700)).toBeCloseTo(1);
    expect(diepteSchaal(200)).toBeLessThan(diepteSchaal(500));
  });
});

describe('vakjes tekenen', () => {
  it('heeft een tekening voor elke soort vakje op het bord', () => {
    for (const v of BORD.vakjes) expect(VAKJE_TEKENINGEN[v.type]).toBeDefined();
  });

  it('tekent een vakje als vier ellipsen met een icoon, met het icoon op de bovenkant', () => {
    const svg = vakjeSvg('blauw', 500, 400);
    expect(svg.match(/<ellipse/g)).toHaveLength(4);
    expect(svg).toContain('translate(500 400)');
    expect(svg).toContain(VAKJE_TEKENINGEN.blauw.icoon);
  });

  it('tekent alle vakjes van achter naar voren', () => {
    const svg = vakjesSvg(BORD.vakjes);
    expect(svg.match(/<g><ellipse/g)).toHaveLength(BORD.vakjes.length);
    const ys = [...svg.matchAll(/<g><ellipse cx="[\d.]+" cy="([\d.]+)"/g)].map((m) => Number(m[1]));
    for (let i = 1; i < ys.length; i++) expect(ys[i] + 8).toBeGreaterThanOrEqual(ys[i - 1]);
  });
});

describe('camera', () => {
  it('op een iPad past het bord precies (schaal 1)', () => {
    expect(basisSchaal(ipad, bord)).toBe(1);
    expect(cameraOverzicht(ipad, bord)).toEqual({ x: 0, y: 0, schaal: 1 });
  });

  it('vult ook een breder scherm', () => {
    expect(basisSchaal({ breedte: 1366, hoogte: 800 }, bord)).toBeCloseTo(1366 / 1180);
  });

  it('zet het gevolgde punt in beeld, iets onder het midden', () => {
    const cam = cameraOp(600, 400, ipad, bord, 1.5);
    const [sx, sy] = naarScherm(cam, 600, 400);
    expect(sx).toBeCloseTo(590);
    expect(sy).toBeCloseTo(820 * 0.62);
  });

  it('schuift nooit voorbij de rand van het bord', () => {
    for (const [px, py] of [[0, 0], [1180, 820], [0, 820], [1180, 0]]) {
      const cam = cameraOp(px, py, ipad, bord, 1.5);
      expect(cam.x).toBeLessThanOrEqual(0);
      expect(cam.y).toBeLessThanOrEqual(0);
      expect(cam.x + 1180 * cam.schaal).toBeGreaterThanOrEqual(1180 - 1e-9);
      expect(cam.y + 820 * cam.schaal).toBeGreaterThanOrEqual(820 - 1e-9);
    }
  });
});
