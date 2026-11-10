import { registerSW } from 'virtual:pwa-register';

// Zorgt dat de iPad een nieuwe versie van het spel ook echt gaat gebruiken.
// De app kijkt bij het openen, bij terugkomen uit de achtergrond en elk half uur
// of er een nieuwe versie online staat. Staat die klaar, dan wordt hij geladen
// zodra je in het hoofdmenu bent (meteen, of de eerstvolgende keer). Midden in
// een beurt gebeurt er dus niets; het spel is toch al na elke actie bewaard.

let klaar = false;
let bijwerken: ((herladen?: boolean) => Promise<void>) | null = null;

export function startBijwerken(inHoofdmenu: () => boolean): void {
  if (!('serviceWorker' in navigator)) return;
  bijwerken = registerSW({
    immediate: true,
    onNeedRefresh() {
      klaar = true;
      if (inHoofdmenu()) werkBijAlsKlaar();
    },
    onRegisteredSW(_url, registratie) {
      if (!registratie) return;
      const kijk = () => registratie.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') kijk();
      });
      setInterval(kijk, 30 * 60 * 1000);
    },
  });
}

/** Laadt de nieuwe versie als die klaarstaat. Geeft true terug als dat gebeurt. */
export function werkBijAlsKlaar(): boolean {
  if (!klaar || !bijwerken) return false;
  klaar = false;
  void bijwerken(true);
  return true;
}
