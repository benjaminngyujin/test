# Innovation Pulse SPFx

New to the project? Start with the [developer quick-start guide](DEVELOPER_GUIDE.md).

This `src/` folder is the portable source handoff. See [portability instructions](docs/portability.md) for restoring the SPFx root configuration and installing dependencies. Paths below are relative to the restored project root unless they are Markdown links.

This project uses the internal newsletter component supplied in `unzip`, with a generic SPFx entry point, manifest, English localization, and SVG loading icon. The existing solution and web-part IDs are retained. The component now runs entirely on local mock news and view records, with category filters, search, article dialogs, readership insights, and CSV export. No SharePoint list access or list ID is required. The SPFx package itself still needs a SharePoint page to host it; the React component no longer depends on SharePoint context.

## Build and development

Use Node **22.22.2**, npm **10.9.7**, SPFx **1.21.1**, TypeScript **5.3.3**, and React **17.0.1**.

```sh
nvm use
npm ci
npm run lint
npm run build
```

The deployment artifact is `sharepoint/solution/innovation-pulse-spfx.sppkg`. `npm run build:dev` builds a development bundle, `npm run styles` compiles Sass, and `npm run clean` clears generated output. For tenant debugging, run `npm run trust-dev-cert` once and `npm run serve`, then use the debug manifests URL on a modern SharePoint page. `config/serve.json` controls the local server settings.

## Mock lists

`src/webparts/innovationPulse/data/mockLists.ts` contains 18 fictional news rows across the nine requested categories (two per category) and 30 fictional interaction rows across October and November 2026. Rows use the supplied display-column names, with an explicit mapping to the component's existing properties. These names are not claimed to be actual SharePoint internal field names.

News fields: `article title`, `upload date`, `article body`, `source url`, `category`, `sub category`, `region`, `source publish date`, `country`, `DBS implication`, `source publisher`, `article image url`, and `in_dib`. The mock assumes `in_dib` is boolean; both values are represented, and both appear in the news feed. Upload date drives article sorting, while source publish date is shown separately. Article images use inline SVG data URLs; source links are clearly labeled placeholders on example.com.

Views fields: `article`, `article ID`, `viewer name`, `viewer account`, `original source URL`, `viewed at`, and `interaction type`. Page views use article ID 0. Opening the component, clicking an article, or opening its source adds a local event for `Demo Reader`, using a fictional example.com account. Insights are available without permission checks and include those new events. CSV export retains the original article, interaction, reader, account, and viewed-at columns.

Each component instance owns its in-memory view records. Refreshing articles preserves interactions; reloading/remounting the component resets them to the seed data. There is no local storage or remote persistence, and no real reader identity is collected. The original internal files remain in `unzip` for reference; reconnecting to live lists later requires confirming internal field names and restoring a live data adapter.

## Categories, banners, and future live lists

See [the internal LLM edit map and live-list migration guide](docs/live-lists.md) for exact files, symbols, field mapping, async request handling, permissions, and validation. Category banner images are configured in `src/webparts/innovationPulse/data/categories.ts`; each category has a detailed, photorealistic AI-generated JPEG banner. Selecting a category changes the top banner and heading. All categories and unknown categories use a city-at-dusk image with fiber-optic detail. No external image service is required. See [banner assets and prompts](docs/banner-prompts.md) for the generation prompts and replacement instructions.

## Source and styles

- `src/webparts/innovationPulse/InnovationPulseWebPart.ts` mounts the mock component without a context or list ID.
- `InnovationPulseWebPart.manifest.json` provides toolbox metadata for the mock preview.
- `loc/` contains the English mock-mode property-pane description.
- `components/` contains the imported component and SCSS.
- `assets/loading-icon.svg` is a generic ring spinner, animated by the component's SCSS.

SPFx Sass regenerates `InnovationPulse.module.scss.ts`; the supplied stale mapping referenced a missing `- Copy.css` file and was replaced by generated output. The interaction CSS from `unzip` has been incorporated into the SCSS module using local class names instead of old build hashes. Edit the SCSS for active styles; the standalone interactions CSS remains a reference copy. The original files in `unzip` are unchanged. The obsolete Tailwind prebuild task has been removed, and TypeScript includes ES2015 API declarations used by the component. Minor lint fixes preserve the imported component's behavior.

## Article transition

Clicking a tile opens the portaled `ArticleDialog.tsx` reader. GSAP **3.13.0** morphs the panel's position and dimensions from the clicked card over 520 ms, with a quick start and gentle settle. A decorative, non-interactive card snapshot fades out as the article content appears. The article stays at its final width during expansion, so its text does not stretch or repeatedly reflow. Closing returns to the card over 360 ms, with a brief snapshot crossfade at the end. The backdrop fades independently. An interrupted opening closes from its current bounds without jumping; a missing or offscreen source uses a short fade. Reduced-motion preferences skip the transition, and viewport/preference changes settle it immediately.

Animation edit points are in `components/ArticleDialog.tsx`: the opening timeline in `useLayoutEffect`, closing timeline in `close`, and decorative snapshot in `makePreview`. Keep snapshot cleanup, original source-opacity restoration, focus restoration, and responsive inline-style cleanup intact when changing timing. The card snapshot is hidden from assistive technology and has no interactive wrapper.

The existing Radix Dialog **1.1.6** handles modal focus, background scroll locking, Escape, and outside clicks. Focus returns to the clicked tile after closing. The reader is portaled outside SharePoint ancestor stacking contexts, with responsive spacing, a scrollable panel, and a clearer metadata layout. No dependency versions changed. See [GSAP fromTo](https://gsap.com/docs/v3/GSAP/gsap.fromTo()/) and [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) for the underlying APIs.

## Dependencies

Fluent UI React Components remains **9.56.8**, React Input **9.8.2**, and React Virtualizer **9.0.0-alpha.89**. The root Fluent UI override prevents SPFx from installing a second newer version. The external setup uses the public virtualizer release. If your internal registry requires the local archive, restore `file:./packages/react-virtualizer-9.0.0-alpha.89.tgz`, supply that archive, and regenerate the lockfile internally before using `npm ci`.

## Validation

The mock source passed zero-warning lint, TypeScript compilation, production bundling, and solution packaging on 16 November 2026 under Node 22.22.2. Run `npm test` to verify the supplied columns, field mapping, instance isolation, search, article rendering, insights, and local view/click tracking. These checks load the component without SharePoint or network APIs. Local Chrome checks with the compiled component and SPFx CSS passed for animated entry/exit, interrupted entry, Escape and backdrop dismissal, keyboard focus trapping/restoration, mobile overflow, and reduced motion, with no browser errors. Rendering in a real SharePoint page has not been verified, and no deployment was performed.


The refined transition passed local Chrome checks on 17 November 2026 for unscaled
panel content, responsive style cleanup, interrupted opening, keyboard focus
trapping/restoration, mobile bounds, backdrop dismissal, and reduced motion, with
no browser errors. Production lint, compilation, bundling, and packaging passed.
SharePoint-host verification remains outstanding.
