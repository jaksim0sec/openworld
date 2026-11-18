/* Stage 02 exploration: first-person heightfield walking and touch controls. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const EYE_HEIGHT=1.7,BODY_RADIUS=.38;
function createInputPulse(){let pending=false;return {press(){pending=true;},release(){},consume(){const v=pending;pending=false;return v;}};}
function createPlayerState(view={},sampleGround=()=>0){
 const x=view.x??0,z=view.z??0,feet=sampleGround(x,z);
 return {x,z,y:feet,vx:0,vz:0,vy:0,yaw:view.yaw??0,pitch:view.pitch??0,onGround:true,jumpHeld:false,distanceWalked:0};
}
function advancePlayer(state,input={},delta=1/60,sampleGround=()=>0,obstacles=[]){
 const dt=clamp(Number.isFinite(delta)?delta:0,0,.05);
 if(!dt)return state;
 const forward=input.forward||0,strafe=input.strafe||0,mag=Math.max(1,Math.hypot(forward,strafe));
 const f=forward/mag,s=strafe/mag,speed=input.sprint?7.1:4.9;
 const sin=Math.sin(state.yaw),cos=Math.cos(state.yaw);
 const targetX=(sin*f+cos*s)*speed,targetZ=(cos*f-sin*s)*speed;
 const responsiveness=1-Math.exp(-(state.onGround?22:9)*dt);
 state.vx+=(targetX-state.vx)*responsiveness;
 state.vz+=(targetZ-state.vz)*responsiveness;
 const risingJump=!!input.jump&&!state.jumpHeld;
 state.jumpHeld=!!input.jump;
 if(risingJump&&state.onGround){state.vy=5.7;state.onGround=false;}
 const steps=Math.max(1,Math.ceil(dt/(1/120))),sub=dt/steps;
 for(let i=0;i<steps;i++){
  const floor=sampleGround(state.x,state.z);
  function canEnter(nx,nz,stepDistance){
   const next=sampleGround(nx,nz),rise=next-floor;
   if(!Number.isFinite(next))return false;
   if(rise>.58||rise>Math.max(.08,stepDistance)*.92)return false;
   if(!state.onGround&&next>state.y+.08)return false;
   for(const o of obstacles)if(Math.hypot(nx-o.x,nz-o.z)<(o.radius||0)+BODY_RADIUS)return false;
   return true;
  }
  let nx=state.x+state.vx*sub,nz=state.z+state.vz*sub;
  if(canEnter(nx,nz,Math.hypot(state.vx,state.vz)*sub)){
   state.distanceWalked+=Math.hypot(nx-state.x,nz-state.z);state.x=nx;state.z=nz;
  }else{
   if(canEnter(nx,state.z,Math.abs(state.vx*sub))){state.distanceWalked+=Math.abs(nx-state.x);state.x=nx;}else state.vx=0;
   if(canEnter(state.x,nz,Math.abs(state.vz*sub))){state.distanceWalked+=Math.abs(nz-state.z);state.z=nz;}else state.vz=0;
  }
  const nextFloor=sampleGround(state.x,state.z);
  if(state.onGround){state.y=nextFloor;state.vy=0;}
  else{state.vy-=15.5*sub;state.y+=state.vy*sub;if(state.y<=nextFloor){state.y=nextFloor;state.vy=0;state.onGround=true;}}
 }
 return state;
}
function createControls({canvas,ground,cam}){
 const pad=document.querySelector('#move-pad'),thumb=document.querySelector('#move-thumb');
 const jump=document.querySelector('#jump'),interact=document.querySelector('#interact');
 const hint=document.querySelector('#context-hint'),toast=document.querySelector('#toast');
 const keys=new Set(),stick={forward:0,strafe:0};
 const tree={x:25,z:68,radius:1.18};
 let state=createPlayerState(cam,ground),lookId=null,lookX=0,lookY=0,padId=null;
 const jumpPulse=createInputPulse();let toastUntil=0;
 const keyCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space','KeyE']);
 function onKeyDown(e){if(keyCodes.has(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='Space'&&!e.repeat)jumpPulse.press();if(e.code==='KeyE'&&!e.repeat)inspect();}
 function onKeyUp(e){keys.delete(e.code);}
 window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
 window.addEventListener('blur',()=>{keys.clear();stick.forward=stick.strafe=0;resetThumb();});
 function resetThumb(){if(thumb)thumb.style.transform='translate(-50%,-50%)';}
 function moveStick(e){
  const r=pad.getBoundingClientRect(),cx=r.left+r.width*.5,cy=r.top+r.height*.5,maxRadius=Math.max(1,r.width*.37);
  let dx=clamp((e.clientX-cx)/maxRadius,-1,1),dy=clamp((e.clientY-cy)/maxRadius,-1,1);
  const mag=Math.max(1,Math.hypot(dx,dy));dx/=mag;dy/=mag;
  stick.strafe=dx;stick.forward=-dy;thumb.style.transform=`translate(calc(-50% + ${dx*maxRadius}px), calc(-50% + ${dy*maxRadius}px))`;
 }
 if(pad){
  pad.addEventListener('pointerdown',e=>{if(padId!==null)return;e.preventDefault();padId=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e);});
  pad.addEventListener('pointermove',e=>{if(e.pointerId===padId)moveStick(e);});
  const stop=e=>{if(e.pointerId!==padId)return;padId=null;stick.forward=stick.strafe=0;resetThumb();};
  ['pointerup','pointercancel','lostpointercapture'].forEach(k=>pad.addEventListener(k,stop));
 }
 canvas.addEventListener('pointerdown',e=>{
  if(lookId!==null||(e.pointerType==='touch'&&e.clientX<window.innerWidth*.28))return;
  lookId=e.pointerId;lookX=e.clientX;lookY=e.clientY;canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==lookId)return;
  state.yaw-=(e.clientX-lookX)*.0028;
  state.pitch=clamp(state.pitch+(e.clientY-lookY)*.0023,-.48,.61);
  lookX=e.clientX;lookY=e.clientY;
 });
 function stopLook(e){if(e.pointerId===lookId)lookId=null;}
 ['pointerup','pointercancel','lostpointercapture'].forEach(k=>canvas.addEventListener(k,stopLook));
 if(jump){jump.addEventListener('pointerdown',e=>{e.preventDefault();jumpPulse.press();jump.setPointerCapture(e.pointerId);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(k=>jump.addEventListener(k,()=>jumpPulse.release()));}
 if(interact)interact.addEventListener('click',inspect);
 function canInspect(){
  const dx=tree.x-state.x,dz=tree.z-state.z,dist=Math.hypot(dx,dz);
  return dist<5.2&&(Math.sin(state.yaw)*dx+Math.cos(state.yaw)*dz)/Math.max(dist,.001)>.0;
 }
 function inspect(){
  if(!canInspect())return false;
  if(toast){toast.textContent='오래된 나무. 줄기에는 희미한 바람의 흔적이 남아 있다.';toast.classList.add('visible');toastUntil=performance.now()+3600;}
  return true;
 }
 let bob=0,roll=0;
 function update(delta){
  const f=clamp((keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+stick.forward,-1,1);
  const s=clamp((keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.strafe,-1,1);
  advancePlayer(state,{forward:f,strafe:s,sprint:keys.has('ShiftLeft')||keys.has('ShiftRight'),jump:jumpPulse.consume()},delta,ground,[tree]);
  const moving=Math.min(1,Math.hypot(state.vx,state.vz)/4.9);
  bob+=(moving-bob)*(1-Math.exp(-8*Math.max(delta,0)));
  const targetRoll=-.028*s*moving;roll+=(targetRoll-roll)*(1-Math.exp(-12*Math.max(delta,0)));
  cam.x=state.x;cam.z=state.z;
  cam.y=state.y+EYE_HEIGHT+(state.onGround?Math.sin(state.distanceWalked*11.2)*.032*bob:0);
  cam.yaw=state.yaw;cam.pitch=state.pitch;cam.roll=roll;
  const visible=canInspect();if(interact)interact.hidden=!visible;if(hint)hint.hidden=!visible;
  if(toast&&toastUntil&&performance.now()>toastUntil){toast.classList.remove('visible');toastUntil=0;}
  window.__SERENVELT_PLAYER__={x:state.x,y:state.y,z:state.z,yaw:state.yaw,onGround:state.onGround,inspectable:visible};
 }
 function teleport(view){state=createPlayerState(view,ground);cam.x=state.x;cam.z=state.z;cam.y=state.y+EYE_HEIGHT;cam.yaw=state.yaw;cam.pitch=state.pitch;cam.roll=0;}
 return {update,teleport,inspect,getState:()=>({...state})};
}
const api={createPlayerState,advancePlayer,createInputPulse,createControls};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SerenveltMotion=api;
})(typeof window==='undefined'?globalThis:window);
