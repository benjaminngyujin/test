# Internal LLM edit map: mock data → SharePoint lists

All paths below are relative to the restored project root. See [portability.md](portability.md) for source-only handoff and build configuration edit points. Modify active code under `src/`;
`unzip/` is a reference snapshot. Do not edit `lib/`, `dist/`, `temp/`, generated
`*.scss.ts`, or the packaged `.sppkg` as source.

## Current edit points

| Change | Source / symbol |
| --- | --- |
| News fixtures and display-column mapping | `src/webparts/innovationPulse/data/mockLists.ts`: `examples`, `mockNewsRows`, `MockLists.getNews` |
| Interaction fixtures and local writes | Same file: `mockViewRows`, `MockLists.getViews`, `MockLists.track` |
| Canonical category labels and images | `src/webparts/innovationPulse/data/categories.ts`: `categoryBanners` |
| General / unknown-category banner | Same file: `defaultBanner`, `bannerForCategory` |
| Adapter creation and async UI calls | `src/webparts/innovationPulse/components/InnovationPulse.tsx`: `lists`, `loadNews`, `loadInsights`, `trackInteraction` |
| Category filtering / grouping | Same component: `categoryFor`, `changeCategory`, `render` |
| Banner rendering and heading | Same component: `<header className={styles.hero}>` |
| Banner size, crop, contrast, mobile layout | `src/webparts/innovationPulse/components/InnovationPulse.module.scss`: `.hero` |
| SharePoint context and list configuration | `src/webparts/innovationPulse/InnovationPulseWebPart.ts`, component `IInnovationPulseProps.ts`, manifest and `loc/` |

The nine category names in `categoryBanners` must match the list's category values
exactly (including punctuation). The UI derives its dropdown and sections from
loaded articles, not the banner registry. Thus each category needs a news row to
appear. Mock fixtures provide two per category. All categories shows up to four
articles per section; selecting a category shows every matching article. Search
still intersects with the category filter and can produce an empty result.

Banner images are decorative AI-generated JPEGs bundled under
`src/webparts/innovationPulse/assets/banners/`, without external image hosts.
See [banner prompts](banner-prompts.md) for each image prompt and replacement steps.
GenAI depicts detailed neural-network feature maps; Quantum Computing depicts a
superconducting processor's dilution refrigerator. These are synthetic imagery,
not documentary photos or exact scientific diagrams. To use approved photography,
replace that entry's `imageUrl` with an accessible HTTPS SharePoint asset URL.
Keep the dark overlay and check long headings and mobile cropping. Article images
are independently mapped from `article image url`; changing a banner does not
change those images. Unknown categories and “All categories” use `defaultBanner`.

## Live-list migration checklist

1. Confirm the news and interactions list IDs, actual **internal** field names,
   field types, access rules, and whether category is single-choice or multi-choice.
   The quoted fields in `IMockNewsRow` / `IMockViewRow` are display names only.
   Never infer REST internal names from them. Record the confirmed schema here.
2. Implement a dedicated live adapter (for example `data/SharePointLists.ts`). Keep
   `INewsItem`, `IViewEvent`, and `InteractionType` as the UI contract; optionally
   move these types into `data/models.ts` and update imports. Map live records at
   this boundary, not in JSX. Preserve IDs, date semantics, categories, and boolean
   values. Normalize SharePoint hyperlink objects to URL strings, nulls to safe
   defaults, and validate dates. Decide how rich text is converted; the current
   reader renders text, not arbitrary HTML. Upload date drives sorting; source
   publish date is a separate metadata field. Both `in_dib` values are displayed.
3. Add context and list configuration in the web part and component props. Replace
   `new MockLists()` at the marked adapter edit point. Prefer injecting a per-instance
   adapter with `getNews`, `getViews`, and `track` methods. Do not instantiate it on
   every render. Keep mock mode explicit for local demonstrations.
4. Convert those adapter methods to promises. Update **all three** callers:
   `loadNews` awaits news; `loadInsights` awaits events; `trackInteraction` awaits
   a write and then an event refresh. Add `try/catch/finally` and disposed checks
   after awaits. Set `error`, `insightsError`, or `trackingError` appropriately;
   failed tracking must not prevent article reading. Handle paging so later pages
   and categories are not silently omitted. Guard stale responses on refresh.
5. Replace `checkInsightsAccess` (currently always true) with approved permissions.
   Enforce access at the list/service too, including CSV data. Replace fictional
   reader identity only under the agreed identity/privacy policy. Preserve the
   three interaction types and the current article ID 0 convention for page views,
   or explicitly map it to a nullable lookup if the live schema requires one.
6. Update mock-only UI copy in `InnovationPulse.tsx` (hero, privacy notice),
   localization, manifest, and README when live mode is actually enabled. Never
   claim that real persisted events remain local or that real readers are fictional.
7. Validate mappings, null fields, pagination, empty lists, request failures,
   denied insights access, tracking failures, and refresh races. Verify every
   category filter and banner, search + category, and “All categories” reset.
   Build and test in a real SharePoint host before deployment.

## Local verification

Use Node 22.22.2, then `npm test`, `npm run lint`, and
`npm run build`. The tests cover exact category coverage, unique banners, valid
fixture dates, filtered rendering, search, fallback, mappings, and local events.
They do not validate live SharePoint requests or browser layout.
