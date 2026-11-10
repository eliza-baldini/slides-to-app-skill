// Packs a built Vite app (dist/) into a plain-script web root for a Tableau data app (viz extension).
//
//   npm install            (once, in this folder)
//   node pack.mjs <project-dir> <out-dir> "<App Name>" [overrides.json]
//
// Output:
//   index.html          scripts/styles in the right order (Extensions API library first)
//   src/app-01.js       the app bundle as one classic script (no modules, no XHR, no eval)
//   src/css-01.css      the stylesheet, with @font-face removed (system fonts are used)
//   src/shim.js         generated SVG stand-ins for every image under public/ (no raster files)
//   digests.txt         sha256, size and name of every file
// build-twbx.mjs then puts this folder into the workbook and keeps src/tableau.extensions.1.latest.min.js.
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import vm from 'vm'
import { fileURLToPath } from 'url'
import * as acorn from 'acorn'

const [projectDir, outDir, appName = 'Data App', overridesFile] = process.argv.slice(2)
if (!projectDir || !outDir) { console.error('usage: node pack.mjs <project-dir> <out-dir> "<App Name>" [overrides.json]'); process.exit(1) }
// Files now travel inside the .twbx, so by default nothing is split: one app script and one stylesheet,
// loaded with plain <script>/<link> tags. Tableau's hosted extension content rejects XMLHttpRequest, so the
// big-NN + loader.js path (only used when PACK_MAX_FILE is set) does not work there; keep it off.
const MAX = process.env.PACK_MAX_FILE ? Number(process.env.PACK_MAX_FILE) : Infinity
const dist = path.join(projectDir, 'dist'), pub = path.join(projectDir, 'public')
const assets = path.join(dist, 'assets')
if (!fs.existsSync(assets)) { console.error('No dist/assets. Run `npm run build` in the project first.'); process.exit(1) }

const jsFiles = fs.readdirSync(assets).filter((f) => f.endsWith('.js'))
const cssFiles = fs.readdirSync(assets).filter((f) => f.endsWith('.css'))
if (jsFiles.length !== 1) { console.error(`Expected one JS bundle in dist/assets, found ${jsFiles.length}. Disable code splitting (no dynamic import()).`); process.exit(1) }

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(path.join(outDir, 'src'), { recursive: true })
const write = (name, text) => fs.writeFileSync(path.join(outDir, name), text)

// ---- JS ----------------------------------------------------------------
const js = fs.readFileSync(path.join(assets, jsFiles[0]), 'utf8')
let ast
try { ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script' }) } catch (e) {
  console.error('Bundle is not a classic script (' + e.message + '). It must have no import/export statements.'); process.exit(1)
}
const pieces = []
for (const n of ast.body) {
  if (n.type === 'VariableDeclaration' && n.declarations.length > 1) for (const d of n.declarations) pieces.push(`${n.kind} ${js.slice(d.start, d.end)};`)
  else if (n.type === 'ExpressionStatement' && n.expression.type === 'SequenceExpression') for (const e of n.expression.expressions) pieces.push(js.slice(e.start, e.end) + ';')
  else pieces.push(js.slice(n.start, n.end) + (/[;}]/.test(js[n.end - 1]) ? '' : ';'))
}
// Break long lines at , or ; so a file never has one 100 KB line (editors and the upload tool dislike it).
const wrap = (t) => {
  let out = '', last = 0, line = 0
  for (const tk of acorn.tokenizer(t, { ecmaVersion: 'latest' })) {
    out += t.slice(last, tk.end); line += tk.end - last; last = tk.end
    if ((tk.type.label === ',' || tk.type.label === ';') && line > 300) { out += '\n'; line = 0 }
  }
  return out + t.slice(last)
}
const seq = []
let cur = '', n = 0, b = 0
const flush = () => {
  if (!cur) return
  const name = `app-${String(++n).padStart(2, '0')}.js`
  const text = '"use strict";\n' + wrap(cur)
  acorn.parse(text, { ecmaVersion: 'latest' })
  write('src/' + name, text); seq.push(name); cur = ''
}
for (const p of pieces) {
  if (p.length > MAX) {
    flush()
    const lines = (wrap(p) + '\n').split('\n')
    let chunk = ''
    const emit = () => { if (!chunk) return; const name = `big-${String(++b).padStart(2, '0')}.js`; write('src/' + name, chunk); seq.push(name); chunk = '' }
    for (let i = 0; i < lines.length - 1; i++) { const l = lines[i] + '\n'; if (chunk && chunk.length + l.length > MAX) emit(); chunk += l }
    emit(); continue
  }
  if (cur && cur.length + p.length > MAX) flush()
  cur += p + '\n'
}
flush()
const bigNames = seq.filter((s) => s.startsWith('big-')).map((s) => s.replace('.js', ''))

