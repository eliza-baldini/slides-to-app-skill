// Turns the Tableau Cloud connector's data app template into a publishable .twbx with your app inside.
//
//   node build-twbx.mjs --template <template.zip> --scaffold <scaffold-result.json> \
//        --content <content-dir> --out <out.twbx> [--origins "<origin> <origin>"] [--csv <data.csv>]
//
// --template  the zip from scaffold-data-app (download its s3URL right away; the link expires in ~60 s)
// --scaffold  the scaffold-data-app result saved as JSON (needs `postUnzip`; the whole result is fine)
// --content   the extension's web root: index.html + src/... (the filled-in tableau-embed shell, or
//             the output folder of data-app-inline/pack.mjs)
// --out       where to write the workbook; publish it with request-workbook-upload + publish-workbook
// --origins   space-separated origins for manifest.json `requestedOrigins`
//             (iframe embed: the site origin, e.g. "https://owner.github.io")
// --csv       optional CSV to pack into the workbook as its data source (Data/<name>/<name>.csv),
//             wired to the data app's worksheet so the Extensions API can query it
//
// Needs the `unzip` and `zip` command-line tools (built into macOS; on Linux install them).
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { execFileSync } from 'child_process'

const args = {}
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i]
  if (!k.startsWith('--')) { console.error('unexpected argument: ' + k); process.exit(1) }
  args[k.slice(2)] = process.argv[i + 1]
}
const { template, scaffold, content, out: outFile, origins = '', csv } = args
if (!template || !scaffold || !content || !outFile) {
  console.error('usage: node build-twbx.mjs --template <zip> --scaffold <json> --content <dir> --out <file.twbx> [--origins "<o1> <o2>"] [--csv <file.csv>]')
  process.exit(1)
}
const fail = (msg) => { console.error('error:', msg); process.exit(1) }
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;')

const result = JSON.parse(fs.readFileSync(scaffold, 'utf8'))
const plan = result.postUnzip || result
if (!Array.isArray(plan.edits) || !Array.isArray(plan.renames)) fail('no postUnzip.edits/renames in ' + scaffold)
if (!fs.existsSync(path.join(content, 'index.html'))) fail('no index.html in ' + content)

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'twbx-'))
execFileSync('unzip', ['-q', path.resolve(template), '-d', work])

// 1. Apply the scaffold's literal find/replace edits, then its renames, in order.
for (const e of plan.edits) {
  const f = path.join(work, e.file)
  if (!fs.existsSync(f)) fail('edit target missing: ' + e.file)
  let text = fs.readFileSync(f, 'utf8')
  for (const r of e.replacements) text = text.split(r.find).join(r.replace)
  fs.writeFileSync(f, text)
}
for (const r of plan.renames) fs.renameSync(path.join(work, r.from), path.join(work, r.to))

// 2. Find the finished workspace folder, its package and the extension's web root.
const root = path.join(work, plan.renames.at(-1).to)
const pkgDir = path.join(root, 'Packages')
const pkgs = fs.readdirSync(pkgDir).filter((d) => fs.statSync(path.join(pkgDir, d)).isDirectory())
if (pkgs.length !== 1) fail('expected one package under Packages/, found ' + pkgs.join(', '))
const pkg = path.join(pkgDir, pkgs[0])
const web = path.join(pkg, 'content')
const lib = 'tableau.extensions.1.latest.min.js'
const libText = fs.readFileSync(path.join(web, 'src', lib))

// 3. Replace the starter web root with the app, keeping the Extensions API library.
fs.rmSync(web, { recursive: true })
fs.cpSync(content, web, { recursive: true })
fs.mkdirSync(path.join(web, 'src'), { recursive: true })
fs.writeFileSync(path.join(web, 'src', lib), libText)
for (const junk of ['digests.txt', '.DS_Store']) fs.rmSync(path.join(web, junk), { force: true })

const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8')
if (!html.includes('src/' + lib)) fail(`index.html must load src/${lib} before the app scripts`)
const leftover = html.match(/__[A-Z_]+__/)
if (leftover) fail('unfilled placeholder in index.html: ' + leftover[0])

// 4. requestedOrigins for anything the app loads from outside the workbook.
if (origins.trim()) {
  const mf = path.join(pkg, 'manifest.json')
  const m = JSON.parse(fs.readFileSync(mf, 'utf8'))
  m.requestedOrigins = origins.trim().split(/\s+/).join(' ')
  fs.writeFileSync(mf, JSON.stringify(m, null, 2) + '\n')
}

