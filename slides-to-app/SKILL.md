---
name: slides-to-app
description: Turn a Google Slides deck into a polished, published web app — either a scroll-told page or a click-through presentation deck with animated builds — styled like the original deck, the Salesforce/Tableau corporate template, or a specific company's brand blended with the Tableau template, then published to GitHub Pages, and optionally turned into a Tableau data app published with the Tableau Cloud connector (an iframe embed of a public site, or an inline build for private/company content, optionally tied to a mock CSV data source). Use this whenever someone shares a docs.google.com/presentation link and wants it as a website, web app, interactive page, microsite, scrollytelling page, "app version of my deck", or an online presentation, or asks to "make this deck interactive", "turn these slides into a site", or "publish my slides to GitHub", or wants a deck as a Tableau data app, even if they don't say "web app".
---

# Slides → Web App

Turn a Google Slides deck into a premium interactive web app and publish it. The deck is the source of truth for **content and narrative**; the app should feel like a crafted product, not a screenshot of slides.

The flow has six stages, plus an optional seventh. Do them in order, and don't skip the questions: each one changes what you build.

0. Ask: which GitHub account, and where to save the project
1. Read the deck
2. Ask: scrollable page or presentable deck
3. Ask: how it should be formatted
4. Name the app, show a mockup in the Browser pane, then build it out
5. With approval, publish to the user's GitHub
6. Optional: make a Tableau data app with the Tableau Cloud connector (iframe embed of a public site, or an inline build for private content), optionally tied to a mock CSV data source

Track these stages in the task list so the user can see where you are.

**Paths in this skill.** `assets/…` and `references/…` are relative to this skill's own folder: the "Base directory" shown when the skill loads (often `~/.claude/skills/slides-to-app`). Use that absolute path in commands.

**What it needs:** the Google Slides connector (to read the deck), Node.js 24+ and npm, `git` and the GitHub CLI `gh` (for publishing), and the Tableau Cloud connector (only for §6). Image steps use macOS `sips`; on other systems use whatever image tool is installed.

## 0. Ask: which GitHub account, and where to save the project

Before reading the deck, settle where this app will live. The skip-slide disclaimer from §1 still opens your first reply; ask these right after it. Skip any question the user already answered in this conversation.

1. **See what's set up.** Run `gh auth status` (it lists every logged-in GitHub account and which one is active) and `git config --global user.email`. If `gh` isn't installed or no account is logged in, say so, and tell the user they can run `gh auth login` themselves or publish later with GitHub Desktop. Don't log in, log out or switch accounts for them.
2. **Ask with `AskUserQuestion`** (header "Account"): which account and owner to publish under. Offer each logged-in account, plus "an organization" (then ask which org). Ask whether the deck is **personal** or **work/company** content; that decides visibility in §5.
3. **Ask where to save the project** (header "Folder"). Offer `~/Documents/GitHub/<slug>` as the default, or a folder they name. Don't build in the session's scratch/working folder if it's a hidden app folder: tools like GitHub Desktop's "Add Local Repository" picker can't reach it.

To use one account without switching the active one, run GitHub commands as `GH_TOKEN=$(gh auth token --user <login>) gh …`, and never print the token. If the user has their own account rules (in `~/.claude/CLAUDE.md` or a project `CLAUDE.md`), those override this section.

**Visibility rules to tell the user:**
- **Personal account:** a GitHub Pages site is always **public**, even when the repo is private (and a free plan needs a public repo for Pages at all).
- **Organization / company account:** follow the org's policy. Many enterprise orgs only allow `internal` repos and offer private (sign-in) Pages; some disable Pages. Check with `gh api orgs/<org> --jq '{members_can_create_internal_repositories, members_can_create_private_repositories, members_can_create_public_repositories, members_can_create_pages, members_can_create_private_pages}'` (fields can be missing on some plans; if so, ask the user).
- Never publish work content publicly without the user's explicit approval **and** their confirmation that company policy allows it.

## 1. Read the deck

The user gives a Google Slides link (and maybe instructions like "skip slides 16–18"). Extract the presentation ID from the URL (`/presentation/d/<ID>/`).

**Open your first reply with this disclaimer,** before any tool output or summary, so the user can unskip anything they want included:

> Heads up: slides marked **Skip slide** in Google Slides won't be included in the web app. If you want any of them in, unskip them in the deck (or tell me which ones) before I build.

Decks often arrive as other links. A Slack file link (`*.slack.com/files/<user>/<FILE_ID>/…`) can be tried with the Slack connector's `slack_read_file` (the ID starts with `F`), but large decks and files stored elsewhere come back unavailable. A Drive file link or an attached `.pptx` isn't a Slides presentation the connector can read. In those cases, ask the user for the Google Slides link, or to open the PowerPoint in Google Slides (Drive → Open with → Google Slides) and share that link. Don't build from a file you couldn't fully read.

Read `references/reading-the-deck.md` before you start. It covers the Slides connector calls, field masks, grouped shapes, off-canvas draft text, thumbnails, **downloading images and logos while their URLs are still valid**, and the confidentiality check. The short version:

