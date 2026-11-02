'use strict';
/* ====== Utilitaires ====== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const NATIVE = !!(window.AndroidApp && typeof AndroidApp.isNative === 'function' && AndroidApp.isNative());
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const arNum = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);

function toast(msg) {
  const old = $('.toast'); if (old) old.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}

/* ====== Icônes ====== */
const I = {
  clock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  book: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>',
  compass: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/></svg>',
  cal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  prev: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 20 9 12l10-8v16zM5 19V5"/></svg>',
  next: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 4 10 8-10 8V4zM19 5v14"/></svg>',
  play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>',
  pause: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  bell: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
  speaker: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
  bellOff: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.7 21a1.9 1.9 0 0 1-3.4 0M17 17H3s3-2 3-9a6 6 0 0 1 .3-1.9M8.7 3.3A6 6 0 0 1 18 8c0 3 .4 5 1 6.4"/><path d="m2 2 20 20"/></svg>',
  check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>',
  dot: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#B4781A" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="#B4781A"/></svg>',
  ring: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" style="opacity:.55"><circle cx="12" cy="12" r="9"/></svg>',
  pin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  bookmark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  bookmarkOn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  star: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>',
  starOn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3 6.9 7.5.7-5.7 5-1.7-7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>',
  note: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};

/* ====== Réglages (stockage local) ====== */
const DEFAULTS = {
  auto: true, cityIdx: 1, method: 'UOIF', asr: 1, hijriAdj: 0,
  remind: true,
  modes: { fajr: 'adhan', dhuhr: 'adhan', asr: 'adhan', maghrib: 'adhan', isha: 'adhan' },
  pre: 0, vol: 0.8, vibrate: true,
  trans: true, size: 28, reciter: 'Alafasy_128kbps',
  theme: 'auto', lastPos: null, fav: [], marks: [], last: null, askedNotif: false
};
let S = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('qs') || '{}'); } catch (e) { s = {}; }
  const m = Object.assign({}, DEFAULTS, s);
  m.modes = Object.assign({}, DEFAULTS.modes, s.modes || {});
  return m;
})();
function applyTheme() { const r = document.documentElement; if (S.theme && S.theme !== 'auto') r.dataset.theme = S.theme; else delete r.dataset.theme; }
applyTheme();
function save() { try { localStorage.setItem('qs', JSON.stringify(S)); } catch (e) { /* ignoré */ } }

/* ====== Villes ====== */
const CITIES = [
  ['Paris', 48.8566, 2.3522, 'Europe/Paris'], ['Marseille', 43.2965, 5.3698, 'Europe/Paris'],
  ['Lyon', 45.764, 4.8357, 'Europe/Paris'], ['Toulouse', 43.6047, 1.4442, 'Europe/Paris'],
  ['Nice', 43.7102, 7.262, 'Europe/Paris'], ['Nantes', 47.2184, -1.5536, 'Europe/Paris'],
  ['Strasbourg', 48.5734, 7.7521, 'Europe/Paris'], ['Montpellier', 43.6108, 3.8767, 'Europe/Paris'],
  ['Bordeaux', 44.8378, -0.5792, 'Europe/Paris'], ['Lille', 50.6292, 3.0573, 'Europe/Paris'],
  ['Rennes', 48.1173, -1.6778, 'Europe/Paris'], ['Reims', 49.2583, 4.0317, 'Europe/Paris'],
  ['Grenoble', 45.1885, 5.7245, 'Europe/Paris'], ['Dijon', 47.322, 5.0415, 'Europe/Paris'],
  ['Le Havre', 49.4944, 0.1079, 'Europe/Paris'], ['Toulon', 43.1242, 5.928, 'Europe/Paris'],
  ['Saint-Étienne', 45.4397, 4.3872, 'Europe/Paris'], ['Angers', 47.4784, -0.5632, 'Europe/Paris'],
  ['Nîmes', 43.8367, 4.3601, 'Europe/Paris'], ['Clermont-Ferrand', 45.7772, 3.087, 'Europe/Paris'],
  ['Metz', 49.1193, 6.1757, 'Europe/Paris'], ['Perpignan', 42.6887, 2.8948, 'Europe/Paris'],
  ['Limoges', 45.8336, 1.2611, 'Europe/Paris'], ['Tours', 47.3941, 0.6848, 'Europe/Paris'],
  ['Amiens', 49.8941, 2.2958, 'Europe/Paris'], ['Rouen', 49.4432, 1.0993, 'Europe/Paris'],
  ['Caen', 49.1829, -0.3707, 'Europe/Paris'], ['Brest', 48.3904, -4.4861, 'Europe/Paris'],
  ['Orléans', 47.9029, 1.9093, 'Europe/Paris'], ['Mulhouse', 47.7508, 7.3359, 'Europe/Paris'],
  ['Ajaccio', 41.9192, 8.7386, 'Europe/Paris'],
  ['Bruxelles', 50.8503, 4.3517, 'Europe/Brussels'], ['Genève', 46.2044, 6.1432, 'Europe/Zurich'],
  ['Londres', 51.5072, -0.1276, 'Europe/London'], ['Alger', 36.7538, 3.0588, 'Africa/Algiers'],
  ['Casablanca', 33.5731, -7.5898, 'Africa/Casablanca'], ['Tunis', 36.8065, 10.1815, 'Africa/Tunis'],
  ['Dakar', 14.7167, -17.4677, 'Africa/Dakar'], ['Istanbul', 41.0082, 28.9784, 'Europe/Istanbul'],
  ['La Mecque', 21.4225, 39.8262, 'Asia/Riyadh'], ['Médine', 24.4672, 39.6111, 'Asia/Riyadh']
];
const DEVICE_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'; } catch (e) { return 'Europe/Paris'; } })();
const KAABA = { lat: 21.422487, lng: 39.826206 };

