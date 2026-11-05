'use strict';
/* ====== À propos ====== */
V.apropos = () => ({
  html: `
  <header class="top"><div style="display:flex;align-items:center;gap:4px;margin-inline-start:-8px"><a class="icon-btn flip" href="javascript:history.back()" aria-label="${tr('Retour')}">${I.back}</a><h1>${tr('À propos')}</h1></div></header>
  <div class="about card" style="padding:16px">
    <p>${tr('<b>Salah Compass</b> · version {0}. Application gratuite, sans publicité, sans compte et sans collecte de données. Vos réglages et votre position restent sur votre téléphone.', APP_VERSION)}</p>
    <h2>${tr('Horaires de prière')}</h2>
    <p>${tr('Calculés sur l’appareil à partir de votre position, selon la méthode choisie dans les réglages. Ils peuvent différer de quelques minutes de ceux de votre mosquée : en cas de doute, suivez les horaires de votre mosquée.')}</p>
    <h2>${tr('Texte du Coran')}</h2>
    <p>${tr('Texte arabe (écriture ‘uthmani) : projet')} <a href="https://tanzil.net" style="text-decoration:underline">Tanzil</a> (tanzil.net).</p>
    <p lang="en" dir="ltr"><small>Tanzil Quran Text. Copyright (C) 2007-2021 Tanzil Project. License: Creative Commons Attribution 3.0. This copy of the Quran text is carefully produced, highly verified and continuously monitored by a group of specialists in Tanzil Project. TERMS OF USE: Permission is granted to copy and distribute verbatim copies of this text, but CHANGING IT IS NOT ALLOWED. This Quran text can be used in any website or application, provided that its source (Tanzil Project) is clearly indicated, and a link is made to tanzil.net to enable users to keep track of changes. This copyright notice shall be included in all verbatim copies of the text, and shall be reproduced appropriately in all files derived from or containing substantial portion of this text. Please check updates at: http://tanzil.net/updates/</small></p>
    <h2>${tr('Traduction française')}</h2>
    <p>${tr('Traduction du Dr Nabil Rudwan, publiée par le Noor International Center (version 1.0.0), fournie par {0}. Le texte et les notes de la traduction sont affichés sans modification (seul le numéro de verset placé en tête de chaque verset est retiré à l’affichage, puisqu’il apparaît déjà dans le médaillon).', '<a href="https://quranenc.com" style="text-decoration:underline">QuranEnc.com</a>')}</p>
    <h2>${tr('Récitation')}</h2>
    <p>${tr('Les récitations verset par verset sont lues en ligne depuis {0}. Elles ne sont pas copiées dans l’application et nécessitent une connexion Internet. Les droits appartiennent aux récitateurs.', '<a href="https://everyayah.com" style="text-decoration:underline">everyayah.com</a>')}</p>
    <h2>${tr('Adhan')}</h2>
    <p>${tr('Fichier audio fourni par l’utilisateur de l’application.')}</p>
    <h2>${tr('Données utilisées')}</h2>
    <p>${tr('Mise en forme des données du Coran : projet {0} (CC BY-SA 4.0).', '<a href="https://github.com/risan/quran-json" style="text-decoration:underline">risan/quran-json</a>')}</p>
  </div>`,
  mount() { }
});

/* ====== Navigation ====== */
let CUR = null;
const NAV = [['prieres', tr('Prières'), I.clock], ['coran', tr('Coran'), I.book], ['qibla', tr('Qibla'), I.compass], ['calendrier', tr('Calendrier'), I.cal]];
function parseHash() { return (location.hash || '#/prieres').replace(/^#\/?/, '').split('/'); }
function render(keep) {
  const view = $('#view'), y = keep ? view.scrollTop : 0;
  if (CUR && CUR.unmount) CUR.unmount();
  const p = parseHash(), key = p[0] || 'prieres';
  if (key !== 'reglages') stopPreview();
  let r;
  try {
    if (key === 'coran') r = p[1] ? V.lire(p[1], p[2]) : V.coran();
    else if (V[key]) r = V[key]();
    else r = V.prieres();
  } catch (e) {
    r = { html: '<div class="empty">' + tr('Erreur d’affichage : ') + esc(e.message) + '</div>' };
  }
  CUR = r;
  view.className = r.reader ? 'reader' : '';
  view.onscroll = null;
  view.innerHTML = r.html;
  if (r.mount) r.mount();
  view.scrollTop = y;
  const on = (key === 'reglages' || key === 'apropos') ? 'prieres' : key;
  $('#nav').innerHTML = NAV.map(n => `<a href="#/${n[0]}" data-nav="1" class="${n[0] === on ? 'on' : ''}"${n[0] === on ? ' aria-current="page"' : ''}><span class="ic">${n[2]}</span>${n[1]}</a>`).join('');
  renderPlayer();
}
window.addEventListener('hashchange', () => render(false));

document.addEventListener('click', e => {
  const nav = e.target.closest('a[data-nav]');
  if (nav) { e.preventDefault(); const href = nav.getAttribute('href'), same = location.hash === href; location.replace(href); if (same) render(false); return; }
  const el = e.target.closest('[data-act]');
  if (el && ACT[el.dataset.act]) { ACT[el.dataset.act](el, e); }
});
document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg] && el.type !== 'range') CHG[el.dataset.chg](el); });
document.addEventListener('input', e => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg] && el.type === 'range') CHG[el.dataset.chg](el); });

setInterval(() => { if (CUR && CUR.tick) CUR.tick(); }, 1000);
window.__resume = () => { syncNative(); const k = parseHash()[0] || 'prieres'; if (k === 'prieres' || k === 'reglages') render(true); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) window.__resume(); });

/* ====== Démarrage ====== */
(function init() {
  if (!location.hash) location.replace('#/prieres');
  render(false);
  if (NATIVE && !S.askedNotif) { S.askedNotif = true; save(); askNotif(); }
  syncNative();
  if (S.auto) locate(ok => { if (ok) { const k = parseHash()[0] || 'prieres'; if (k === 'prieres' || k === 'qibla') render(true); } });
})();
