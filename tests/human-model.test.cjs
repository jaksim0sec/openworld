const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const file=fs.readFileSync(path.join(__dirname,'../assets/human_npc_lod.js'),'utf8');
const ctx={window:{}};vm.runInNewContext(file,ctx,{filename:'human_npc_lod.js'});
const model=ctx.window.SerenveltHumanLOD;
const renderer=require('../town_render.js');
const {WORKERS}=require('../town.js');
test('NPC asset is derived from the exact user-provided 47-bone source',()=>{
 assert.equal(model.format,'SerenveltHumanLOD/1');
 assert.equal(model.sourceSha256,'7ced6d5c1e5a0495497788c862252f9d7c1758b60567afef0d7844a69fad5144');
 assert.equal(model.bones.length,47);
 assert.equal(model.sourceFaces,112704);
 assert.ok(model.sourceFile.startsWith('인간모델1'));
});
test('all harbor residents share source-derived mesh, not geometry rebuilt per NPC',()=>{
 assert.equal(WORKERS.length,6);
 assert.ok(WORKERS.every(a=>a.color.length===3));
 assert.equal(model.lods.near.triangleCount<model.sourceFaces,true);
 assert.ok(model.lods.far.triangleCount<model.lods.near.triangleCount);
 const near=renderer.unpackLOD(model.lods.near);
 assert.equal(near.vertices.length,near.vertexCount*20);
 assert.equal(near.count,near.triangles*3);
 assert.ok(Math.max(...near.indices)<near.vertexCount);
});
test('bind pose leaves source mesh coordinates unchanged',()=>{
 const actor={walking:false,phase:0,action:0,index:0,rest:true};
 const m=renderer.computeSkinMatrices(model.bones,actor);
 assert.equal(m.length,47*16);
 for(let i=0;i<47;i++){
  const j=i*16;
  for(const k of [0,5,10,15])assert.ok(Math.abs(m[j+k]-1)<1e-5);
  for(const k of [1,2,3,4,6,7,8,9,11,12,13,14])assert.ok(Math.abs(m[j+k])<1e-5);
 }
});
test('walking pose changes articulated limbs, stays finite, and keeps head attached',()=>{
 const idle=renderer.computeSkinMatrices(model.bones,{walking:false,phase:0,action:0,index:1});
 const walking=renderer.computeSkinMatrices(model.bones,{walking:true,phase:Math.PI/2,action:1,index:1});
 assert.ok(walking.every(Number.isFinite));
 assert.ok(walking.some((v,i)=>Math.abs(v-idle[i])>.1));
 const arm=model.bones.findIndex(x=>x.id==='upper_arm_left');
 assert.ok(walking.subarray(arm*16,arm*16+16).some((v,i)=>Math.abs(v-idle[arm*16+i])>.01));
});
test('shader is a skinned mesh renderer rather than a primitive mannequin',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../town_render.js'),'utf8');
 assert.match(source,/uSkin\[47\]/);
 assert.match(source,/gl\.drawElements\(gl\.TRIANGLES/);
 assert.doesNotMatch(source,/function loft\(/);
 assert.doesNotMatch(source,/function makeMesh\(/);
});
