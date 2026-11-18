const test=require('node:test');
const assert=require('node:assert/strict');
const {getCollision}=require('../harbor.js');
const town=require('../town.js');
const region=getCollision(()=>2.3);

test('residents form a stable six-person working community, not player-triggered spawns',()=>{
  const sim=town.createSimulation({region,initialHour:8.2});
  const a=sim.snapshot();
  assert.equal(a.residents.length,6);
  assert.equal(new Set(a.residents.map(x=>x.id)).size,6);
  assert.deepEqual(a.residents.map(x=>x.id),['nerin','gio','maren','ravi','serian','barin']);
  assert.ok(a.residents.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)&&x.job));
});

test('NPCs change activity and market supply without player input',()=>{
  const sim=town.createSimulation({region,initialHour:8.2});
  const early=sim.snapshot();
  assert.equal(early.marketSupply,'low');
  for(let t=0;t<120;t++)sim.tick(1);
  const later=sim.snapshot();
  assert.notEqual(later.hour,early.hour);
  assert.equal(later.marketSupply,'restocked');
  assert.ok(later.residents.some(x=>x.activity!==early.residents.find(y=>y.id===x.id).activity));
});

test('moving residents remain outside walls and within the harbor',()=>{
  const sim=town.createSimulation({region,initialHour:7.8});
  for(let i=0;i<1500;i++){
    sim.tick(1/10);
    if(i%10===0)for(const actor of sim.snapshot().residents){
      assert.equal(region.blocks(actor.x,actor.z),false,`${actor.id} inside wall at ${actor.x},${actor.z}`);
      assert.ok(actor.x>-42&&actor.x<36&&actor.z>-35&&actor.z<70);
    }
  }
});

test('interaction respects facing, range and walls; dialogue reflects work',()=>{
  const sim=town.createSimulation({region,initialHour:8.2});
  const nerin=sim.snapshot().residents.find(x=>x.id==='nerin');
  assert.ok(nerin);
  const look=town.nearestResident(sim,{x:nerin.x,z:nerin.z-1.5,yaw:0},region);
  assert.equal(look?.def.id,'nerin');
  assert.equal(town.nearestResident(sim,{x:nerin.x,z:nerin.z-1.5,yaw:Math.PI},region),null);
  assert.ok(sim.talk('nerin').includes('네린'));
});

test('simulation remains deterministic at different delta sizes',()=>{
  const a=town.createSimulation({region,initialHour:8.2});const b=town.createSimulation({region,initialHour:8.2});
  for(let i=0;i<600;i++)a.tick(.1);
  for(let i=0;i<1200;i++)b.tick(.05);
  for(const actor of a.snapshot().residents){const other=b.snapshot().residents.find(x=>x.id===actor.id);assert.ok(Math.hypot(actor.x-other.x,actor.z-other.z)<.20,actor.id);}
});

test('night shifts leave stalls closed while patrol keeps its work',()=>{
 const sim=town.createSimulation({region,initialHour:22.2});
 const s=sim.snapshot();
 assert.equal(s.marketSupply,'closing');
 assert.equal(s.residents.find(x=>x.id==='maren').activity,'가게 마감');
 assert.equal(s.residents.find(x=>x.id==='barin').activity,'야간 경비');
 for(let i=0;i<40;i++)sim.tick(1);
 assert.equal(sim.snapshot().marketSupply,'closing');
});
test('residents do not overlap each other in shared alleys',()=>{
 const sim=town.createSimulation({region,initialHour:8.2});
 for(let i=0;i<1800;i++){
  sim.tick(.1);
  const a=sim.snapshot().residents;
  for(let j=0;j<a.length;j++)for(let k=j+1;k<a.length;k++){
   const d=Math.hypot(a[j].x-a[k].x,a[j].z-a[k].z);
   assert.ok(d>.43,`${a[j].id} / ${a[k].id} at ${d}`);
  }
 }
});
