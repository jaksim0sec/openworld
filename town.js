/* Serenvelt / Kael Harbor living social slice. Pure schedule simulation + instanced visual actors. */
(function (root) {
'use strict';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const SCHEDULE_MINUTES_PER_SECOND=2.4;
// Work paths follow authored safe streets / door apertures, not arbitrary straight-line teleportation.
const WORKERS=[
 {id:'nerin',name:'네린',job:'항만 선적 담당',color:[.18,.45,.52],skin:.90,hair:.26,move:.91,
  path:[[-29,11],[-32,14],[-33,19],[-29,22],[-27,16],[-29,11]],jobs:['선적 확인','입항 점검','정산','퇴근 준비'],restAt:0},
 {id:'gio',name:'기오',job:'화물 운반 반장',color:[.59,.37,.22],skin:.86,hair:.16,move:1.23,
  path:[[-33,7],[-29,9],[-23,8],[-15,8],[-10,12],[-10,29],[-13,35],[-13,45],[-10.8,45],[-13,45],[-13,35],[-10,29],[-10,12],[-15,8],[-23,8],[-29,9]],jobs:['짐 운반','창고 납품','빈 상자 회수','퇴근 준비'],restAt:7},
 {id:'maren',name:'마렌',job:'시장 노점 상인',color:[.64,.34,.28],skin:.97,hair:.30,move:.79,
  path:[[3,11],[4,13],[4,11],[3.4,8],[4,4],[3,8]],jobs:['물건 진열','시장 판매','재고 정리','가게 마감'],restAt:2},
 {id:'ravi',name:'라비',job:'수리공방 기술자',color:[.40,.39,.67],skin:.82,hair:.23,move:.78,
  path:[[24,23],[26,23],[26,25],[24,25],[22,23],[19,23],[19,30],[19,33],[19,30],[19,23],[22,23]],jobs:['공구 손질','장비 수리','현장 수리','공방 정리'],restAt:0},
 {id:'serian',name:'세리안',job:'길드 의뢰 서기',color:[.30,.50,.57],skin:.92,hair:.34,move:.82,
  path:[[-12,31],[-10,32],[-11,34],[-13,36],[-13,40],[-13,36]],jobs:['의뢰 정리','방문자 상담','게시물 갱신','기록 정리'],restAt:0},
 {id:'barin',name:'바린',job:'항구 순찰대원',color:[.34,.49,.36],skin:.83,hair:.18,move:1.17,
  path:[[-4,-18],[-5,-12],[-9,-3],[-11,7],[-11,18],[-9,29],[-13,35],[-13,45],[-13,53],[-10,55],[-13,53],[-13,45],[-13,35],[-9,29],[-11,18],[-11,7],[-9,-3]],jobs:['항구 순찰','사람들 확인','야간 경비','야간 경비'],restAt:0}
];
function scheduleSlot(hour){return hour<6?3:hour<11.25?0:hour<15?1:hour<19?2:3;}
function sceneEvent(hour){return hour>=6&&hour<12?'low':hour>=12&&hour<19?'restocked':'closing';}
function createSimulation({region,initialHour=8.2}={}){
 if(!region||typeof region.floorAt!=='function'||typeof region.blocks!=='function')throw Error('Harbor collision/ground region required');
 let minutes=initialHour*60,elapsed=0;
 const actors=WORKERS.map((def,index)=>({def,index,idx:0,x:def.path[0][0],z:def.path[0][1],facing:index%2?1.4:0,phase:index*.77,walking:false,action:0,stop:.5+index*.18}));
 function getHour(){return ((minutes/60)%24+24)%24;}
 function tick(dt){
  const total=clamp(Number.isFinite(dt)?dt:0,0,10);if(!total)return;
  const n=Math.ceil(total/.05),step=total/n;
  for(let iteration=0;iteration<n;iteration++)advanceStep(step);
 }
 function advanceStep(step){
  elapsed+=step;minutes+=step*SCHEDULE_MINUTES_PER_SECOND;
  const hour=getHour(),slot=scheduleSlot(hour);
  for(const a of actors){
   const d=a.def,route=d.path;
   // Late quiet hours: keep a resident at a known safe endpoint, but reach it by walking.
   const targetIdx=(slot===3&&d.id!=='barin')?d.restAt:(a.idx+1)%route.length;
   const destination=route[targetIdx];let remaining=step*(slot===3&&d.id!=='barin'?.68:1)*d.move;
   const sleeping=slot===3&&d.id!=='barin'&&a.idx===d.restAt;
   a.action=d.id==='gio'&&(slot!==3)&&a.idx<8?1:d.id==='ravi'&&slot<3?3:d.id==='maren'&&slot<3?2:d.id==='nerin'&&slot<3?5:d.id==='serian'&&slot<3?2:4;
   if(sleeping){a.walking=false;a.action=0;continue;}
   if(a.stop>0){const waited=Math.min(step,a.stop);a.stop-=waited;if(a.stop>0){a.walking=false;continue;}a.stop=0;}
   let guard=0;
   while(remaining>0.0001&&guard++<12){
    const next=route[(a.idx+1)%route.length];
    // Route always advances through authored points. In late hours continue toward restAt.
    const dest=(slot===3&&d.id!=='barin'&&a.idx===d.restAt)?route[d.restAt]:next;
    const dx=dest[0]-a.x,dz=dest[1]-a.z,dist=Math.hypot(dx,dz);
    if(dist<.0001){a.idx=(a.idx+1)%route.length;a.stop=.35+.34*((a.index+a.idx)%3);break;}
    const part=Math.min(dist,remaining);
    const fx=dx/dist,fz=dz/dist;
    let sidestep=0;
    // Keep walking people from intersecting: pre-emptively move around one another.
    for(const other of actors){if(other===a)continue;
     const gap=Math.hypot(a.x-other.x,a.z-other.z);
     if(gap<1.35)sidestep+=Math.max(0,1.35-gap)*1.55;
    }
    const stepX=fx-fz*sidestep,stepZ=fz+fx*sidestep,norm=Math.hypot(stepX,stepZ)||1;
    const xx=a.x+stepX/norm*part,zz=a.z+stepZ/norm*part;
    // Guard against malformed paths, walls, and crowd interpenetration.
    if(region.blocks(xx,zz)||actors.some(other=>other!==a&&Math.hypot(xx-other.x,zz-other.z)<.51)){
     a.walking=false;remaining=0;break;
    }
    a.x=xx;a.z=zz;a.facing=Math.atan2(stepX,stepZ);a.walking=true;a.phase+=part*7.8;
    remaining-=part;
    if(part>=dist-.00001){a.idx=(a.idx+1)%route.length;a.stop=.32+.23*((a.idx+a.index)%3);break;}
   }
  }
 }
 function snapshot(){
  const hour=getHour(),slot=scheduleSlot(hour);
  return {hour,marketSupply:sceneEvent(hour),residents:actors.map(a=>({id:a.def.id,name:a.def.name,job:a.def.job,activity:a.def.jobs[slot],x:a.x,y:region.floorAt(a.x,a.z),z:a.z,facing:a.facing,walking:a.walking,phase:a.phase,action:a.action,color:a.def.color}))};
 }
 function talk(id){const hour=getHour(),slot=scheduleSlot(hour),d=WORKERS.find(d=>d.id===id);if(!d)return '';
  const texts={
   nerin:['서류가 산더미야. 출항 전에는 말 걸기 힘들어.','항로가 밀려서 배가 한 척 늦었어.','오늘 선적량은 거의 맞아떨어졌네.','내일 새벽에 다시 확인해야지.'],
   gio:['지금 상자를 나르는 중이야. 길 좀 비켜줘.','창고에 가져다 둬야 할 물건이 남았어.','오늘은 짐이 많지 않아서 다행이네.','이제 팔 좀 쉬어야겠어.'],
   maren:['일찍 왔네. 진열은 아직 끝나지 않았어.','부두 물건이 늦게 들어와서 일부 상품은 품절이었어.','오늘 들어온 식료품은 꽤 괜찮아.','노점은 곧 접어. 내일 다시 와.'],
   ravi:['망가진 부속을 손보는 중이야.','입항할 때마다 수리품이 쌓이더라고.','공구를 정리하고 있어.','모루가 식으면 문을 닫을 거야.'],
   serian:['의뢰서를 분류 중이야. 위험도를 보지도 않고 덤비진 마.','게시판에 새 공지가 몇 개 붙었어.','일부 의뢰는 내일로 미뤄졌어.','기록을 마무리하면 쉴 수 있겠네.'],
   barin:['부두는 미끄러워. 짐 내리는 사람들 길은 비워 둬.','시장이 붐빌 땐 소매치기를 조심해.','해 지기 전에 순찰을 한 바퀴 더 돌아야겠어.','밤에는 등불 있는 큰길로 다녀.']
  };
  const shift=d.id==='maren'&&sceneEvent(hour)==='low'?' 아직 물건이 도착하지 않았어.':'';
  return `${d.name} · ${texts[id][slot]}${shift}`;
 }
 return {tick,snapshot,talk,_region:region,getActors:()=>actors,getClock:()=>getHour(),getState:()=>({elapsed,minutes})};
}
function visibleLine(region,x,z,tx,tz){
 let len=Math.hypot(tx-x,tz-z);if(len<.0001)return true;
 for(let d=.3;d<len-.24;d+=.24){const t=d/len;if(region.blocks(lerp(x,tx,t),lerp(z,tz,t)))return false;}
 return true;
}
function nearestResident(sim,player,region,maxDistance=3.4){
 const dxForward=Math.sin(player.yaw),dzForward=Math.cos(player.yaw);let nearest=null,best=maxDistance;
 for(const a of sim.getActors()){let dx=a.x-player.x,dz=a.z-player.z,dist=Math.hypot(dx,dz);
  if(dist<best&&dist>.01&&(dx*dxForward+dz*dzForward)/dist>.06&&visibleLine(region,player.x,player.z,a.x,a.z)){nearest=a;best=dist;}}
 return nearest;
}
const api={createSimulation,nearestResident,WORKERS,scheduleSlot,sceneEvent};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SerenveltTown=api;
})(typeof window==='undefined'?globalThis:window);
