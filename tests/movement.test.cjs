const test=require('node:test');
const assert=require('node:assert/strict');
const {createPlayerState,advancePlayer,createInputPulse}=require('../movement.js');
const flat=()=>0;
function run(state,input,secs,ground=flat,obstacles=[]){for(let i=0;i<Math.round(secs*60);i++)advancePlayer(state,input,1/60,ground,obstacles);return state;}
test('forward movement tracks yaw',()=>{
 const a=createPlayerState({yaw:0},flat);run(a,{forward:1},1);assert.ok(a.z>3&&Math.abs(a.x)<.01);
 const b=createPlayerState({yaw:Math.PI/2},flat);run(b,{forward:1},1);assert.ok(b.x>3&&Math.abs(b.z)<.01);
});
test('diagonal movement never exceeds straight movement',()=>{
 const a=createPlayerState({},flat),b=createPlayerState({},flat);
 run(a,{forward:1},2);run(b,{forward:1,strafe:1},2);
 assert.ok(Math.abs(Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))<.15);
});
test('tree trunk and steep grade reject traversal',()=>{
 const a=createPlayerState({},flat);run(a,{forward:1},2,flat,[{x:0,z:5,radius:1.2}]);
 assert.ok(a.z<3.6);
 const cliff=(x,z)=>z>2?10:0;
 const b=createPlayerState({},cliff);run(b,{forward:1},2,cliff);
 assert.ok(b.z<2.1&&b.y<1);
});
test('jump goes up, lands and does not restart while held',()=>{
 const a=createPlayerState({},flat);advancePlayer(a,{jump:true},1/60,flat);
 assert.ok(a.y>0&&a.vy>0&&!a.onGround);
 run(a,{jump:true},.4);assert.ok(a.y>0);
 run(a,{},2);assert.ok(a.y===0&&a.vy===0&&a.onGround);
});
test('walkable slope and long frame clamp',()=>{
 const slope=(x,z)=>z*.12;
 const a=createPlayerState({},slope);run(a,{forward:1},2,slope);
 assert.ok(a.z>4&&Math.abs(a.y-slope(a.x,a.z))<.01);
 const b=createPlayerState({},flat);advancePlayer(b,{forward:1},.9,flat);
 assert.ok(b.z<1.5);
});
test('quick press-release is consumed once even between frames',()=>{
 const p=createInputPulse();p.press();p.release();assert.equal(p.consume(),true);assert.equal(p.consume(),false);
});