function haversineKm(a, b, c, d) {
  const r = Math.PI / 180, R = 6371, dLa = (c - a) * r, dLo = (d - b) * r;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function nearestCity(lat, lng) {
  let best = null, bd = 1e9;
  CITIES.forEach(c => { const d = haversineKm(lat, lng, c[1], c[2]); if (d < bd) { bd = d; best = c; } });
  return bd <= 25 ? best[0] : null;
}
/** Position active : {name, lat, lng, tz} */
function loc() {
  if (S.auto && S.lastPos) {
    const n = nearestCity(S.lastPos.lat, S.lastPos.lng);
    return { name: n || 'Ma position', lat: S.lastPos.lat, lng: S.lastPos.lng, tz: DEVICE_TZ, auto: true };
  }
  const c = CITIES[S.cityIdx] || CITIES[1];
  return { name: c[0], lat: c[1], lng: c[2], tz: c[3], auto: false };
}

/* ====== Fuseaux, dates ====== */
function tzOffset(tz, date) { // en heures
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const p = {}; f.formatToParts(date).forEach(x => { p[x.type] = x.value; });
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return (asUTC - Math.floor(date.getTime() / 1000) * 1000) / 3600000;
  } catch (e) { return -new Date().getTimezoneOffset() / 60; }
}
function datePartsIn(tz, ms) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' });
  const p = {}; f.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
  return { y: +p.year, m: +p.month, d: +p.day };
}
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
function dow(y, m, d) { return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); }
function fmtClock(ms, tz) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms));
}
function hfmt(h) { h = ((h % 24) + 24) % 24; h = Math.round(h * 60) / 60; const H = Math.floor(h + 1e-9), M = Math.round((h - H) * 60); return M === 60 ? pad((H + 1) % 24) + ':00' : pad(H) + ':' + pad(M); }
function utcLabel(off) { const s = off >= 0 ? '+' : '−'; const a = Math.abs(off); const h = Math.floor(a), m = Math.round((a - h) * 60); return 'UTC' + s + h + (m ? ':' + pad(m) : ''); }

/* ====== Hégire ====== */
function hijriOf(y, m, d) {
  try {
    const f = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const p = {}; f.formatToParts(new Date(Date.UTC(y, m - 1, d + (S.hijriAdj || 0), 12))).forEach(x => { p[x.type] = x.value; });
    return { d: +p.day, month: cap(p.month), y: p.year };
  } catch (e) { return { d: '', month: '', y: '' }; }
}
const hijriStr = (y, m, d) => { const h = hijriOf(y, m, d); return h.d + ' ' + h.month + ' ' + h.y; };

