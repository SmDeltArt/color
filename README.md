# SmΔrt Color Picker

A self-contained, framework-free color picker widget — solid color, gradient editor, alpha, presets, palette save/load. Single HTML file, zero dependencies.

- **Version:** 1.2.0
- **Size:** ~1 file (HTML + inlined CSS/JS)
- **License:** see repository

## 🎨 Live demo

Click a link to launch the picker — the panel auto-opens in standalone mode:

- 🚀 **[Vercel CDN (canonical)](https://color-picker.caddeltai.com/)** — `color-picker.caddeltai.com`
- 🌍 **[Vercel CDN (SmΔrt alias)](https://color-picker.smdeltart.com/)** — `color-picker.smdeltart.com`
- 📦 **[v1.2.0 pinned (Statically)](https://cdn.statically.io/gh/SmDeltArt/smart-color-picker/v1.2.0/smart-color-picker.html)** — tagged release
- 🧪 **[Demo host page](https://color-picker.caddeltai.com/demo)** — picker embedded in a sample app (`color-picker.caddeltai.com/demo`)

## Quick start

### 1. As a standalone page

Just open `smart-color-picker.html` in any browser, or click the live links above.

### 2. Embed in your site (iframe)

Use the GitHub Pages URL — open CORS, serves `text/html` correctly for iframes:

```html
<iframe
  src="https://smdeltart.github.io/smart-color-picker/smart-color-picker.html?embed=overlay"
  style="border:0;width:420px;height:560px;background:transparent"
  allowtransparency="true"
></iframe>
```

For local dev, use the relative same-origin URL instead (see isLocal pattern below).

---

## Deploy on Vercel (CDN)

This repo ships a `vercel.json` for direct Vercel deployment — same pattern as
`api-caddeltai.vercel.app` in the SmΔrt ecosystem.

### Setup

1. **Connect** this repo to a Vercel project (no _Root Directory_ config needed).
2. **Assign** custom domains in the Vercel dashboard.
3. **Done.** The `vercel.json` handles clean URLs, CORS, and `frame-ancestors *`.

**Live deployments:**

| Domain                          | Purpose                            |
| ------------------------------- | ---------------------------------- |
| `smart-color-picker.vercel.app` | Vercel auto-URL (always available) |
| `color-picker.caddeltai.com`    | CAD-AI canonical CDN ✅ live       |
| `color-picker.smdeltart.com`    | SmΔrt Collection alias ✅ live     |

Routes once deployed:

| URL       | Serves                    |
| --------- | ------------------------- |
| `/`       | `smart-color-picker.html` |
| `/picker` | `smart-color-picker.html` |
| `/demo`   | `demo.html`               |

### Embed from any SmΔrt app (isLocal pattern)

Use the same pattern as the api-settings bridge so local dev works without CORS
and production uses the CDN:

```js
const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const SCP_SRC = isLocal
  ? "smart-color-picker.html?embed=overlay" // same-origin (local dev)
  : "https://smdeltart.github.io/smart-color-picker/smart-color-picker.html?embed=overlay"; // GitHub Pages (production)
```

Then set the iframe src:

```html
<iframe id="scpFrame" src="" style="display:none;border:0;"></iframe>
<script>
  document.getElementById("scpFrame").src = SCP_SRC;
</script>
```

### Security note

`frame-ancestors *` and open CORS are intentional for a public CDN widget — the
color picker holds no sensitive data. The `postMessage` protocol uses the
`{ type:"smart-widget" }` envelope to avoid collisions with other messages.

---

### 3. Hosting / CDN options

| Source                  | URL pattern                                                                               | Renders HTML?                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **GitHub Pages**        | `https://smdeltart.github.io/smart-color-picker/smart-color-picker.html`                  | ✅ yes (recommended)                                                                  |
| **Statically** (pinned) | `https://cdn.statically.io/gh/SmDeltArt/smart-color-picker/<tag>/smart-color-picker.html` | ✅ yes                                                                                |
| jsDelivr (asset only)   | `https://cdn.jsdelivr.net/gh/SmDeltArt/smart-color-picker@<tag>/smart-color-picker.html`  | ❌ served as `text/plain` — fine for `fetch()`, **not** for direct viewing or iframes |
| **Vercel CDN** ✅ live  | `https://color-picker.caddeltai.com/` · `https://color-picker.smdeltart.com/`             | ✅ yes — `frame-ancestors *`, open CORS                                               |

> **Why not jsDelivr for iframes?** jsDelivr deliberately serves HTML files
> from `/gh/` paths as `text/plain` to discourage abuse. Use it for
> `fetch()`-style asset loading; use **GitHub Pages** or **Statically** for
> direct page / iframe URLs.

---

## Used in SmΔrt Collection

These apps embed the picker from `color-picker.caddeltai.com` when deployed, and from a local copy during development (isLocal pattern):

| App              | Domain                              | Integration                                                    |
| ---------------- | ----------------------------------- | -------------------------------------------------------------- |
| SmΔrt SVG Editor | `widgets.smdeltart.com/?app=svg`    | overlay panel — `embed=overlay` mode                           |
| SmΔrt 3D Editor  | `widgets.smdeltart.com/?app=3d`     | background color + material color picker                       |
| SmΔrt IceOff     | `widgets.smdeltart.com/?app=iceoff` | floating iframe — text color + bg color via `_openColorPicker` |

Both use the same isLocal bridge pattern (see [Embed from any SmΔrt app](#embed-from-any-smrt-app-islocal-pattern) above).

---

## Public API

When loaded directly (not in an iframe) the widget exposes:

```js
window.SmartColorPicker.open({ theme: "light" });
window.SmartColorPicker.set("#ff8800");
const color = window.SmartColorPicker.get();
window.SmartColorPicker.setTheme("dark");
window.SmartColorPicker.onChange((payload) => console.log(payload));
window.SmartColorPicker.close();
```

### Pre-load configuration

Set before the script runs:

```html
<script>
  window.SmartColorPickerConfig = {
    theme: "dark", // "dark" | "light"
    autoOpen: true,
    openOptions: { color: "#6366f1" },
  };
</script>
```

### postMessage bridge (for iframe hosts)

All messages use a `{ type: "smart-widget", action, data }` envelope. The widget accepts messages from any origin (open CDN design — no origin restriction).

```js
const frame = document.getElementById("colorPickerFrame");

// Open with theme + initial color
frame.contentWindow.postMessage(
  {
    type: "smart-widget",
    action: "scp:open",
    data: { hex: "#ff0000", theme: "light" },
  },
  "*",
);

// Listen for color changes
window.addEventListener("message", (e) => {
  const msg = e.data;
  if (!msg || msg.type !== "smart-widget") return;
  if (msg.action === "scp:color") console.log(msg.data);
});
```

**Inbound actions** (host → widget):

- `scp:open` · data: `{ hex?, alpha?, theme? }`
- `scp:close`
- `scp:set` · data: `{ hex?, alpha? }`
- `scp:setTheme` · data: `{ theme: "dark" | "light", palette?: PaletteOverrides }`
- `scp:get` (triggers a `scp:color` emit)
- `scp:selectStop` · data: `{ index?: number }` or `{ pos?: number }` (0–100, picks nearest stop) — only meaningful when the gradient editor is open
- `scp:setGradient` · data: `{ open?: boolean, type?: "linear" | "radial", angle?: 0..360 }` — toggle the gradient editor section, change geometry from the host UI

`PaletteOverrides` is an optional object that lets the host re-skin the picker to match its own surfaces. All keys are optional; unknown keys are ignored. Any CSS color value works (`#hex`, `rgb()`, `hsl()`, etc.).

```js
{
  (bg,
    surface,
    panel,
    input, // backgrounds (most → least prominent)
    text,
    muted,
    faint, // text tiers
    border, // dividers
    accent,
    primary,
    accent2); // brand / focus / hover colors
}
```

You can also pass `palette` inside `scp:open` data to apply at open time. Reset by sending `scp:setTheme` with an empty `palette: {}` (clears overrides; built-in dark/light tokens take over).

**Outbound actions** (widget → host):

- `scp:color` · live updates while picking — data: `{ hex, rgba, hsla, gradient, gradientActive }`
- `scp:validate` · color confirmed (swatch click, add to palette)
- `scp:close` · panel dismissed
- `scp:size` · panel bbox `{ width, height }` so host can shrink iframe to fit

## Applying the result in your app

The picker returns **either a solid color or a CSS gradient string**. Backgrounds accept both, but **`color: linear-gradient(...)` is invalid CSS** — gradients on text need the `background-clip:text` technique. Apply this everywhere your app sets text foreground (toolbars, frames, table/spreadsheet cells, contenteditable selections).

### Single helper for solid + gradient

```js
function applyTextColor(el, color) {
  const isGradient = typeof color === "string" && color.includes("gradient");
  if (isGradient) {
    el.style.backgroundImage = color;
    el.style.webkitBackgroundClip = "text";
    el.style.backgroundClip = "text";
    el.style.color = "transparent";
  } else {
    // clear any previous gradient state, then set the solid color
    el.style.backgroundImage = "";
    el.style.webkitBackgroundClip = "";
    el.style.backgroundClip = "";
    el.style.color = color;
  }
}

function applyBgColor(el, color) {
  // backgrounds take both solid colors and gradients natively
  el.style.background = color;
}
```

### Wiring it to picker messages

```js
window.addEventListener("message", (e) => {
  const msg = e.data;
  if (!msg || msg.type !== "smart-widget") return;
  if (msg.action !== "scp:color" && msg.action !== "scp:validate") return;

  const d = msg.data || {};
  // Pick the richest representation: gradient > rgba (with alpha) > hex
  const color =
    d.gradientActive && d.gradient && d.gradient.includes("gradient")
      ? d.gradient
      : d.rgba && typeof d.a === "number" && d.a < 1
        ? d.rgba
        : d.hex;

  if (!color) return;
  applyTextColor(myTargetEl, color); // or applyBgColor(...)
});
```

### contenteditable / `execCommand("foreColor")`

`document.execCommand("foreColor")` only accepts solid colors. For a gradient on the **selected text inside a contenteditable**, wrap the range in a span instead:

```js
function paintSelectionWithColor(color) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const isGradient = typeof color === "string" && color.includes("gradient");

  if (isGradient) {
    const span = document.createElement("span");
    span.style.cssText =
      `background-image:${color};` +
      `-webkit-background-clip:text;background-clip:text;color:transparent;`;
    span.appendChild(range.extractContents());
    range.insertNode(span);
  } else {
    document.execCommand("foreColor", false, color);
  }
}
```

> **Cross-origin gotcha:** when the picker iframe is hosted on a different origin (Pages/Statically), the iframe steals focus on click. Re-focus your editor and re-add the saved `Range` to the selection **before** mutating the DOM, otherwise `execCommand` and `range.extractContents()` will operate on nothing.

### Spreadsheet / table cells

Same pattern as text — apply `applyTextColor()` to each selected cell's `style`. For **cell background** just assign `style.background = color` (gradients work directly there).

### LLM prompt (drop into Copilot / Claude / etc. when integrating)

```text
I am embedding the SmDeltArt smart-color-picker via iframe. The picker
posts messages: { type:"smart-widget", action:"scp:color"|"scp:validate",
data:{ hex, rgba, hsla, gradient, gradientActive } }.

Wire color application so it works for BOTH solid colors AND CSS gradients:
- Backgrounds: assign element.style.background directly (accepts both).
- Text foreground: solid → element.style.color; gradient → set
  backgroundImage + (webkit-)background-clip:text + color:transparent
  (clear the opposite mode each time so leftovers don't leak).
- Inside contenteditable: execCommand("foreColor") only accepts solids.
  For gradients, wrap the current Range in a <span> with the
  background-clip:text styles.
- Cross-origin iframe: refocus the editor and restore the saved Range
  before mutating the DOM (the iframe steals focus on click).

Refactor every text-color code path through a single applyTextColor(el, c)
helper that branches on c.includes("gradient"). Apply to: toolbar text-
color buttons, selected text-frame foreground, table/spreadsheet selected
cells, and execCommand-based document text coloring.
```

## Features

- HSV color wheel + value/alpha track
- Linear & radial gradients with stop editor
- 8-snap angle dial (cardinals + diagonals)
- Harmony presets (complement, triad, tetrad, analogous)
- Save/load palettes (localStorage + JSON file)
- Eyedropper (where supported by browser)
- Drag-anywhere panel with hard screen bounds
- Light/dark theme
- Touch + mouse + keyboard
- **Mobile-first**: long-press a swatch to remove (mobile equivalent of right-click)
- **Tutorial tips**: hover-to-explain mode, toggled from the help popover
- **Default color set**: ships with `smart-colorset.json` auto-loaded on first run
- **i18n-ready**: shared CSV (`smart-color-picker.i18n.csv`) — register a translator via `SmartColorPicker.setI18n(fn)`

## Changelog

### v1.2.0

- ✨ Tutorial tips overlay (toggle from help popover) with `data-tut` /
  `data-tut-key` on every key control
- ✨ Default color set: bundled `smart-colorset.json` auto-loads when
  localStorage is empty
- ✨ i18n: companion `smart-color-picker.i18n.csv` (EN + FR seeded,
  9 more locales available); `SmartColorPicker.setI18n(fn)` to wire it
- 📱 Mobile: long-press to remove a saved swatch (550 ms hold, suppresses
  follow-up click, optional haptic)
- 🎨 Theme-aware help popover (Δ + accents follow detected palette)
- 🐛 Demo: rgba object → string conversion on solid fallback

### v1.1.0

- Initial public release: standalone SPA, gradient editor, palette
  save/load, theme palette overrides

## Pinning versions

For production embeds, **always pin a tag**:

```
https://cdn.statically.io/gh/SmDeltArt/smart-color-picker/v1.2.0/smart-color-picker.html
```

(Statically returns `text/html` and supports tag pinning — preferred over
jsDelivr for direct page / iframe usage.)

Using `@latest` or no tag will pull the most recent commit and may break.
