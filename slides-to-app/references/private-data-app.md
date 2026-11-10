# Private content → Tableau data app (inline build)

Use this instead of the iframe embed when the deck is **private**: company or other internal content, anything on a private Pages site, or any case where the user doesn't want a public URL. Private GitHub Pages sends visitors to a sign-in page, and that page refuses to be framed, so an iframe shows an error icon and a link-out. The app has to live **inside** the workbook instead.

The current single-script packer, `build-twbx.mjs` and the connector's publish flow have been tested end to end on Tableau Cloud with the deck starter (React 19 + Vite + Tailwind + motion), and the app rendered. An earlier version of the packer also ran a 30-slide deck in Tableau, with stand-in images.

## Contents
1. Decide the mode
2. Design for the data app from the start
3. Build and pack
4. Build the workbook and publish
5. What to tell the user
6. Gotchas

## 1. Decide the mode

| Situation | Mode |
|---|---|
| Public site (personal Pages), user wants live updates | iframe embed (`tableau-data-app.md`) |
| Private/internal content, company account, or the site is behind sign-in | **inline build (this file)** |
| User wants no web app at all, only the data app | inline build; still develop in the Vite project, and skip the publish step in SKILL.md §5 |

Keep developing and previewing in the Vite web app (hot reload, real console). The data app has no local preview, so the web app is the authoring surface and the data app is a build target of the same project. Don't maintain a second hand-written copy.

## 2. Design for the data app from the start

For any deck that may become a private data app:

- **No raster images or font files in the design.** Draw logos, avatars, icons and diagrams as SVG or CSS in components. Use a system font stack with the brand fonts as an optional first choice (they silently fall back to similar system fonts). If the deck has photos or logos that matter, say up front that the inline build shows stand-ins.
- **No code splitting.** One JS bundle, no dynamic `import()`. The deck starter already builds that way.
- **No network fetches** at runtime (the sandbox blocks origins not in the site's allow-list, and private hosts need sign-in).
- Keep the bundle lean.

## 3. Build and pack

```bash
cd <project> && npm run build
cd <skill>/assets/data-app-inline && npm install        # once
node pack.mjs <project> <project>/tableau/content "<App Name>" [overrides.json]
```

`<skill>` is this skill's base directory. `pack.mjs` does the whole conversion and prints a smoke-test result (it runs the output in jsdom and fails if nothing renders):

- writes the bundle as **one classic script**, `src/app-01.js` (no modules, no XHR, no `eval`), and the stylesheet as `src/css-01.css` with `@font-face` removed
- **Don't set `PACK_MAX_FILE`.** It brings back the old split into `big-NN.js` parts joined by `loader.js` with synchronous XHR, which Tableau-hosted extension content rejects ("Could not load app code: Failed to execute 'send' on 'XMLHttpRequest'…"). It only existed for the old per-file upload limit.
- generates `src/shim.js`: every image under `public/` is answered with a generated SVG (monogram badge, or an avatar for paths containing person/avatar/team/photo). Pass `overrides.json` to set real labels and colors: `{"logos/arch/b0": ["SAP", "#0b6cc5"], "personas/maya": ["M", "#1b46d6", "avatar"]}`. To label opaque filenames, look at the images (make a contact sheet) and set a label for each; say which labels are guesses.
- writes `index.html` with plain `<script>`/`<link>` tags in the right order (`src/tableau.extensions.1.latest.min.js` first), and `digests.txt`

If it reports the bundle isn't a classic script, the build has import/export or code splitting; fix the build, not the packer.

## 4. Build the workbook and publish

Follow `tableau-data-app.md` §3: pick project and name, offer the mock CSV (§2 there), `scaffold-data-app`, download the template at once, then:

```bash
node <skill>/assets/tableau-workbook/build-twbx.mjs \
  --template <project>/tableau/template.zip --scaffold <project>/tableau/scaffold.json \
  --content <project>/tableau/content --out "<project>/tableau/<Workbook Name>.twbx" \
  [--csv <project>/tableau/deck_outline.csv]
```

No `--origins`: the inline build loads nothing from outside the workbook. Then explicit yes → `request-workbook-upload` → upload → `publish-workbook` (`overwrite: true` for updates). Return the URL as given.

The packed files go into the `.twbx` as they are; nothing is typed into tool calls, so there's no per-file upload or digest check any more.

## 5. What to tell the user

- The data app contains a **copy** of the app. Later changes to the web app need `npm run build`, `pack.mjs`, `build-twbx.mjs` and a republish with `overwrite: true`; it doesn't update itself like the iframe version.
- Images are generated stand-ins and fonts fall back to system fonts.
- A packed CSV is readable by anyone who can download the workbook.
- You can't see inside Tableau's sandbox. Ask the user to open it and confirm it renders, animates and responds to arrow keys. If they see an error or a blank frame, ask for the exact text (it usually names the file or API that was blocked).

## 6. Gotchas

- Inside Tableau the app runs from a token-protected hosted URL: `<script>` and `<link>` tags work, but XHR/`fetch` to the app's own files doesn't. Load everything with tags.
- Don't hand-edit generated files; change the project and re-run `pack.mjs`.
- **Never base64-encode images or fonts into the scripts.** Use the SVG stand-ins.