- Get slide IDs and text with `read_presentation` using targeted field masks; get a thumbnail of every slide so you see what's actually visible.
- Images (`image.contentUrl`) are temporary signed URLs — download the ones you'll use as soon as you find them.
- Copy text **verbatim**. Never invent figures, names or quotes. Leave speaker notes out unless the user asks for them.
- Leave out slides marked skipped in the deck (`slides.slideProperties.isSkipped: true`), unless the user asks for them. Treat them like user exclusions.
- Respect exclusions the user gives ("don't include slides 16–18") everywhere: content files, bundle, README.

If the Google Slides connector isn't available or can't open the deck, stop and tell the user (they may need to connect or share it); don't guess at content.

Before asking anything, briefly tell the user what you found: deck title, slide count, the sections you see. List any skipped slides by number and title, and say they're being left out (or "No slides are marked skipped").

## 2. Ask: scrollable page or presentable deck

Use `AskUserQuestion`:

- **Presentable deck (Recommended for presenting live)** — a 16:9 canvas that scales to any screen; one click/→/Space per slide; each slide's builds auto-play; top bar with section tabs, slide counter, Overview grid and prev/next. Details: `references/format-deck.md`. Starter project: `assets/deck-starter/`.
- **Scrollable page** — one continuous, scroll-told page: sections reveal as you scroll, key diagrams pin and animate with scroll, floating top bar with chapter links and a dot rail. Details: `references/format-scroll.md`. Primitives: `assets/scroll-kit/`.

Put the recommendation first. If the user said "present", "click through", "meeting", lean deck; "share", "send", "read on their own", lean scroll.

## 3. Ask: how it should be formatted

Use `AskUserQuestion` with these three options (the "Other" box lets them type a company):

- **Same as their deck** — reuse the deck's own theme colors, fonts (via web-safe substitutes), backgrounds and logo.
- **Salesforce/Tableau corporate template** — the look of the Tableau Corporate Template 2026 and FY27 First Call Deck.
- **A specific company** — ask for the company name (follow up with a short question if they picked this without typing one). Build from that company's brand/style guide **combined with** the Tableau template's structure.

Then read `references/themes.md` for what each option means in tokens, fonts, surfaces and logos — including how to research a company's brand responsibly and what not to do with licensed fonts and third-party logos.

## 4. Name the app, mock it up, build it

**Name.** Propose a short name and repo slug derived from the deck (e.g. "FY27 Q3 CEO Product Review" → `fy27-q3-ceo-review`). Ask the user to confirm or change it with `AskUserQuestion` (offer your proposal plus one alternative). The name becomes the page `<title>`, the README heading and the GitHub repo name.

**Scaffold.** Create the project at the path chosen in §0, e.g. `~/Documents/GitHub/<slug>` (if the folder already exists, ask before reusing it). Check the repo name isn't taken under the chosen owner (`gh repo view <owner>/<slug>`). Run `git init -b main` there once the first build works, so the folder is ready to publish, and set the repo's git author if the user wants a different one from their global config (`git config user.email …`).
- Deck: copy `assets/deck-starter/` and run `npm install`. It already builds; replace `src/content/*`, `src/slides/*` and the registry in `src/deck/slides.tsx`.
- Scroll: scaffold Vite + React + TS, install `motion lenis tailwindcss @tailwindcss/vite @fontsource-variable/*`, then copy what you need from `assets/scroll-kit/` and adapt it.
- In both, set the theme tokens in `src/index.css` per the chosen format option (§3).

**Mockup first.** Before building every slide, build the opening plus two or three representative slides/sections (one dense diagram, one card layout) in the chosen theme. Ask whether the direction is right. This catches theme and layout mismatches when they're cheap to fix.

**Make sure the user can actually see it.** Your screenshots come from a browser page the user may not be looking at, so "it's in the pane" isn't enough. Follow "Showing the app to the user" below every time you ask for feedback.

**Build out.** Then build every remaining slide/section from the content files. Patterns that worked well (and the corrections users asked for) are in the format reference — read the relevant one before writing slides. Key ones:
- All copy lives in `src/content/*`; components never hard-code text.
- Recreate the deck's visuals as real UI (cards, diagrams, charts) rather than pasting slide images. Use the deck's actual photos and logos where the slide has them.
- Slides that build on one diagram should share one canvas (deck format: `group`), not transition between near-identical slides.

**Verify** in the Browser pane after each batch: screenshots of each slide/section, an overflow check (nothing clipped or overlapping), console errors, and every image loading. Then `npm run build` and lint. See "Verification" in the format reference. Show the user the finished app (see "Showing the app to the user") and summarize what's there.

### Showing the app to the user

The dev server runs in the new project, but the Browser pane only reads `.claude/launch.json` from **the session's working directory**, which is usually a different folder.
1. Add the entry to the working directory's `.claude/launch.json` (create the file if it doesn't exist). Point it at the project with `npm --prefix`, and give it a fixed port that other servers don't use:
   ```json
   { "name": "<slug>-dev", "runtimeExecutable": "npm",
     "runtimeArgs": ["--prefix", "<absolute project path>", "run", "dev", "--", "--port", "5181", "--strictPort"],
     "port": 5181 }
   ```
