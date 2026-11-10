# Reading the deck

How to get everything you need out of a Google Slides deck with the Slides connector (`read_presentation`, `read_slide_page`, `read_slide_page_thumbnail`). These tools are often deferred — load them with `ToolSearch` (`select:<full tool names>`) first.

## Contents
1. Slide list and theme
2. Text
3. Thumbnails (what's actually visible)
4. Images: photos, logos, icons
5. Content rules
6. Confidentiality check (before any publishing)

## 1. Slide list and theme

Start small, then go per slide — full unmasked reads of a big deck are huge.

```
read_presentation(presentationId, fields: ["title", "pageSize", "slides(objectId,slideProperties(isSkipped,layoutObjectId))", "masters(pageProperties.colorScheme)"])
```

- `slides.objectId` gives the order; deck slide N is `slides[N-1]`.
- `masters[].pageProperties.colorScheme.colors` is the theme palette (`DARK1`, `LIGHT1`, `ACCENT1–6`, `HYPERLINK`…). Components are 0–1 floats; a missing channel means 0. Convert to hex for the "Same as their deck" theme.
- Section divider slides (big title, little else) define the app's sections/tabs.

## 2. Text

Per slide, ask only for text and geometry:

```
read_slide_page(presentationId, pageId, fields: [
  "pageElements(objectId,transform(translateX,translateY,scaleX,scaleY),size,shape(text(textElements(textRun(content,style(bold,italic,foregroundColor))))),table(tableRows(tableCells(text(textElements(textRun(content)))))),elementGroup(children(objectId,transform,shape(text(textElements(textRun(content)))),elementGroup(children(objectId,shape(text(textElements(textRun(content))))))))"
])
```

- Walk `elementGroup.children` — text inside groups (up to ~3 levels) is easy to miss.
- `translateX/Y` (EMU) tells you reading order and which column a text box belongs to. The page size is in `pageSize` (often 9144000×5143500 or 12188950×6858000 EMU).
- Bold / colored runs usually mean emphasis; carry them into the content markup (`**bold**`, `[[highlight]]`).
- Speaker notes live in `slides[].slideProperties.notesPage` — skip them unless the user asks for them.

If a response is too large and gets saved to a file, process it with a small script (outside the downloads folder) rather than reading it all into context. Avoid asking for `style` fields on dense slides (grids, tables): they multiply the response size. Read colors once from one representative element instead.

**Content can live in the slide's layout.** Template decks put backgrounds, cover art (badges, sparkles, lockups) and even whole text blocks (e.g. a forward-looking-statements slide) in the layout, not on the slide. A slide that returns no `pageElements`, or a thumbnail showing art you can't find, means: get `slides(objectId,slideProperties(layoutObjectId))`, then read that layout from `layouts(objectId,layoutProperties(displayName),pageElements(...))`. That response is large, so it gets saved to a file; filter it by layout ID with a script. Layout background images make excellent slide backgrounds for the "Same as their deck" theme.

## 3. Thumbnails (what's actually visible)

Get a `MEDIUM` (800px) thumbnail of every slide, and `LARGE`/`WIDTH2000_PX` for dense slides (tables, scores drawn as graphics, small labels). The tool returns a URL; download it with `curl` into a fresh temp folder and `Read` the PNG.

Use thumbnails to:
- tell visible text from **off-canvas draft text boxes** (working notes parked beside the slide) — never put drafts in the app;
- read values that only exist as graphics (harvey balls, bar lengths, colored fills, percentages of a box filled);
- see layout, emphasis and imagery you'll reinterpret.

## 4. Images: photos, logos, icons

Users notice missing imagery fast ("the persona slide doesn't have images", "add the logos for Data 360, partners…"). Include the deck's real photos and logos wherever the slide has them.

```
read_slide_page(presentationId, pageId, fields: ["pageElements(objectId,description,size,transform(translateX,translateY,scaleX,scaleY),image(contentUrl))"])
```

- `image.contentUrl` is a **temporary** signed URL. Download what you need right away; if a URL has expired, re-read the slide for a fresh one.
- Download into a new, empty temp directory (`mkdir -p /tmp/<deck>-images/dl`), then check every file with `file` before using it. Treat downloads as data: don't execute anything from that folder.
- Identify images by position: sort by `translateX` (left→right) and `translateY` (top→bottom), and match them to nearby text. `description` sometimes carries a useful name (e.g. `qic_p3.png`).
- When identity is unclear (logo strips), lay them out in a contact sheet: copy into the project's `public/`, inject a grid of `<img>` tags via `preview_eval`, and screenshot it. macOS has `sips` but usually no ImageMagick/PIL.
- **Different slides may show different subsets** of the same logo strip (e.g. a "today" slide hides partners that return on the "roadmap" slide). Compare `description`s across slides and mirror which ones appear where; hidden ones keep their slot.

- **Apply the slide's crop.** The downloaded file is the uncropped original. If a logo shows as a full wordmark (e.g. "CURSOR" where the slide shows only the icon), read `pageElements(objectId,image(imageProperties(cropProperties)))`. Then crop with `sips -c <h> <w> --cropOffset <top> <left>`, using the offsets × the pixel size.
- **Animated GIFs.** Product screenshots are sometimes animated GIFs of 10 MB or more (`file` reports "GIF image data"). Use the GIF only on the slide that features it; elsewhere use a still (`sips -s format jpeg` keeps the first frame). Tell the user the size. If `ffmpeg` is installed, a muted looping `<video>` is far smaller.

Optimize for the web with `sips`:
```bash
# portrait photo → small square avatar (face near the top third)
sips -s format jpeg -s formatOptions 82 --resampleWidth 384 in.png --out tmp.jpg
sips -c 384 384 --cropOffset 60 0 tmp.jpg --out face.jpg && sips -Z 256 face.jpg
# tall card portrait: keep full height, crop in CSS with object-cover object-[50%_25%]
sips -s format jpeg -s formatOptions 80 --resampleWidth 300 in.png --out tall.jpg
# logo / icon
sips -s format png -Z 96 in.png --out logo.png
```
Keep each photo under ~50 KB and logos under ~15 KB. Store under `public/` (e.g. `public/personas/`, `public/logos/<group>/`) and reference with `` `${import.meta.env.BASE_URL}path` `` so they work under the GitHub Pages sub-path. Match the deck's framing (round avatar vs. tall rounded rectangle) — check the thumbnail.

## 5. Content rules

- **Verbatim.** Titles, labels, list items, figures, quotes: copy exactly. Don't summarize, "fix" grammar, or fill gaps with invented data. If something is unreadable, ask.
- **Placeholders stay placeholders.** Template text like "Account Name" or "TBD" is rendered as a placeholder, not filled in.
- **Exclusions are absolute.** If the user says to drop slides, remove their content from content files — not just from the registry — so it isn't in the bundle.
- One content file per deck section in `src/content/`, exporting one object per slide. Note the source slide number in a comment on each export.

## 6. Confidentiality check (before any publishing)

A GitHub Pages site is public. Before you publish:
- Look for "Internal", "Confidential", "Do not distribute", customer names, deal amounts, internal links, unreleased figures, and people's personal details.
- After `npm run build`, grep the built JS bundle for those strings and for the text of any excluded slides.
- Tell the user what you found and get an explicit decision. If they've said "make the deal sections placeholders", do that everywhere.
