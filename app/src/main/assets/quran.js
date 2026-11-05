'use strict';
/* ====== Coran : liste, lecture, traduction, récitation ====== */
const RECITERS = [
  ['Alafasy_128kbps', 'Mishary Alafasy'], ['Abdurrahmaan_As-Sudais_192kbps', 'Abdurrahmaan As-Sudais'],
  ['Abdul_Basit_Murattal_192kbps', 'Abdul Basit (murattal)'], ['Husary_128kbps', 'Mahmoud Khalil Al-Husary'],
  ['Minshawy_Murattal_128kbps', 'Al-Minshawi (murattal)'], ['Saood_ash-Shuraym_128kbps', 'Saud Ash-Shuraym'],
  ['MaherAlMuaiqly128kbps', 'Maher Al-Muaiqly'], ['Abu_Bakr_Ash-Shaatree_128kbps', 'Abu Bakr Ash-Shatri']
];
const SIZES = [24, 28, 34, 40];
let QD = null;
// Traduction affichée : celle de la langue choisie quand elle existe, français pour l'arabe.
const TL = LANG === 'ar' ? null : LANG;   // en arabe : pas de traduction (le Coran est déjà en arabe)
const TL_RTL = TL === 'ur';
/* Crédits de chaque traduction (QuranEnc.com : texte et notes affichés sans modification). */
const TRANS_INFO = {
  fr: { name: 'Dr Nabil Rudwan, Noor International Center', ver: '1.0.0' },
  en: { name: 'Noor International Center', ver: '1.1.2' },
  es: { name: 'Noor International Center (Latin American Spanish)', ver: '1.0.1' },
  de: { name: 'Frank Bubenheim', ver: '1.1.4' },
  tr: { name: 'Dr. Ali Ozek and others', ver: '1.0.0' },
  id: { name: 'Ministry of Religious Affairs', ver: '1.0.1' },
  ur: { name: 'Muhammad Junagarhi', ver: '1.1.3' }
}[TL] || { name: '', ver: '' };
const TL_NUMBERED = TL === 'fr' || TL === 'en' || TL === 'es';   // ces fichiers commencent par le numéro du verset
function loadQuran() {
  if (!QD) {
    QD = Promise.all([
      fetch('data/chapters.json').then(r => r.json()),
      fetch('data/quran-ar.json').then(r => r.json()),
      (TL ? fetch('data/quran-' + TL + '.json').then(r => r.json()) : Promise.resolve({}))
    ]).then(([c, a, f]) => ({ ch: c.chapters, juz: c.indexes.juzs, ar: a, fr: f }))
      .catch(e => { QD = null; throw e; });
  }
  return QD;
}
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').replace(/([aeiou])\1/g, '$1');
const chType = c => c.type === 'meccan' ? tr('Mecquoise') : tr('Médinoise');
const chSub = c => `${chType(c)} · ${tr(c.total_verses > 1 ? '{0} versets' : '{0} verset', c.total_verses)}`;
let QS = { tab: 'sourates', q: '' };