2. Start it with `preview_start`, then confirm it responds (`curl -s -o /dev/null -w '%{http_code}' http://localhost:<port>/`).
3. Bring it in front of the user with `mcp__ccd_view__show_pane` (`pane: "preview"`), loading it with `ToolSearch` first if needed.
4. If that call errors (for example "no page open") or the user says they can't see it, don't keep retrying the pane. Open the app in their default browser instead: `open http://localhost:<port>/` on macOS, `xdg-open` on Linux, `start` on Windows.
5. In your message, always give the plain URL (`http://localhost:<port>/#<slide-id>`) and the keys to try (→ / Space, O for overview), and say which slides to look at. The user may be looking at a different window, so they need a way in that doesn't depend on the pane.

Keep the server running while the user reviews. If the user stops or restarts it from the pane, `preview_list` shows a new server ID; use that one.

## 5. Publish to GitHub (only with approval)

Publishing makes the content public, so never publish without the user's explicit yes in this conversation — and run the confidentiality check from `references/reading-the-deck.md` first, telling the user anything sensitive you found.

Read `references/publishing.md`. In short:
- Use the account and owner chosen in §0. Check that `git config user.email` and the remote (`github.com/<owner>/…`) match it. If anything is missing or doesn't match, **ask** rather than guessing; never push to an account or owner the user hasn't named.
- Personal account: the Pages site is public. Organization: use the visibility its policy allows (often `--internal`), and private Pages where available.
- Ask how they want to push: you push with `gh`/`git`, or they push themselves (e.g. GitHub Desktop) after you commit.
- Add the GitHub Pages workflow (already in the deck starter), make sure Pages uses GitHub Actions, push, then confirm the live URL serves the new build.
- Tell the user a personal GitHub Pages site is public even if the repo is private (a private org Pages site needs GitHub sign-in), and that viewers may need a hard refresh after updates.

## 6. Optional: make a Tableau data app

Once the web app works (and, for a public site, the live check in step 5 passes), offer this with `AskUserQuestion` ("Also make a Tableau data app from it?"). Offer it even if the user didn't mention Tableau; skip the question if they've already said yes or no.

Everything goes through the **Tableau Cloud connector** (Tableau MCP): `scaffold-data-app` returns a template you finish locally, `assets/tableau-workbook/build-twbx.mjs` turns it into a `.twbx`, and `request-workbook-upload` + `publish-workbook` publish it. Load the tools with `ToolSearch` first. If the connector isn't connected or needs sign-in, tell the user to connect it (`/mcp` or the app's connector settings) and stop this step.

**1. Pick the mode.**
- **Iframe embed (public sites):** the data app shows the live site full-screen, so every later push to the web app appears in Tableau with no republish. Say this when you offer it; it's the reason to embed rather than copy. Details: `references/tableau-data-app.md`.
- **Inline build (private content):** for work/internal decks, private Pages sites, or when the user wants no public URL. A private Pages sign-in page refuses to be framed, so the app's code is packed into the workbook instead. It's a copy that needs a re-pack to update; images become generated stand-ins and fonts fall back to system fonts. Details: `references/private-data-app.md`.

**2. Ask about a data source** (header "Data"). The data app doesn't need one, but tying it to data lets the app (or a later version) query real rows through the Extensions API, and gives Tableau users something to explore. Offer:
- **Mock CSV from the deck (Recommended)** — you generate a small CSV from the deck outline: one row per included slide with `slide,section,title,slide_id,app_url` (plus any figures the deck states verbatim, if the user wants them). Show the user the rows before packing. No invented numbers; skipped/excluded slides stay out.
- **Their own CSV** — they give a file path; check it has a header row and is small (a few MB at most).
- **No data source.**
The CSV is packed inside the `.twbx` and wired to the data app's worksheet (`--csv`). It travels with the workbook, so apply the confidentiality check to it too.

**3. Build and publish** (both modes; details in `references/tableau-data-app.md` §3): `list-projects` (with `capability: "Write"`) → ask for project and workbook name → `scaffold-data-app` → download the template right away → fill the content → `build-twbx.mjs` → explicit yes → `request-workbook-upload` → upload → `publish-workbook`. Return the published URL exactly as given, and ask the user to open it and confirm it renders: you can't see inside Tableau.

## After publishing

If there's an inline-build data app (private content), it holds a copy: after web app changes, rebuild, re-run `pack.mjs` and `build-twbx.mjs`, and republish with `overwrite: true` (`references/private-data-app.md`).

Users usually come back with tweaks ("include the photos from slide 10", "make 13–15 build on each other", "remove the loading bar"). Handle each as: re-read the relevant slide, change content or components, verify in the pane, build, commit, and (with approval) push and re-check the live site. If there's an iframe-embed Tableau data app, it picks up the change on its next load; nothing to republish. An inline-build one needs a re-pack and republish.
