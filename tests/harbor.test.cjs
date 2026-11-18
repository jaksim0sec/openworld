const test=require('node:test');
const assert=require('node:assert/strict');
const H=require('../harbor.js');
const ground=()=>2.7;
test('harbor district has accessible dock, alley, two furnished interiors',()=>{
 const blueprint=H.getLayout();assert.ok(blueprint.buildings.length>=3);
 assert.ok(blueprint.buildings.filter(b=>b.enterable).length>=2);
 assert.ok(blueprint.features.includes('pier')&&blueprint.features.includes('workshop'));
});
test('merchant and workshop door openings have walkable passage without blocked interiors',()=>{
 const world=H.getCollision(ground);
 for(const id of ['merchant','workshop']){
  const b=H.getLayout().buildings.find(x=>x.id===id);
  assert.ok(b,'missing '+id);
  assert.equal(world.blocks(b.x-b.w/2-.10,b.z),false,'blocked doorway '+id);
  assert.equal(world.blocks(b.x-b.w/2+.9,b.z),false,'blocked entry '+id);
  assert.equal(world.blocks(b.x-b.w/2-.10,b.z+b.d/2-0.3),true,'missing wall '+id);
  assert.equal(world.blocks(b.x,b.z),false,'blocked interior '+id);
 }
});
test('pier height, gangway slope and bank ground are continuous',()=>{
 const c=H.getCollision(ground);
 assert.ok(Math.abs(c.floorAt(-31,8)-.85)<.2);
 assert.ok(c.floorAt(-21,8)<c.floorAt(-14,8));
 assert.ok(Math.abs(c.floorAt(30,80)-2.7)<.01);
});
test('custom architecture mesh is textured, finite and richer than box blockout',()=>{
 let triangles=0,invalid=0;
 const m={tri(a,b,c,color,na,nb,nc,uv){triangles++;if(![...a,...b,...c,...color,...(uv?.flat()||[])].every(Number.isFinite))invalid++},quad(a,b,c,d,color,normals,uv){this.tri(a,b,c,color,null,null,null,uv?.slice(0,3));this.tri(a,c,d,color,null,null,null,uv?[uv[0],uv[2],uv[3]]:null)}};
 H.build(m,ground);
 assert.ok(triangles>4500,'mesh lacks sufficient facade/roof detail '+triangles);
 assert.equal(invalid,0);
});
