# Source-only handoff

Copy the entire `src/` folder into a new, empty project directory. Everything
specific to this web part is included: code, styles, banners, loading icon,
localization, manifests, SharePoint services, tests, documentation, dependency versions and
lockfile, and the SPFx build configuration. No runtime asset points outside `src`.

From the **new project root** (the directory containing `src`):

```sh
node src/tooling/project.cjs restore
nvm use
npm ci
npm test
npm run lint
npm run build
```

The restore script uses only Node built-ins. It recreates the conventional root
files from `src/project/`, including `package.json`, `package-lock.json`,
`gulpfile.js`, `tsconfig.json`, lint configuration, npm/Node settings, and
`config/*.json`. SPFx and npm require those root files to build normally. They
are not additional material to remember when transporting the source.

Node 22.22.2 and npm 10.9.7 are the supported toolchain. `nvm use` is optional if
your environment selects the matching Node version another way. Dependencies
are not vendored: `npm ci` needs access to your package registry (or a populated
npm cache). A SharePoint tenant/page is still needed to run the deployed web part.
This handoff is not a standalone HTML application or an offline npm installer.

## Edit map for internal LLMs

- Application edits: `src/webparts/innovationPulse/`.
- Images: `src/webparts/innovationPulse/assets/`; mapping in `presentation/categoryBanners.ts`.
- Live-list configuration and column mapping: [live-lists.md](live-lists.md).
- Tests: `src/tests/` covers live-list service behavior and the portable restore workflow; run `npm test`.
- Build behavior: `src/tooling/gulp.cjs`; root `gulpfile.js` delegates to it.
- Root configuration: **edit `src/project/` first**, then run
  `node src/tooling/project.cjs apply` to update the root copies. `apply` overwrites
  differing root files, so reconcile any root-only changes before running it.
- Dependency upgrades: edit `src/project/package.json`, apply it, update the
  lockfile using npm at the root, then copy the resulting root `package-lock.json`
  back to `src/project/package-lock.json`. Run `npm run project:check` afterward.
  Do not regenerate or hand-edit the lockfile inside the template directory.
- New required root files: add them to the `files` list in
  `src/tooling/project.cjs` and place their templates under `src/project/`.

`restore` creates missing files and accepts identical existing ones. If any
existing file differs, it stops before writing anything. `check` compares bytes;
production/development builds run it automatically to catch stale portable copies.
Do not run npm commands from `src/project/`: it is a template directory.

## Environment changes

Review `src/project/config/serve.json` for the target SharePoint workbench URL.
Keep tenant-specific credentials and private registry tokens outside this source
handoff (for example in user npm configuration or environment variables).
Review package and manifest IDs: retain them when upgrading the same solution;
choose new IDs deliberately only when creating a separate installable solution.
Restore does not rewrite tenant URLs or identities automatically.

## What does not need copying

`node_modules/` is installed from the lockfile. `lib/`, `dist/`, `temp/`, `release/`,
`sharepoint/solution/`, and `*.scss.ts` are generated outputs. The deployment file
is `sharepoint/solution/innovation-pulse-spfx.sppkg`. Old archives, `unzip/`,
`scripts/build-styles.js`, `tailwind.config.js`, and `components.json` are legacy
reference files and are not used by the active build. They are not required for
this handoff. Historical third-party notices are preserved in
`src/docs/THIRD_PARTY_NOTICES.md`.


## Verification

On 17 November 2026, a fresh temporary directory received only `src/` (excluding
regenerable `*.scss.ts` files). Restore recreated all 15 required root files.
Tests, lint, and production packaging passed there using the existing installed
dependencies via a symlink. A fresh network installation was not repeated.
Automated tests also verify repeat restoration, drift detection, conflict
preflight with no partial writes, and explicit template application.
