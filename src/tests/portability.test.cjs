'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const original = path.resolve(__dirname, '..');
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-portability-test-'));
try {
  fs.cpSync(original, path.join(sandbox, 'src'), { recursive: true, filter: source => !source.endsWith('.scss.ts') });
  const run = mode => spawnSync(process.execPath, ['src/tooling/project.cjs', mode], { cwd: sandbox, encoding: 'utf8' });
  for (const mode of ['restore', 'restore', 'check']) {
    const result = run(mode);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.ok(fs.existsSync(path.join(sandbox, 'package-lock.json')));
  assert.ok(fs.existsSync(path.join(sandbox, 'config/package-solution.json')));
  fs.appendFileSync(path.join(sandbox, 'package.json'), '\n');
  fs.unlinkSync(path.join(sandbox, 'gulpfile.js'));
  assert.equal(run('check').status, 1, 'Detect drift');
  assert.equal(run('restore').status, 1, 'Reject existing conflicts');
  assert.equal(fs.existsSync(path.join(sandbox, 'gulpfile.js')), false, 'No partial writes on conflict');
  assert.equal(run('apply').status, 0);
  assert.equal(run('check').status, 0);
  console.log('Source-only restoration, idempotence, drift detection, and conflict preflight passed.');
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