/* ====== Calcul des heures de prière ====== */
const d2r = Math.PI / 180, r2d = 180 / Math.PI;
const sn = x => Math.sin(x * d2r), cs = x => Math.cos(x * d2r), tn = x => Math.tan(x * d2r);
const asn = x => Math.asin(x) * r2d, acs = x => Math.acos(x) * r2d, at2 = (y, x) => Math.atan2(y, x) * r2d, acot = x => Math.atan(1 / x) * r2d;
const fixA = a => { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; };
const fixH = h => { h = h - 24 * Math.floor(h / 24); return h < 0 ? h + 24 : h; };
function julian(y, m, d) { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }
function sunPos(jd) {
  const D = jd - 2451545.0, g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
  const L = fixA(q + 1.915 * sn(g) + 0.020 * sn(2 * g)), e = 23.439 - 0.00000036 * D;
  const RA = at2(cs(e) * sn(L), cs(L)) / 15;
  return { decl: asn(sn(e) * sn(L)), eqt: q / 15 - fixH(RA) };
}
const METHODS = {
  UOIF: { n: 'UOIF (France) · 12°', f: 12, i: 12 },
  MWL: { n: 'Ligue islamique mondiale · 18° / 17°', f: 18, i: 17 },
  ISNA: { n: 'ISNA · 15°', f: 15, i: 15 },
  EGY: { n: 'Égypte · 19,5° / 17,5°', f: 19.5, i: 17.5 },
  UMM: { n: 'Umm al-Qura · 18,5° / Isha +90 min', f: 18.5, im: 90 },
  TUR: { n: 'Diyanet (Turquie) · 18° / 17°', f: 18, i: 17 }
};
/** Heures décimales locales pour le jour civil (y,m,d) */
function rawTimes(y, m, d, L) {
  const M = METHODS[S.method] || METHODS.UOIF;
  const tz = tzOffset(L.tz, new Date(Date.UTC(y, m - 1, d, 12)));
  const lat = L.lat, lng = L.lng;
  const jd = julian(y, m, d) - lng / (15 * 24);
  const mid = t => { const s = sunPos(jd + t / 24); return fixH(12 - s.eqt); };
  const T = (A, t) => { const s = sunPos(jd + t / 24); return 1 / 15 * acs((-sn(A) - sn(s.decl) * sn(lat)) / (cs(s.decl) * cs(lat))); };
  const asrT = (f, t) => { const s = sunPos(jd + t / 24); return 1 / 15 * acs((-sn(-acot(f + tn(Math.abs(lat - s.decl)))) - sn(lat) * sn(s.decl)) / (cs(lat) * cs(s.decl))); };
  const noon = mid(12) + (tz - lng / 15);
  const maghrib = noon + T(0.833, noon + 6);
  const r = {
    fajr: noon - T(M.f, noon - 1), sunrise: noon - T(0.833, noon - 1), dhuhr: noon + 2 / 60,
    asr: noon + asrT(S.asr || 1, noon + 3), maghrib,
    isha: M.im ? maghrib + M.im / 60 : noon + T(M.i, noon + 8)
  };
  return { h: r, tz };
}
const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const FIVE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PNAME = { fajr: 'Fajr', sunrise: 'Lever du soleil', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const PAR = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
/** {fajr:{h,t,str},...} avec t = instant absolu (ms) */
function dayTimes(y, m, d, L) {
  L = L || loc();
  const { h, tz } = rawTimes(y, m, d, L);
  const out = {};
  ORDER.forEach(k => {
    const hh = Math.round(h[k] * 60) / 60;
    out[k] = isNaN(hh) ? { h: NaN, t: NaN, str: '--:--' } : { h: hh, t: Date.UTC(y, m - 1, d) + hh * 3600000 - tz * 3600000, str: hfmt(hh) };
  });
  return out;
}
function shiftDay(p, n) { const x = new Date(Date.UTC(p.y, p.m - 1, p.d + n, 12)); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() }; }
function todayParts(L) { return datePartsIn((L || loc()).tz, Date.now()); }
/** Liste triée des 5 prières autour de maintenant */
function around(now, L) {
  L = L || loc();
  const t = todayParts(L), list = [];
  [-1, 0, 1].forEach(n => {
    const p = shiftDay(t, n), dt = dayTimes(p.y, p.m, p.d, L);
    FIVE.forEach(k => { if (!isNaN(dt[k].t)) list.push({ k, t: dt[k].t, str: dt[k].str, day: n }); });
  });
  list.sort((a, b) => a.t - b.t);
  const next = list.find(x => x.t > now) || list[list.length - 1];
  const idx = list.indexOf(next);
  const prev = idx > 0 ? list[idx - 1] : null;
  return { today: dayTimes(t.y, t.m, t.d, L), t, next, prev };
}

