'use strict';
/* ====== Vues : Prières, Réglages, Calendrier ====== */
const V = {};          // vues
const ACT = {};        // actions (clic)
const CHG = {};        // changements (select, range)

const MODE_LABEL = { adhan: tr('Adhan'), notif: tr('Notification'), off: tr('Désactivée') };
const MODE_ICON = { adhan: I.speaker, notif: I.bell, off: I.bellOff };
const MODE_NEXT = { adhan: 'notif', notif: 'off', off: 'adhan' };

function cdText(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return tr('dans {0} h {1} min', h, pad(m));
  if (m > 0) return tr('dans {0} min {1} s', m, pad(sec));
  return tr('dans {0} s', sec);
}

function permBanner() {
  if (!NATIVE) return '<div class="banner">' + tr('Les rappels et l’adhan fonctionnent uniquement dans l’application Android installée.') + '</div>';
  if (!S.remind) return '<div class="banner">' + tr('Les rappels sont désactivés.') + '<button class="pill-btn" data-act="go" data-to="#/reglages">' + tr('Ouvrir les réglages') + '</button></div>';
  if (!notifOk()) return '<div class="banner">' + tr('Les notifications sont bloquées : sans elles, aucun rappel ni adhan ne sera joué.') + '<button class="pill-btn" data-act="askNotif">' + tr('Autoriser les notifications') + '</button><span class="sub">' + tr('Si rien ne s’affiche, autorisez-les dans Réglages Android › Applications › Salah Compass › Notifications.') + '</span></div>';
  return '';
}

V.prieres = () => {
  const L = loc(), now = Date.now(), a = around(now, L), t = a.t;
  const dw = dow(t.y, t.m, t.d);
  const nx = a.next;
  const span = a.prev ? nx.t - a.prev.t : 1;
  const prog = a.prev ? Math.min(100, Math.max(0, (now - a.prev.t) / span * 100)) : 0;
  let rows = '';
  ORDER.forEach(k => {
    const tm = a.today[k], past = tm.t <= now;
    const isNext = nx.day === 0 && nx.k === k;
    if (k === 'sunrise') {
      rows += `<div class="prow info">${timeIcon(k, past)}<div class="nm"><b>${PNAME[k]}</b><span>${tr('Fin de la prière de Fajr')}</span></div><span class="tm mono">${tm.str}</span><span style="width:44px"></span></div>`;
    } else {
      const mode = S.remind ? S.modes[k] : 'off';
      const st = timeIcon(k, past && !isNext);
      const sub = S.remind ? MODE_LABEL[S.modes[k]] : tr('Rappels désactivés');
      rows += `<div class="prow${isNext ? ' next' : ''}">${st}<div class="nm"><b>${PNAME[k]}${k === 'dhuhr' && dw === 5 ? ' · ' + tr('Joumou‘a') : ''}</b><span>${sub}</span></div><span class="tm mono">${tm.str}</span><button class="bt${mode === 'off' ? ' off' : ''}" data-act="cycle" data-k="${k}" aria-label="${tr('{0} : {1}. Changer', PNAME[k], MODE_LABEL[S.modes[k]])}">${MODE_ICON[mode]}</button></div>`;
    }
  });
  const html = `
  <div class="scenebox" id="scenebox">${sceneHtml(a, now, L)}<div class="scenebar"><span class="chip glass">${I.pin}${esc(L.name)}</span><a class="icon-btn glass" href="#/reglages" aria-label="${tr('Réglages')}">${I.gear}</a></div></div>
  <div class="stack">
    <div><div style="font-size:17px;font-weight:600">${cap(DAYS[dw])} ${t.d} ${MONTHS[t.m - 1]} ${t.y}</div><div class="sub">${esc(hijriStr(t.y, t.m, t.d))}</div></div>
    ${permBanner()}
    <section class="hero" aria-label="${tr('Prochaine prière')}" data-nt="${nx.t}">
      <div class="lbl">${tr('Prochaine prière')}</div>
      <div class="row"><div class="name">${PNAME[nx.k]}</div>${RTL ? '' : `<div class="nar ar" lang="ar" dir="rtl">${PAR[nx.k]}</div>`}</div>
      <div class="time mono">${nx.str}${nx.day > 0 ? ' <span style="font-size:15px;color:var(--hero-text)">' + tr('demain') + '</span>' : ''}</div>
      <div class="cd" id="cd" role="timer">${cdText(nx.t - now)}</div>
      <div class="bar"><i id="pg" style="width:${prog}%"></i></div>
    </section>
    <section class="card plist" aria-label="${tr('Horaires du jour')}">${rows}</section>
    <div class="sub" style="text-align:center">${tr('Méthode : {0}', esc((METHODS[S.method] || METHODS.UOIF).n))}</div>
  </div>`;
  return { html, mount() { }, tick() { tickPrayers(); } };
};
function sceneHtml(a, now, L) {
  const sr = a.today.sunrise, mg = a.today.maghrib;
  const R = isNaN(sr.h) ? 420 : sr.h * 60, Sx = isNaN(mg.h) ? 1020 : mg.h * 60;
  let t = isNaN(sr.t) ? 720 : R + (now - sr.t) / 60000;
  t = ((t % 1440) + 1440) % 1440;
  return Scene.sceneSvg({ t, R, S: Sx, ms: now, phase: now / 1000, uid: 'sc' });
}
let SCENE_MIN = -1;
function tickPrayers() {
  const box = $('#scenebox');
  const mn = Math.floor(Date.now() / 60000);
  if (box && mn !== SCENE_MIN) {
    SCENE_MIN = mn;
    const L = loc(), now = Date.now(), a = around(now, L), svg = box.querySelector(':scope > svg.scene');
    if (svg) { const tmp = document.createElement('div'); tmp.innerHTML = sceneHtml(a, now, L); svg.replaceWith(tmp.firstChild); }
  }
  const hero = $('.hero'); if (!hero) return;
  const now = Date.now(), a = around(now, loc());
  if (String(a.next.t) !== hero.dataset.nt) { render(true); return; }
  const cd = $('#cd'); if (cd) cd.textContent = cdText(a.next.t - now);
  const pg = $('#pg'); if (pg && a.prev) pg.style.width = Math.min(100, Math.max(0, (now - a.prev.t) / (a.next.t - a.prev.t) * 100)) + '%';
}

