/**
 * Stringalong — Grammar-based random text generator.
 * Based on Orteil's RandomGen - https://orteil.dashnet.org/randomgen/
 *
 * Usage:
 *   const gen = new Stringalong(sourceText);
 *   const results = gen.generate({ count: 5, seed: 'hello' });
 */
;(function(root) {
'use strict';

// ── Seeded PRNG (Mulberry32) ──────────────────────────────────────

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function seedRng(seed) {
  let s = typeof seed === 'string' ? hashStr(seed) : seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Pluralization (based on OWL Pluralization, LGPL) ──────────────

const pluralize = (function() {
  const custom = {};
  const uninflected = new Set(
    'aircraft,advice,blues,corn,molasses,equipment,gold,information,cotton,jewelry,kin,'+
    'legislation,luck,luggage,moose,music,offspring,rice,silver,trousers,wheat,bison,'+
    'bream,breeches,britches,carp,chassis,clippers,cod,contretemps,corps,debris,diabetes,'+
    'djinn,eland,elk,flounder,gallows,graffiti,headquarters,herpes,high,homework,innings,'+
    'jackanapes,mackerel,measles,mews,mumps,news,pincers,pliers,proceedings,rabies,'+
    'salmon,scissors,sea,series,shears,species,swine,trout,tuna,whiting,wildebeest,pike,'+
    'oats,tongs,dregs,snuffers,victuals,tweezers,vespers,pinchers,bellows,cattle'
  .split(','));
  const irregular = {
    I:'we',you:'you',he:'they',it:'they',me:'us',him:'them',them:'them',
    myself:'ourselves',yourself:'yourselves',himself:'themselves',herself:'themselves',
    itself:'themselves',themself:'themselves',oneself:'oneselves',
    child:'children',dwarf:'dwarfs',mongoose:'mongooses',mythos:'mythoi',ox:'oxen',
    soliloquy:'soliloquies',trilby:'trilbys',person:'people',forum:'forums',
    syllabus:'syllabi',alumnus:'alumni',genus:'genera',viscus:'viscera',
    stigma:'stigmata',thief:'thieves'
  };
  const rules = [
    [/man$/i,'men'], [/([lm])ouse$/i,'$1ice'], [/tooth$/i,'teeth'],
    [/goose$/i,'geese'], [/foot$/i,'feet'], [/zoon$/i,'zoa'],
    [/([tcsx])is$/i,'$1es'], [/ix$/i,'ices'],
    [/^(cod|mur|sil|vert)ex$/i,'$1ices'],
    [/^(agend|addend|memorand|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi)um$/i,'$1a'],
    [/^(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|\w+hedr)on$/i,'$1a'],
    [/^(alumn|alg|vertebr)a$/i,'$1ae'],
    [/([cs]h|ss|x)$/i,'$1es'],
    [/([aeo]l|[^d]ea|ar)f$/i,'$1ves'], [/([nlw]i)fe$/i,'$1ves'],
    [/([aeiou])y$/i,'$1ys'], [/(^[A-Z][a-z]*)y$/,'$1ys'], [/y$/i,'ies'],
    [/([aeiou])o$/i,'$1os'],
    [/^(pian|portic|albin|generalissim|manifest|archipelag|ghett|medic|armadill|guan|octav|command|infern|phot|ditt|jumb|pr|dynam|ling|quart|embry|lumbag|rhin|fiasc|magnet|styl|alt|contralt|sopran|bass|crescend|temp|cant|sol|kimon)o$/i,'$1os'],
    [/o$/i,'oes'], [/ss$/i,'sses'], [/s$/i,'s']
  ];
  function matchCase(result, sample) {
    return sample[0] === sample[0].toUpperCase() ? result[0].toUpperCase() + result.slice(1) : result;
  }
  function fn(word) {
    if (!word) return '';
    const lo = word.toLowerCase();
    if (lo in custom) return matchCase(custom[lo], word);
    if (/^[A-Z]$/.test(word)) return word + "'s";
    if (/fish$|ois$|sheep$|deer$|pox$|itis$/i.test(word)) return word;
    if (/^[A-Z][a-z]*ese$/.test(word)) return word;
    if (uninflected.has(lo)) return word;
    if (lo in irregular) return matchCase(irregular[lo], word);
    for (const [re, repl] of rules) if (re.test(word)) return word.replace(re, repl);
    return word + 's';
  }
  fn.define = (word, plural) => { custom[word.toLowerCase()] = plural; };
  return fn;
})();

// ── Text Utilities ────────────────────────────────────────────────

const MINOR = new Set('a,an,the,of,in,on,and,with,to,for,but,or,nor,at,by,so,yet'.split(','));

function titleCase(s) {
  return s.split(' ').map((w, i) => i > 0 && MINOR.has(w.toLowerCase()) ? w : cap(w)).join(' ');
}
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

function detectCase(s) {
  if (!s) return 'lower';
  if (s === s.toUpperCase() && s !== s.toLowerCase()) return 'upper';
  if (s[0] === s[0].toUpperCase() && s[0] !== s[0].toLowerCase()) return 'cap';
  return 'lower';
}
function applyCase(s, c) {
  if (!s || c === 'lower') return s;
  if (c === 'upper') return s.toUpperCase();
  return cap(s);
}

function splitPipe(str) {
  const parts = []; let depth = 0, cur = '';
  for (const ch of str) {
    if (ch === '[') { depth++; cur += ch; }
    else if (ch === ']') { depth--; cur += ch; }
    else if (ch === '|' && depth <= 0) { parts.push(cur); cur = ''; }
    else cur += ch;
  }
  parts.push(cur);
  return parts;
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function randInt(lo, hi, rng) { return Math.floor(rng() * (hi - lo + 1)) + lo; }

// ── Stringalong ───────────────────────────────────────────────────

class Stringalong {
  constructor(source, opts = {}) {
    this.lists = new Map();
    this.listOrder = [];
    this.meta = {
      name: 'Untitled', author: 'anonymous', description: '', picture: '',
      button: 'Generate', amount: 1, seedText: '',
      forceUnique: true, allRoots: false, includes: []
    };
    this.maxNesting = opts.maxNesting ?? 50;
    this.onWarn = opts.onWarn ?? null;
    if (source) this.parse(source);
  }

  // ── Parsing ───────────────────────────────────────────

  parse(source) {
    const lines = source.split(/\r?\n/);
    // inIncludes: if source has prepended includes (marked by $includes finalized),
    // ignore settings from the included portion. Otherwise process everything.
    let current = null, commenting = false;
    let inIncludes = /\$includes finalized/i.test(source);

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('/*')) {
        commenting = true;
        if (line.includes('*/')) commenting = false;
        continue;
      }
      if (commenting) { if (line.includes('*/')) commenting = false; continue; }
      if (line.startsWith('//')) continue;

      const lo = line.toLowerCase();
      if (lo.startsWith('$[note]')) continue;
      if (lo === '$includes finalized') { inIncludes = false; continue; }

      if (line[0] === '$') {
        const dir = line.slice(1);
        // key : value settings
        const kv = dir.match(/^([\w][\w\s]*?)\s*:\s*(.+)$/);
        if (kv) {
          if (!inIncludes) {
            const key = kv[1].toLowerCase().trim(), val = kv[2];
            if      (key === 'name')        this.meta.name = val;
            else if (key === 'author')      this.meta.author = val;
            else if (key === 'description') this.meta.description = val;
            else if (key === 'picture')     this.meta.picture = val;
            else if (key === 'button')      this.meta.button = val;
            else if (key === 'seed text')   this.meta.seedText = val;
            else if (key === 'amount')      this.meta.amount = clamp(parseInt(val) || 1, 1, 50);
          }
          continue;
        }
        const dl = dir.toLowerCase();
        if (dl === 'force unique')    { if (!inIncludes) this.meta.forceUnique = true; continue; }
        if (dl === 'allow duplicates'){ if (!inIncludes) this.meta.forceUnique = false; continue; }
        if (dl === 'all roots')       { if (!inIncludes) this.meta.allRoots = true; continue; }
        if (dl.startsWith('include ')){ this.meta.includes.push(dir.slice(8).trim()); continue; }

        // List declaration
        let name = dir, isRoot = false, append = false;
        if (name.includes('>')) { isRoot = true; name = name.replace(/>/g, ''); }
        if (name[0] === '+') { append = true; name = name.slice(1); }
        name = name.trim().toLowerCase();

        if (append && this.lists.has(name)) {
          current = this.lists.get(name);
        } else if (!append && this.lists.has(name)) {
          current = this.lists.get(name);
          current.items = [];
        } else {
          current = { name, items: [], root: false };
          this.lists.set(name, current);
          this.listOrder.push(name);
        }
        if (isRoot) current.root = true;
        continue;
      }

      // List item
      if (current) current.items.push(this._parseItem(line));
    }
    return this;
  }

  _parseItem(line) {
    const tags = { chance: 1, attrs: {} };
    if (line.endsWith('}') && line.includes(' {')) {
      const bi = line.indexOf(' {');
      for (const part of line.slice(bi + 2, -1).replace(/}\s*{/g, '}{').split('}{')) {
        if (part.endsWith('%')) tags.chance = parseFloat(part) / 100;
        else if (part.includes(':')) {
          const ci = part.indexOf(':');
          tags.attrs[part.slice(0, ci).toLowerCase()] = part.slice(ci + 1);
        }
      }
      line = line.slice(0, bi);
    }
    return { text: line, tags };
  }

  // ── Generation ────────────────────────────────────────

  generate({ count, seed, root } = {}) {
    count = clamp(count ?? this.meta.amount, 1, 999);
    const list = this._resolveRoot(root);
    if (!list) throw new Error('No root list found');

    const results = [];
    for (let i = 0; i < count; i++) {
      const ctx = {
        rng: seed != null ? seedRng(seed + ' /// ' + i) : Math.random,
        id: new Map(), uniques: new Set(), nesting: 0,
        forceUnique: this.meta.forceUnique, seed: seed ?? ''
      };
      const item = this._pickFromList(list, ctx, ctx.forceUnique);
      const text = item ? this._eval(item.text, ctx) : '';
      results.push(this._reparse(text).trim());
    }
    return results;
  }

  _resolveRoot(name) {
    if (name) return this.lists.get(name.toLowerCase()) || null;
    return this.listOrder.length ? this.lists.get(this.listOrder.at(-1)) : null;
  }

  getRoots() {
    const roots = [];
    for (const [name, list] of this.lists)
      if (list.root || this.meta.allRoots) roots.push(name);
    const last = this.listOrder.at(-1);
    if (last && !roots.includes(last)) roots.push(last);
    return roots;
  }

  // ── Picking ───────────────────────────────────────────

  _pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

  _pickWeighted(items, rng) {
    const total = items.reduce((s, it) => s + (it.tags?.chance ?? 1), 0);
    let roll = rng() * total;
    for (const it of items) {
      roll -= it.tags?.chance ?? 1;
      if (roll <= 0) return it;
    }
    return items[items.length - 1];
  }

  _pickUnique(arr, uniques, rng) {
    const f = arr.filter(it => !uniques.has(typeof it === 'string' ? it : it.text));
    return this._pick(f.length ? f : arr, rng);
  }

  _pickFromList(list, ctx, unique) {
    if (unique) {
      const pool = list.items.filter(it => !ctx.uniques.has(it.text));
      return this._pickWeighted(pool.length ? pool : list.items, ctx.rng);
    }
    return this._pickWeighted(list.items, ctx.rng);
  }

  // ── Evaluation ────────────────────────────────────────

  _eval(text, ctx) {
    if (!text) return '';
    let out = '', tag = '', inTag = false, depth = 0;
    for (const ch of text) {
      if (ch === '[' && !inTag) { inTag = true; tag = ''; }
      else if (ch === '[' && inTag) { depth++; tag += ch; }
      else if (ch === ']' && inTag && depth) { depth--; tag += ch; }
      else if (ch === ']' && inTag) { out += this._evalTag(tag, ctx); inTag = false; }
      else if (inTag) tag += ch;
      else out += ch;
    }
    return out;
  }

  _evalTag(tag, ctx) {
    if (++ctx.nesting > this.maxNesting) {
      ctx.nesting--;
      this._warn('Max nesting exceeded — likely recursion in: ' + tag);
      return '';
    }
    try { return this._evalTagInner(tag, ctx); }
    finally { ctx.nesting--; }
  }

  _evalTagInner(rawTag, ctx, toObj = false) {
    // ── Inline choices ──
    if (rawTag.includes('|') && !rawTag.includes(',%')) {
      const parts = splitPipe(rawTag);
      const chosen = ctx.forceUnique
        ? this._pickUnique(parts, ctx.uniques, ctx.rng)
        : this._pick(parts, ctx.rng);
      const result = this._eval(chosen, ctx);
      if (ctx.forceUnique && result) ctx.uniques.add(result);
      return result;
    }

    // ── Parse meta-parameters ──
    let tag = rawTag, metas = [];
    if (rawTag.includes(',')) { metas = rawTag.split(','); tag = metas.shift(); }

    let times = 1, id = null, as = '', fallback = null;
    let hidden = false, unique = ctx.forceUnique;
    let caseMode = null, doTitle = false, doLower = false;
    let compress = false, eachList = null, written = false, part = 0, replacements = [];
    const tagCase = detectCase((tag.split(' ').at(-1)) || tag);

    for (const m of metas) {
      if (m[0] === 'x') {
        const [lo, hi] = m.slice(1).split('-').map(Number);
        times = clamp(randInt(lo, hi || lo, ctx.rng), 1, 50);
      }
      else if (m[0] === '#')          id = m.slice(1);
      else if (m[0] === '%')          replacements.push(m.slice(1));
      else if (m.startsWith('as '))   as = m.slice(3).toLowerCase();
      else if (m.startsWith('or '))   fallback = m.slice(3);
      else if (m === 'hidden')        hidden = true;
      else if (m === 'unique')        unique = true;
      else if (m === 'mundane')       unique = false;
      else if (m === 'title')         doTitle = true;
      else if (m === 'upper')         caseMode = 'upper';
      else if (m === 'lower')         doLower = true;
      else if (m === 'compress')      compress = true;
      else if (m.startsWith('each ')) eachList = m.slice(5).trim();
      else if (m === 'written')       written = true;
      else if (m === 'first part')    part = 1;
      else if (m === 'middle part')   part = 2;
      else if (m === 'last part')     part = 3;
      else { caseMode = detectCase(m); tag = applyCase(tag, caseMode); }
    }

    let resolvedAs = this._resolveAs(as, ctx);

    // ── Resolve tag ──
    let out = '', obj = null;
    const tagLo = tag.toLowerCase();

    if (tag[0] === '#') {
      // Identifier recall
      const stored = ctx.id.get(tag.slice(1));
      if (!stored) { this._warn('Unknown identifier: ' + tag); }
      else for (let i = 0; i < times; i++) {
        if (typeof stored === 'string') { out += stored; }
        else {
          obj = stored;
          if (resolvedAs && obj.tags?.attrs[resolvedAs] != null)
            out += this._eval(obj.tags.attrs[resolvedAs], ctx);
          else if (fallback != null) out += this._eval(fallback, ctx);
          else out += this._eval(obj.text, ctx);
        }
      }
    }
    else if (this.lists.has(tagLo)) {
      // List reference
      const list = this.lists.get(tagLo);
      for (let i = 0; i < times; i++) {
        let item = this._pickFromList(list, ctx, unique);
        if (!item) continue;

        // Refinement: resolve single-ref items to preserve inner attributes
        if (id && this._isSingleRef(item.text)) {
          const inner = this._resolveRef(item.text, ctx);
          if (inner && typeof inner === 'object') item = inner;
        }

        let text;
        if (resolvedAs && item.tags?.attrs[resolvedAs] != null)
          text = this._eval(item.tags.attrs[resolvedAs], ctx);
        else if (resolvedAs && fallback != null)
          text = this._eval(fallback, ctx);
        else text = this._eval(item.text, ctx);

        out += text;
        if (unique && item.text) ctx.uniques.add(item.text);
        obj = item;
      }
    }
    else if (/^-?\d+\s*-\s*-?\d+$/.test(tag)) {
      // Number range
      const [lo, hi] = tag.split(/\s*-\s*(?=-?\d+$)/).map(Number);
      out += randInt(Math.min(lo, hi), Math.max(lo, hi), ctx.rng);
    }
    else if (tag === '/')                         out = '<br>';
    else if (tagLo === "author's name")           out = this.meta.author;
    else if (tagLo === "game's name")             out = this.meta.name;
    else if (tag === '*CLEAR*')                   ctx.id.clear();
    else if (tagLo === 'seed')                    out = String(ctx.seed);
    else if (tag === '*DEBUG ON*' || tag === '*DEBUG OFF*') { /* library no-op */ }
    else if (/^(an?|s| )$/i.test(tag))            out = '[' + tag + ']'; // pass to reparse
    else                                          out = '[' + tag + ']'; // unknown, pass through

    // Template replacements (%1, %2, ...)
    for (let i = replacements.length - 1; i >= 0; i--)
      out = out.replaceAll('%' + (i + 1), this._eval(replacements[i], ctx));

    // Store identifier
    if (id) {
      if (written) {
        const final = this._applyCasing(out, doLower, doTitle, caseMode, tagCase);
        ctx.id.set(id, final);
        out = final;
        // Skip casing below since already applied
        doLower = doTitle = false; caseMode = null;
      } else {
        ctx.id.set(id, obj ?? out);
      }
    }

    // Text slicing
    if (part === 1) out = out.slice(0, Math.max(1, Math.floor(out.length / 3)));
    else if (part === 2) {
      const s = Math.floor(out.length / 3);
      out = out.slice(s, Math.max(s + 1, Math.floor(out.length * 2 / 3)));
    }
    else if (part === 3) out = out.slice(Math.floor(out.length * 2 / 3));

    // Casing: explicit modifiers win over contextual case
    out = this._applyCasing(out, doLower, doTitle, caseMode, tagCase);

    // Character-level iteration: feed each char through a list as [_]
    if (eachList) {
      out = this._reparse(out); // resolve [s], [an], [ ] before iterating chars
      const saved = this.lists.get('_');
      let mapped = '';
      for (const ch of out) {
        this.lists.set('_', { name: '_', items: [{ text: ch, tags: { chance: 1, attrs: {} } }], root: false });
        mapped += this._evalTag(eachList, ctx);
      }
      if (saved) this.lists.set('_', saved); else this.lists.delete('_');
      out = mapped;
    }

    if (compress) out = out.replace(/ /g, '');
    if (hidden) out = '';

    return toObj && obj ? obj : out;
  }

  _applyCasing(out, doLower, doTitle, caseMode, tagCase) {
    if (doLower) return out.toLowerCase();
    if (doTitle) return titleCase(out);
    return applyCase(out, caseMode ?? tagCase);
  }

  _resolveAs(as, ctx) {
    if (!as) return '';
    if (as[0] === '#') {
      const ref = ctx.id.get(as.slice(1));
      return typeof ref === 'string' ? ref : as;
    }
    return as;
  }

  _isSingleRef(text) {
    const t = text.trim();
    if (t.length < 3 || t[0] !== '[' || t.at(-1) !== ']') return false;
    let depth = 0;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === '[') depth++;
      else if (t[i] === ']') depth--;
      if (depth === 0 && i < t.length - 1) return false;
    }
    return depth === 0;
  }

  _resolveRef(text, ctx) {
    const tag = text.trim().slice(1, -1);
    try { return this._evalTagInner(tag, ctx, true); }
    catch { return null; }
  }

  // ── Second pass: [an], [s], [ ] ───────────────────────

  _reparse(text) {
    let out = '', tag = '', inTag = false;
    const chars = [...text];
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === '[') { inTag = true; tag = ''; }
      else if (chars[i] === ']' && inTag) {
        const tl = tag.toLowerCase();
        if (tl === 'a' || tl === 'an') {
          // Look ahead for first letter, skipping spaces and HTML tags
          let letter = '';
          for (let j = i + 1; j < chars.length && !letter; j++) {
            if (chars[j] === '<') { while (j < chars.length && chars[j] !== '>') j++; }
            else if (chars[j] !== ' ') letter = chars[j].toLowerCase();
          }
          out += applyCase('aeiou'.includes(letter) ? 'an' : 'a', detectCase(tag));
        }
        else if (tl === 's') {
          // Pluralize last word
          const si = out.lastIndexOf(' ') + 1;
          const lastWord = out.slice(si);
          if (lastWord) out = out.slice(0, si) + applyCase(pluralize(lastWord), detectCase(lastWord));
        }
        else if (tag === ' ') out += ' ';
        else out += '[' + tag + ']';
        inTag = false;
      }
      else if (inTag) tag += chars[i];
      else out += chars[i];
    }
    return out;
  }

  _warn(msg) { if (this.onWarn) this.onWarn(msg); }
}

// ── Export ─────────────────────────────────────────────────────────
Stringalong.pluralize = pluralize;
Stringalong.seedRng = seedRng;

if (typeof module !== 'undefined' && module.exports) module.exports = Stringalong;
else if (typeof define === 'function' && define.amd) define(() => Stringalong);
else root.Stringalong = Stringalong;

})(typeof globalThis !== 'undefined' ? globalThis : this);
