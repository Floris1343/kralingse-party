/** Kleine knop-icoontjes, letterlijk uit de design-HTML. */
export const icoon = {
  play: (kleur = '#FFFFFF', maat = 28) =>
    `<svg width="${maat}" height="${maat}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5 L19 12 L7 19.5 Z" fill="${kleur}" stroke="${kleur}" stroke-width="2.4" stroke-linejoin="round"></path></svg>`,
  plus: (kleur = '#FFFFFF', maat = 28) =>
    `<svg width="${maat}" height="${maat}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 V20 M4 12 H20" stroke="${kleur}" stroke-width="3.6" stroke-linecap="round"></path></svg>`,
  vinkje: (kleur = '#FFFFFF', maat = 26) =>
    `<svg width="${maat}" height="${maat}" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="${kleur}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
  tandwiel: (kleur = '#2B1D14', maat = 28) =>
    `<svg width="${maat}" height="${maat}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="${kleur}" stroke-width="2.6"></circle><path d="M12 2.5 V5.5 M12 18.5 V21.5 M2.5 12 H5.5 M18.5 12 H21.5 M5.3 5.3 L7.4 7.4 M16.6 16.6 L18.7 18.7 M5.3 18.7 L7.4 16.6 M16.6 7.4 L18.7 5.3" stroke="${kleur}" stroke-width="2.6" stroke-linecap="round"></path></svg>`,
  turbo: (kleur = '#2B1D14', maat = 28) =>
    `<svg width="${maat}" height="${maat}" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5 L11 12 L3 19 Z M12 5 L20 12 L12 19 Z" fill="${kleur}" stroke="${kleur}" stroke-width="2" stroke-linejoin="round"></path></svg>`,
  menu: (kleur = '#2B1D14', maat = 26) =>
    `<svg width="${maat}" height="${maat}" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6 H20 M4 12 H20 M4 18 H20" fill="none" stroke="${kleur}" stroke-width="3" stroke-linecap="round"></path></svg>`,
  terug: (kleur = '#2B1D14', maat = 26) =>
    `<svg width="${maat}" height="${maat}" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" fill="none" stroke="${kleur}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
};
