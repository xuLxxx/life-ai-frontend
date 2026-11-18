import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { BackendReader } from './backend-reader.js';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'backend-mcp-'));
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'README.md'), '# Backend docs');
  await writeFile(
    path.join(root, 'src', 'api.ts'),
    "@Controller('users')\nexport class UsersController {}\n",
  );
  await writeFile(path.join(root, '.env'), 'SECRET=blocked');
  return root;
}

test('reads and searches backend files', async () => {
  const root = await fixture();
  try {
    const reader = new BackendReader(root);
    assert.equal((await reader.read('README.md')).content, '# Backend docs');
    assert.equal((await reader.search('Controller')).length, 1);
    assert.equal((await reader.priorityDocs())[0]?.path, 'README.md');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('blocks traversal and secrets', async () => {
  const root = await fixture();
  try {
    const reader = new BackendReader(root);
    await assert.rejects(reader.read('../outside.md'));
    await assert.rejects(reader.read('.env'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('blocks symlink escapes on Windows when supported', async (t) => {
  const root = await fixture();
  const outside = await mkdtemp(path.join(os.tmpdir(), 'backend-mcp-outside-'));
  try {
    await writeFile(path.join(outside, 'secret.md'), 'secret');
    try {
      await symlink(
        path.join(outside, 'secret.md'),
        path.join(root, 'escape.md'),
      );
    } catch {
      t.skip('symlinks unavailable');
      return;
    }
    const reader = new BackendReader(root);
    await assert.rejects(reader.read('escape.md'));
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
