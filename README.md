# Innovation Pulse SPFx dependencies

This folder currently contains dependency setup only. Bring in the original project's source, Gulp file, TypeScript configuration, and SPFx configuration before running `npm run build` or `npm run serve`.

The project owner reports running this setup with Node v22.22.2. No Node version manager is assumed. The Node 18 pin and root engine restriction previously added by the assistant have been removed. Microsoft lists Node 18 for SPFx 1.20; this differs from the reported runtime and does not establish whether this project builds successfully on Node 22.22.2.

## Installed package choices

- GSAP 3.13.0: `import { gsap } from "gsap";`
- Framer Motion 6.5.1: `import { motion } from "framer-motion";` — this release supports React 17.
- shadcn foundation: Tailwind CSS 3.4.17, tailwindcss-animate 1.0.7, class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 2.6.0, and lucide-react 0.468.0.
- Radix primitives: Slot 1.1.2, Dialog 1.1.6, Dropdown Menu 2.1.6, Tabs 1.1.3, and Tooltip 1.1.8.

shadcn UI components are source files added to your project. These dependencies provide a foundation for React 17-compatible, Tailwind 3-era components; they do not install a complete UI component collection. Tailwind configuration, scoped styles, and integration with the SPFx build still need to be added alongside your source. Review component requirements before adding further components or running the latest shadcn CLI, which may introduce newer dependencies and conventions.

`@microsoft/sp-module-interfaces` is set to the published 1.20.2 release in the SPFx 1.20 line. Exact direct dependency versions and `package-lock.json` preserve this installation; `npm ci` installs the locked dependency tree.

References: [Microsoft SPFx compatibility](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility), [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual), [GSAP installation](https://gsap.com/docs/v3/Installation/).

The SPFx 1.20 Heft plugin requests an unavailable `@microsoft/sp-module-interfaces@1.19.0-dev.233`. A narrowly scoped npm override uses the direct 1.20.2 dependency for that plugin so installation can resolve. Validate the complete SPFx build after restoring project files.

Validation performed by the assistant: installation and the TypeScript check ran under a temporary Node 18.20.8 toolchain, not the owner’s Node v22.22.2 environment. Node v22.22.2 has not been validated here. A strict TypeScript 4.7.4 check of imports and representative JSX for every added runtime library passed, including declaration checking (no `skipLibCheck`). `@types/react` was updated to 17.0.89 for the JSX namespace required by Radix; React remains 17.0.1.

The existing SPFx Heft dependencies emit a peer warning: `loader-load-themed-styles@2.1.37` expects `load-themed-styles@^2.0.113`, while the Heft plugin pins 1.10.292. Installation succeeds, but the missing original project files prevent validating this build-tool path. npm also reports deprecations in the legacy SPFx dependency tree.
