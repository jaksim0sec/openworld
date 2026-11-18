const test=require('node:test');
const assert=require('node:assert/strict');
const { createPlayerState, advancePlayer }=require('../movement.js');
const flat=()=>0;
function run(state,input,secs,ground=flat,obstacles=[]){const frames=Math.round(secs*60);for(let i=0;i<frames;i++)advancePlayer(state,input,1/60,ground,obstacles);return state;}

test('W advances along the 1st-person look heading and yaw rotates movement',()=>{
 const a=createPlayerState({x:0,z:0,yaw:0},flat);run(a,{forward:1,strafe:0},1);
 assert.ok(a.z>3 && Math.abs(a.x)<.01,JSON.stringify(a));
 const b=createPlayerState({x:0,z:0,yaw:Math.PI/2},flat);run(b,{forward:1,strafe:0},1);
 assert.ok(b.x>3 && Math.abs(b.z)<.01,JSON.stringify(b));
});

test('diagonal input normalization prevents faster traversal',()=>{
 const a=createPlayerState({},flat),b=createPlayerState({},flat);
 run(a,{forward:1,strafe:0},2);run(b,{forward:1,strafe:1},2);
 assert.ok(Math.abs(Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))<.15);
});

test('wall and steep height changes block horizontal movement',()=>{
 const wall=[{x:0,z:5,radius:1.2}];
 const a=createPlayerState({x:0,z:0},flat);run(a,{forward:1},2,flat,wall);
 assert.ok(a.z<3.6,JSON.stringify(a));
 const cliff=(x,z)=>z>2?10:0;
 const b=createPlayerState({z:0},cliff);run(b,{forward:1},2,cliff);
 assert.ok(b.z<2.1 && b.y<1,JSON.stringify(b));
});

test('jump is a brief vertical arc, lands, and cannot repeat midair',()=>{
 const s=createPlayerState({},flat);advancePlayer(s,{jump:true},1/60,flat);
 assert.ok(s.y>0 && s.vy>0 && !s.onGround);
 run(s,{jump:true},.4);assert.ok(s.y>0);
 run(s,{},2);assert.ok(Math.abs(s.y)<1e-6 && s.vy===0 && s.onGround);
});

test('height-following respects a walkable incline and dt clamping',()=>{
 const grade=(x,z)=>z*.12;
 const a=createPlayerState({z:0},grade);
 run(a,{forward:1},2,grade);
 assert.ok(a.z>4 && Math.abs(a.y-grade(a.x,a.z))<.01,JSON.stringify(a));
 const b=createPlayerState({},flat);advancePlayer(b,{forward:1},.9,flat);
 assert.ok(b.z<1.5,'Unexpected teleport from a long paused frame');
});

test('a press and release between render frames is kept until consumed',()=>{
 const {createInputPulse}=require('../movement.js');
 const pulse=createInputPulse();pulse.press();pulse.release();
 assert.equal(pulse.consume(),true);
 assert.equal(pulse.consume(),false);
});

const {getCollision}=require('../harbor.js');
test('box wall blocks walking while the shop doorway remains passable',()=>{
 const port=getCollision(()=>2.7),near={...createPlayerState({x:6.0,z:5.3,yaw:Math.PI/2},()=>2.7)};
 run(near,{forward:1},1,()=>2.7,port.colliders);
 assert.ok(near.x<7.0,'player passed solid shop wall');
 const door=createPlayerState({x:6.0,z:0,yaw:Math.PI/2},()=>2.7);
 run(door,{forward:1},1,()=>2.7,port.colliders);
 assert.ok(door.x>8.0,'shop door blocked');
});
test('the merchant apron leads from street into the room without falling through the floor',()=>{
 const port=getCollision(()=>2.7),state=createPlayerState({x:5,z:0,yaw:Math.PI/2},port.floorAt);
 run(state,{forward:1},1.25,port.floorAt,port.colliders);
 assert.ok(state.x>9,'could not cross the open merchant door');
 assert.ok(state.y>3.55&&state.y<3.8,'player failed to climb finished floor '+state.y);
});
