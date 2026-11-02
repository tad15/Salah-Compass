'use strict';
/* ====== Vues : Prières, Réglages, Calendrier ====== */
const V = {};          // vues
const ACT = {};        // actions (clic)
const CHG = {};        // changements (select, range)

const MODE_LABEL = { adhan: 'Adhan', notif: 'Notification', off: 'Désactivée' };
const MODE_ICON = { adhan: I.speaker, notif: I.bell, off: I.bellOff };
const MODE_NEXT = { adhan: 'notif', notif: 'off', off: 'adhan' };

function cdText(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return 'dans ' + h + ' h ' + pad(m) + ' min';
  if (m > 0) return 'dans ' + m + ' min ' + pad(sec) + ' s';
  return 'dans ' + sec + ' s';
}

function permBanner() {
  if (!NATIVE) return '<div class="banner">Les rappels et l’adhan fonctionnent uniquement dans l’application Android installée.</div>';
  if (!S.remind) return '<div class="banner">Les rappels sont désactivés.<button class="pill-btn" data-act="go" data-to="#/reglages">Ouvrir les réglages</button></div>';
  if (!notifOk()) return '<div class="banner">Les notifications sont bloquées : sans elles, aucun rappel ni adhan ne sera joué.<button class="pill-btn" data-act="askNotif">Autoriser les notifications</button><span class="sub">Si rien ne s’affiche, autorisez-les dans Réglages Android › Applications › Boussole Qibla › Notifications.</span></div>';
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
      rows += `<div class="prow info">${timeIcon(k, past)}<div class="nm"><b>${PNAME[k]}</b><span>Fin de la prière de Fajr</span></div><span class="tm mono">${tm.str}</span><span style="width:44px"></span></div>`;
    } else {
      const mode = S.remind ? S.modes[k] : 'off';
      const st = timeIcon(k, past && !isNext);
      const sub = S.remind ? MODE_LABEL[S.modes[k]] : 'Rappels désactivés';
      rows += `<div class="prow${isNext ? ' next' : ''}">${st}<div class="nm"><b>${PNAME[k]}${k === 'dhuhr' && dw === 5 ? ' · Joumou‘a' : ''}</b><span>${sub}</span></div><span class="tm mono">${tm.str}</span><button class="bt${mode === 'off' ? ' off' : ''}" data-act="cycle" data-k="${k}" aria-label="${PNAME[k]} : ${MODE_LABEL[S.modes[k]]}. Changer">${MODE_ICON[mode]}</button></div>`;
    }
  });
  const html = `
  <header class="top">
    <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
      <h1>Prières</h1>
      <span class="chip" style="align-self:flex-start">${I.pin}${esc(L.name)}</span>
    </div>
    <a class="icon-btn" href="#/reglages" aria-label="Réglages">${I.gear}</a>
  </header>
  <div class="stack">
    <div><div style="font-size:17px;font-weight:600">${cap(DAYS[dw])} ${t.d} ${MONTHS[t.m - 1]} ${t.y}</div><div class="sub">${esc(hijriStr(t.y, t.m, t.d))}</div></div>
    ${permBanner()}
    <section class="hero" aria-label="Prochaine prière" data-nt="${nx.t}">
      <div class="lbl">Prochaine prière</div>
      <div class="row"><div class="name">${PNAME[nx.k]}</div><div class="nar ar" lang="ar" dir="rtl">${PAR[nx.k]}</div></div>
      <div class="time mono">${nx.str}${nx.day > 0 ? ' <span style="font-size:15px;color:var(--hero-text)">demain</span>' : ''}</div>
      <div class="cd" id="cd" role="timer">${cdText(nx.t - now)}</div>
      <div class="bar"><i id="pg" style="width:${prog}%"></i></div>
    </section>
    <section class="card plist" aria-label="Horaires du jour">${rows}</section>
    <div class="sub" style="text-align:center">Méthode : ${esc((METHODS[S.method] || METHODS.UOIF).n)}</div>
  </div>`;
  return { html, mount() { }, tick() { tickPrayers(); } };
};
function tickPrayers() {
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
ACT.askNotif = () => { askNotif(); toast('Autorisez les notifications dans la fenêtre Android.'); };

/* ====== Réglages ====== */
let previewAudio = null;
function stopPreview() { if (previewAudio) { previewAudio.pause(); previewAudio = null; } }
let ADHAN_SHOWN = 'false';
function adhanOn() { let v = false; try { v = NATIVE && AndroidApp.isAdhanPlaying(); } catch (e) { v = false; } ADHAN_SHOWN = String(v); return v; }
const seg = (opts, cur, act, extra) => `<div class="seg" role="group">${opts.map(o => `<button data-act="${act}" ${extra || ''} data-v="${o[0]}" class="${String(cur) === String(o[0]) ? 'on' : ''}" aria-pressed="${String(cur) === String(o[0])}">${o[1]}</button>`).join('')}</div>`;
const sw = (on, act, label, extra) => `<button class="switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-act="${act}" ${extra || ''}></button>`;

V.reglages = () => {
  const L = loc();
  const posRows = S.auto
    ? `<div class="srow2"><div class="l"><b>Position automatique</b><span>${S.lastPos ? esc(L.name) + ' · ' + S.lastPos.lat + ', ' + S.lastPos.lng : 'Position non obtenue (autorisez la localisation)'}</span></div>${sw(true, 'tAuto', 'Position automatique')}</div>
       <div class="srow2"><div class="l"><b>Actualiser la position</b></div><button class="pill-btn" data-act="locate">Localiser</button></div>`
    : `<div class="srow2"><div class="l"><b>Position automatique</b><span>Désactivée</span></div>${sw(false, 'tAuto', 'Position automatique')}</div>
       <div class="srow2"><div class="l"><b>Ville</b></div><select data-chg="city" aria-label="Ville">${CITIES.map((c, i) => `<option value="${i}"${i === S.cityIdx ? ' selected' : ''}>${esc(c[0])}</option>`).join('')}</select></div>`;
  const html = `
  <header class="top">
    <div style="display:flex;align-items:center;gap:4px;margin-left:-8px"><a class="icon-btn" href="javascript:history.back()" aria-label="Retour">${I.back}</a><h1>Réglages</h1></div>
  </header>
  <div class="stack">
    <div class="sec"><h2>Position</h2><div class="card set">${posRows}</div></div>
    <div class="sec"><h2>Calcul des horaires</h2><div class="card set">
      <div class="srow2"><div class="l"><b>Méthode</b></div><select data-chg="method" aria-label="Méthode de calcul">${Object.keys(METHODS).map(k => `<option value="${k}"${k === S.method ? ' selected' : ''}>${esc(METHODS[k].n)}</option>`).join('')}</select></div>
      <div class="srow2"><div class="l"><b>Asr</b><span>Ombre = 1 ou 2 fois l’objet</span></div>${seg([[1, 'Standard'], [2, 'Hanafite']], S.asr, 'setAsr')}</div>
      <div class="srow2"><div class="l"><b>Date hégirienne</b><span>Ajustement selon l’observation locale</span></div>${seg([[-1, '−1'], [0, '0'], [1, '+1']], S.hijriAdj, 'setHij')}</div>
    </div></div>
    <div class="sec"><h2>Rappels</h2><div class="card set">
      <div class="srow2"><div class="l"><b>Rappels de prière</b><span>Interrupteur général</span></div>${sw(S.remind, 'tRemind', 'Rappels de prière')}</div>
      ${FIVE.map(k => `<div class="srow2"><div class="l"><b>${PNAME[k]}</b></div>${seg([['off', 'Aucun'], ['notif', 'Notif.'], ['adhan', 'Adhan']], S.modes[k], 'setMode', 'data-k="' + k + '"')}</div>`).join('')}
      <div class="srow2"><div class="l"><b>Prévenir avant</b><span>Notification discrète avant la prière</span></div>${seg([[0, 'Non'], [5, '5'], [10, '10'], [15, '15'], [30, '30']], S.pre, 'setPre')}</div>
      ${NATIVE ? `<div class="srow2"><div class="l"><b>Notifications Android</b><span>${notifOk() ? 'Autorisées · touchez pour gérer dans Android' : 'Bloquées · touchez pour autoriser dans Android'}</span></div>${sw(notifOk(), 'notifSettings', 'Notifications Android')}</div>` : ''}
    </div></div>
    <div class="sec"><h2>Adhan</h2><div class="card set">
      <div class="srow2"><div class="l"><b>Écouter l’adhan</b></div><button class="pill-btn" data-act="preview" id="pv">${previewAudio ? 'Arrêter' : 'Écouter'}</button></div>
      <div class="srow2"><div class="l"><b>Volume</b></div><input type="range" min="0.1" max="1" step="0.05" value="${S.vol}" data-chg="vol" aria-label="Volume de l’adhan"></div>
      <div class="srow2"><div class="l"><b>Vibration</b><span>Au début de l’adhan</span></div>${sw(S.vibrate, 'tVib', 'Vibration')}</div>
      ${NATIVE ? `<div class="srow2"><div class="l"><b>Tester maintenant</b><span id="testsub" class="${adhanOn() ? 'live' : ''}">${adhanOn() ? 'Adhan en cours…' : 'Vérifie que le téléphone sonne bien'}</span></div><div style="display:flex;gap:6px"><button class="pill-btn" data-act="testN">Notif.</button><button class="pill-btn${adhanOn() ? ' act' : ''}" id="testa" data-act="testA">${adhanOn() ? 'Arrêter' : 'Adhan'}</button></div></div>` : ''}
    </div></div>
    <div class="sec"><h2>Coran</h2><div class="card set">
      <div class="srow2"><div class="l"><b>Récitateur</b></div><select data-chg="reciter" aria-label="Récitateur">${RECITERS.map(r => `<option value="${r[0]}"${r[0] === S.reciter ? ' selected' : ''}>${esc(r[1])}</option>`).join('')}</select></div>
    </div></div>
    <a class="pill-btn" href="#/apropos">À propos, sources et licences</a>
    <div class="sub" style="text-align:center">Version 2.1 · aucune publicité, aucun compte</div>
  </div>`;
  return { html, mount() { }, tick() { if (NATIVE && String(adhanOn()) !== ADHAN_SHOWN) render(true); } };
};
ACT.tAuto = () => { S.auto = !S.auto; save(); if (S.auto) locate(() => { syncNative(); render(true); }); syncNative(); render(true); };
ACT.locate = () => locate(ok => { toast(ok ? 'Position mise à jour.' : 'Position indisponible : autorisez la localisation.'); render(true); });
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
  previewAudio.onended = () => { previewAudio = null; const b = $('#pv'); if (b) b.textContent = 'Écouter'; };
  previewAudio.onerror = () => { previewAudio = null; toast('Lecture impossible.'); const b = $('#pv'); if (b) b.textContent = 'Écouter'; };
  previewAudio.play().catch(() => { previewAudio = null; });
  const b = $('#pv'); if (b) b.textContent = 'Arrêter';
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
  <header class="top"><h1>Calendrier</h1><button class="pill-btn" data-act="calToday">Aujourd’hui</button></header>
  <div class="stack">
    <section class="card cal" aria-label="${cap(MONTHS[m - 1])} ${y}">
      <div class="calhead">
        <button class="icon-btn" data-act="calPrev" aria-label="Mois précédent">${I.back}</button>
        <div class="t"><b>${cap(MONTHS[m - 1])} ${y}</b><span>${esc(hr)}</span></div>
        <button class="icon-btn" data-act="calNext" aria-label="Mois suivant" style="transform:scaleX(-1)">${I.back}</button>
      </div>
      <div class="grid7">${['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map(x => `<div class="dow">${x}</div>`).join('')}</div>
      <div class="grid7">${cells}</div>
      <div class="legend"><i></i>Vendredi, prière de Joumou‘a · petits chiffres : jour hégirien</div>
    </section>
    <section class="card daycard" aria-label="Horaires du jour sélectionné">
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
