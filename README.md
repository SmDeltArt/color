# SmΔrt Color Picker

A standalone HTML colour picker with solid colours, alpha, linear/radial gradients, palettes, draggable panel, light/dark themes and touch controls.

**[Integration guide and ready-to-paste LLM prompt](EMBEDDING.md)** — start here for local copies, hosted iframe use and transparent full-screen overlays.

## Run

Serve this folder with a static HTTP server and open `smart-color-picker.html`. Keep `smart-colorset.json` and `smart-color-picker.i18n.csv` beside it. `demo.html` is an example host. Some optional shared controls use external resources; verify offline requirements in your consumer.

Hosted entry: https://color-iota-five.vercel.app/smart-color-picker.html

For a full-screen iframe, append `?embed=overlay`. The iframe remains full-screen while the picker moves inside it. Its outside area is transparent and catches outside clicks to close. The host receives live colour/gradient messages; see the integration guide for validation and lifecycle handling.

## Deployment

`vercel.json` configures the static deployment and response headers. Verify the actual deployment, HTML Content-Type, framing headers and allowed parent origins before embedding from a new site. Branded domains require configured DNS/project aliases; aliases of one project are not independent failover hosts. Use a reviewed local copy for a pinned integration, or publish and verify a version before documenting a versioned URL. GitHub raw files and asset CDNs are not interchangeable with HTML hosting.

## API

Standalone: `window.SmartColorPicker` exposes `open`, `set`, `get`, `setTheme`, `onChange` and `close`. Inspect the implementation for current option fields.

Iframe messages use `{type:'smart-widget', action, data}`. Commands include `scp:open`, `scp:set`, `scp:setTheme`, `scp:setGradient`, `scp:selectStop`, `scp:get` and `scp:close`. Results include `scp:color`, `scp:validate`, `scp:close`, size and drag events. Ignore size/drag events in overlay mode. Always validate message source and origin in the host; the upstream picker also restricts parent origins.

`rgba` is an object, not a CSS string. Backgrounds accept validated solid/gradient CSS; text gradients require background-clip:text. Preserve the editor selection when an iframe takes focus.

## Consumers

- topic.earth: pinned local copy under `assets/widgets/color/`, managed by `lib/story-color-picker.mjs`, including PWA precaching and local security adaptations.
- Studio: hosted integration in `SmDeltArt/private`, `studio/public/app/src/color-picker-bridge.js`.

## 15 October 2026

Overlay mode now explicitly keeps the document root and outside-click backdrop transparent. Standalone dimming and compact embedding retain their own behaviour. The picker panel still has its own readable surface. See the guide for the complete verification checklist.
