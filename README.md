# slides-to-app (Claude Code skill)

A Claude Code skill that turns a Google Slides deck into a polished, published web app, and optionally a Tableau data app.

- **Two web app formats:** a **presentable deck** (16:9 canvas, click/arrow-key navigation, animated builds, overview grid) or a **scrollable page** (scroll-told sections, pinned diagrams, chapter rail).
- **Three looks:** the deck's own theme, the Salesforce/Tableau corporate template, or a specific company's brand blended with the Tableau template.
- **Publishing:** to GitHub Pages under the account and org you choose (public for personal accounts; internal repo and private Pages where the org requires it).
- **Tableau data app (optional):** built and published with the Tableau Cloud connector, either as an iframe embed of a public site or as an inline build that packs the app into the workbook (for private/internal content). It can tie the data app to a **mock CSV data source** generated from the deck outline, your own CSV, or none.

The skill reads the deck text verbatim (no invented figures), leaves out slides marked **Skip slide**, shows a mockup before building everything, runs a confidentiality check, and asks before publishing anything to GitHub or Tableau.

## Repository contents

| Path | What it is |
|---|---|
| `slides-to-app/` | The skill folder: `SKILL.md`, `references/` (step-by-step guides) and `assets/` (deck starter, scroll kit, Tableau embed shell, inline packer, `.twbx` builder) |
| `dist/slides-to-app.zip` | The tested release ZIP (the skill folder plus `INSTALL.md`), unchanged |

## Install in Claude Code

Either:

- **From the ZIP:** unzip `dist/slides-to-app.zip` and move the `slides-to-app` folder into `~/.claude/skills/`, or
- **From this repo:** copy the `slides-to-app/` folder into `~/.claude/skills/`:
  ```bash
  git clone https://github.com/eliza-baldini/slides-to-app-skill.git
  cp -R slides-to-app-skill/slides-to-app ~/.claude/skills/
  ```

You should end up with `~/.claude/skills/slides-to-app/SKILL.md`. Restart Claude Code and check that `slides-to-app` appears in the skills list.

## Prerequisites

- **Google Slides connector** in Claude Code (reads the deck). The deck must be shared with you.
- **Node.js 24+** and npm.
- **git** and the **GitHub CLI** logged in (`gh auth login`), for publishing to GitHub Pages. GitHub Desktop works too: the skill can commit, and you push.
- **Tableau Cloud connector** (Tableau MCP), only for the data app step, with permission to publish to a project or your Personal Space.
- macOS is assumed for image resizing (`sips`), `zip` and `unzip`.

If you keep your own GitHub account rules in `~/.claude/CLAUDE.md`, the skill follows them.

## Use

Paste a Google Slides link and ask, for example, "turn this deck into a web app". The skill asks which GitHub account to use, where to save the project, the format and the theme, then shows a mockup before building the rest.

## What has been tested

| Mode | Status |
|---|---|
| Presentable deck web app (deck starter) | Tested: installs and builds cleanly from the release ZIP (`npm install`, `npm run build`). |
| Tableau data app, **inline build** + **mock CSV** data source | Tested end to end on Tableau Cloud: `scaffold-data-app` → `pack.mjs` → `build-twbx.mjs --csv` → staged upload → `publish-workbook` (new and `overwrite`). Published with no warnings; the CSV showed up as a queryable embedded data source and returned its rows; the app rendered in the browser. |
| Tableau data app, **iframe embed** of a public site | Partly tested: the `.twbx` builds and is valid, but it has not been published and rendered. It needs the site's origin (e.g. `https://<owner>.github.io`) on the Tableau site's allowed-origins list; the skill checks this and suggests the inline build if it's missing. |
| Scrollable page web app | Not re-tested in this release; `assets/scroll-kit/` holds the primitives the skill adapts into a new Vite project. |
| GitHub Pages publishing | Not re-tested in this release with the generalized account steps. |

## Notes

- A GitHub Pages site on a personal account is public even if the repo is private. For internal content, use an org that supports internal repos and private Pages, or the Tableau inline build.
- An inline-build data app is a copy: after changing the web app, re-run `pack.mjs` and `build-twbx.mjs` and republish with `overwrite: true`. An iframe embed always shows the live site.
- Licensed Salesforce fonts are not bundled; the templates use free stand-ins (Plus Jakarta Sans, Inter).
