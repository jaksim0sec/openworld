import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('../scene.js',import.meta.url),'utf8');
const ground=source.slice(source.indexOf('const worldFS='),source.indexOf('// V1 grass study'));
const grass=source.slice(source.indexOf('const grassVS='),source.indexOf('function shader('));
const sky=source.slice(source.indexOf('const skyFS='),source.indexOf('const worldVS='));

assert.match(ground,/vec3 dark=vec3\(\.18,\.40,\.22\),mid=vec3\(\.42,\.66,\.30\),bright=vec3\(\.75,\.84,\.35\)/,'Vivid, separated meadow light/shadow colors');
assert.match(ground,/loam=clamp\(loam\+exposure\*\.12,0\.,\.19\)/,'Grass coverage not globally replaced by soil');
assert.match(ground,/vec3 ambientSky=vec3\(/,'Indirect sky illumination retained');
assert.match(ground,/vec3 horizon=mix\(/,'Warm and cool atmospheric perspective both present');
assert.match(ground,/smoothstep\(\.48,1\.35,abs\(p\.x-track\)\)/,'Footpath not excessively broad');
assert.match(grass,/height=mix\(\.39,\.73/,'Variable grass tuft heights');
assert.match(grass,/vec3\(\.14,\.13,\.02\)/,'Sunlit warm grass tips');
assert.match(sky,/vec3 skyAtmosphere\(/,'V1 Rayleigh/Mie sky model preserved');
assert.match(source,/gl\.drawArraysInstanced\(/,'V1 GPU grass instancing preserved');
console.log('PASS: Palette, soil mask, fog, path and original sky/grass behavior invariants');
