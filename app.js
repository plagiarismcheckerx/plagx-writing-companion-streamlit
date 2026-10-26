(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Tabs
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.tab, .panel').forEach((el) => el.classList.remove('active'));
    t.classList.add('active');
    $(t.dataset.tab).classList.add('active');
  }));

  // ---------- Draft checks + reading time ----------
  const syllables = (w) => {
    w = w.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  };

  function draftStats(text) {
    const words = text.match(/\b[\w'’-]+\b/g) || [];
    const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length);
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length);
    const syl = words.reduce((n, w) => n + syllables(w), 0);
    const wc = words.length, sc = Math.max(sentences.length, 1);
    const flesch = wc ? Math.round(206.835 - 1.015 * (wc / sc) - 84.6 * (syl / wc)) : 0;
    const mins = wc / 238;
    return {
      Words: wc,
      Characters: text.length,
      Sentences: sentences.length,
      Paragraphs: paragraphs.length,
      'Reading time': mins < 1 ? Math.ceil(mins * 60) + ' sec' : Math.round(mins) + ' min',
      'Speaking time': Math.max(1, Math.round(wc / 130)) + ' min',
      'Avg sentence': (wc / sc).toFixed(1) + ' words',
      Readability: wc ? flesch + ' (Flesch)' : '–',
    };
  }

  const HINT_RULES = [
    [/\b(\w+)\s+\1\b/gi, 'repeat', (m) => `Repeated word: “${m[0]}”`],
    [/\b(was|were|is|are|been|being|be)\s+\w+ed\b/gi, 'passive', (m) => `Possible passive voice: “${m[0]}”`],
    [/\b(very|really|basically|actually|literally|just|quite|totally)\b/gi, 'filler', (m) => `Filler word: “${m[0]}”`],
    [/\b(could of|should of|would of)\b/gi, 'grammar', (m) => `Use “${m[0].split(' ')[0]} have” instead of “${m[0]}”`],
    [/\b(alot)\b/gi, 'spelling', () => '“alot” should be “a lot”'],
    [/\b(irregardless)\b/gi, 'usage', () => 'Use “regardless” instead of “irregardless”'],
    [/\b(don't|can't|won't|isn't|aren't|doesn't|didn't|it's|i'm|we're|they're)\b/gi, 'academic', (m) => `Contraction “${m[0]}”; academic writing usually avoids these`],
    [/\b(I think|I feel|I believe|in my opinion)\b/gi, 'academic', (m) => `Subjective phrasing “${m[0]}”; consider supporting with evidence`],
    [/ {2,}/g, 'spacing', () => 'Multiple consecutive spaces'],
    [/\s+([,.;:!?])/g, 'spacing', (m) => `Space before punctuation “${m[1]}”`],
    [/[.!?]\s+[a-z]/g, 'capital', (m) => `Sentence should start with a capital: “${m[0].trim()}”`],
  ];

  function hints(text) {
    const out = [];
    for (const [re, tag, msg] of HINT_RULES) {
      for (const m of text.matchAll(re)) { out.push([tag, msg(m)]); if (out.length > 60) break; }
    }
    text.split(/(?<=[.!?])\s+/).forEach((s) => {
      const n = (s.match(/\b\w+\b/g) || []).length;
      if (n > 35) out.push(['length', `Long sentence (${n} words): “${s.slice(0, 60)}…”`]);
    });
    return out;
  }

  function renderDraft() {
    const text = $('draftText').value;
    $('stats').innerHTML = Object.entries(draftStats(text))
      .map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
    const h = text.trim() ? hints(text) : [];
    $('hints').innerHTML = h.length
      ? h.map(([t, m]) => `<li><span class="tag">${t}</span>${esc(m)}</li>`).join('')
      : `<li class="muted">${text.trim() ? 'No issues found.' : 'Hints appear as you type.'}</li>`;
  }
  $('draftText').addEventListener('input', renderDraft);
  renderDraft();

  // ---------- Citations ----------
  const parseAuthors = (s) => s.split(';').map((a) => a.trim()).filter(Boolean).map((a) => {
    const [last, first = ''] = a.split(',').map((x) => x.trim());
    return { last, first, initials: first.split(/\s+/).filter(Boolean).map((p) => p[0].toUpperCase() + '.').join(' ') };
  });

  function joinAuthors(list, style) {
    if (!list.length) return '';
    const fmt = (a, i) => {
      if (style === 'APA' || style === 'Harvard') return `${a.last}, ${a.initials}`.replace(/, $/, '');
      return i === 0 ? `${a.last}${a.first ? ', ' + a.first : ''}` : `${a.first} ${a.last}`.trim();
    };
    if (style === 'MLA' && list.length > 2) return fmt(list[0], 0) + ', et al.';
    const parts = list.map(fmt);
    if (parts.length === 1) return parts[0];
    const amp = style === 'APA' ? ', & ' : style === 'Harvard' ? ' and ' : ', and ';
    return parts.length === 2 && style !== 'APA'
      ? parts.join(style === 'Harvard' ? ' and ' : ', and ')
      : parts.slice(0, -1).join(', ') + amp + parts[parts.length - 1];
  }

  const fmtDate = (d) => d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  function cite() {
    const v = (id) => $(id).value.trim();
    const type = v('cType'), style = v('cStyle');
    const A = joinAuthors(parseAuthors(v('cAuthors')), style);
    const T = esc(v('cTitle')), Y = v('cYear') || 'n.d.', P = esc(v('cPublisher')), J = esc(v('cJournal'));
    const vi = esc(v('cVolume')), pg = esc(v('cPages')), S = esc(v('cSite')), U = esc(v('cUrl')), acc = fmtDate(v('cAccessed'));
    const a = esc(A);
    if (!a && !T) return '';
    const end = (s) => s.replace(/\s+/g, ' ').replace(/\s([.,])/g, '$1').replace(/\.\./g, '.').trim();
    if (style === 'APA') {
      if (type === 'book') return end(`${a} (${Y}). <i>${T}</i>. ${P}.`);
      if (type === 'journal') return end(`${a} (${Y}). ${T}. <i>${J}</i>, ${vi}, ${pg}. ${U}`);
      return end(`${a} (${Y}). <i>${T}</i>. ${S}. ${U}`);
    }
    if (style === 'MLA') {
      if (type === 'book') return end(`${a}. <i>${T}</i>. ${P}, ${Y}.`);
      if (type === 'journal') return end(`${a}. “${T}.” <i>${J}</i>, vol. ${vi}, ${Y}, pp. ${pg}. ${U}`);
      return end(`${a}. “${T}.” <i>${S}</i>, ${Y}, ${U}. ${acc ? 'Accessed ' + acc + '.' : ''}`);
    }
    if (style === 'Chicago') {
      if (type === 'book') return end(`${a}. <i>${T}</i>. ${P}, ${Y}.`);
      if (type === 'journal') return end(`${a}. “${T}.” <i>${J}</i> ${vi} (${Y}): ${pg}. ${U}`);
      return end(`${a}. “${T}.” ${S}. ${acc ? 'Accessed ' + acc + '.' : ''} ${U}`);
    }
    // Harvard
    if (type === 'book') return end(`${a} (${Y}) <i>${T}</i>. ${P}.`);
    if (type === 'journal') return end(`${a} (${Y}) ‘${T}’, <i>${J}</i>, ${vi}, pp. ${pg}. ${U}`);
    return end(`${a} (${Y}) <i>${T}</i>. Available at: ${U} ${acc ? '(Accessed: ' + acc + ').' : ''}`);
  }

  function renderCite() {
    const type = $('cType').value;
    document.querySelectorAll('#cite .grid > label.j, #cite .grid > label.w, #cite .grid > label.b').forEach((l) => {
      l.style.display = l.classList.contains(type[0]) ? '' : 'none';
    });
    const out = cite();
    $('cOut').innerHTML = out || 'Fill in the fields to generate a citation.';
    $('cOut').className = out ? '' : 'muted';
  }
  document.querySelectorAll('#cite input, #cite select').forEach((el) => el.addEventListener('input', renderCite));
  $('cCopy').addEventListener('click', () => {
    navigator.clipboard?.writeText($('cOut').innerText).then(() => {
      $('cCopy').textContent = 'Copied'; setTimeout(() => ($('cCopy').textContent = 'Copy'), 1200);
    });
  });
  renderCite();

  // ---------- Reference matching ----------
  function inText(body) {
    const found = new Map();
    const add = (name, year) => {
      const key = name.split(/\s+(?:and|&|et al\.?)\s*/)[0].trim().toLowerCase() + '|' + year;
      found.set(key, `${name.trim()}, ${year}`);
    };
    for (const m of body.matchAll(/\(([^()]*?\d{4}[a-z]?[^()]*)\)/g)) {
      m[1].split(';').forEach((part) => {
        const x = part.match(/([A-Z][\w'’-]+(?:\s+(?:and|&)\s+[A-Z][\w'’-]+|\s+et al\.?)?),?\s+(\d{4}[a-z]?)/);
        if (x) add(x[1], x[2]);
      });
    }
    for (const m of body.matchAll(/([A-Z][\w'’-]+(?:\s+(?:and|&)\s+[A-Z][\w'’-]+|\s+et al\.?)?)\s+\((\d{4}[a-z]?)\)/g)) add(m[1], m[2]);
    return found;
  }

  function refKeys(list) {
    return list.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const last = (line.match(/^([A-Z][\w'’-]+)/) || [])[1] || '';
      const year = (line.match(/\b(1[89]\d{2}|20\d{2})[a-z]?\b/) || [])[0] || '';
      return { line, key: last.toLowerCase() + '|' + year };
    });
  }

  function renderRefs() {
    const body = $('rBody').value, list = $('rList').value;
    if (!body.trim() && !list.trim()) { $('rOut').innerHTML = ''; return; }
    const cites = inText(body), refs = refKeys(list);
    const refSet = new Set(refs.map((r) => r.key));
    const missing = [...cites].filter(([k]) => !refSet.has(k)).map(([, v]) => v);
    const unused = refs.filter((r) => !cites.has(r.key)).map((r) => r.line);
    const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join('');
    $('rOut').innerHTML = `
      <p><b>${cites.size}</b> in-text citations · <b>${refs.length}</b> references</p>
      <h3 class="${missing.length ? 'bad' : 'ok'}">Cited but not in reference list (${missing.length})</h3><ul>${li(missing)}</ul>
      <h3 class="${unused.length ? 'bad' : 'ok'}">In reference list but never cited (${unused.length})</h3><ul>${li(unused)}</ul>`;
  }
  $('rBody').addEventListener('input', renderRefs);
  $('rList').addEventListener('input', renderRefs);
})();
