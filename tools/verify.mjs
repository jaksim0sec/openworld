import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scene = readFileSync(new URL('../scene.js', import.meta.url), 'utf8');

new Script(scene, { filename: 'scene.js' });
assert.match(html, /<script src="scene\.js"><\/script>/);
for (const id of ['world', 'stats', 'error']) {
  assert.match(html, new RegExp('id="' + id + '"'), 'Missing DOM ID: ' + id);
}
for (const vista of ['meadow', 'grove', 'cliff', 'quality']) {
  assert.match(html, new RegExp('data-vista="' + vista + '"'), 'Missing vista button: ' + vista);
}
for (const segment of ["getContext('webgl2'", 'function ridge(', 'function ground(', 'function bigTree(', 'function crownSurface(', 'function drawAtlas(', 'const skyFS=', 'const worldFS=', 'requestAnimationFrame(render)', '__SERENVELT_DIAGNOSTICS__']) {
  assert.ok(scene.includes(segment), 'Missing required rendering code: ' + segment);
}
assert.equal((scene.match(/#version 300 es/g) || []).length >= 4, true, 'Missing shader declarations');
console.log('PASS: Node JavaScript syntax, launcher controls, shader declarations, and render loop.');
console.log('NOTE: This check does NOT verify GPU shader compilation, rendered appearance, mobile GPU frame rate or texture quality.');

const atlas = readFileSync(new URL('../assets/grass_v1.png', import.meta.url));
assert.equal(atlas.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Original study PNG header');
assert.equal(atlas.readUInt32BE(16),512,'Original atlas width');
assert.equal(atlas.readUInt32BE(20),512,'Original atlas height');
for (const fragment of ['vec3 skyAtmosphere(', 'function grassInstances(', 'gl.drawArraysInstanced(', "image.src='assets/grass_v1.png'"]) {
 assert.ok(scene.includes(fragment),'Study v1 art direction regression: '+fragment);
}
console.log('PASS: Original sky/grass research integrations and atlas retained.');
