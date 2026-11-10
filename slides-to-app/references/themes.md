# Formatting options

All three options set the same token names in `src/index.css` (`@theme`), so components never change, only tokens, fonts, surfaces and the logo. Keep the names (`navy-*`, `royal`, `cyan`, `sky`, `paper`, `ink*`, `line`…) even when the colors aren't blue; they describe roles: `navy-900` = primary ink/dark surface, `royal` = primary accent on light, `cyan` = highlight on dark, `sky` = soft fill, `paper` = page background.

## Contents
1. Same as their deck
2. Salesforce/Tableau corporate template
3. A specific company (brand × Tableau template)
4. Fonts and logos: rules

## 1. Same as their deck

- Palette: convert `masters[].pageProperties.colorScheme.colors` to hex. Map `DARK1`/`TEXT1` → `ink`/`navy-900`, `ACCENT1` → `royal`, the brightest accent → `cyan`, `LIGHT2`/`BACKGROUND2` → surfaces. Check against thumbnails: the theme scheme and the colors actually used on slides sometimes differ; trust the slides.
- Fonts: read `textRun.style.fontFamily` on titles and body text. Use the same family if it's on Google Fonts/Fontsource; otherwise the closest free match (geometric display → Plus Jakarta Sans / Poppins / Outfit; humanist body → Inter / Source Sans 3).
- Surfaces: reproduce the deck's background treatments (gradients, photo washes, dark section slides) as `surface` values.
- Logo: use the deck's own logo image from the title slide (download it as in reading-the-deck §4).

## 2. Salesforce/Tableau corporate template

Sources: *Tableau Salesforce Corporate Template 2026* (`1AabZqUP0ca9NnoZbnEepFp_ePxfzaAmGwj6Dd2mdduM`) and *FY27 Tableau First Call Deck* (`1a7WAc29bzLFeo-ejrtKPgPzp-E0wz_nGtZPsOXAHn3k`). The deck starter's `index.css` already holds these tokens.

**Palette**

| Token | Hex | Template role |
|---|---|---|
| `navy-950` | `#000F33` | Darkest surface |
| `navy-900` | `#001E5B` | Titles, body ink, dark cards (template DARK1/TEXT1) |
| `navy-800` | `#002775` | Dark section background |
| `royal` | `#022AC0` | Primary blue, cover gradient base (DARK2) |
| `cyan` | `#00B3FF` | Bright accent, highlighted title words, pills (LIGHT2) |
| `cyan-soft` | `#90D0FE` | Soft accent, bars in the title art (ACCENT1) |
| `sky` | `#EAF5FE` | Light card fill (ACCENT6) |
| `paper` | `#F5F9FF` | Page background; template content slides use a light sky `#CFE9FE`-ish wash |
| `teal` | `#04E1CB` | Accent (ACCENT2) |
| `gold` | `#FCC003` | Accent / callout banner (ACCENT3) |
| `pink` | `#FF538A` | Accent (ACCENT4) |
| `violet` | `#D17DFE` | Accent (ACCENT5) |
| `link` | `#066AFE` | Links, arrow buttons |

**Look**
- **Covers and dividers:** deep blue gradient (`#0418A8 → #0A2FD0`, glows `#0B4BF0` / cyan from the bottom), white display title with the key words in cyan, the "tableau from Salesforce" lockup top-left, a white circular badge with the colored Tableau plus mark, cyan four-point sparkles and small white plus signs. `src/slides/Opening.tsx` implements this.
- **Content slides:** light sky background, navy title (~54pt-equivalent, `.display`) with a lighter subtitle below, Tableau lockup small in the top-right corner, white rounded cards (24px radius, soft navy shadow), light-blue pill rows with blue circular arrow buttons, a small three-bar + sparkle motif bottom-right.
- **Type scale (template guidance):** title 54pt, subtitle 36pt, first-level text 30pt, bullets 24pt, category header 26pt, description 22pt. On the 1600×900 canvas that's roughly title 46–52px, subtitle 22–26px, body 18–22px.
- **Fonts:** the template uses **Avant Garde Demi SFDC** for titles/headings/numbers and **Salesforce Sans** for subheads, body, captions, eyebrows. Both are licensed — don't self-host them on a public site. Use **Plus Jakarta Sans** (display, weight 700, tracking −0.035em) and **Inter** (body) as stand-ins, already wired in the starter. Don't use the display face for body copy.

## 3. A specific company (brand × Tableau template)

Goal: it should read as *that company's* deck, built with Tableau's structure and polish. Typical uses: a customer-facing version of a pitch.

1. **Research the brand.** Use web search/fetch for the company's official brand or press page ("<company> brand guidelines", "<company> press kit / media kit / logo"). Gather: primary and secondary colors (hex), typefaces, logo usage rules, tone. Prefer official sources; note what you couldn't confirm and tell the user.
2. **Blend:**
   - Company colors replace the Tableau palette roles: their primary → `royal`, their darkest → `navy-900`/`ink`, their bright accent → `cyan`, a tint of the primary → `sky`/`paper`. Keep enough contrast (body text ≥ 4.5:1).
   - Keep the Tableau template's **structure**: cover/divider treatment, light content slides, white rounded cards, type scale, motion, chrome.
   - Fonts: the company's typeface if it's freely licensed for the web (Google Fonts/Fontsource); otherwise the closest free match. Never self-host a proprietary brand font.
   - Logo: the company's logo from their official media/press page, in the top bar and on the cover, and the Tableau lockup as "Powered by"/co-brand where the deck is about Tableau. Ask the user before using a third-party logo on a public site.
3. Show the mockup (SKILL.md §4) before building out, and call out any brand values you had to approximate.

## 4. Fonts and logos: rules

- Self-host free fonts via `@fontsource-variable/*` (no Google Fonts CDN calls needed); set them in `--font-display` / `--font-sans`.
- Licensed brand fonts (Salesforce's, most corporate typefaces) stay off public sites. Mention the substitution in the README.
- Logos: use official assets, don't recolor or distort them, keep clear space. For Tableau, the simplified plus mark in `components/ui/TableauMark.tsx` is used on covers and the top bar.
