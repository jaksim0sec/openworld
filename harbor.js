/* Serenvelt / Kael waterfront district. Authored geometry and collision, no runtime dependencies. */
(function(root){'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const layout={name:'카엘 항구 · 서쪽 선착장',features:['pier','market','workshop','interior'],spawn:{x:-2,z:-27,yaw:.03,pitch:-.035},buildings:[
 {id:'merchant',x:13,z:0,w:12,d:14,floor:3.57,roof:0,enterable:true,name:'해풍 잡화점'},
 {id:'bakery',x:12,z:22,w:10,d:13,floor:3.72,roof:1,enterable:true,name:'밀빛 제빵소'},
 {id:'workshop',x:29,z:23,w:15,d:18,floor:3.89,roof:2,enterable:true,name:'카엘 수리공방'},
 {id:'warehouse',x:-3,z:45,w:14,d:16,floor:3.75,roof:1,enterable:true,name:'항구 창고'}
]};
const wood=[.52,.37,.25],stone=[.70,.71,.65],white=[.97,.91,.76],tile=[.87,.72,.65],iron=[.29,.36,.38],glass=[.42,.69,.77];
const tiles={stucco:0,stone:1,roof:2,wood:3};
const floorY=(x,z,base)=>{if(x>=-40&&x<=-22&&z>=-8&&z<=29)return .85;if(x>-22&&x<-12&&z>=4&&z<=12)return .85+(x+22)/10*(base(-12,z)-.85);return base(x,z);};
function getLayout(){return layout;}
function getCollision(base){
 const boxes=[];const put=(x0,x1,z0,z1)=>boxes.push({kind:'box',minX:x0,maxX:x1,minZ:z0,maxZ:z1});
 for(const b of layout.buildings){const x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2,door=1.4,t=.34;
  put(x0-t,x0+t,z0,b.z-door);put(x0-t,x0+t,b.z+door,z1);
  put(x1-t,x1+t,z0,z1);put(x0,x1,z0-t,z0+t);put(x0,x1,z1-t,z1+t);
 }
 // The pier rail remains physically open where the gangway reaches land.
 boxes.push({x:-15,z:59,radius:3.2});put(-40,-39.4,-8,29);put(-40,-22,28.5,29);put(-40,-33,-8,-7.5);
 return {colliders:boxes,blocks(x,z){return boxes.some(o=>o.kind==='box'?(x>=o.minX&&x<=o.maxX&&z>=o.minZ&&z<=o.maxZ):Math.hypot(x-o.x,z-o.z)<o.radius)},floorAt(x,z){for(const b of layout.buildings){const x0=b.x-b.w/2;
   if(Math.abs(z-b.z)<1.36&&x>=x0-2&&x<x0+2)return base(x,z)+(b.floor+.05-base(x,z))*Math.max(0,Math.min(1,(x-x0+2)/4));
   if(x>x0+.25&&x<b.x+b.w/2-.25&&z>b.z-b.d/2+.25&&z<b.z+b.d/2-.25)return b.floor+.05;
  }return floorY(x,z,base)},interactions:[
  {id:'merchant',x:7.5,z:0,label:'잡화점 진열대',description:'항로별 물품과 마른 약초, 섬유 꾸러미가 정리되어 있다.'},
  {id:'workshop',x:23.5,z:21,label:'공방 작업대',description:'금속을 두드린 자국이 남은 모루와 아직 식지 않은 수리 도구.'},
  {id:'dock',x:-29,z:18,label:'선착장',description:'화물선이 드나드는 카엘의 서쪽 부두. 묵직한 젖은 목재 냄새가 난다.'}
 ]};
}
function build(mesh,ground){
 const shade=(v,s)=>v.map(x=>clamp(x*s,0,1.2));
 const uv=(tile,u,v)=>[(tile%2)*.5+.012+clamp(u,0,1)*.474,Math.floor(tile/2)*.5+.012+clamp(v,0,1)*.474];
 function q(a,b,c,d,col,material=0){mesh.quad(a,b,c,d,col,null,[uv(material,0,0),uv(material,0,1),uv(material,1,1),uv(material,1,0)]);}
 function tri(a,b,c,col,material=0){mesh.tri(a,b,c,col,null,null,null,[uv(material,0,0),uv(material,1,0),uv(material,.5,1)]);}
 function plank(x0,x1,z0,z1,y,co=wood,t=2){q([x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0],co,t);}
 function beam(a,b,r,col=wood,material=3,sides=6){let dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz)||1;
  let nx=-dz/len,nz=dx/len,ringA=[],ringB=[];
  for(let i=0;i<=sides;i++){let theta=i/sides*TAU;const off=[nx*Math.cos(theta)*r,-Math.sin(theta)*r,nz*Math.cos(theta)*r];ringA.push(a.map((v,k)=>v+off[k]));ringB.push(b.map((v,k)=>v+off[k]));}
  for(let i=0;i<sides;i++)q(ringA[i],ringB[i],ringB[i+1],ringA[i+1],shade(col,.88+.18*(i%3)),material);
 }
 function wall(a,b,y0,y1,col,mat=0){q([a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],col,mat);}
 function floorboards(x0,x1,z0,z1,y){for(let x=x0;x<x1-.01;x+=.7)plank(x,Math.min(x+.69,x1),z0,z1,y+.02,shade(white,.90+.09*Math.sin(x*8)),3);}
 function windowAt(x,z,y,front){const c=[x,y,z],mat=1;
   let o=front?-1:1,xx=x+o*.055;
   wall([xx,z-.90],[xx,z+.90],y,y+2.2,glass,0);
   beam([xx,z===0?y:y,z-.92],[xx,y+2.28,z-.92],.075,wood);
   beam([xx,y,z+.92],[xx,y+2.28,z+.92],.075,wood);
   beam([xx,y+1.11,z-.92],[xx,y+1.11,z+.92],.065,wood);
   beam([xx,y+2.27,z-.92],[xx,y+2.27,z+.92],.115,white,1);
   plank(xx-.18,xx+.16,z-1.12,z+1.12,y-.09,stone,1);
 }
 function lamp(x,y,z){beam([x,y,z],[x,y+.64,z],.065,iron,3,8);
   for(let i=0;i<8;i++){let a=i*TAU/8,b=(i+1)*TAU/8,r=.25;
     q([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x+Math.cos(b)*r*.74,y+.58,z+Math.sin(b)*r*.74],[x+Math.cos(a)*r*.74,y+.58,z+Math.sin(a)*r*.74],[1,.78,.43],1);
   }beam([x,y+.58,z],[x,y+.78,z],.20,iron,3);}
 function awning(x,z,by,w,col){const edge=x-2.6,back=x+.15;
  for(let j=0;j<12;j++){let z0=z-w/2+j*w/12,z1=z-w/2+(j+1)*w/12;
   let a=[back,by+.46,z0],b=[back,by+.46,z1],c=[edge,by-.45+.1*Math.sin(j*1.5),z1],d=[edge,by-.45+.1*Math.sin(j*1.5),z0];q(a,b,c,d,shade(col,j%2?.88:1.06),0);
   if(j%3===0)beam([edge,by-.45,z0],[edge,by-.66,z0],.045,white,3,4);
  }beam([edge,by-.4,z-w/2],[edge,by-.4,z+w/2],.09,wood);
 }
 function counter(x,z,y,side=1){plank(x-.65,x+.65,z-1.6,z+1.6,y+1.05,white,3);for(let dz of [-1.28,1.28])beam([x-.45,y,z+dz],[x-.45,y+1,z+dz],.12,wood);}
 function barrel(x,z,y,r=.46){const row=[],sides=10;for(let j=0;j<=5;j++){let t=j/5,h=j*.18,bulge=1+.17*Math.sin(Math.PI*t);let ring=[];
  for(let i=0;i<=sides;i++){let a=i/sides*TAU;ring.push([x+Math.cos(a)*r*bulge,y+h,z+Math.sin(a)*r*bulge]);}row.push(ring);}
  for(let j=0;j<5;j++)for(let i=0;i<sides;i++)q(row[j][i],row[j][i+1],row[j+1][i+1],row[j+1][i],shade(wood,.7+.08*(i%3)),3);
  for(let j of [1,4])for(let i=0;i<sides;i++)beam(row[j][i],row[j][i+1],.06,iron,3,5);
 }
 function crate(x,z,y,w=.8){const r=w/2;plank(x-r,x+r,z-r,z+r,y+w,white,3);
  for(let a of [-1,1])for(let b of [-1,1])beam([x+a*r,y,z+b*r],[x+a*r,y+w,z+b*r],.095,wood,3);
  for(let sign of [-1,1])wall([x-r,z+sign*r],[x+r,z+sign*r],y,y+w,shade(white,.78),3);
  beam([x-r,y,z-r],[x+r,y+w,z-r],.06,wood,3);
 }
 function roof(b){let {x,z,w,d,floor:y,roof}=b,x0=x-w/2-.85,x1=x+w/2+.85,z0=z-d/2-1,z1=z+d/2+1,base=y+6.2,top=y+(roof===2?10:9.4);
  // Roof curvature and real overhang: continuous pitched surface, tiles run across each hip.
  const n=22,m=13;
  for(let side of [-1,1])for(let j=0;j<n;j++)for(let i=0;i<m;i++){
   function v(t,k){let a=(i+t)/m,zz=z0+(j+k)/n*(z1-z0),xx=x+side*a*(w/2+1),lift=(top-base)*(1-Math.pow(a,1.16));return [xx,base+lift+.095*Math.sin(zz*.9+a*7),zz];}
   const co=shade(roof===2?[.69,.88,.93]:tile,.84+.16*Math.sin(j*1.9+i*.63));q(v(0,0),v(0,1),v(1,1),v(1,0),co,2);
  }
  beam([x,top+.05,z0],[x,top+.05,z1],.18,white,1,8);
  for(let side of [-1,1]){let xx=x+side*(w/2+1);beam([xx,base,z0],[xx,base,z1],.14,wood,3,7);}
  for(let zz of [z0+.12,z1-.12]){tri([x-w/2,base,zz],[x+w/2,base,zz],[x,top-.06,zz],white,0);
   beam([x-w/2,base,zz],[x,top,zz],.13,wood);beam([x+w/2,base,zz],[x,top,zz],.13,wood);
  }
  // Little dormer with an actual two-sided miniature pitched roof, not a top cube.
  if(roof!==1){const zz=z-2.2,yy=(base+top)/2+.9;
    tri([x-.9,yy,zz],[x+.9,yy,zz],[x,yy+1.1,zz],white,0);
    q([x-.9,yy,zz],[x-.9,yy,zz+1.7],[x,yy+1.1,zz+1.7],[x,yy+1.1,zz],tile,2);
    q([x,yy+1.1,zz],[x,yy+1.1,zz+1.7],[x+.9,yy,zz+1.7],[x+.9,yy,zz],tile,2);
    wall([x-.42,zz-.04],[x+.42,zz-.04],yy+.04,yy+.70,glass,1);
  }
  // Chimney: chimney shaft is part of the roof line, visible cap and dark flue.
  const cx=x+w*.29,cz=z+d*.23;
  for(let sx of [-1,1])wall([cx+sx*.36,cz-.35],[cx+sx*.36,cz+.35],top-1,top+1.4,stone,1);
  for(let sz of [-1,1])wall([cx-.36,cz+sz*.35],[cx+.36,cz+sz*.35],top-1,top+1.4,stone,1);
  plank(cx-.50,cx+.50,cz-.50,cz+.50,top+1.48,iron,1);
 }
 function house(b){let {x,z,w,d,floor:y,roof:variant}=b,x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;
  // Door is a true empty aperture in the front wall, 2.8m wide and 3.2m tall.
  floorboards(x0+1.96,x1-.15,z0+.16,z1-.16,y+.025);
  // Walkable entrance apron: a real sloped threshold rather than a player teleport.
  for(let i=0;i<16;i++){
   const xStart=x0-2+i*4/16,xEnd=x0-2+(i+1)*4/16;
   const t=i/16,t1=(i+1)/16;
   const y0=ground(xStart,z)+(y+.075-ground(xStart,z))*t;
   const y1=ground(xEnd,z)+(y+.075-ground(xEnd,z))*t1;
   q([xStart,y0,z-1.35],[xStart,y0,z+1.35],[xEnd,y1,z+1.35],[xEnd,y1,z-1.35],shade(stone,.80+.14*(i%3)),1);
  }
  for(let zz=z0;zz<z1-.05;zz+=1.3){let zEnd=Math.min(z1,zz+1.3),opening=zz<z+1.40&&zEnd>z-1.40;
   if(!opening)wall([x0,zz],[x0,zEnd],y+.08,y+6.2,white,0);
   else{let cut0=Math.max(zz,z-1.40),cut1=Math.min(zEnd,z+1.40);
     if(zz<cut0)wall([x0,zz],[x0,cut0],y+.08,y+6.2,white,0);
     if(cut1<zEnd)wall([x0,cut1],[x0,zEnd],y+.08,y+6.2,white,0);
     wall([x0,cut0],[x0,cut1],y+3.2,y+6.2,white,0);
   }
   wall([x1,zz],[x1,zEnd],y+.08,y+6.2,shade(white,.84),0);
  }
  for(let xx=x0;xx<x1-.05;xx+=1.2){let end=Math.min(x1,xx+1.2);
   wall([xx,z0],[end,z0],y+.08,y+6.2,shade(white,.92),0);
   wall([xx,z1],[end,z1],y+.08,y+6.2,shade(white,.87),0);
  }
  for(let cornerX of [x0,x1])for(let cornerZ of [z0,z1])beam([cornerX,y,cornerZ],[cornerX,y+6.6,cornerZ],.22,wood,3,7);
  for(let yy of [y+.56,y+3.65,y+6.14])for(let xx of [x0,x1])beam([xx,yy,z0],[xx,yy,z1],.11,wood,3);
  for(let zz of [z0,z1]){beam([x0,y+3.6,zz],[x1,y+3.6,zz],.09,wood);
   for(let xx of [x0+2.2,x1-2.2])beam([xx,y+.4,zz],[xx,y+6.2,zz],.10,wood);}
  // Door arch: timber jambs with a segmented upper curved lintel.
  for(let zz of [z-1.5,z+1.5])beam([x0-.14,y,zz],[x0-.14,y+3.15,zz],.16,wood,3);
  for(let j=0;j<12;j++){let a=Math.PI*j/12,b=Math.PI*(j+1)/12;
   const p=t=>[x0-.15,y+3.05+.33*Math.sin(t),z+1.52*Math.cos(t)];beam(p(a),p(b),.17,stone,1);}
  for(let zz of [z0+3.05,z1-3.05])windowAt(x0,zz,y+3.85,true);
  for(let zz of [z0+3.05,z1-3.05])windowAt(x1,zz,y+3.82,false);
  for(let xx of [x0+2.3,x1-2.3]){wall([xx-.8,z0-.04],[xx+.8,z0-.04],y+3.85,y+5.65,glass,1);}
  // Below-floor foundation and joinery run continuously into actual terrain.
  for(let zz=z0;zz<z1;zz+=1.8)wall([x0-.05,zz],[x0-.05,Math.min(z1,zz+1.8)],y-.55,y+.62,stone,1);
  awning(x0,z,y+3.5,5.8,variant===1?[.96,.68,.53]:variant===2?[.50,.72,.76]:[.68,.79,.55]);
  // Projecting sign and embossed compass medallion make the storefront identifiable.
  beam([x0-.13,y+3.85,z-3.1],[x0-2.75,y+3.85,z-3.1],.12,wood,3,7);
  let sx=x0-2.75,sz=z-3.1;
  q([sx-.66,y+2.30,sz-.05],[sx+.66,y+2.30,sz-.05],[sx+.66,y+3.56,sz-.05],[sx-.66,y+3.56,sz-.05],shade(white,.75),3);
  for(let a=0;a<4;a++){let t=a*TAU/4;beam([sx-.36*Math.cos(t),y+2.91-.36*Math.sin(t),sz-.12],[sx+.36*Math.cos(t),y+2.91+.36*Math.sin(t),sz-.12],.045,stone,1,5);}
  // Goods and planters along the façade, without blocking the door opening.
  for(let dz of [-5.0,4.8]){
   const px=x0-1.6,pz=z+dz;
   barrel(px,pz,y+.02,.37);
   for(let k=0;k<11;k++){let a=k*2.39996,rad=.14+.25*Math.sqrt(k/11);
    beam([px,y+.7,pz],[px+Math.cos(a)*rad,y+1.05+.25*Math.sin(k*5),pz+Math.sin(a)*rad],.027,[.33,.59,.31],3,5);
   }
  }

  // Fully accessible room: counter, shelving and workplace material objects.
  counter(x0+3.1,z-1.6,y,1);
  for(let zz of [z-4,z+3.7]){for(let yy of [y+.85,y+1.78,y+2.67])plank(x0+6,x1-1.2,zz-.34,zz+.34,yy,white,3);
   for(let xx of [x0+6,x1-1.2])beam([xx,y+.15,zz],[xx,y+2.9,zz],.11,wood);
  }
  if(b.id==='workshop'){
   const fx=x+1.8,fz=z-2.4;for(let j=0;j<12;j++){const a=j*TAU/12,b=(j+1)*TAU/12,r=.52;
    q([fx+Math.cos(a)*r,y+1.2,fz+Math.sin(a)*r],[fx+Math.cos(b)*r,y+1.2,fz+Math.sin(b)*r],[fx+Math.cos(b)*r*.6,y+1.6,fz+Math.sin(b)*r*.6],[fx+Math.cos(a)*r*.6,y+1.6,fz+Math.sin(a)*r*.6],iron,1);
   }beam([fx,y+.3,fz],[fx,y+1.2,fz],.26,iron,3);
   for(let j=0;j<6;j++){let zz=z-3+j*.95;beam([x1-.8,y+2.1,zz],[x1-2.2,y+1.5,zz],.05,iron,3);}
  }else{for(let j=0;j<6;j++)barrel(x1-2,z-4.1+j*1.5,y+.06,.30+.1*(j%2));}
  roof(b);lamp(x0-1.7,y+3.2,z-3.2);lamp(x0-1.7,y+3.2,z+3.2);
 }
 // Narrow quay takes advantage of a naturally excavated river bend.
 for(let z=-9;z<30;z+=.8){let z1=Math.min(30,z+.8);
  plank(-40,-22,z,z1,.83,shade(white,.76+.10*Math.sin(z*3.2)),3);
  beam([-40,.80,z],[-22,.80,z],.020,wood,3,4);
 }
 for(let z of [-7,0,8,16,24,29])for(let x of [-39,-22]){
  beam([x,-2.2,z],[x,2.35,z],.27,wood,3,9);
  if(z!==-7&&z!==29&&x===-39)beam([x,2.2,z],[x,2.2,z+7],.085,wood,3,6);
 }
 // Sloped gangway is actual walkable surface, not teleportation from pier to bank.
 for(let i=0;i<22;i++){let x=-22+i*10/22,xx=-22+(i+1)*10/22;
  const y=.85+(x+22)/10*(ground(-12,8)-.85),yy=.85+(xx+22)/10*(ground(-12,8)-.85);
  q([x,y,4],[x,y,12],[xx,yy,12],[xx,yy,4],shade(wood,.90+.09*(i%3)),3);
 }
 // Cobble walk follows existing terrain and permits free diagonal approaches.
 for(let z=-39;z<55;z+=1.3){let z1=z+1.3,cx=-2.8+2.5*Math.sin(z*.055),cx1=-2.8+2.5*Math.sin(z1*.055);
  for(let i=0;i<11;i++){const x=cx-4.5+i*9/11,xx=cx-4.5+(i+1)*9/11,x2=cx1-4.5+i*9/11,x3=cx1-4.5+(i+1)*9/11;
   q([x,ground(x,z)+.05,z],[x2,ground(x2,z1)+.05,z1],[x3,ground(x3,z1)+.05,z1],[xx,ground(xx,z)+.05,z],shade(stone,.77+.14*Math.sin(i*7+z*2)),1);
  }
 }
 // Handmade edge curb and scattered grass-free stone alleys.
 for(let z=-34;z<52;z+=1.7)for(let side of [-1,1]){let x=-2.8+2.5*Math.sin(z*.055)+side*4.7;
  beam([x,ground(x,z)+.07,z],[x+.15,ground(x+.15,z+1.7)+.07,z+1.7],.09,stone,1,6);
 }
 layout.buildings.forEach(house);
 // Two independent hand-built market pavilions. Curved textile skins, display counters, stacked cargo.
 for(const [mx,mz,accent] of [[-9,11,[.62,.79,.64]],[-8,31,[.83,.63,.54]]]){
  const yy=ground(mx,mz),w=3.5,d=4.5;
  for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])beam([mx+dx,yy,mz+dz],[mx+dx,yy+3.4,mz+dz],.10,wood);
  for(let i=0;i<12;i++){const zz=mz-d/2+i*d/12,zz1=mz-d/2+(i+1)*d/12;
   let roll=.17*Math.sin(i*.85),top=yy+4.05;
   q([mx-w/2-.35,yy+3.3+roll,zz],[mx-w/2-.35,yy+3.3+roll,zz1],[mx,top,zz1],[mx,top,zz],shade(accent,i%2?.92:1.07),0);
   q([mx,top,zz],[mx,top,zz1],[mx+w/2+.35,yy+3.3+roll,zz1],[mx+w/2+.35,yy+3.3+roll,zz],shade(accent,i%2?1.07:.91),0);
  }
  beam([mx,yy+4.07,mz-d/2],[mx,yy+4.07,mz+d/2],.10,wood);
  for(let zz of [mz-.9,mz+1]){
   plank(mx-1.45,mx+1.45,zz-.5,zz+.5,yy+1.0,white,3);
   for(let k=0;k<4;k++)crate(mx-1.05+k*.65,zz,yy+1.03,.34);
  }
 }

 // The quay clock/bell tower is a distinct octagonal landmark with recessed arch bays.
 {const tx=-15,tz=59,y=ground(tx,tz),sides=8,r=3.15;
  let rings=[];for(let j=0;j<4;j++){let py=y+[0,2,13,15.3][j],radius=r*[1.06,1,1,.9][j],v=[];
   for(let i=0;i<=sides;i++){let a=(i/sides+.125)*TAU;v.push([tx+Math.cos(a)*radius,py,tz+Math.sin(a)*radius]);}rings.push(v);}
  for(let j=0;j<3;j++)for(let i=0;i<sides;i++){
   let co=j===0?stone:white;q(rings[j][i],rings[j][i+1],rings[j+1][i+1],rings[j+1][i],co,j===0?1:0);
   beam(rings[j][i],rings[j+1][i],j===1?.15:.11,wood,3,7);
  }
  for(let i=0;i<sides;i++){let a=(i+.5)/sides*TAU,cx=tx+Math.cos(a)*(r+.09),cz=tz+Math.sin(a)*(r+.09);
   beam([cx,y+8,cz],[cx,y+11.3,cz],.13,stone,1,7);
   // Dark inset arch glazing framed by stone mouldings.
   for(let k=0;k<8;k++){let t=k/8*Math.PI,u=(k+1)/8*Math.PI;
    let x0=cx+Math.cos(t)*.75,z0=cz+Math.sin(t)*.75;
    let x1=cx+Math.cos(u)*.75,z1=cz+Math.sin(u)*.75;
    beam([x0,y+10.2+.7*Math.sin(t),z0],[x1,y+10.2+.7*Math.sin(u),z1],.065,stone,1,6);
   }
  }
  // Bell gallery, open arches under a tall needle-like metal-capped roof.
  for(let i=0;i<sides;i++){let a=i/sides*TAU,b=(i+1)/sides*TAU;
   let rim=r*.96,tip=[tx,y+23.4,tz];
   tri([tx+Math.cos(a)*rim,y+15.45,tz+Math.sin(a)*rim],[tx+Math.cos(b)*rim,y+15.45,tz+Math.sin(b)*rim],tip,tile,2);
   beam([tx+Math.cos(a)*rim,y+15.45,tz+Math.sin(a)*rim],tip,.12,iron,3,6);
  }
  beam([tx,y+23.2,tz],[tx,y+25.0,tz],.11,iron,3,7);
  lamp(tx,y+24.75,tz);
 }
 // Harbor crane: curved load arm, thick lifting ropes and hanging hook.
 const crane=[-35,14],by=.85;
 for(let p of [[-35,14],[-31,14]])beam([p[0],by,p[1]],[p[0],by+9.1,p[1]],.36,wood,3,9);
 beam([-35,by+9.1,14],[-29,by+10.4,14],.35,wood,3,9);
 beam([-29,by+10.4,14],[-23,by+8.2,14],.21,wood,3,9);
 beam([-23,by+8.2,14],[-23,by+2.3,14],.04,iron,3,5);
 beam([-23,by+2.3,14],[-23,by+1.8,14.3],.06,iron,3,6);
 for(let i=0;i<18;i++){let x=-39+(i%4)*2.3,z=-5+Math.floor(i/4)*5.4;
  if(i%3===0)barrel(x,z,.89,.39);else crate(x,z,.90,.7+(.20*(i%2)));
 }
 for(let i=0;i<11;i++){let z=-18+i*6.7,x=4+8*Math.sin(i*3.12);barrel(x,z,ground(x,z)+.05,.37);}
 // Sail shade over the dock sorting platform, supported by tensioned timber poles.
 for(let i=0;i<10;i++){const z=18+i*.75,z1=z+.75,drop=.38+.16*Math.sin(i*.84);
  q([-37,6.5,z],[-37,6.5,z1],[-27,5.1-drop,z1],[-27,5.1-drop,z],shade(white,i%2?.86:.98),0);
 }
 beam([-37,.9,18],[-37,6.65,18],.13,wood);beam([-37,.9,26],[-37,6.65,26],.13,wood);
 beam([-27,.9,18],[-27,5.2,18],.13,wood);beam([-27,.9,26],[-27,5.2,26],.13,wood);
 return {buildings:layout.buildings.length,features:layout.features};
}
function createTexture(gl){const canvas=document.createElement('canvas'),c=canvas.getContext('2d');canvas.width=canvas.height=1024;
 let seed=9221;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967295;};
 function tileArea(t){return [(t%2)*512,Math.floor(t/2)*512];}
 function paint(t,bg){let [x,y]=tileArea(t);c.fillStyle=bg;c.fillRect(x,y,512,512);return [x,y];}
 // Hand-painted plaster with mottled lime washes and localized aged cracks.
 {let [x,y]=paint(0,'#e1d4b5');for(let i=0;i<1400;i++){let r=3+rand()*16;c.fillStyle=rand()>.52?'#f0e5c9':'#c7b89b';c.globalAlpha=.03+rand()*.10;c.beginPath();c.ellipse(x+rand()*512,y+rand()*512,r,r*.45,rand()*TAU,0,TAU);c.fill();}c.globalAlpha=1;}
 // Limestone quay: hand-placed staggered blocks and mineral color variations.
 {let [x,y]=paint(1,'#777b73');for(let j=0;j<15;j++)for(let i=0;i<12;i++){let xx=x+i*47+((j%2)*23),yy=y+j*37,k=rand();c.fillStyle=['#a0a49b','#c2beb1','#858f89','#b2afa2'][Math.floor(k*4)];c.fillRect(xx+1,yy+1,45,35);c.strokeStyle='#616d6a';c.lineWidth=1;c.strokeRect(xx+1,yy+1,45,35);c.fillStyle='#ede5cf';c.globalAlpha=.15;c.fillRect(xx+5,yy+4,32,2);c.globalAlpha=1;}}
 // Roof tile rows with staggered fish-scale lower edges.
 {let [x,y]=paint(2,'#7f554b');for(let j=0;j<22;j++)for(let i=-1;i<21;i++){let xx=x+i*29+(j%2)*15,yy=y+j*24;let k=rand();c.fillStyle=['#c7724e','#b95243','#d78b58','#a85445','#dea06b'][Math.floor(k*5)];c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+29,yy);c.lineTo(xx+29,yy+17);c.quadraticCurveTo(xx+15,yy+29,xx,yy+17);c.closePath();c.fill();c.strokeStyle='#633d39';c.globalAlpha=.4;c.stroke();c.globalAlpha=1;}}
 // Seasoned timbers: grain follows board direction, repeated joins have subtle offsets.
 {let [x,y]=paint(3,'#8a6a4c');for(let j=0;j<13;j++){let yy=y+j*40;c.fillStyle=j%2?'#a67a53':'#77563e';c.globalAlpha=.28;c.fillRect(x,yy,512,37);c.globalAlpha=1;c.strokeStyle='#49372c';c.lineWidth=2;c.beginPath();c.moveTo(x,yy);c.lineTo(x+512,yy);c.stroke();for(let k=0;k<30;k++){let px=x+rand()*512,z=yy+2+rand()*34;c.globalAlpha=.11;c.strokeStyle=rand()>.5?'#edc496':'#342e2a';c.beginPath();c.moveTo(px,z);c.bezierCurveTo(px+18,z+rand()*3,px+50,z-rand()*4,px+rand()*120,z);c.stroke();}}c.globalAlpha=1;}
 const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
function isPaved(x,z){if(x>-41&&x<-12&&z>-10&&z<30)return true;
 for(const b of layout.buildings)if(Math.abs(x-b.x)<b.w/2+2.2&&Math.abs(z-b.z)<b.d/2+1.6)return true;
 return z>-40&&z<57&&Math.abs(x-(-2.8+2.5*Math.sin(z*.055)))<6;
}
const api={getLayout,getCollision,build,createTexture,isPaved};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SerenveltHarbor=api;
})(typeof window==='undefined'?globalThis:window);
