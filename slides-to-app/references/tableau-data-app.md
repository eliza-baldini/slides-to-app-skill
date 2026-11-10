# Tableau data app with the Tableau Cloud connector

> **Private content or a company account with private Pages?** The iframe route in §4 can't work there, because a private Pages sign-in page refuses to be framed. Follow §3 here for the build and publish steps, and take the app content from `private-data-app.md`.

This flow (scaffold → `build-twbx.mjs` with a mock CSV → staged upload → publish to Personal Space, then republish with `overwrite: true`) has been tested end to end on Tableau Cloud with the inline build: it published with no warnings, the packed CSV was listed as a queryable embedded data source that returned its rows, and the app rendered in the browser.

A Tableau data app is a workbook whose worksheet hosts a **viz extension**: a small web app packaged inside the `.twbx`. This skill makes one of two kinds:

```
<workbook>.twbx
├─ <workbook>.twb                      worksheet with the viz extension (+ optional CSV data source)
├─ Data/<name>/<name>.csv              optional mock or user CSV (--csv)
├─ Resources/.agents/README.md         from the template; keep it
└─ Packages/<package-id>/
   ├─ manifest.json                    requestedOrigins lives here
   ├─ extensions/data-app.trex
   └─ content/                         the extension's web root
      ├─ index.html
      └─ src/  tableau.extensions.1.latest.min.js + app files
```

- **Iframe embed** (`content/` = `assets/tableau-embed/`): one full-viewport `<iframe>` showing the live public site. Every later push to the site shows in Tableau on the next load, with no republish.
- **Inline build** (`content/` = output of `assets/data-app-inline/pack.mjs`): the app itself, packed into classic scripts. See `private-data-app.md`.

## Contents
1. Prerequisites
2. The data source option (mock CSV)
3. Build and publish (both modes)
4. Iframe shell files
5. Using the data inside the app (optional)
6. Limits to tell the user about
7. Checks

## 1. Prerequisites

1. **Tableau Cloud connector (Tableau MCP)** with `list-projects`, `scaffold-data-app`, `request-workbook-upload`, `publish-workbook` (and `get-workbook`/`query-datasource` for checks). They're usually deferred: load them with `ToolSearch` (e.g. `scaffold-data-app publish-workbook`). If the connector needs sign-in, tell the user to authorize it; if `scaffold-data-app` is missing, their connector version or site doesn't support data apps, so say so and stop.
2. **Iframe embed only:** the web app is live at a public HTTPS URL (SKILL.md §5 live check passed), and `curl -sI <url>` shows no `X-Frame-Options: DENY` or restrictive `frame-ancestors`. GitHub Pages sends neither.
3. **Command-line tools:** Node.js, `curl`, `unzip`, `zip` (all standard on macOS).

## 2. The data source option (mock CSV)

The current template needs **no** data source. Offer one anyway (SKILL.md §6 step 2), because a data app tied to data can query it live, and Tableau users get fields to explore.

**Mock CSV from the deck (recommended).** Write it into the project, e.g. `<project>/tableau/deck_outline.csv`:

```csv
slide,section,title,slide_id,app_url
1,Opening,FY27 Kickoff,opening,https://<owner>.github.io/<repo>/#opening
2,Strategy,Where we play,strategy,https://<owner>.github.io/<repo>/#strategy
```

- One row per **included** slide, in deck order, with titles copied verbatim from `src/content/*`. Leave skipped/excluded slides out.
- `slide_id` matches the app's slide/section ids, so the app can deep-link from a row later. For the inline build, leave `app_url` out (or blank) when there is no public URL.
- Add figure columns only for numbers the deck states verbatim, and only if the user wants them. Never invent values; if the user asks for illustrative numbers, label the column clearly (e.g. `sample_value`) and say they're made up.
- Show the user the rows and get a yes before packing.

**Their own CSV.** Ask for the path; check it has a unique header row, no `[` or `]` in names, and is small (a few MB at most; bigger data belongs in a published data source).

