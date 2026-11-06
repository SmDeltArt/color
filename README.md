# SmΔrt Color Picker

A standalone HTML colour picker with solid colours, alpha, linear/radial gradients, palettes, draggable panel, light/dark themes and touch controls.

**[Integration guide and ready-to-paste LLM prompt](EMBEDDING.md)** — start here for local copies, hosted iframe use and transparent full-screen overlays.

## Gradient eyedroppers (image sampling and direct host selection)

The six high-visibility emoji wheel actions are 💉 single-color eyedropper, ➕ save color, 🔄 swap colors, 🎲 random color, 🌈 file-based gradient eyedropper, and 🎯 direct gradient eyedropper. The 🌈 action opens a local-image sampler: choose a PNG, JPEG, WebP or SVG, then draw a line over the gradient. It estimates the angle and up to eight stops and loads them into the existing editable linear-gradient panel. The tutorial hover mode describes this workflow.

The 🎯 button now performs **direct inspection in the same-origin document** (or same-origin embedding host): it can read supported SVG/CSS gradient definitions, and allows drawing a line across an accessible raster image. When the parent is cross-origin, it instead requests host selection using `scp:gradient-pick-request`; the host responds with `scp:gradient-pick-result` and the matching request ID. Browsers prevent reading inaccessible cross-origin DOM/pixels.

Both eyedroppers live entirely inside `smart-color-picker.html`; there are no separate gradient JavaScript modules. The 🌈 file sampler's preview and controls are embedded in the scrollable gradient section. Raster results are approximations; unsupported SVG geometry and CSS syntax must not be treated as exact.

## Run

Serve this folder with a static HTTP server and open `smart-color-picker.html`. Keep `smart-colorset.json` and `smart-color-picker.i18n.csv` beside it. `demo.html` is an example host. Some optional shared controls use external resources; verify offline requirements in your consumer.

Primary branded entry: https://color.smdeltart.com/smart-color-picker.html

Overlay entry: https://color.smdeltart.com/smart-color-picker.html?embed=overlay

GitHub Pages alternative (where enabled): https://smdeltart.github.io/color/smart-color-picker.html?embed=overlay

The repository includes `color-picker-overlay.js`: an optional, host-page launcher for banners using `data-scp-overlay` that opens the picker in the **current page** as a transparent iframe overlay. Its SVG/PNG banner image remains passive; it is the host page that handles the click. A regular SVG hyperlink falls back to opening the standalone picker.

For a full-screen iframe, append `?embed=overlay`. The iframe remains full-screen while the picker moves inside it. Its outside area is transparent and catches outside clicks to close. The host receives live colour/gradient messages; see the integration guide for validation and lifecycle handling.

## Banner overlay integration

```html
<a href="https://color.smdeltart.com/smart-color-picker.html" data-scp-overlay>
  <img src="/images/color-picker-banner.svg" alt="Open SmΔrt Color Picker">
</a>
<script defer src="https://color.smdeltart.com/color-picker-overlay.js"></script>
```

The launcher validates message origin and iframe source, intercepts normal left-clicks only, and preserves regular navigation for modifier-clicks or without JavaScript. For WordPress, ensure your page allows the script, and allow embedding via your site's framing/CSP policies. To embed on another domain, the picker's parent-origin allowlist must allow it. Test live origins before deploying.

## Deployment

`vercel.json` configures the static deployment and response headers. Verify the actual deployment, HTML Content-Type, framing headers and allowed parent origins before embedding from a new site. The branded hostname is the intended public address; verify DNS and Vercel routing before advertising it. Branded domains require configured DNS/project aliases; aliases of one project are not independent failover hosts. Use a reviewed local copy for a pinned integration, or publish and verify a version before documenting a versioned URL. GitHub raw files and asset CDNs are not interchangeable with HTML hosting.

## API

Standalone: `window.SmartColorPicker` exposes `open`, `set`, `get`, `setTheme`, `onChange` and `close`. Inspect the implementation for current option fields.

Iframe messages use `{type:'smart-widget', action, data}`. Commands include `scp:open`, `scp:set`, `scp:setTheme`, `scp:setGradient`, `scp:selectStop`, `scp:get` and `scp:close`. Results include `scp:color`, `scp:validate`, `scp:close`, size and drag events. Ignore size/drag events in overlay mode. Always validate message source and origin in the host; the upstream picker also restricts parent origins.

`rgba` is an object, not a CSS string. Backgrounds accept validated solid/gradient CSS; text gradients require background-clip:text. Preserve the editor selection when an iframe takes focus.

## Consumers

- topic.earth: pinned local copy under `assets/widgets/color/`, managed by `lib/story-color-picker.mjs`, including PWA precaching and local security adaptations.
- Studio: hosted integration in `SmDeltArt/private`, `studio/public/app/src/color-picker-bridge.js`.

## 15 October 2026

Overlay mode now explicitly keeps the document root and outside-click backdrop transparent. Standalone dimming and compact embedding retain their own behaviour. The picker panel still has its own readable surface. See the guide for the complete verification checklist.
