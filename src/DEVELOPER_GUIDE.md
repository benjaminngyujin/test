# Developer quick start

## What to copy

Copy the entire **`src` folder** into an empty project folder. It contains the
web part, images, styles, mock data, documentation, tests, and templates for the
build configuration. You do not need to copy `node_modules` or previous build output.

SPFx needs some configuration files outside `src` when building. The restore
command below creates those files for you.

## Set up and build

Use **Node 22.22.2** and **npm 10.9.7**. Open a terminal in the project folder
that contains `src`, then run:

```sh
node src/tooling/project.cjs restore
npm ci
npm test
npm run lint
npm run build
```

If you use nvm, run `nvm use` after the restore step to select the project's Node
version. Installing dependencies requires access to your npm registry or cache.
Run all commands from the project folder, not from inside `src` or `src/project`.

The build creates:

```text
sharepoint/solution/innovation-pulse-spfx.sppkg
```

Use your team's normal SharePoint app-catalog deployment process to install this
package, then add the web part to a SharePoint page. Building does not deploy it.
The web part currently uses fictional mock data; it is not connected to live lists.

## Where to make changes

| What you want to change | Where to edit |
| --- | --- |
| Page layout and filtering | `src/webparts/innovationPulse/components/InnovationPulse.tsx` |
| Colours, spacing, and styling | `src/webparts/innovationPulse/components/InnovationPulse.module.scss` |
| Card-to-popup animation | `src/webparts/innovationPulse/components/ArticleDialog.tsx` |
| Mock news and interactions | `src/webparts/innovationPulse/data/mockLists.ts` |
| Category names and banner mapping | `src/webparts/innovationPulse/data/categories.ts` |
| Banner images | `src/webparts/innovationPulse/assets/banners/` |
| Build settings and dependency versions | `src/project/` |
| Custom build logic | `src/tooling/gulp.cjs` |

After normal code or image edits, run `npm test`, `npm run lint`, and `npm run build`.
Do not edit generated files in `lib`, `dist`, `temp`, or `sharepoint/solution`,
or generated `*.scss.ts` files. They will be recreated during the build.

## Changing build settings

The files in **`src/project` are the master copies** of the root configuration.
Edit them there, review the changes, then run:

```sh
node src/tooling/project.cjs apply
npm run project:check
```

`apply` overwrites the matching root configuration files. If someone has edited
those root files directly, first bring any changes you want to keep into
`src/project`. Builds stop when the root files and master copies differ.

For dependency changes, edit `src/project/package.json`, run `apply`, then run
`npm install` at the project root. Copy the updated root `package-lock.json` back
to `src/project/package-lock.json` before running the checks and build.

If `restore` reports a conflict, compare the named root file with its copy in
`src/project`, keep the intended settings in `src/project`, and then use `apply`.
`restore` will not overwrite conflicting files.

## Handing the project to another developer

Run `npm run project:check` and the tests/build, then hand over the entire `src`
folder. The next developer can follow the setup steps above. Keep credentials
and registry tokens outside the handoff. Review tenant-specific settings when
moving environments, and retain solution IDs when updating the same web part.

For more detail, see [porting instructions](docs/portability.md),
[connecting real lists](docs/live-lists.md), and
[banner replacement instructions](docs/banner-prompts.md).


## What belongs in Git

Commit `src`, dependency lockfiles, required root build configuration, shared VS
Code settings/tasks, and legal notices. Build outputs, installed dependencies,
local environment files, caches, and unused legacy scaffolding are ignored.
Safe `.env.example`, `.env.sample`, and `.env.template` files remain trackable;
never put real credentials in them.

To change ignore rules, edit `src/project/.gitignore` and run
`node src/tooling/project.cjs apply`. Git ignore rules do not remove files that
are already tracked, and do not replace a secrets check before committing.
