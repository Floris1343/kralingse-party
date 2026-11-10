import { describe, expect, it } from 'vitest';
import { BORD } from '../data/bord';
import { volgendVakje } from './bord';
import { controleerBord, hoofdroute } from './bordControle';
import { nieuwSpel } from './nieuwSpel';
import { keuzes, alleBots, speelUit } from './testhulp';

const vakjes = (zone: string) => BORD.vakjes.filter((v) => v.zone === zone);
const zijpaden = ['boot', 'ijspad'];
const hoofd = BORD.vakjes.filter((v) => !zijpaden.includes(v.zone));
const telType = (lijst: typeof hoofd) =>
  lijst.reduce<Record<string, number>>((t, v) => ({ ...t, [v.type]: (t[v.type] ?? 0) + 1 }), {});

describe('board.json', () => {
  it('heeft geen fouten', () => {
    expect(controleerBord(BORD)).toEqual([]);
  });

  it('hoofdroute: 39 vakjes, rond, met de vakjes van §6.5', () => {
    const route = hoofdroute(BORD);
    expect(route).toHaveLength(40); // start ... start
    expect(new Set(route).size).toBe(39);
    expect(hoofd).toHaveLength(39);
    expect(telType(hoofd)).toEqual({ start: 1, blauw: 16, rood: 6, event: 5, item: 3, kans: 2, pech: 2, boot: 1, hertenkamp: 3 });
  });

  it('de zones liggen met de klok mee in de goede volgorde', () => {
    const volgorde = hoofdroute(BORD)
      .slice(0, -1)
      .map((id) => BORD.vakjes.find((v) => v.id === id)!.zone)
      .filter((z, i, a) => z !== a[i - 1]);
    expect(volgorde).toEqual([
      'strand', 'noordoever', 'hertenkamp', 'oostoever', 'restaurant',
      'plaszoom', 'zuidoever', 'jachthaven', 'westoever',
    ]);
  });

  it('de events staan in de goede zones', () => {
    const event = (vlag: string) => BORD.vakjes.filter((v) => v.flags?.includes(vlag as never)).map((v) => v.zone);
    expect(event('lantaarnpaal').sort()).toEqual(['noordoever', 'plaszoom']);
    expect(event('strandtent')).toEqual(['strand']);
    expect(event('windvlaag')).toEqual(['oostoever']);
    expect(event('zeilwedstrijd')).toEqual(['westoever']);
    for (const v of BORD.vakjes.filter((x) => x.type === 'event')) expect(v.flags).toHaveLength(1);
  });

  it("3 vakjes worden 's nachts rood en 2 krijgen vleermuizen, allemaal blauw aan de Noordoever", () => {
    for (const [vlag, aantal] of [['nachtRood', 3], ['nachtVleermuis', 2]] as const) {
      const lijst = BORD.vakjes.filter((v) => v.flags?.includes(vlag));
      expect(lijst).toHaveLength(aantal);
      for (const v of lijst) expect([v.type, v.zone]).toEqual(['blauw', 'noordoever']);
    }
  });

  it('hertenkamp: één pad van 4 vakjes, met drie hertenkamp-actievakjes op een rij en geen splitsing', () => {
    expect(vakjes('hertenkamp').map((v) => v.type)).toEqual(['blauw', 'hertenkamp', 'hertenkamp', 'hertenkamp']);
    expect(BORD.splitsingen.map((s) => s.soort)).toEqual(['boot', 'ijspad']);
    // Netjes aangesloten: noord7 → herten1 → … → herten4 → oost1, zonder losse vakjes.
    let id = 'noord7';
    const pad: string[] = [];
    for (let i = 0; i < 5; i++) pad.push((id = BORD.vakjes.find((v) => v.id === id)!.next[0]));
    expect(pad).toEqual(['herten1', 'herten2', 'herten3', 'herten4', 'oost1']);
    for (const v of BORD.vakjes) expect(BORD.vakjes.some((w) => w.next.includes(v.id))).toBe(true);
    expect(BORD.vakjes.some((v) => v.id.startsWith('hoofdpad'))).toBe(false);
  });

  it('het Pech-vakje van het oude onderste pad staat op de Oostoever; het bordje bij de ingang', () => {
    expect(BORD.vakjes.find((v) => v.id === 'oost1')!.type).toBe('pech');
    expect(BORD.plekken.bokBordje?.vakje).toBe('herten1');
  });

  it('boot: van de jachthaven via 4 blauwe vakjes naar het restaurant', () => {
    const s = BORD.splitsingen.find((x) => x.soort === 'boot')!;
    expect(BORD.vakjes.find((v) => v.id === s.vakje)!.zone).toBe('jachthaven');
    expect(telType(vakjes('boot'))).toEqual({ blauw: 4 });
    let id = s.zijpad;
    for (let i = 0; i < 4; i++) id = BORD.vakjes.find((v) => v.id === id)!.next[0];
    expect(BORD.vakjes.find((v) => v.id === id)!.zone).toBe('restaurant');
  });

  it('ijspad: 5 ijsvakjes van het Strand naar Plaszoom', () => {
    const s = BORD.splitsingen.find((x) => x.soort === 'ijspad')!;
    expect(BORD.vakjes.find((v) => v.id === s.vakje)!.zone).toBe('strand');
    expect(telType(vakjes('ijspad'))).toEqual({ ijs: 5 });
    let id = s.zijpad;
    for (let i = 0; i < 5; i++) id = BORD.vakjes.find((v) => v.id === id)!.next[0];
    expect(BORD.vakjes.find((v) => v.id === id)!.zone).toBe('plaszoom');
  });

  it('zes sterplekken op de hoofdroute, en de winkel, Nachtwinkel en Ratje op de goede plek', () => {
    expect(BORD.sterplekken.map((p) => p.id)).toEqual([
      'strand-noord', 'noordoever', 'oostoever', 'plaszoom', 'park-rozenburg', 'westoever',
    ]);
    const route = new Set(hoofdroute(BORD));
    for (const p of BORD.sterplekken) expect(route.has(p.vakje)).toBe(true);
    const zone = (id: string) => BORD.vakjes.find((v) => v.id === id)!.zone;
    expect(zone(BORD.plekken.winkel.vakje)).toBe('restaurant');
    expect(zone(BORD.plekken.nachtwinkel.vakje)).toBe('jachthaven');
    expect(BORD.plekken.nachtwinkel.vakje).toBe(BORD.splitsingen.find((x) => x.soort === 'boot')!.vakje);
    expect(zone(BORD.plekken.ratje.vakje)).toBe('zuidoever');
  });

  it('alle coördinaten liggen op het bord', () => {
    for (const p of [...BORD.vakjes, ...BORD.sterplekken, ...Object.values(BORD.plekken)]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(BORD.breedte);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(BORD.hoogte);
    }
  });

  it('bij een splitsing loopt het spel (voorlopig) over het hoofdpad', () => {
    for (const s of BORD.splitsingen) expect(volgendVakje(BORD, s.vakje)).toBe(s.hoofdpad);
  });

  it('een heel spel met 4 bots loopt netjes rond op het echte bord', () => {
    const { eind } = speelUit(nieuwSpel(BORD, keuzes({ spelers: alleBots() }), 5), undefined, 10_000, BORD);
    expect(eind.fase).toEqual({ soort: 'einde' });
    for (const sp of eind.spelers) expect(hoofdroute(BORD)).toContain(sp.vakje);
  });
});

describe('controleerBord', () => {
  it('vindt een kapotte verwijzing en een losse splitsing', () => {
    const kapot = structuredClone(BORD);
    kapot.vakjes[3].next = ['bestaat-niet'];
    expect(controleerBord(kapot).join()).toContain('bestaat-niet');
    const los = structuredClone(BORD);
    los.vakjes[5].next.push(los.vakjes[9].id);
    expect(controleerBord(los).join()).toContain('geen splitsing');
  });
});
