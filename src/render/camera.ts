/**
 * De camera: het bord wordt in zijn geheel verschoven en vergroot (één transform, dus soepel op de iPad).
 */

export interface CameraStand {
  /** Verschuiving van het bord op het scherm, in schermpixels. */
  x: number;
  y: number;
  /** Vergroting: 1 = één bordpixel is één schermpixel. */
  schaal: number;
}

export interface Afmeting {
  breedte: number;
  hoogte: number;
}

/** Kleinste vergroting waarbij het bord het hele scherm vult. */
export function basisSchaal(scherm: Afmeting, bord: Afmeting): number {
  return Math.max(scherm.breedte / bord.breedte, scherm.hoogte / bord.hoogte);
}

/**
 * Camera die punt (px, py) van het bord in beeld brengt, iets onder het midden
 * (zodat er boven het figuur ruimte is voor de dobbelknop). Het bord blijft altijd schermvullend.
 */
export function cameraOp(
  px: number,
  py: number,
  scherm: Afmeting,
  bord: Afmeting,
  zoom: number,
  hoogteFactor = 0.62,
): CameraStand {
  const schaal = basisSchaal(scherm, bord) * zoom;
  const klem = (v: number, min: number) => Math.min(0, Math.max(min, v));
  return {
    schaal,
    x: klem(scherm.breedte / 2 - px * schaal, scherm.breedte - bord.breedte * schaal),
    y: klem(scherm.hoogte * hoogteFactor - py * schaal, scherm.hoogte - bord.hoogte * schaal),
  };
}

/** Het hele bord in beeld (gecentreerd, schermvullend). */
export function cameraOverzicht(scherm: Afmeting, bord: Afmeting): CameraStand {
  return cameraOp(bord.breedte / 2, bord.hoogte / 2, scherm, bord, 1, 0.5);
}

/** Van bordcoördinaten naar schermcoördinaten. */
export function naarScherm(cam: CameraStand, px: number, py: number): [number, number] {
  return [cam.x + px * cam.schaal, cam.y + py * cam.schaal];
}

/** Hoeveel je bij "Bord bekijken" hoogstens inzoomt, ten opzichte van het overzicht. */
export const MAX_VRIJ_ZOOM = 2.6;

/**
 * Schuiven en zoomen met de vingers ("Bord bekijken"). Het punt van het bord dat onder `van`
 * lag, ligt daarna onder `naar` (het midden tussen de vingers), en de vergroting wordt `factor`
 * keer zo groot. Het bord blijft schermvullend en je zoomt nooit verder uit dan het overzicht.
 */
export function vrijeCamera(
  cam: CameraStand,
  scherm: Afmeting,
  bord: Afmeting,
  van: [number, number],
  naar: [number, number],
  factor = 1,
): CameraStand {
  const basis = basisSchaal(scherm, bord);
  const schaal = Math.min(basis * MAX_VRIJ_ZOOM, Math.max(basis, cam.schaal * factor));
  const k = schaal / cam.schaal;
  const klem = (v: number, min: number) => Math.min(0, Math.max(min, v));
  return {
    schaal,
    x: klem(naar[0] - (van[0] - cam.x) * k, scherm.breedte - bord.breedte * schaal),
    y: klem(naar[1] - (van[1] - cam.y) * k, scherm.hoogte - bord.hoogte * schaal),
  };
}