// The loader runs where the first big-NN part sat in the sequence, so statement order is unchanged.
if (bigNames.length) write('src/loader.js', `"use strict";
// Assembles one large statement of the app bundle from src/big-*.js (stored in ~20 KB parts) and runs it.
(function () {
  var parts = ${JSON.stringify(bigNames)};
  function show(msg) {
    var r = document.getElementById('root');
    if (!r) return;
    var p = document.createElement('p');
    p.style.cssText = 'font:14px system-ui,sans-serif;color:#b00020;padding:16px';
    p.textContent = msg;
    r.appendChild(p);
  }
  function get(u) {
    var x = new XMLHttpRequest();
    x.open('GET', u, false);
    x.send(null);
    if (x.status !== 200 && x.status !== 0) throw new Error(u + ' returned ' + x.status);
    return x.responseText;
  }
  try {
    var code = '';
    for (var i = 0; i < parts.length; i++) code += get('src/' + parts[i] + '.js');
    code += '\\n;window.__bigLoaded=true;';
    var s = document.createElement('script');
    s.text = code;
    document.head.appendChild(s);
    s.parentNode.removeChild(s);
    if (!window.__bigLoaded) (0, eval)(code);
    if (!window.__bigLoaded) throw new Error('script injection was blocked');
  } catch (e) {
    show('Could not load app code: ' + ((e && e.message) || e));
  }
})();
`)

// ---- CSS ---------------------------------------------------------------
let css = cssFiles.map((f) => fs.readFileSync(path.join(assets, f), 'utf8')).join('\n')
css = css.replace(/@font-face\{[^}]*\}/g, '') // font files aren't bundled; the font stack falls back to system fonts
if (/url\(\.\//.test(css)) console.warn('warning: stylesheet still references relative files:', css.match(/url\(\.\/[^)]*\)/g))
// Split into top-level blocks; an oversized `@layer x{...}` is re-split into several `@layer x{...}` blocks (they merge).
const topBlocks = (t) => {
  const out = []
  let depth = 0, start = 0
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '{') depth++
    else if (t[i] === '}' && --depth === 0) { out.push(t.slice(start, i + 1)); start = i + 1 }
  }
  if (t.slice(start).trim()) out.push(t.slice(start))
  return out
}
const blocks = []
for (const blk of topBlocks(css)) {
  const m = blk.length > MAX && /^\s*(@layer [\w-]+)\{/.exec(blk)
  if (!m) { blocks.push(blk); continue }
  const inner = blk.slice(m[0].length, blk.lastIndexOf('}'))
  let group = ''
  for (const r of topBlocks(inner)) {
    if (group && group.length + r.length > MAX) { blocks.push(`${m[1]}{${group}}`); group = '' }
    group += r
  }
  if (group) blocks.push(`${m[1]}{${group}}`)
}
const cssParts = []
let curCss = ''
for (const blk of blocks) {
  if (curCss && curCss.length + blk.length > MAX) { cssParts.push(curCss); curCss = '' }
  curCss += blk
}
if (curCss) cssParts.push(curCss)
const cssNames = cssParts.map((t, i) => {
  const name = `css-${String(i + 1).padStart(2, '0')}.css`
  // newline after each closing brace keeps lines short
  write('src/' + name, t.replace(/\}/g, '}\n').replace(/\n+/g, '\n').trim() + '\n'); return name
})

