'use strict';
/* ====== Qibla : boussole et heures La Mecque / France ====== */
const DIR16 = ['Nord', 'Nord-Nord-Est', 'Nord-Est', 'Est-Nord-Est', 'Est', 'Est-Sud-Est', 'Sud-Est', 'Sud-Sud-Est', 'Sud', 'Sud-Sud-Ouest', 'Sud-Ouest', 'Ouest-Sud-Ouest', 'Ouest', 'Ouest-Nord-Ouest', 'Nord-Ouest', 'Nord-Nord-Ouest'];
function qiblaBearing(lat, lng) {
  const f = lat * d2r, f2 = KAABA.lat * d2r, dl = (KAABA.lng - lng) * d2r;
  return (Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f) * Math.sin(f2) - Math.sin(f) * Math.cos(f2) * Math.cos(dl)) * r2d + 360) % 360;
}
let HEAD = null, SMOOTH = null, ALIGNED = false, COMPASS_ON = false, QB = 0;

function onHeading(h) {
  if (SMOOTH == null) SMOOTH = h;
  else { const d = ((h - SMOOTH + 540) % 360) - 180; SMOOTH = (SMOOTH + d * 0.3 + 360) % 360; }
  HEAD = SMOOTH; updateCompass();
}
window.__heading = h => onHeading(h);
window.__compassUnavailable = () => startWebCompass();

function webOri(e) {
  let h = null;
  if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
  else if (e.alpha != null && (e.absolute || e.type === 'deviceorientationabsolute')) h = (360 - e.alpha) % 360;
  if (h != null) onHeading(h);
}
function startWebCompass() {
  const add = () => { window.addEventListener('deviceorientationabsolute', webOri, true); window.addEventListener('deviceorientation', webOri, true); };
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') add(); }).catch(() => { });
  } else add();
}
function startCompass() {
  if (COMPASS_ON) return; COMPASS_ON = true;
  const L = loc();
  if (NATIVE) { try { AndroidApp.startCompass(L.lat, L.lng); } catch (e) { startWebCompass(); } } else startWebCompass();
}
function stopCompass() {
  if (!COMPASS_ON) return; COMPASS_ON = false; HEAD = null; SMOOTH = null;
  if (NATIVE) { try { AndroidApp.stopCompass(); } catch (e) { /* ignoré */ } }
  window.removeEventListener('deviceorientationabsolute', webOri, true);
  window.removeEventListener('deviceorientation', webOri, true);
}