ACT.go = el => { location.hash = el.dataset.to; };
ACT.cycle = el => {
  const k = el.dataset.k;
  if (!S.remind) { S.remind = true; }
  S.modes[k] = MODE_NEXT[S.modes[k]]; save(); syncNative(); render(true);
  if (NATIVE && S.modes[k] !== 'off' && !notifOk()) askNotif();
};
function askNotif() { try { AndroidApp.requestNotifPermission(); } catch (e) { /* ignoré */ } }
ACT.askNotif = () => { askNotif(); toast(tr('Autorisez les notifications dans la fenêtre Android.')); };

/* ====== Réglages ====== */
const THEME_LIST = [
  ['auto', 'Automatique', null],
  ['light', 'Clair', ['#EBEFED', '#C9D3CE', '#0E6B57', '#F8FAF9']],
  ['dark', 'Sombre', ['#0D1512', '#27382F', '#14574A', '#15211D']],
  ['midnight', 'Bleu minuit', ['#0B1426', '#24365A', '#1E3A70', '#121E36']],
  ['gray', 'Gris clair', ['#E9EAEC', '#CDD0D5', '#3E5C76', '#F7F7F8']],
  ['black', 'Noir', ['#000000', '#2A2A2A', '#14574A', '#111111']],
  ['cream', 'Blanc cassé', ['#F4EFE6', '#D8CFBF', '#0E6B57', '#FBF8F2']],
  ['violet', 'Violet', ['#14101F', '#3A2F5A', '#4A2F8F', '#1E1830']],
  ['yellow', 'Jaune', ['#FBF3D0', '#E3D59A', '#7A5A00', '#FFFBE8']],
  ['pink', 'Rose', ['#F8ECEF', '#E6CBD3', '#A3365F', '#FFF8FA']],
  ['sky', 'Bleu ciel', ['#E6F0FA', '#C3D6E8', '#1D5FA8', '#F5FAFE']],
  ['ocean', 'Océan', ['#08202A', '#1F4757', '#0E5E6E', '#0F2D3A']]
];
function themeTile(t) {
  const on = (S.theme || 'auto') === t[0], c = t[2];
  const pv = c ? `<span class="pv" style="background:${c[0]};border-color:${c[1]}"><i class="h" style="background:${c[2]}"></i><i style="background:${c[3]};width:75%"></i><i style="background:${c[3]};width:50%"></i></span>`
    : '<span class="pv" style="background:linear-gradient(135deg,#EBEFED 50%,#0D1512 50%);border-color:#8CA197"></span>';
  return `<button class="tile${on ? ' on' : ''}" data-act="setTheme" data-v="${t[0]}" aria-pressed="${on}">${pv}<b>${tr(t[1])}</b>${on ? `<span class="ck">${I.check.replace('width="22" height="22"', 'width="12" height="12"').replace('<circle cx="12" cy="12" r="10"/>', '')}</span>` : ''}</button>`;
}
ACT.setTheme = el => { S.theme = el.dataset.v; save(); applyTheme(); render(true); };
let previewAudio = null;
function stopPreview() { if (previewAudio) { previewAudio.pause(); previewAudio = null; } }
let ADHAN_SHOWN = 'false';
function adhanOn() { let v = false; try { v = NATIVE && AndroidApp.isAdhanPlaying(); } catch (e) { v = false; } ADHAN_SHOWN = String(v); return v; }
const seg = (opts, cur, act, extra) => `<div class="seg" role="group">${opts.map(o => `<button data-act="${act}" ${extra || ''} data-v="${o[0]}" class="${String(cur) === String(o[0]) ? 'on' : ''}" aria-pressed="${String(cur) === String(o[0])}">${o[1]}</button>`).join('')}</div>`;
const sw = (on, act, label, extra) => `<button class="switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-act="${act}" ${extra || ''}></button>`;

