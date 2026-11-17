import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(js, 'Executable JavaScript script is present');
new Script(js[1], { filename: 'index-inline.js' });

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const id of ['world', 'stats', 'err', 'quality', 'sky-vs', 'sky-fs', 'world-vs', 'world-fs']) {
  assert.ok(ids.has(id), 'Missing DOM ID: ' + id);
}
for (const match of js[1].matchAll(/getElementById\('([^']+)'\)/g)) {
  assert.ok(ids.has(match[1]), 'Unresolved DOM ID: ' + match[1]);
}
for (const shaderId of ['sky-vs', 'sky-fs', 'world-vs', 'world-fs']) {
  const shaderTag = html.match(new RegExp('<script[^>]*id="' + shaderId + '"[^>]*>([\\s\\S]*?)<\\/script>'));
  assert.ok(shaderTag && shaderTag[1].startsWith('#version 300 es'), 'Missing GLSL ES 3 shader: ' + shaderId);
}
assert.match(js[1], /getContext\('webgl2'/);
assert.match(js[1], /requestAnimationFrame\(draw\)/);
assert.match(js[1], /pointermove/);
console.log('PASS: Inline JavaScript syntax, DOM references, GLSL declarations, and render loop');
console.log('NOTE: GPU compilation, visual appearance, FPS and mobile hardware remain untested');