// 5. Optional: pack a CSV as the workbook's data source and wire it to the data app's worksheet.
const twbName = fs.readdirSync(root).find((f) => f.endsWith('.twb'))
if (!twbName) fail('no .twb in the workspace')
let dsSummary = ''
if (csv) {
  const text = fs.readFileSync(csv, 'utf8').replace(/^﻿/, '')
  const rows = parseCsv(text).filter((r) => r.some((c) => c !== ''))
  if (rows.length < 2) fail('the CSV needs a header row and at least one data row')
  const header = rows[0].map((h) => h.trim())
  if (header.some((h) => !h) || new Set(header).size !== header.length) fail('CSV header names must be non-empty and unique')
  if (header.some((h) => /[\[\]]/.test(h))) fail('CSV header names cannot contain [ or ]')
  const body = rows.slice(1)
  const types = header.map((_, i) => inferType(body.map((r) => (r[i] ?? '').trim())))

  const base = path.basename(csv, path.extname(csv)).replace(/[^A-Za-z0-9_-]+/g, '_') || 'data'
  const dataDir = path.join(root, 'Data', base)
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, base + '.csv'), text)

  const id = crypto.randomBytes(14).toString('hex').slice(0, 28)
  const dsName = 'federated.' + id
  const connName = 'textscan.' + id
  const tableauType = { integer: 'integer', real: 'real', date: 'date', boolean: 'boolean', string: 'string' }
  const remote = header.map((h, i) => `            <column datatype='${tableauType[types[i]]}' name='${xml(h)}' ordinal='${i}' />`).join('\n')
  const cols = header.map((h, i) => {
    const measure = types[i] === 'integer' || types[i] === 'real'
    return `    <column datatype='${tableauType[types[i]]}' name='[${xml(h)}]' role='${measure ? 'measure' : 'dimension'}' type='${measure ? 'quantitative' : types[i] === 'date' ? 'ordinal' : 'nominal'}' />`
  }).join('\n')
  const ds = `  <datasources>
    <datasource caption='${xml(base)}' inline='true' name='${dsName}' version='18.1'>
      <connection class='federated'>
        <named-connections>
          <named-connection caption='${xml(base)}' name='${connName}'>
            <connection class='textscan' directory='Data/${xml(base)}' filename='${xml(base)}.csv' password='' server='' />
          </named-connection>
        </named-connections>
        <relation connection='${connName}' name='${xml(base)}.csv' table='[${xml(base)}#csv]' type='table'>
          <columns character-set='UTF-8' header='yes' locale='en_US' separator=','>
${remote}
          </columns>
        </relation>
      </connection>
      <aliases enabled='yes' />
${cols.replace(/^ {4}/gm, '      ')}
    </datasource>
  </datasources>`

  const twbPath = path.join(root, twbName)
  let twb = fs.readFileSync(twbPath, 'utf8')
  if (!twb.includes('<datasources />')) fail('unexpected template: no empty <datasources /> in ' + twbName)
  // First occurrence is the workbook level; the next is the worksheet's view.
  twb = twb.replace('  <datasources />', ds)
  twb = twb.replace('<datasources />', `<datasources>\n            <datasource caption='${xml(base)}' name='${dsName}' />\n          </datasources>`)
  fs.writeFileSync(twbPath, twb)
  dsSummary = ` | data source: ${base} (${body.length} rows; ${header.map((h, i) => h + ':' + types[i]).join(', ')})`
}

// 6. Zip the folder's contents (not the folder itself) into the .twbx.
const out = path.resolve(outFile)
fs.rmSync(out, { force: true })
execFileSync('zip', ['-q', '-r', '-X', out, '.', '-x', '*.DS_Store'], { cwd: root })

const entries = execFileSync('unzip', ['-Z1', out], { encoding: 'utf8' }).trim().split('\n')
console.log(`wrote ${out} (${fs.statSync(out).size} bytes, ${entries.length} entries)`)
console.log(`workbook: ${twbName} | package: ${pkgs[0]}${origins.trim() ? ' | requestedOrigins: ' + origins.trim() : ''}${dsSummary}`)
fs.rmSync(work, { recursive: true, force: true })

function parseCsv(s) {
  const rows = []; let row = []; let cell = ''; let q = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

function inferType(values) {
  const v = values.filter((x) => x !== '')
  if (!v.length) return 'string'
  if (v.every((x) => /^-?\d+$/.test(x))) return 'integer'
  if (v.every((x) => /^-?(\d+\.?\d*|\.\d+)$/.test(x))) return 'real'
  if (v.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x))) return 'date'
  if (v.every((x) => /^(true|false)$/i.test(x))) return 'boolean'
  return 'string'
}