V.reglages = () => {
  const L = loc();
  const posRows = S.auto
    ? `<div class="srow2"><div class="l"><b>${tr('Position automatique')}</b><span>${S.lastPos ? esc(L.name) + ' · ' + S.lastPos.lat + ', ' + S.lastPos.lng : tr('Position non obtenue (autorisez la localisation)')}</span></div>${sw(true, 'tAuto', tr('Position automatique'))}</div>
       <div class="srow2"><div class="l"><b>${tr('Actualiser la position')}</b></div><button class="pill-btn" data-act="locate">${tr('Localiser')}</button></div>`
    : `<div class="srow2"><div class="l"><b>${tr('Position automatique')}</b><span>${tr('Désactivée')}</span></div>${sw(false, 'tAuto', tr('Position automatique'))}</div>
       <div class="srow2"><div class="l"><b>${tr('Ville')}</b></div><select data-chg="city" aria-label="${tr('Ville')}">${CITIES.map((c, i) => `<option value="${i}"${i === S.cityIdx ? ' selected' : ''}>${esc(tr(c[0]))}</option>`).join('')}</select></div>`;
  const html = `
  <header class="top">
    <div style="display:flex;align-items:center;gap:4px;margin-inline-start:-8px"><a class="icon-btn flip" href="javascript:history.back()" aria-label="${tr('Retour')}">${I.back}</a><h1>${tr('Réglages')}</h1></div>
  </header>
  <div class="stack">
    <div class="sec"><h2>${tr('Langue')}</h2><div class="card set"><div class="srow2"><div class="l"><b>${tr('Langue')}</b></div><select data-chg="lang" aria-label="${tr('Langue')}">${LANGS.map(l => `<option value="${l[0]}"${l[0] === LANG ? ' selected' : ''}>${l[1]}</option>`).join('')}</select></div></div></div>
    <div class="sec"><h2>${tr('Apparence')}</h2><div class="themes">${THEME_LIST.map(t => themeTile(t)).join('')}</div><div class="sub" style="padding:2px 4px;font-size:13px">${tr('« Automatique » suit le mode clair ou sombre du téléphone.')}</div></div>
    <div class="sec"><h2>${tr('Position')}</h2><div class="card set">${posRows}</div></div>
    <div class="sec"><h2>${tr('Calcul des horaires')}</h2><div class="card set">
      <div class="srow2"><div class="l"><b>${tr('Méthode')}</b></div><select data-chg="method" aria-label="${tr('Méthode de calcul')}">${Object.keys(METHODS).map(k => `<option value="${k}"${k === S.method ? ' selected' : ''}>${esc(METHODS[k].n)}</option>`).join('')}</select></div>
      <div class="srow2"><div class="l"><b>${tr('Asr')}</b><span>${tr('Ombre = 1 ou 2 fois l’objet')}</span></div>${seg([[1, tr('Standard')], [2, tr('Hanafite')]], S.asr, 'setAsr')}</div>
      <div class="srow2"><div class="l"><b>${tr('Date hégirienne')}</b><span>${tr('Ajustement selon l’observation locale')}</span></div>${seg([[-1, '−1'], [0, '0'], [1, '+1']], S.hijriAdj, 'setHij')}</div>
    </div></div>
    <div class="sec"><h2>${tr('Rappels')}</h2><div class="card set">
      <div class="srow2"><div class="l"><b>${tr('Rappels de prière')}</b><span>${tr('Interrupteur général')}</span></div>${sw(S.remind, 'tRemind', tr('Rappels de prière'))}</div>
      ${FIVE.map(k => `<div class="srow2"><div class="l"><b>${PNAME[k]}</b></div>${seg([['off', tr('Aucun')], ['notif', tr('Notif.')], ['adhan', tr('Adhan')]], S.modes[k], 'setMode', 'data-k="' + k + '"')}</div>`).join('')}
      <div class="srow2"><div class="l"><b>${tr('Prévenir avant')}</b><span>${tr('Notification discrète avant la prière')}</span></div>${seg([[0, tr('Non')], [5, '5'], [10, '10'], [15, '15'], [30, '30']], S.pre, 'setPre')}</div>
      ${NATIVE ? `<div class="srow2"><div class="l"><b>${tr('Notifications Android')}</b><span>${notifOk() ? tr('Autorisées · touchez pour gérer dans Android') : tr('Bloquées · touchez pour autoriser dans Android')}</span></div>${sw(notifOk(), 'notifSettings', tr('Notifications Android'))}</div>` : ''}
    </div></div>
    <div class="sec"><h2>${tr('Adhan')}</h2><div class="card set">
      <div class="srow2"><div class="l"><b>${tr('Écouter l’adhan')}</b></div><button class="pill-btn" data-act="preview" id="pv">${previewAudio ? tr('Arrêter') : tr('Écouter')}</button></div>
      <div class="srow2"><div class="l"><b>${tr('Volume')}</b></div><input type="range" min="0.1" max="1" step="0.05" value="${S.vol}" data-chg="vol" aria-label="${tr('Volume de l’adhan')}"></div>
      <div class="srow2"><div class="l"><b>${tr('Vibration')}</b><span>${tr('Au début de l’adhan')}</span></div>${sw(S.vibrate, 'tVib', tr('Vibration'))}</div>
      ${NATIVE ? `<div class="srow2"><div class="l"><b>${tr('Tester maintenant')}</b><span id="testsub" class="${adhanOn() ? 'live' : ''}">${adhanOn() ? tr('Adhan en cours…') : tr('Vérifie que le téléphone sonne bien')}</span></div><div style="display:flex;gap:6px"><button class="pill-btn" data-act="testN">${tr('Notif.')}</button><button class="pill-btn${adhanOn() ? ' act' : ''}" id="testa" data-act="testA">${adhanOn() ? tr('Arrêter') : tr('Adhan')}</button></div></div>` : ''}
    </div></div>
    <div class="sec"><h2>${tr('Coran')}</h2><div class="card set">
      <div class="srow2"><div class="l"><b>${tr('Récitateur')}</b></div><select data-chg="reciter" aria-label="${tr('Récitateur')}">${RECITERS.map(r => `<option value="${r[0]}"${r[0] === S.reciter ? ' selected' : ''}>${esc(r[1])}</option>`).join('')}</select></div>
    </div></div>
    <a class="pill-btn" href="#/apropos">${tr('À propos, sources et licences')}</a>
    <div class="sub" style="text-align:center">${tr('Version {0} · aucune publicité, aucun compte', APP_VERSION)}</div>
  </div>`;
  return { html, mount() { }, tick() { if (NATIVE && String(adhanOn()) !== ADHAN_SHOWN) render(true); } };
};
CHG.lang = el => { S.lang = el.value; save(); location.reload(); };
ACT.tAuto = () => { S.auto = !S.auto; save(); if (S.auto) locate(() => { syncNative(); render(true); }); syncNative(); render(true); };
ACT.locate = () => locate(ok => { toast(ok ? tr('Position mise à jour.') : tr('Position indisponible : autorisez la localisation.')); render(true); });
CHG.city = el => { S.cityIdx = +el.value; save(); syncNative(); render(true); };
CHG.method = el => { S.method = el.value; save(); syncNative(); };
ACT.setAsr = el => { S.asr = +el.dataset.v; save(); syncNative(); render(true); };
ACT.setHij = el => { S.hijriAdj = +el.dataset.v; save(); render(true); };
ACT.tRemind = () => { S.remind = !S.remind; save(); syncNative(); render(true); if (S.remind && NATIVE && !notifOk()) askNotif(); };
ACT.setMode = el => { S.modes[el.dataset.k] = el.dataset.v; save(); syncNative(); render(true); if (NATIVE && el.dataset.v !== 'off' && !notifOk()) askNotif(); };
ACT.setPre = el => { S.pre = +el.dataset.v; save(); syncNative(); render(true); };
ACT.tVib = () => { S.vibrate = !S.vibrate; save(); syncNative(); render(true); if (S.vibrate && navigator.vibrate) navigator.vibrate(150); };
CHG.vol = el => { S.vol = +el.value; save(); syncNative(); if (previewAudio) previewAudio.volume = S.vol; };
CHG.reciter = el => { S.reciter = el.value; save(); };
ACT.preview = () => {
  if (previewAudio) { stopPreview(); render(true); return; }
  previewAudio = new Audio('adhan.mp3'); previewAudio.volume = S.vol;
  previewAudio.onended = () => { previewAudio = null; const b = $('#pv'); if (b) b.textContent = tr('Écouter'); };
  previewAudio.onerror = () => { previewAudio = null; toast(tr('Lecture impossible.')); const b = $('#pv'); if (b) b.textContent = tr('Écouter'); };
  previewAudio.play().catch(() => { previewAudio = null; });
  const b = $('#pv'); if (b) b.textContent = tr('Arrêter');
};
ACT.testN = () => { try { AndroidApp.testNotification(false); } catch (e) { /* ignoré */ } };
ACT.testA = () => {
  try { if (AndroidApp.isAdhanPlaying()) AndroidApp.stopAdhan(); else AndroidApp.testNotification(true); } catch (e) { /* ignoré */ }
  setTimeout(() => render(true), 700);
};
ACT.notifSettings = () => { try { AndroidApp.openNotifSettings(); } catch (e) { /* ignoré */ } };

