# Publishing to GitHub Pages

Publishing is outward-facing and hard to take back: get the user's explicit yes for each push, and finish the confidentiality check (reading-the-deck §6) first.

## 1. Check the configuration

Run, and report what's missing:
```bash
git config --get user.name; git config --get user.email
gh auth status            # which GitHub accounts are logged in, and which is active
git -C <project> remote -v
```
- Publish under the account and owner chosen in SKILL.md §0. Run `gh` commands as that account with `GH_TOKEN=$(gh auth token --user <login>) gh …` rather than switching, and check it with `… gh api user --jq .login`. If the account wasn't chosen, or the email or remote doesn't match it, ask. Never push to an account or owner the user hasn't named.
- Check permission before creating anything: for an org, `gh api orgs/<org> --jq .members_can_create_repositories` (or ask the user); for an existing repo, `gh api repos/<owner>/<repo> --jq .permissions`.
- If `gh` isn't installed or logged in, either have the user run `gh auth login` themselves in a terminal, or ask them to create the empty repo on github.com and give you the URL. Don't handle their passwords or tokens.

## 2. Ask how they want to push

`AskUserQuestion`: "I push it for you" (with `gh`/`git`) vs. "I'll push it myself" (e.g. GitHub Desktop). If they push themselves, you commit locally, tell them exactly what to push, and verify after they say it's done.

When `gh` isn't installed, the user creates the repo from GitHub Desktop. Give these steps:
1. File → Add Local Repository → the project folder.
2. Publish repository: name = the slug, account/org = the one they named. On a free personal account, untick "Keep this code private": Pages only works for public repos there.
3. On github.com: Settings → Pages → Source: **GitHub Actions**.
4. Actions tab: if the first run failed because Pages wasn't on yet, choose Re-run all jobs.

Then run the live check in §4.

## 3. Set up the repo and Pages

1. `git init` (if needed), `.gitignore` with `node_modules`, `dist`, `.DS_Store`. Commit on `main`.
2. Create the repo when the user agreed to you doing it:
   ```bash
   gh repo create <owner>/<repo> --public --source <project> --remote origin    # personal: --public or --private
   gh repo create <org>/<repo> --internal --source <project> --remote origin     # company org: whatever its policy allows (often --internal)
   ```
   A GitHub Pages site on a personal account is **public even if the repo is private** — say so before choosing. In a company org, use the visibility its policy allows; never make a work repo or site public without the user's approval and their confirmation that policy allows it.
3. Workflow: `.github/workflows/deploy.yml` (in the deck starter; copy it for the scroll format). It builds on push to `main` with Node 24 and deploys `dist/` with `actions/upload-pages-artifact` + `actions/deploy-pages`. Vite must use `base: './'`.
4. Set Pages to deploy from GitHub Actions **before** the first push:
   ```bash
   gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow   # or PUT if Pages already exists
   gh api -X PUT repos/<org>/<repo>/pages -F public=false             # org with private Pages: make the site private
   ```
5. Push (`git push -u origin main`) or let the user push.

## 4. Verify the live site

- Watch the run: `gh run watch --repo <owner>/<repo>` (or `gh run list`).
- Personal URL: `https://<owner>.github.io/<repo>/` — case-sensitive, matching the repo name. Private org site: read the URL from `gh api repos/<org>/<repo>/pages --jq .html_url` (often a `*.pages.github.io` address). It needs GitHub sign-in to the org, so `curl` gets a redirect: check it with `public` = false from the API and ask the user to open it in their signed-in browser.
- Confirm it serves *this* build: compare the hashed script name in the live HTML with your local `dist/`:
  ```bash
  curl -s "https://<owner>.github.io/<repo>/?t=$(date +%s)" | grep -o 'index-[A-Za-z0-9_-]*\.js'
  ls dist/assets | grep -o 'index-[A-Za-z0-9_-]*\.js'
  ```
  It can take a minute or two; retry every 20s.
- Check a few assets return 200 (`curl -s -o /dev/null -w '%{http_code}' <url>/personas/x.jpg`).
- Tell the user: Pages caches `index.html` ~10 minutes, so anyone who had the site open may need a hard refresh (Cmd+Shift+R); "the live site still shows the old deck" is almost always that.

## 5. Updates

Each round of tweaks: commit with a clear message, get approval, push (or have the user push), re-run the live check.