V.coran = () => {
  const html = `
  <header class="top"><div><h1>${tr('Coran')}</h1><div class="sub">${tr(TL ? '114 sourates · texte arabe et traduction' : '114 sourates · texte arabe')}</div></div></header>
  <div class="stack">
    <div id="resume"></div>
    <label class="search">${I.search}<input id="qsearch" type="search" placeholder="${tr('Rechercher une sourate')}" value="${esc(QS.q)}" aria-label="${tr('Rechercher une sourate')}" autocomplete="off"></label>
    <div class="tabs" role="tablist">${[['sourates', tr('Sourates')], ['juz', tr('Juz’')], ['fav', tr('Marque-pages')]].map(t => `<button role="tab" data-act="qtab" data-v="${t[0]}" class="${QS.tab === t[0] ? 'on' : ''}" aria-selected="${QS.tab === t[0]}">${t[1]}</button>`).join('')}</div>
    <div class="card" id="qbody"><div class="empty">${tr('Chargement…')}</div></div>
  </div>`;
  return {
    html, mount() {
      loadQuran().then(() => fillList()).catch(() => { $('#qbody').innerHTML = '<div class="empty">' + tr('Impossible de charger le texte du Coran.') + '</div>'; });
      $('#qsearch').addEventListener('input', e => { QS.q = e.target.value; fillList(); });
    }
  };
};
ACT.qtab = el => { QS.tab = el.dataset.v; $$('.tabs button').forEach(b => { const on = b.dataset.v === QS.tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); fillList(); };
ACT.open = el => { location.hash = '#/coran/' + el.dataset.s + (el.dataset.v ? '/' + el.dataset.v : ''); };

function fillList() {
  const body = $('#qbody'); if (!body) return;
  loadQuran().then(D => {
    const res = $('#resume');
    if (res) {
      if (S.last && D.ch[S.last.s - 1]) {
        const c = D.ch[S.last.s - 1];
        res.innerHTML = `<button class="resume" style="width:100%;border:0;text-align:start" data-act="open" data-s="${S.last.s}" data-v="${S.last.v}"><div class="t"><small>${tr('Reprendre la lecture')}</small><b>${tr('{0} · verset {1}', esc(c.transliteration), S.last.v)}</b></div><span class="flipn">${I.back}</span></button>`;
      } else res.innerHTML = '';
    }
    const q = norm(QS.q);
    let html = '';
    if (QS.tab === 'sourates') {
      D.ch.forEach(c => {
        if (q && !(norm(c.transliteration).includes(q) || norm(c.translation).includes(q) || String(c.id) === q || c.name.includes(QS.q.trim()))) return;
        html += `<button class="srow" data-act="open" data-s="${c.id}"><span class="num mono">${c.id}</span><span class="nm"><b>${esc(c.transliteration)}</b><span>${chSub(c)}</span></span><span class="a ar" lang="ar" dir="rtl">${c.name}</span></button>`;
      });
    } else if (QS.tab === 'juz') {
      D.juz.forEach(j => {
        const c = D.ch[j.sura - 1];
        if (q && !(String(j.index) === q || norm(c.transliteration).includes(q))) return;
        html += `<button class="srow" data-act="open" data-s="${j.sura}" data-v="${j.aya}"><span class="num mono">${j.index}</span><span class="nm"><b>${tr('Juz’ {0}', j.index)}</b><span>${tr('{0}, verset {1}', esc(c.transliteration), j.aya)}</span></span><span class="a ar" lang="ar" dir="rtl">${c.name}</span></button>`;
      });
    } else {
      let g1 = '', g2 = '';
      S.fav.slice().sort((a, b) => a - b).forEach(n => {
        const c = D.ch[n - 1]; if (!c) return;
        if (q && !norm(c.transliteration).includes(q)) return;
        g1 += `<button class="srow" data-act="open" data-s="${c.id}"><span class="num">${I.bookmarkOn}</span><span class="nm"><b>${esc(c.transliteration)}</b><span>${chSub(c)}</span></span><span class="a ar" lang="ar" dir="rtl">${c.name}</span></button>`;
      });
      S.marks.slice().sort((a, b) => { const x = a.split(':').map(Number), y = b.split(':').map(Number); return x[0] - y[0] || x[1] - y[1]; }).forEach(k => {
        const [s, v] = k.split(':').map(Number), c = D.ch[s - 1]; if (!c) return;
        if (q && !norm(c.transliteration).includes(q)) return;
        g2 += `<button class="srow" data-act="open" data-s="${s}" data-v="${v}"><span class="num">${I.bookmarkOn}</span><span class="nm"><b>${tr('{0} · verset {1}', esc(c.transliteration), v)}</b><span>${tr('Marque-page')}</span></span><span class="a ar" lang="ar" dir="rtl">${c.name}</span></button>`;
      });
      html = (g1 ? '<div class="grp">' + tr('Sourates') + '</div>' + g1 : '') + (g2 ? '<div class="grp">' + tr('Versets') + '</div>' + g2 : '');
    }
    body.innerHTML = html || `<div class="empty">${QS.tab === 'fav' ? tr('Aucun marque-page. Touchez le marque-page en haut d’une sourate, ou celui d’un verset.') : tr('Aucun résultat.')}</div>`;
  });
}

/* ---- Lecture ---- */
let R = { s: 0, scrollT: 0 };
V.lire = (s, v) => {
  s = Math.min(114, Math.max(1, +s || 1));
  R.s = s;
  const html = `<div id="reader"><div class="empty">${tr('Chargement de la sourate…')}</div></div>`;
  return {
    html, reader: true, mount() {
      loadQuran().then(D => buildReader(D, s, v ? +v : 0)).catch(() => { $('#reader').innerHTML = '<div class="empty">' + tr('Impossible de charger le texte du Coran.') + '</div>'; });
    }, unmount() { clearTimeout(R.scrollT); }
  };
};
function verseHtml(D, s, i) {
  const a = D.ar[s][i], f = D.fr[s] && D.fr[s][i], n = a.verse;
  const key = s + ':' + n, on = S.marks.includes(key);
  let trn = '';
  if (S.trans && f) {
    trn = `<div class="vfr" lang="${TL}" dir="${TL_RTL ? 'rtl' : 'ltr'}">${esc(TL_NUMBERED ? f.text.replace(/^\(?\d+[.)]\s*/, '') : f.text)}</div>`;
    if (f.footnotes) trn += `<button type="button" class="vnote" lang="${TL}" dir="${TL_RTL ? 'rtl' : 'ltr'}" id="n${n}" data-act="note" data-v="${n}" aria-label="${tr('Refermer la note')}" hidden>${esc(f.footnotes)}<span class="close">${I.up} ${tr('Refermer')}</span></button>`;
  }
  return `<article class="verse${PL.s === s && PL.v === n ? ' cur' : ''}" id="v${n}" data-v="${n}">
    <div class="vtop"><span class="vnum ar" aria-label="${tr('Verset {0}', n)}">${arNum(n)}</span><div class="vtext ar" lang="ar" dir="rtl" style="font-size:${S.size}px">${esc(a.text)}</div></div>
    ${trn}
    <div class="vact"><button data-act="playV" data-v="${n}" aria-label="${tr('Écouter le verset {0}', n)}">${I.play}</button><button data-act="mark" data-v="${n}" class="${on ? 'on' : ''}" aria-pressed="${on}" aria-label="${tr('Marque-page, verset {0}', n)}">${on ? I.bookmarkOn : I.bookmark}</button>${S.trans && f && f.footnotes ? `<button class="nb" data-act="note" data-v="${n}" aria-expanded="false" aria-label="${tr('Notes du verset {0}', n)}">${I.note} ${tr('Notes')}</button>` : ''}</div>
  </article>`;
}
function buildReader(D, s, startV) {
  const c = D.ch[s - 1], fav = S.fav.includes(s);
  const verses = D.ar[s].map((_, i) => verseHtml(D, s, i)).join('');
  $('#reader').innerHTML = `
  <div class="rhead">
    <a class="icon-btn flip" href="javascript:history.back()" aria-label="${tr('Retour à la liste des sourates')}" style="margin-inline-start:-8px">${I.back}</a>
    <div class="t"><h1>${esc(c.transliteration)}</h1><div class="sub">${tr('Sourate {0}', c.id)} · ${chSub(c)}</div></div>
    <button class="icon-btn${fav ? '' : ''}" data-act="fav" aria-pressed="${fav}" aria-label="${fav ? tr('Retirer la sourate des marque-pages') : tr('Ajouter la sourate aux marque-pages')}" style="color:${fav ? 'var(--brass-text)' : 'inherit'}">${fav ? I.bookmarkOn : I.bookmark}</button>
    <span class="ar" lang="ar" dir="rtl" style="font-size:32px;line-height:1;font-weight:700;color:var(--accent)">${c.name}</span>
  </div>
  <div class="ctrls">
    <button class="pill-btn" data-act="size"><span class="ar" aria-hidden="true" style="font-size:18px;font-weight:700">أ</span>${tr('Taille du texte')}</button>
    ${TL ? `<button class="pill-btn" data-act="trans" aria-pressed="${S.trans}"><span class="sw${S.trans ? ' on' : ''}"></span>${tr('Traduction')}</button>` : ''}
  </div>
  <select class="sel" data-chg="readReciter" aria-label="${tr('Récitateur')}">${RECITERS.map(r => `<option value="${r[0]}"${r[0] === S.reciter ? ' selected' : ''}>${tr('Récitation : {0}', esc(r[1]))}</option>`).join('')}</select>
  <section class="card verses" aria-label="${tr('Texte de la sourate')}">${verses}</section>
  <div class="sub" style="margin-top:12px;font-size:12px">${TL ? tr('Texte arabe : Tanzil.net (licence CC BY 3.0). Traduction : {0}, via QuranEnc.com. ', TRANS_INFO.name) : tr('Texte arabe : Tanzil.net (licence CC BY 3.0). ')}<a href="#/apropos" style="text-decoration:underline">${tr('Détails')}</a></div>`;
  if (!S.last || S.last.s !== s || startV) S.last = { s, v: startV || 1 };
  save();
  const view = $('#view');
  if (startV && $('#v' + startV)) { $('#v' + startV).scrollIntoView({ block: 'start' }); view.scrollTop -= 8; }
  else if (S.last && S.last.s === s && S.last.v > 1 && $('#v' + S.last.v)) $('#v' + S.last.v).scrollIntoView({ block: 'start' });
  view.onscroll = () => { clearTimeout(R.scrollT); R.scrollT = setTimeout(trackScroll, 500); };
  renderPlayer();
}
function firstVisible() {
  const top = $('#view').getBoundingClientRect().top + 40;
  const vs = $$('.verse');
  for (const e of vs) { if (e.getBoundingClientRect().bottom > top) return +e.dataset.v; }
  return 1;
}
function trackScroll() {
  if (!R.s || !$('.verse')) return;
  S.last = { s: R.s, v: firstVisible() }; save();
}
function reRenderReader() {
  const view = $('#view'), y = view.scrollTop;
  loadQuran().then(D => { if (!$('#reader') || !R.s) return; const sec = $('.verses'); sec.innerHTML = D.ar[R.s].map((_, i) => verseHtml(D, R.s, i)).join(''); view.scrollTop = y; });
}
ACT.fav = el => {
  const i = S.fav.indexOf(R.s); if (i >= 0) S.fav.splice(i, 1); else S.fav.push(R.s); save();
  const on = i < 0; el.setAttribute('aria-pressed', on); el.style.color = on ? 'var(--brass-text)' : 'inherit'; el.innerHTML = on ? I.bookmarkOn : I.bookmark;
  toast(on ? tr('Sourate ajoutée aux marque-pages.') : tr('Sourate retirée des marque-pages.'));
};
ACT.size = () => { S.size = SIZES[(SIZES.indexOf(S.size) + 1) % SIZES.length] || 28; save(); $$('.vtext').forEach(e => { e.style.fontSize = S.size + 'px'; }); };
ACT.trans = el => { S.trans = !S.trans; save(); el.setAttribute('aria-pressed', S.trans); $('.sw', el).classList.toggle('on', S.trans); reRenderReader(); };
ACT.mark = el => {
  const key = R.s + ':' + el.dataset.v, i = S.marks.indexOf(key);
  if (i >= 0) S.marks.splice(i, 1); else S.marks.push(key); save();
  const on = i < 0; el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); el.innerHTML = on ? I.bookmarkOn : I.bookmark;
  toast(on ? tr('Marque-page ajouté.') : tr('Marque-page retiré.'));
};
ACT.note = el => {
  const v = el.dataset.v, n = $('#n' + v); if (!n) return;
  n.hidden = !n.hidden;
  const b = $('.vact .nb[data-v="' + v + '"]');
  if (b) { b.classList.toggle('open', !n.hidden); b.setAttribute('aria-expanded', String(!n.hidden)); }
};
CHG.readReciter = el => { S.reciter = el.value; save(); if (PL.s && PL.playing) playVerse(PL.s, PL.v, !PL.basm); };