/* ====== Rappels : planning envoyé au code natif ====== */
function buildSchedule() {
  if (!S.remind) return [];
  const L = loc(), now = Date.now(), t0 = todayParts(L), out = [];
  for (let n = 0; n < 30; n++) {
    const p = shiftDay(t0, n), dt = dayTimes(p.y, p.m, p.d, L);
    FIVE.forEach(k => {
      const mode = S.modes[k]; if (mode === 'off' || isNaN(dt[k].t)) return;
      if (S.pre > 0 && dt[k].t - S.pre * 60000 > now) out.push({ t: dt[k].t - S.pre * 60000, title: PNAME[k] + ' dans ' + S.pre + ' min', text: 'Prière de ' + PNAME[k] + ' à ' + dt[k].str + ' (' + L.name + ')', mode: 'notif' });
      if (dt[k].t > now) out.push({ t: dt[k].t, title: 'Il est l’heure de la prière de ' + PNAME[k], text: PNAME[k] + ' · ' + dt[k].str + ' · ' + L.name, mode });
    });
  }
  return out;
}
function syncNative() {
  if (!NATIVE) return;
  try {
    AndroidApp.setSettings(S.vol, !!S.vibrate);
    AndroidApp.setSchedule(JSON.stringify(buildSchedule()));
  } catch (e) { /* ignoré */ }
}
function notifOk() { try { return NATIVE ? AndroidApp.hasNotifPermission() : false; } catch (e) { return false; } }

/* ====== Position GPS ====== */
function locate(cb) {
  if (!navigator.geolocation) { if (cb) cb(false); return; }
  navigator.geolocation.getCurrentPosition(p => {
    S.lastPos = { lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4) };
    save(); syncNative(); if (cb) cb(true);
  }, () => { if (cb) cb(false); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
}

/* ====== Icônes selon le moment de la journée ====== */
const PICON = (() => {
  const rays = (cx, cy, r1, r2, angles, color) => angles.map(a => { const t = a * Math.PI / 180; return `<path d="M${(cx + r1 * Math.cos(t)).toFixed(2)} ${(cy - r1 * Math.sin(t)).toFixed(2)}L${(cx + r2 * Math.cos(t)).toFixed(2)} ${(cy - r2 * Math.sin(t)).toFixed(2)}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`; }).join('');
  const HZ = '<path d="M3 24.5h26" stroke="#22B8CF" stroke-width="2.4" stroke-linecap="round"/><path d="M9 29h14" stroke="#22B8CF" stroke-width="2.4" stroke-linecap="round"/>';
  const Y = '#F5C518', O = '#F9A825', R = '#F2762E', ALL = [0, 45, 90, 135, 180, 225, 270, 315];
  const wrap = x => `<svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">${x}</svg>`;
  return {
    fajr: wrap('<path d="M21 8.6A5.6 5.6 0 1 1 14.4 2a4.4 4.4 0 0 0 6.6 6.6z" style="fill:var(--moon)"/><path d="M11 21a5 5 0 0 1 10 0z" fill="' + Y + '"/>' + rays(16, 21, 7, 9.6, [30, 60, 90, 120, 150], Y) + HZ),
    sunrise: wrap('<path d="M9 21.5a7 7 0 0 1 14 0z" fill="' + Y + '"/>' + rays(16, 21.5, 10, 13, [20, 50, 90, 130, 160], Y) + HZ),
    dhuhr: wrap('<circle cx="16" cy="13" r="5.6" fill="' + Y + '"/>' + rays(16, 13, 8.6, 11.6, ALL, Y) + HZ),
    asr: wrap('<circle cx="16" cy="14.5" r="5.6" fill="' + O + '"/>' + rays(16, 14.5, 8.6, 11.6, ALL, O) + HZ),
    maghrib: wrap('<path d="M9.5 21.5a6.5 6.5 0 0 1 13 0z" fill="' + R + '"/>' + rays(16, 21.5, 9.5, 12.2, [25, 60, 120, 155], R) + HZ),
    isha: wrap('<path d="M23 12.5A8.4 8.4 0 1 1 13.4 3a6.6 6.6 0 0 0 9.6 9.5z" style="fill:var(--moon)"/><path d="M24.5 6l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z" style="fill:var(--moon)"/><path d="M26 19l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6z" style="fill:var(--moon)"/>')
  };
})();
const BADGE = '<span class="bdg"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>';
const timeIcon = (k, past) => `<span class="st${past ? ' done' : ''}"><span class="ico">${PICON[k]}</span>${past ? BADGE : ''}</span>`;