// ---- image stand-ins -----------------------------------------------------
// Every file under public/ (png/jpg/jpeg/webp/gif) is answered with a generated SVG. Override label/color/kind per
// path (without extension) in overrides.json: { "logos/arch/b0": ["SAP", "#0b6cc5"], "personas/maya": ["M", "#1b46d6", "avatar"] }
const overrides = overridesFile ? JSON.parse(fs.readFileSync(overridesFile, 'utf8')) : {}
const palette = ['#1b46d6', '#2e8b6f', '#6d3fd6', '#e8731a', '#0b9be0', '#d6402c', '#1f8a54', '#5f6b7d']
const images = {}
const walk = (d, rel = '') => {
  if (!fs.existsSync(d)) return
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) walk(path.join(d, e.name), r)
    else if (/\.(png|jpe?g|webp|gif)$/i.test(e.name)) {
      const key = r.replace(/\.[^.]+$/, '')
      const base = path.basename(key)
      const h = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
      const kind = /person|avatar|people|team|headshot|photo/i.test(key) ? 'avatar' : 'badge'
      const label = kind === 'avatar' ? base[0].toUpperCase() : base.replace(/[-_]/g, ' ')
      images[key] = overrides[key] || [label, palette[h % palette.length], kind]
    }
  }
}
walk(pub)
write('src/shim.js', `"use strict";
// Image stand-ins: the app requests ./logos/... and ./personas/... files, which are not bundled in the data app. Those paths are answered with small generated SVGs (monogram badges and avatars).
(function () {
  var IMAGES = ${JSON.stringify(images)};
  function uri(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
  function badge(label, color) {
    var t = label.length > 5 ? label.slice(0, 2) : label;
    var fs = t.length <= 2 ? 30 : t.length <= 3 ? 24 : 18;
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#fff"/><circle cx="32" cy="32" r="26" fill="' + color + '" fill-opacity="0.14"/><text x="32" y="' + (32 + fs * 0.35) + '" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="' + fs + '" fill="' + color + '">' + t.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text></svg>');
  }
  function avatar(label, color) {
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="' + color + '" fill-opacity="0.16"/><circle cx="48" cy="38" r="17" fill="' + color + '" fill-opacity="0.55"/><path d="M14 96c2-22 16-34 34-34s32 12 34 34z" fill="' + color + '" fill-opacity="0.55"/><text x="48" y="46" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="' + (label.length > 1 ? 15 : 20) + '" fill="#fff">' + label.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text></svg>');
  }
  var cache = {};
  function fix(v) {
    if (typeof v !== 'string') return v;
    var m = /^(?:.*?\\/)?(.+)\\.(?:png|jpe?g|webp|gif)$/i.exec(v.replace(/^\\.?\\//, ''));
    if (!m) return v;
    var key = null;
    for (var k in IMAGES) if (v.indexOf(k + '.') !== -1 && v.slice(v.indexOf(k)).replace(/\\.[^.]+$/, '') === k) { key = k; break; }
    if (!key) return v;
    if (cache[key]) return cache[key];
    var d = IMAGES[key];
    return (cache[key] = d[2] === 'avatar' ? avatar(d[0], d[1]) : badge(d[0], d[1]));
  }
  var desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true, enumerable: desc.enumerable, get: desc.get,
    set: function (v) { desc.set.call(this, fix(v)); }
  });
  var setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) {
    if (this instanceof HTMLImageElement && String(n).toLowerCase() === 'src') v = fix(v);
    return setAttr.call(this, n, v);
  };
})();
`)

// ---- index.html --------------------------------------------------------
const scripts = ['src/shim.js']
let loaderPlaced = false
for (const s of seq) {
  if (s.startsWith('big-')) { if (!loaderPlaced) { scripts.push('src/loader.js'); loaderPlaced = true } } else scripts.push('src/' + s)
}
write('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>
${cssNames.map((c) => `    <link rel="stylesheet" href="src/${c}" />`).join('\n')}
  </head>
  <body>
    <div id="root"></div>
    <!-- Tableau Extensions API library: ships in the scaffold template; build-twbx.mjs keeps it at this path. -->
    <script src="src/tableau.extensions.1.latest.min.js"></script>
${scripts.map((s) => `    <script src="${s}"></script>`).join('\n')}
  </body>
</html>
`)

// ---- digests -----------------------------------------------------------
const all = ['index.html', ...fs.readdirSync(path.join(outDir, 'src')).sort().map((f) => 'src/' + f)]
const rows = all.map((f) => {
  const buf = fs.readFileSync(path.join(outDir, f))
  return `${crypto.createHash('sha256').update(buf).digest('hex')} ${buf.length} ${f}`
})
write('digests.txt', rows.join('\n') + '\n')

// ---- smoke test --------------------------------------------------------
const { JSDOM, VirtualConsole } = await import('jsdom')
const errs = []
const vc = new VirtualConsole()
vc.on('jsdomError', (e) => errs.push(String(e.message).slice(0, 200)))
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { runScripts: 'outside-only', virtualConsole: vc, pretendToBeVisual: true, url: 'https://x.test/' })
const w = dom.window
w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }))
const ctx = dom.getInternalVMContext()
const run = (name, code) => { try { new vm.Script(code, { filename: name }).runInContext(ctx) } catch (e) { errs.push(name + ': ' + e.message) } }
run('shim.js', fs.readFileSync(path.join(outDir, 'src/shim.js'), 'utf8'))
let big = ''
for (const s of seq) {
  const text = fs.readFileSync(path.join(outDir, 'src', s), 'utf8')
  if (s.startsWith('big-')) big += text
  else { if (big) { run('big', big); big = '' } run(s, text) }
}
if (big) run('big', big)
await new Promise((r) => setTimeout(r, 800))
const html = w.document.getElementById('root').innerHTML
console.log(`${seq.length} script files (${bigNames.length} big parts), ${cssNames.length} css files, ${Object.keys(images).length} image stand-ins`)
console.log('smoke test:', errs.length ? 'ERRORS ' + JSON.stringify(errs.slice(0, 5)) : 'ok', '| root html length', html.length)
if (bigNames.length) console.warn('warning: big-NN parts need XMLHttpRequest, which Tableau-hosted extensions block. Unset PACK_MAX_FILE.')
console.log('largest file:', Math.max(...rows.map((r) => +r.split(' ')[1])), 'bytes. Digests in', path.join(outDir, 'digests.txt'))
if (errs.length || html.length < 200) process.exit(2)