`build-twbx.mjs --csv <file>` copies the CSV into `Data/<name>/`, adds a text-file data source with inferred column types (integer, real, `YYYY-MM-DD` date, boolean, else string; integers and reals become measures) and wires it to the data app's worksheet. The CSV travels with the workbook: anyone who can download the workbook can read it, so it goes through the confidentiality check.

## 3. Build and publish (both modes)

1. **Ask where it goes.** `list-projects` with `capability: "Write"` (only projects the user can publish to). Shared sites can have dozens of top-level projects and nested personal folders, so first look for one named after the user (`filter: "name:eq:*<surname>*"`), then walk down with `parentProjectId:eq:<id>`. Offer the best matches plus **Personal Space** (`publish-workbook` without `projectId`). Ask for the workbook name too (default: the web app's name; letters, digits, spaces, `.`, `_`, `-`). An occasional 401 can be transient: retry once before asking the user to re-authorize.
2. **Scaffold.** `scaffold-data-app` with `datappName` = the workbook name. Save the whole result as JSON (e.g. `<project>/tableau/scaffold.json`).
   - It returns `allowedOrigins` (the site's allow-list for external origins) and a `postUnzip` plan.
   - **Iframe embed:** if the site's origin (`https://<owner>.github.io`) isn't in `allowedOrigins`, tell the user now: a Tableau site admin has to add it, or the embed renders blank. Offer the inline build as the alternative.
3. **Download the template immediately.** If the result has `s3URL`, it's a presigned link that expires in about 60 seconds: `curl -sf -o <project>/tableau/template.zip '<s3URL>'` in the very next call, then `file` it to confirm it's a zip. If it expired, call `scaffold-data-app` again. If the result has `filePath` instead, copy that file.
4. **Prepare the content folder.**
   - Iframe: copy `assets/tableau-embed/` to `<project>/tableau/content/` and fill its placeholders (§4).
   - Inline: run `pack.mjs` (see `private-data-app.md` §3); its output folder is the content folder.
5. **Build the workbook:**
   ```bash
   node <skill>/assets/tableau-workbook/build-twbx.mjs \
     --template <project>/tableau/template.zip --scaffold <project>/tableau/scaffold.json \
     --content <project>/tableau/content --out "<project>/tableau/<Workbook Name>.twbx" \
     --origins "https://<owner>.github.io" \
     --csv <project>/tableau/deck_outline.csv
   ```
   Drop `--origins` for the inline build (it loads nothing external) and `--csv` if the user chose no data source. The script applies the scaffold edits and renames, swaps in your content while keeping `src/tableau.extensions.1.latest.min.js`, refuses unfilled `__PLACEHOLDER__`s, and zips the `.twbx`. Add `tableau/*.twbx`, `tableau/template.zip` and `tableau/scaffold.json` to `.gitignore`.
6. **Confirm, then publish.** Publishing puts content on the user's Tableau site, so get an explicit yes for the project, workbook name and whether a CSV is included. Then:
   - `request-workbook-upload` with `fileName` = the `.twbx` file name. It returns `workbookUploadId`, `uploadUrl` (expires in about 60 seconds) and `requiredHeaders`. Upload in the very next call, sending every required header:
     ```bash
     curl -s -w '\nHTTP %{http_code}\n' -X PUT -H 'Content-Type: application/octet-stream' \
       --upload-file "<project>/tableau/<Workbook Name>.twbx" '<uploadUrl>'
     ```
     Expect `HTTP 200`. If the URL expired, request a new one.
   - `publish-workbook` with `name`, `workbookUploadId`, and `projectId` (or none for Personal Space). Use `overwrite: true` only for an update the user asked for.
   - If the connector returns no upload URL but supports local paths, pass `workbookFilePath` instead.
   - If publishing fails, report Tableau's error exactly; don't retry with changed settings without telling the user.
7. **Check what you can, then hand over.**
   - `get-workbook` with the published `id`: the view should be listed, and with `--csv` the CSV appears under `upstreamDatasources` as an `embedded` data source with `queryability.isQueryable: true`.
   - With a CSV, a quick `query-datasource` (pass the data source `luid` and `workbookLuid`) should return the CSV's rows. Dates come back as `YYYY-MM-DDT00:00:00`.
   - Don't rely on `get-view-image`: it can return a Tableau sign-in page or a "can't export Viz Extensions" placeholder rather than the app.
   - Return the `url` from `publish-workbook` exactly as given, and ask the user to open it and confirm the app shows and responds to clicks and arrow keys. You can't see inside Tableau's sandbox.

## 4. Iframe shell files (`assets/tableau-embed/`)

| File | Placeholders | Notes |
|---|---|---|
| `index.html` | `__APP_NAME__`, `__SITE_URL__` | One full-viewport iframe. To open on a specific slide, append `#slide-id` to the URL. Keep the `src/tableau.extensions.1.latest.min.js` script tag before `app.js`. |
| `src/styles.css` | `__BACKGROUND__` | The web app's own background color, so there's no white flash while it loads. |
| `src/app.js` | `__SITE_ORIGIN__` | Initializes the Extensions API and focuses the iframe so arrow keys and Space drive the deck without an extra click. |

The Extensions API library ships in the scaffold template; `build-twbx.mjs` keeps it. Don't fetch it from a CDN.

## 5. Using the data inside the app (optional)

The basic app doesn't query the CSV. If the user wants the app to read it (e.g. a slide picker or live figures), the extension can query the bound data source:

```js
await tableau.extensions.initializeAsync()
const [ds] = await tableau.extensions.workbook.getAllDataSourcesAsync()
const { data: rows } = await ds.queryAsync({ fields: [{ fieldCaption: 'title' }, { fieldCaption: 'slide_id' }] })
```

- **Iframe embed:** the shell queries and passes rows to the site with `frame.contentWindow.postMessage({ type: 'rows', rows }, SITE_ORIGIN)`; the web app needs a `message` listener that checks `event.origin`. That's a change to the web app itself, so treat it as a separate request.
- **Inline build:** the packed app can call the API directly, guarded by `if (window.tableau?.extensions)` so it still runs as a plain web app.
- Keep queries few and small (one query when the data is small). If the `anthropic-skills:tableau-data-app-performance` skill is installed, follow it.

## 6. Limits to tell the user about

- **Allowed origins (iframe).** The site's origin must be in the Tableau site's allow-list (`allowedOrigins` from the scaffold) and in the package's `requestedOrigins` (`--origins`). If it isn't allowed, the embed renders blank until an admin adds it.
- **It depends on the live site (iframe).** If the site is taken down, renamed, or its repo renamed (the Pages URL follows the repo name), the data app breaks.
- **Public stays public.** Embedding in Tableau doesn't restrict who can see a public site; Tableau permissions don't protect it. For confidential content use the inline build.
- **The CSV is inside the workbook.** Anyone who can download the workbook can open it.
- **Only the extension talks to Tableau.** An embedded site can't call the Extensions API; anything from Tableau comes through `postMessage`.
- **Large media loads inside Tableau too.** Big GIFs or videos load in the worksheet the same way.
- **A worksheet title may show above the app.** If the user sees one, someone with web-edit rights can hide it: Edit → Worksheet → uncheck Show Title → Save. Pick a workbook name that reads well as a heading just in case.

## 7. Checks

1. Before building: (iframe) the site URL returns 200, allows framing, and its origin is in `allowedOrigins`.
2. Before publishing: the confidentiality check from reading-the-deck §6 has passed for the app **and** the CSV, and the user has confirmed project, name and data source.
3. After publishing: return the Tableau URL verbatim, mention allowed origins and public hosting where relevant, and ask the user to confirm it renders.