/* ====== Calendrier ====== */
let CAL = null;
V.calendrier = () => {
  const L = loc(), tp = todayParts(L);
  if (!CAL) CAL = { y: tp.y, m: tp.m, sel: { y: tp.y, m: tp.m, d: tp.d } };
  const { y, m } = CAL;
  const first = dow(y, m, 1), off = (first + 6) % 7;
  const start = Date.UTC(y, m - 1, 1 - off, 12);
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const dt = new Date(start + i * 86400000), cy = dt.getUTCFullYear(), cm = dt.getUTCMonth() + 1, cd = dt.getUTCDate();
    const inM = cm === m, isT = cy === tp.y && cm === tp.m && cd === tp.d;
    const isS = cy === CAL.sel.y && cm === CAL.sel.m && cd === CAL.sel.d;
    const h = hijriOf(cy, cm, cd);
    cells += `<button class="cell${inM ? '' : ' out'}${isT ? ' today' : ''}${isS && !isT ? ' sel' : ''}" data-act="pick" data-y="${cy}" data-m="${cm}" data-d="${cd}" aria-label="${cd} ${MONTHS[cm - 1]} ${cy}, ${esc(h.d + ' ' + h.month)}"><span class="d">${cd}</span><span class="h mono">${h.d}</span>${i % 7 === 4 && inM ? '<span class="fr"></span>' : ''}</button>`;
  }
  const h1 = hijriOf(y, m, 1), h2 = hijriOf(y, m, new Date(Date.UTC(y, m, 0)).getUTCDate());
  const hr = h1.month === h2.month ? `${h1.month} ${h1.y}` : (h1.y === h2.y ? `${h1.month} · ${h2.month} ${h1.y}` : `${h1.month} ${h1.y} · ${h2.month} ${h2.y}`);
  const s = CAL.sel, dt = dayTimes(s.y, s.m, s.d, L), sd = dow(s.y, s.m, s.d);
  const html = `
  <header class="top"><h1>${tr('Calendrier')}</h1><button class="pill-btn" data-act="calToday">${tr('Aujourd’hui')}</button></header>
  <div class="stack">
    <section class="card cal" aria-label="${cap(MONTHS[m - 1])} ${y}">
      <div class="calhead">
        <button class="icon-btn flip" data-act="calPrev" aria-label="${tr('Mois précédent')}">${I.back}</button>
        <div class="t"><b>${cap(MONTHS[m - 1])} ${y}</b><span>${esc(hr)}</span></div>
        <button class="icon-btn flipn" data-act="calNext" aria-label="${tr('Mois suivant')}">${I.back}</button>
      </div>
      <div class="grid7">${DOW_SHORT.map(x => `<div class="dow">${x}</div>`).join('')}</div>
      <div class="grid7">${cells}</div>
      <div class="legend"><i></i>${tr('Vendredi, prière de Joumou‘a · petits chiffres : jour hégirien')}</div>
    </section>
    <section class="card daycard" aria-label="${tr('Horaires du jour sélectionné')}">
      <div class="hd"><b>${cap(DAYS[sd])} ${s.d} ${MONTHS[s.m - 1]}</b><span>${esc(hijriStr(s.y, s.m, s.d))}</span></div>
      <div class="tgrid">${ORDER.map(k => `<div><small>${PNAME[k]}</small><b class="mono">${dt[k].str}</b></div>`).join('')}</div>
      <div class="sub">${esc(L.name)} · ${esc((METHODS[S.method] || METHODS.UOIF).n)}</div>
    </section>
  </div>`;
  return { html, mount() { } };
};
ACT.pick = el => { CAL.sel = { y: +el.dataset.y, m: +el.dataset.m, d: +el.dataset.d }; if (+el.dataset.m !== CAL.m) { CAL.y = +el.dataset.y; CAL.m = +el.dataset.m; } render(true); };
ACT.calPrev = () => { CAL.m--; if (CAL.m < 1) { CAL.m = 12; CAL.y--; } render(true); };
ACT.calNext = () => { CAL.m++; if (CAL.m > 12) { CAL.m = 1; CAL.y++; } render(true); };
ACT.calToday = () => { CAL = null; render(true); };
