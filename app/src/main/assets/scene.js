'use strict';
/* Scène du haut de l'écran Prières : ciel, soleil, lune, nuages et cour de la Kaaba.
   Tout dépend de l'heure locale et des heures de lever / coucher du soleil de la position. */
(function (root) {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const hx = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mix = (c1, c2, t) => { const a = hx(c1), b = hx(c2); return '#' + [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], clamp(t, 0, 1))).toString(16).padStart(2, '0')).join(''); };

  const KEYS = [
    // décalage en minutes (R = lever, S = coucher), haut du ciel, bas du ciel, obscurité, chaleur
    ['R', -120, '#0A1230', '#1B2A52', 1, 0],
    ['R', -50, '#1E2C5E', '#6C5E9A', 0.8, 0.15],
    ['R', -10, '#5B6FB5', '#F4A46A', 0.35, 0.8],
    ['R', 50, '#5AA0E6', '#CFE3F2', 0.05, 0.3],
    ['R', 150, '#3F8EE3', '#BEE3FA', 0, 0],
    ['S', -150, '#3F8EE3', '#BEE3FA', 0, 0],
    ['S', -60, '#4C93DD', '#EADFC4', 0, 0.25],
    ['S', -5, '#5B63B0', '#F7A15B', 0.3, 0.9],
    ['S', 40, '#2A3A78', '#B1608A', 0.7, 0.4],
    ['S', 110, '#0A1230', '#1B2A52', 1, 0]
  ];
  function sky(t, R, S) {
    const k = KEYS.map(a => ({ m: (a[0] === 'R' ? R : S) + a[1], top: a[2], bot: a[3], d: a[4], w: a[5] }));
    if (t <= k[0].m) return k[0];
    if (t >= k[k.length - 1].m) return k[k.length - 1];
    for (let i = 0; i < k.length - 1; i++) {
      if (t >= k[i].m && t <= k[i + 1].m) {
        const f = (t - k[i].m) / (k[i + 1].m - k[i].m);
        return { top: mix(k[i].top, k[i + 1].top, f), bot: mix(k[i].bot, k[i + 1].bot, f), d: lerp(k[i].d, k[i + 1].d, f), w: lerp(k[i].w, k[i + 1].w, f) };
      }
    }
    return k[0];
  }
  function moonPhase(ms) { // 0 = nouvelle lune, 0,5 = pleine lune
    const jd = ms / 86400000 + 2440587.5;
    return (((jd - 2451550.1) / 29.530588853) % 1 + 1) % 1;
  }
  function moonShape(cx, cy, r, p, lit, dark) {
    const k = Math.cos(2 * Math.PI * p), rx = Math.abs(k) * r, sweep = k > 0 ? 0 : 1;
    const flip = p >= 0.5 ? ` transform="translate(${cx} ${cy}) scale(-1 1)"` : ` transform="translate(${cx} ${cy})"`;
    const path = `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx.toFixed(2)} ${r} 0 0 ${sweep} 0 ${-r}z`;
    return `<g${flip}><circle r="${r}" fill="${dark}" opacity=".55"/><path d="${path}" fill="${lit}"/></g>`;
  }

  /* o = { t: minutes depuis minuit (local), R, S: lever / coucher en minutes, ms: instant (pour la phase), uid } */
  function sceneSvg(o) {
    const { t, R, S } = o, uid = o.uid || 'sc', H = 170;
    const sk = sky(t, R, S), d = sk.d, w = sk.w;
    const T = c => mix(mix(c, '#0B1228', d * 0.6), '#F08A4B', w * 0.22 * (1 - d));
    let s = `<svg viewBox="0 0 390 230" width="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Cour de la Kaaba, ${d > 0.6 ? 'de nuit' : d > 0.2 ? 'au crépuscule' : 'de jour'}" class="scene" style="display:block">`;
    s += `<defs><linearGradient id="${uid}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk.top}"/><stop offset="1" stop-color="${sk.bot}"/></linearGradient>`;
    s += `<radialGradient id="${uid}sg"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".85"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>`;
    s += `<radialGradient id="${uid}mg"><stop offset="0" stop-color="#DDE8FF" stop-opacity=".45"/><stop offset="1" stop-color="#DDE8FF" stop-opacity="0"/></radialGradient>`;
    s += `<radialGradient id="${uid}lg"><stop offset="0" stop-color="#FFD27A" stop-opacity=".95"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>`;
    s += `<linearGradient id="${uid}fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T('#EFE2CC')}"/><stop offset="1" stop-color="${T('#CDB693')}"/></linearGradient></defs>`;
    s += `<rect width="390" height="230" fill="url(#${uid}sk)"/>`;

    // étoiles
    if (d > 0.3) {
      const op = clamp((d - 0.3) / 0.6, 0, 1);
      let seed = 7;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < 38; i++) {
        const x = rnd() * 390, y = rnd() * 100, r = 0.5 + rnd() * 1.1;
        s += `<circle class="star" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(op * (0.5 + rnd() * 0.5)).toFixed(2)}" style="animation-delay:-${(rnd() * 4).toFixed(1)}s"/>`;
      }
    }
    // soleil
    if (t >= R - 25 && t <= S + 25) {
      const f = clamp((t - R) / (S - R), -0.05, 1.05), sx = lerp(20, 370, f), sy = H + 2 - 118 * Math.sin(Math.PI * clamp(f, 0, 1));
      const warm = clamp(1 - Math.sin(Math.PI * clamp(f, 0, 1)) * 1.6, 0, 1);
      const col = mix('#FFE680', '#FF9A4A', warm);
      s += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(46 + 22 * warm).toFixed(0)}" fill="url(#${uid}sg)"/><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="13" fill="${col}"/>`;
    }
    // lune
    if (t <= R + 10 || t >= S - 10) {
      const tm = t >= S - 10 ? t : t + 1440, end = R + 1440, f = clamp((tm - S) / (end - S), 0, 1);
      const mx = lerp(40, 350, f), my = H - 10 - 122 * Math.sin(Math.PI * f), vis = clamp((d - 0.15) / 0.5, 0, 1);
      if (vis > 0) s += `<g opacity="${vis.toFixed(2)}"><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="30" fill="url(#${uid}mg)"/>${moonShape(mx.toFixed(1), my.toFixed(1), 11, moonPhase(o.ms || Date.now()), '#F4F0DC', '#8E97B8')}</g>`;
    }
    // nuages (défilement par CSS)
    const cloudCol = mix(mix('#FFFFFF', '#4A5788', d), '#FFC6A0', w * 0.6 * (1 - d));
    const cloudOp = (0.96 - 0.4 * d).toFixed(2);
    const clouds = [[-20, 22, 1.15, 70, 0], [200, 52, 0.8, 95, 28], [80, 84, 0.62, 120, 60], [300, 14, 0.7, 85, 40], [150, 106, 0.5, 140, 90]];
    clouds.forEach(c => {
      s += `<g class="cl" style="animation-duration:${c[3]}s;animation-delay:-${(((o.phase || 0) + c[4]) % c[3]).toFixed(1)}s"><g transform="translate(${c[0]} ${c[1]}) scale(${c[2]})" opacity="${cloudOp}"><g fill="${cloudCol}"><ellipse cx="50" cy="28" rx="44" ry="10"/><circle cx="30" cy="22" r="13"/><circle cx="52" cy="15" r="17"/><circle cx="73" cy="23" r="12"/></g><ellipse cx="50" cy="33" rx="40" ry="5" fill="${mix(cloudCol, '#6F7FA8', 0.35)}" opacity=".45"/></g></g>`;
    });

    // arcades
    const wall = T('#E6D6BA'), arch = T('#B49C78'), roof = T('#C9B28E');
    const arcade = (x0, x1) => {
      const top = 100, mid = 138, bot = H + 8;
      let a = `<rect x="${x0}" y="${top + 4}" width="${x1 - x0}" height="${bot - top - 4}" fill="${wall}"/><rect x="${x0}" y="${top}" width="${x1 - x0}" height="6" fill="${roof}"/><rect x="${x0}" y="${mid + 1}" width="${x1 - x0}" height="3" fill="${roof}"/>`;
      const n = Math.round((x1 - x0) / 24);
      for (let i = 0; i < n; i++) {
        const x = x0 + 3 + i * ((x1 - x0 - 6) / n), ww = (x1 - x0 - 6) / n - 6, r = (ww / 2).toFixed(1);
        a += `<path d="M${x.toFixed(1)} ${mid - 2}v-17a${r} ${r} 0 0 1 ${ww.toFixed(1)} 0v17z" fill="${arch}"/><path d="M${x.toFixed(1)} ${bot}v-24a${r} ${r} 0 0 1 ${ww.toFixed(1)} 0v24z" fill="${arch}"/>`;
      }
      return a;
    };
    s += arcade(0, 390);
    // minarets
    const minaret = (x, top) => {
      const wd = 11, sh = T('#D9C6A2'), sd = T('#BFA77F'), cap = T('#2E6E63');
      let m = `<rect x="${x - wd / 2}" y="${top + 28}" width="${wd}" height="${H + 6 - top - 28}" fill="${sh}"/><rect x="${x}" y="${top + 28}" width="${wd / 2}" height="${H + 6 - top - 28}" fill="${sd}"/>`;
      m += `<rect x="${x - 8}" y="${top + 26}" width="16" height="4" rx="1" fill="${T('#A88F69')}"/><rect x="${x - 3.5}" y="${top + 12}" width="7" height="15" fill="${sh}"/><rect x="${x}" y="${top + 12}" width="3.5" height="15" fill="${sd}"/>`;
      m += `<path d="M${x - 5} ${top + 12}L${x} ${top}L${x + 5} ${top + 12}z" fill="${cap}"/><rect x="${x - 0.5}" y="${top - 7}" width="1" height="8" fill="${T('#D4A93A')}"/>`;
      for (let y = top + 44; y < H - 14; y += 26) m += `<rect x="${x - 1.6}" y="${y}" width="3.2" height="9" rx="1.6" fill="${T('#7C6A4E')}"/>`;
      m += `<rect x="${x - wd / 2}" y="${top + 80}" width="${wd}" height="2" fill="${T('#B79F7D')}"/>`;
      return m;
    };
    s += minaret(34, 22) + minaret(90, 46) + minaret(300, 46) + minaret(356, 22);
    // sol
    s += `<rect y="${H + 6}" width="390" height="${230 - H - 6}" fill="url(#${uid}fl)"/>`;
    for (let x = -300; x <= 700; x += 70) s += `<line x1="195" y1="${H + 6}" x2="${x}" y2="230" stroke="#000" stroke-opacity=".07" stroke-width="1"/>`;
    [184, 195, 209, 226].forEach(y => { s += `<line x1="0" y1="${y}" x2="390" y2="${y}" stroke="#000" stroke-opacity=".06"/>`; });
    // Kaaba
    s += `<ellipse cx="190" cy="210" rx="66" ry="5" fill="#000" opacity="${(0.2 + 0.15 * (1 - d)).toFixed(2)}"/>`;
    const gold = T('#DDAE3E'), gold2 = T('#B98A24'), goldDark = T('#8A6A1C');
    s += `<g transform="translate(126 90) scale(2.05)">
<polygon points="6,56 42,56 42,59 6,59" fill="${T('#D6D1C2')}"/><polygon points="42,56 58,52.8 58,55.8 42,59" fill="${T('#A9A493')}"/>
<polygon points="6,13 42,13 42,56 6,56" fill="${T('#1B1B20')}"/><polygon points="42,13 58,18.5 58,52.8 42,56" fill="${T('#2E2E35')}"/>
<path d="M14 31V55M22 31V55" stroke="${T('#2A2A31')}" stroke-width="1"/>
<polygon points="6,21 42,21 42,30 6,30" fill="${gold}"/><polygon points="42,21 58,25 58,31.6 42,30" fill="${gold2}"/>
<path d="M6 22.4H42M6 28.6H42" stroke="${goldDark}" stroke-width=".7"/><path d="M42 22.4L58 26.3M42 28.6L58 30.2" stroke="${goldDark}" stroke-width=".7"/>
<rect x="10" y="23.6" width="7" height="3.4" rx=".8" fill="${gold2}"/><rect x="20" y="23.6" width="7" height="3.4" rx=".8" fill="${gold2}"/><rect x="30" y="23.6" width="7" height="3.4" rx=".8" fill="${gold2}"/>
<rect x="28.5" y="37" width="10" height="16" rx="1" fill="${gold}"/><rect x="30.3" y="38.8" width="6.4" height="12.4" rx=".6" fill="none" stroke="${goldDark}" stroke-width=".8"/><path d="M33.5 38.8V51.2" stroke="${goldDark}" stroke-width=".6"/>
<path d="M6 13H42L58 18.5" stroke="${T('#4A4A53')}" stroke-width=".9" fill="none"/></g>`;
    // lampes (nuit)
    if (d > 0.35) {
      const lo = clamp((d - 0.35) / 0.5, 0, 1).toFixed(2);
      const lamps = [14, 62, 110, 280, 328, 376, 18 + 40, 340];
      lamps.forEach(x => { s += `<circle cx="${x}" cy="143" r="9" fill="url(#${uid}lg)" opacity="${lo}"/><circle cx="${x}" cy="143" r="1.8" fill="#FFE7A6" opacity="${lo}"/>`; });
      s += `<circle cx="${126 + 33.5 * 2.05}" cy="${90 + 45 * 2.05}" r="16" fill="url(#${uid}lg)" opacity="${(lo * 0.8).toFixed(2)}"/>`;
    }
    return s + '</svg>';
  }
  const api = { sceneSvg, sky, moonPhase };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Scene = api;
})(typeof window !== 'undefined' ? window : globalThis);