/* ---- Lecteur audio (EveryAyah) ---- */
const AUD = new Audio();
AUD.preload = 'auto';
let PL = { s: 0, v: 0, playing: false, basm: false };
const audioSrc = (s, v) => `https://everyayah.com/data/${S.reciter}/${String(s).padStart(3, '0')}${String(v).padStart(3, '0')}.mp3`;
let CHAPTERS = null; loadQuran().then(D => { CHAPTERS = D.ch; renderPlayer(); }).catch(() => { });
const totalOf = s => CHAPTERS ? CHAPTERS[s - 1].total_verses : 0;

function playVerse(s, v, withBasmala) {
  PL.s = s; PL.v = v; PL.basm = withBasmala !== false && v === 1 && s !== 1 && s !== 9; PL.playing = true;
  AUD.src = PL.basm ? audioSrc(1, 1) : audioSrc(s, v);
  AUD.play().catch(() => { });
  S.last = { s, v }; save();
  markCurrent(); renderPlayer();
}
AUD.onended = () => {
  if (PL.basm) { PL.basm = false; AUD.src = audioSrc(PL.s, PL.v); AUD.play().catch(() => { }); return; }
  if (PL.v < totalOf(PL.s)) playVerse(PL.s, PL.v + 1, false);
  else { PL.playing = false; markCurrent(); renderPlayer(); toast(tr('Fin de la sourate.')); }
};
AUD.onerror = () => { if (!PL.s) return; PL.playing = false; renderPlayer(); toast(tr('Récitation indisponible : vérifiez la connexion Internet.')); };
function markCurrent() {
  $$('.verse.cur').forEach(e => e.classList.remove('cur'));
  if (R.s === PL.s && PL.s) {
    const e = $('#v' + PL.v);
    if (e) {
      e.classList.add('cur');
      const vr = $('#view').getBoundingClientRect(), er = e.getBoundingClientRect();
      if (er.top < vr.top + 10 || er.bottom > vr.bottom - 10) e.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
}
function renderPlayer() {
  const box = $('#player'); if (!box) return;
  const inReader = !!$('#reader') && R.s;
  const active = PL.s > 0;
  if (!inReader && !active) { box.classList.remove('show'); box.innerHTML = ''; return; }
  const s = active ? PL.s : R.s, v = active ? PL.v : 0, tot = totalOf(s);
  const ch = CHAPTERS ? CHAPTERS[s - 1] : null;
  box.classList.add('show');
  box.innerHTML = `
    <button class="pp" data-act="pp" aria-label="${PL.playing ? tr('Mettre en pause la récitation') : tr('Lancer la récitation')}">${PL.playing ? I.pause : I.play}</button>
    <button class="mid" data-act="openPl"><span class="l1">${tr('Récitation')}${ch ? ' · ' + esc(ch.transliteration) : ''}</span><span class="l2 mono">${active ? tr('Verset {0} sur {1}', v, tot) : tr('Touchez ▶ pour écouter')}</span><span class="pbar"><i style="width:${active && tot ? v / tot * 100 : 0}%"></i></span></button>
    <button class="ib" data-act="plPrev" aria-label="${tr('Verset précédent')}">${I.prev}</button>
    <button class="ib" data-act="plNext" aria-label="${tr('Verset suivant')}">${I.next}</button>
    ${active ? `<button class="ib" data-act="plStop" aria-label="${tr('Arrêter la récitation')}">${I.close}</button>` : ''}`;
}
ACT.pp = () => {
  if (!PL.s) { playVerse(R.s, firstVisible()); return; }
  if (PL.playing) { AUD.pause(); PL.playing = false; } else { AUD.play().catch(() => { }); PL.playing = true; }
  renderPlayer();
};
ACT.playV = el => playVerse(R.s, +el.dataset.v);
ACT.plNext = () => { const s = PL.s || R.s, v = PL.s ? PL.v : firstVisible(); if (v < totalOf(s)) playVerse(s, v + 1, false); };
ACT.plPrev = () => { const s = PL.s || R.s, v = PL.s ? PL.v : firstVisible(); if (v > 1) playVerse(s, v - 1, false); else playVerse(s, 1); };
ACT.plStop = () => { AUD.pause(); AUD.removeAttribute('src'); AUD.load(); PL = { s: 0, v: 0, playing: false, basm: false }; markCurrent(); renderPlayer(); };
ACT.openPl = () => { if (PL.s && !(R.s === PL.s && $('#reader'))) location.hash = '#/coran/' + PL.s + '/' + PL.v; };