function dialSvg() {
  const lab = (x, y, t, c) => `<text class="lab" data-x="${x}" data-y="${y}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="ui-monospace,Menlo,monospace" font-size="18" font-weight="500" fill="${c}">${t}</text>`;
  return `<svg viewBox="0 -24 360 384" width="290" height="309" role="img" id="dialsvg" aria-label="${tr('Boussole')}" style="display:block">
    <polygon points="169,-18 191,-18 180,6" fill="var(--ink)"/>
    <g id="dial">
      <circle cx="180" cy="180" r="168" fill="var(--bg)" stroke="var(--line)" stroke-width="2"/>
      <circle cx="180" cy="180" r="164" fill="none" stroke="var(--muted)" stroke-width="6" stroke-dasharray="1.2 13.11" stroke-dashoffset="0.6" opacity="0.7" transform="rotate(-90 180 180)"/>
      <circle cx="180" cy="180" r="160" fill="none" stroke="var(--ink)" stroke-width="16" stroke-dasharray="2.5 248.83" stroke-dashoffset="1.25" transform="rotate(-90 180 180)"/>
      ${lab(180, 48, tr('N'), 'var(--accent)')}${lab(312, 180, tr('E'), 'var(--ink)')}${lab(180, 312, tr('S'), 'var(--ink)')}${lab(48, 180, tr('O'), 'var(--ink)')}
      <g id="needle">
        <line x1="180" y1="146" x2="180" y2="40" stroke="var(--brass)" stroke-width="4" stroke-linecap="round"/>
        <rect x="167" y="0" width="26" height="26" rx="4" fill="var(--brass)"/>
        <rect x="167" y="7" width="26" height="4" fill="var(--surface)" opacity="0.7"/>
      </g>
    </g>
    <circle cx="180" cy="180" r="7" fill="var(--ink)"/>
  </svg>`;
}
function updateCompass() {
  const dial = $('#dial'); if (!dial) return;
  const st = $('#qstatus');
  if (HEAD == null) { st.textContent = COMPASS_ON ? tr('Recherche du nord… bougez le téléphone en dessinant un 8.') : ''; dial.setAttribute('transform', 'rotate(0 180 180)'); $$('.lab', dial).forEach(l => l.removeAttribute('transform')); return; }
  dial.setAttribute('transform', `rotate(${-HEAD.toFixed(1)} 180 180)`);
  $$('.lab', dial).forEach(l => l.setAttribute('transform', `rotate(${HEAD.toFixed(1)} ${l.dataset.x} ${l.dataset.y})`));
  const diff = ((QB - HEAD + 540) % 360) - 180, ad = Math.abs(diff);
  if (ad <= 3) {
    st.textContent = tr('Vous faites face à la Qibla.');
    if (!ALIGNED && navigator.vibrate) navigator.vibrate(40);
    ALIGNED = true;
  } else {
    ALIGNED = false;
    st.textContent = tr(diff > 0 ? 'Tournez de {0}° vers la droite.' : 'Tournez de {0}° vers la gauche.', Math.round(ad));
  }
}
function clockInfo(tz) {
  const off = tzOffset(tz, new Date());
  return { time: fmtClock(Date.now(), tz), off };
}
function updateClocks() {
  const m = $('#cm'), f = $('#cf'); if (!m) return;
  const a = clockInfo('Asia/Riyadh'), b = clockInfo('Europe/Paris');
  m.textContent = a.time; f.textContent = b.time;
  $('#cmz').textContent = utcLabel(a.off);
  $('#cfz').textContent = utcLabel(b.off) + (b.off === 1 ? tr(' · heure d’hiver') : b.off === 2 ? tr(' · heure d’été') : '');
}

V.qibla = () => {
  const L = loc();
  QB = qiblaBearing(L.lat, L.lng);
  const dist = Math.round(haversineKm(L.lat, L.lng, KAABA.lat, KAABA.lng) / 10) * 10;
  const html = `
  <header class="top">
    <div style="display:flex;flex-direction:column;gap:2px"><h1>${tr('Qibla')}</h1><div class="sub">${esc(L.name)}</div></div>
    ${RTL ? '' : '<span class="ar" lang="ar" dir="rtl" style="font-size:36px;line-height:1;font-weight:700;color:var(--accent)">القبلة</span>'}
  </header>
  <div class="stack">
    <section class="card compass" aria-label="${tr('Boussole')}">
      ${dialSvg()}
      <div class="bigdeg mono"><b>${Math.round(QB)}</b><span>°</span></div>
      <div class="sub" style="font-size:15px">${tr(DIR16[Math.round(QB / 22.5) % 16])} · ${dist.toLocaleString(LOCALE + '-u-nu-latn')} km</div>
      <div class="status" id="qstatus" role="status"></div>
    </section>
    <section class="clocks" aria-label="${tr('Heures')}">
      <article class="card clock"><h2>${tr('La Mecque')}</h2><div class="c mono" id="cm">--:--</div><div class="z mono" id="cmz"></div></article>
      <article class="card clock"><h2>${tr('France')}</h2><div class="c mono" id="cf">--:--</div><div class="z mono" id="cfz"></div></article>
    </section>
    <div class="sub" style="text-align:center">${tr('Tenez le téléphone à plat et éloignez-le des objets métalliques ou aimantés.')}</div>
  </div>`;
  return { html, mount() { $('#dial').querySelector('#needle').setAttribute('transform', `rotate(${QB.toFixed(1)} 180 180)`); updateClocks(); startCompass(); updateCompass(); }, unmount: stopCompass, tick: updateClocks };
};
