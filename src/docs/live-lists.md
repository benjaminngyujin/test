# Connecting the real SharePoint lists

There is no mock data provider or `data` folder. `InnovationPulse.tsx` receives an
`IInnovationPulseService` through props. The web part creates a
`SharePointListsService` using its authenticated SPFx context. List contents are
read at runtime and are not included in the source handoff or deployment package.

## Set up after porting

1. Build and deploy the web part to your SharePoint site.
2. Edit the page and open the web part's properties.
3. Enter **News list name or GUID**. This is a list on the current SharePoint web.
4. Optionally enter **Interactions list name or GUID** to enable readership
   insights for users who can read that list.
5. Enable **Record readership interactions** only if you want page visits, tile
   clicks, and source-link clicks written to the interactions list. It is off by
   default. Reads and writes use the signed-in user's SharePoint permissions.
6. Apply/save the page. Verify articles, filtering, images, and permissions using
   accounts with the intended access. The source does not contain a real list ID.

An unset news list produces a setup message. An empty list produces an empty
state. Failed requests produce an error; no sample articles are substituted.
Blank interactions configuration disables both insights and tracking.

## Match your columns

Edit `src/webparts/innovationPulse/services/listSchema.ts` if your column names
differ. Each mapping value may be a **display name or internal name**. The service
queries the list's field definitions to find the real internal name, preferring
an exact internal-name match. Ambiguous display names cause an explicit error.
Reload the web part after changing a list's column definitions.

News mapping defaults:

| Column | Type | Required to load news? |
| --- | --- | --- |
| article title | Text | Yes |
| upload date | Date and Time | Yes |
| article body | Multiple lines of text | Yes |
| category | Text or single Choice | Yes |
| source url | Text or Hyperlink | No |
| sub category | Text or single Choice | No |
| region | Text or single Choice | No |
| source publish date | Date and Time | No |
| country | Text or single Choice | No |
| DBS implication | Text or Multiple lines of text | No |
| source publisher | Text | No |
| article image url | Text or Hyperlink | No |
| in_dib | Yes/No | No |

Missing optional fields become empty strings (or false for `in_dib`). Existing
fields with incompatible types produce an error rather than being silently
misinterpreted. Rich-text bodies/implications are converted to plain text; the
reader does not render arbitrary HTML. Only HTTP(S) source/image URLs are used.
Both `in_dib` values appear in the feed. Upload date drives sorting.

Interactions mapping defaults (all required when using the interactions list):

| Column | Type |
| --- | --- |
| article | Text |
| article ID | Number (not a Lookup) |
| viewer name | Text |
| viewer account | Text (not a Person field) |
| original source URL | Text or Hyperlink; allow empty values |
| viewed at | Date and Time |
| interaction type | Text or Choice: `Page view`, `Tile click`, `Source article click` |

Rename the built-in `Title` column to the mapped article/title display name, or
map that property to `Title`. If using a different column, ensure the unused
built-in Title and any extra columns do not block writes with unmet requirements.
Page views use article ID `0` and an empty source URL. Reader name and account
come from `pageContext.user`; the account is the SharePoint login name.

Lookup, Person, taxonomy, multi-choice, calculated, and modern Image fields need
explicit service changes before use. Do not map them as plain strings. To use a
list on another web, change service construction deliberately; the property pane
currently targets the web hosting this web part.

## Developer edit map

All paths below are under `src/webparts/innovationPulse/`.

| Change | File |
| --- | --- |
| List settings, service creation, SPFx context | `InnovationPulseWebPart.ts` |
| Default settings (blank list names, tracking off) | `InnovationPulseWebPart.manifest.json` |
| Column names | `services/listSchema.ts` |
| REST requests, paging, field mapping, permissions, writes | `services/SharePointListsService.ts` |
| Contract consumed by the UI | `services/IInnovationPulseService.ts` |
| Article and interaction types | `models/NewsModels.ts` |
| Loading/error states, filters, article display | `components/InnovationPulse.tsx` |
| Category banner mapping | `presentation/categoryBanners.ts` |
| Bundled decorative banner images | `assets/banners/` |

Keep list access out of `InnovationPulse.tsx`. It calls asynchronous service
methods, handles failures, and discards late news/insight results. Changing web
part settings creates a new service and remounts the component. Failed tracking
does not prevent reading an article. SharePoint enforces list/item permissions;
hiding an Insights tab is not an access-control boundary. CSV exports contain
only interaction records returned for the current user.

News and interactions follow REST pagination. Category sections come from actual
news rows, so a category with no articles will not appear. The banner registry
contains the nine established category labels and a general fallback image.
Banner configuration is presentation, not a source of articles.

## Validation

Run `npm test`, `npm run lint`, and `npm run build`. Tests use isolated stub HTTP
responses to exercise mappings, paging, permission denial, setup errors,
tracking opt-in/failure, and stale response handling. Test records are not imported
by the web part. There is no runtime sample-data mode.

The implementation has passed local tests and production packaging. Actual
SharePoint connectivity and your list schema remain to be verified after porting.
No live list was accessed or changed during implementation.
