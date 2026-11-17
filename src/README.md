# Innovation Pulse SPFx

Start with the [developer quick-start guide](DEVELOPER_GUIDE.md).

This web part reads news and optional readership records from real SharePoint
lists. No article fixtures, local reader records, or mock-data provider are
included. List names are intentionally blank; configure them in the web part's
properties after porting. See [list setup and column mapping](docs/live-lists.md).

## Build and handoff

Copy `src/` into an empty project directory and run these commands from that
project directory, using Node 22.22.2 and npm 10.9.7:

```sh
node src/tooling/project.cjs restore
npm ci
npm test
npm run lint
npm run build
```

The package is `sharepoint/solution/innovation-pulse-spfx.sppkg`. Deployment and
hosting require SharePoint. See [portability details](docs/portability.md).

## Source layout

Paths below are under `src/webparts/innovationPulse/`:

- `InnovationPulseWebPart.ts` creates the SharePoint service and exposes list settings.
- `services/` contains the service contract, REST implementation, and column mapping.
- `models/` contains UI-facing article and interaction types.
- `components/` contains the page, reader, and active SCSS.
- `presentation/categoryBanners.ts` maps category labels to decorative images.
- `assets/` contains all bundled banners and the loading icon.
- `loc/` and the manifest contain SPFx localization and metadata.

The React component depends on the injected service, not on a data directory.
No runtime fallback supplies fake news when configuration or requests fail.
Optional tracking is off by default. List access uses the current user's SPFx
context; no credentials are stored in the source.

## Categories and banners

Filters and sections are derived from actual list articles. The nine established
categories have realistic AI-generated banners, with a general image for All
categories and unknown labels. See [banner prompts](docs/banner-prompts.md).

## Article transition

Clicking a tile opens the portaled `ArticleDialog.tsx` reader. GSAP **3.13.0** morphs the panel's position and dimensions from the clicked card over 520 ms, with a quick start and gentle settle. A decorative, non-interactive card snapshot fades out as the article content appears. The article stays at its final width during expansion, so its text does not stretch or repeatedly reflow. Closing returns to the card over 360 ms, with a brief snapshot crossfade at the end. The backdrop fades independently. An interrupted opening closes from its current bounds without jumping; a missing or offscreen source uses a short fade. Reduced-motion preferences skip the transition, and viewport/preference changes settle it immediately.

Animation edit points are in `components/ArticleDialog.tsx`: the opening timeline in `useLayoutEffect`, closing timeline in `close`, and decorative snapshot in `makePreview`. Keep snapshot cleanup, original source-opacity restoration, focus restoration, and responsive inline-style cleanup intact when changing timing. The card snapshot is hidden from assistive technology and has no interactive wrapper.

The existing Radix Dialog **1.1.6** handles modal focus, background scroll locking, Escape, and outside clicks. Focus returns to the clicked tile after closing. The reader is portaled outside SharePoint ancestor stacking contexts, with responsive spacing, a scrollable panel, and a clearer metadata layout. No dependency versions changed. See [GSAP fromTo](https://gsap.com/docs/v3/GSAP/gsap.fromTo()/) and [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) for the underlying APIs.

## Validation

Live-list service tests, portability tests, lint, TypeScript compilation,
production bundling, and packaging pass locally. Service tests use isolated HTTP
stubs and do not contact a tenant. The prior card-transition browser checks
covered keyboard focus, mobile layout, interruption, and reduced motion.
Live SharePoint connectivity, column types, and permissions must be verified
in the destination environment. No deployment or live-list writes were performed.
