# Innovation Pulse SPFx

The portable handoff is **`src/`**: web-part code, images, styles, SharePoint services,
tests, documentation, build logic, and templates for the SPFx project files.

See [source documentation](src/README.md), [porting instructions](src/docs/portability.md),
and the [internal LLM edit map](src/docs/live-lists.md).

In a new directory containing the copied `src/` folder:

```sh
node src/tooling/project.cjs restore
nvm use
npm ci
npm test
npm run lint
npm run build
```

Node 22.22.2 is required for installation and builds. Dependencies are installed
from the lockfile; they are not vendored inside `src`. SPFx still needs a
SharePoint host. Build output is `sharepoint/solution/innovation-pulse-spfx.sppkg`.
