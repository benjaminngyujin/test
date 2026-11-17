'use strict';
// No npm dependencies: usable immediately after copying src into an empty project.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const templates = path.join(root, 'src/project');
const files = [
  'package.json', 'package-lock.json', 'gulpfile.js', 'tsconfig.json',
  '.eslintrc.js', '.npmrc', '.nvmrc', '.gitignore', '.npmignore', 'README.md',
  'config/config.json', 'config/package-solution.json', 'config/sass.json',
  'config/serve.json', 'config/write-manifests.json'
];
const mode = process.argv[2] || 'check';
if (!['check', 'restore', 'apply'].includes(mode)) {
  console.error('Usage: node src/tooling/project.cjs check|restore|apply');
  process.exit(1);
}
const changes = files.map(file => {
  const bytes = fs.readFileSync(path.join(templates, file));
  const target = path.join(root, file);
  const exists = fs.existsSync(target);
  return { file, target, bytes, exists, matches: exists && fs.readFileSync(target).equals(bytes) };
}).filter(entry => !entry.matches);
const conflicts = mode === 'restore' ? changes.filter(entry => entry.exists) : mode === 'check' ? changes : [];
// Preflight every file before writing: never leave a half-restored conflicting project.
if (conflicts.length) {
  console.error('Project files differ from src/project:\n' + conflicts.map(entry => '  ' + entry.file).join('\n'));
  console.error('Reconcile edits into src/project, then use "apply" to write the reviewed templates to the root.');
  process.exit(1);
}
if (mode !== 'check') {
  for (const entry of changes) {
    fs.mkdirSync(path.dirname(entry.target), { recursive: true });
    fs.writeFileSync(entry.target, entry.bytes);
  }
}
console.log(mode === 'check' ? 'Portable project templates match the build files.' : `Project ${mode} complete (${changes.length} files written).`);
