/* Kael Harbor citizens: reusable, softly sculpted mannequin meshes with instanced skeletal hints. */
(function(root){'use strict';
const TAU=Math.PI*2;
function makeMesh(){
 const v=[];let triangles=0;
 function vertex(p,n,c,part){v.push(...p,...n,...c,part);}
 function tri(a,b,c,shade,part=0){const u=b.map((x,i)=>x-a[i]),w=c.map((x,i)=>x-a[i]);let n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],l=Math.hypot(...n)||1;n=n.map(q=>q/l);vertex(a,n,shade,part);vertex(b,n,shade,part);vertex(c,n,shade,part);triangles++;}
 function quad(a,b,c,d,shade,part=0){tri(a,b,c,shade,part);tri(a,c,d,shade,part);}
 function loft(rings,shade,part=0,segments=12){
  const points=rings.map(([y,cx,cz,rx,rz],r)=>Array.from({length:segments+1},(_,i)=>{let a=i/segments*TAU,rough=1+.026*Math.sin(5*a+r*.62);return [cx+Math.cos(a)*rx*rough,y,cz+Math.sin(a)*rz*rough];}));
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<segments;i++){
   let a=points[k][i],b=points[k][i+1],c=points[k+1][i+1],d=points[k+1][i];quad(a,b,c,d,shade,part);
  }
 }
 function strip(a,b,c,d,color,part){quad(a,b,c,d,color,part);quad(d,c,b,a,color,part);}
 // Outfit: shaped tunic and trousers with separate sleeves, collar, apron and pockets.
 loft([[.57,0,0,.255,.15],[.78,0,.01,.30,.19],[1.00,0,0,.245,.16],[1.27,0,0,.32,.19],[1.40,0,0,.26,.15]], [.87,.86,.80],0,15);
 loft([[.50,0,.02,.34,.22],[.59,0,.03,.34,.21],[.72,0,.02,.30,.18]], [.72,.75,.66],0,15);
 // Layered coat front and apron, curved drape rather than a single rectangular slab.
 strip([-.20,.72,.20],[-.12,.33,.17],[.19,.33,.18],[.22,.72,.18],[.91,.81,.64],0);
 strip([-.25,1.31,.16],[-.065,1.13,.22],[-.02,1.38,.18],[-.17,1.44,.13],[.98,.91,.78],0);
 strip([.25,1.31,.16],[.065,1.13,.22],[.02,1.38,.18],[.17,1.44,.13],[.97,.89,.79],0);
 // Leather strap crossing tunic and a hand-tool pouch at hip.
 strip([-.23,1.34,.18],[-.18,1.28,.21],[.22,.72,.21],[.25,.80,.18],[.38,.29,.24],0);
 loft([[.55,.24,.045,.15,.08],[.72,.24,.06,.15,.10],[.79,.24,.06,.12,.08]], [.53,.37,.27],0,8);
 for(let side of [-1,1]){
  const cx=side*.16,part=side<0?1:2,arm=side<0?3:4;
  loft([[.035,cx,.005,.124,.14],[.20,cx,.02,.13,.15],[.48,cx,.005,.124,.14],[.73,cx,-.005,.135,.155]], [.29,.29,.30],part,10);
  loft([[.065,cx,.004,.143,.17],[.19,cx,.002,.146,.17]], [.28,.21,.19],part,10);
  loft([[.69,side*.35,.02,.107,.12],[.88,side*.37,.04,.12,.13],[1.15,side*.38,.01,.135,.13],[1.36,side*.33,0,.145,.15]], [.88,.86,.82],arm,12);
  loft([[.61,side*.35,.04,.105,.11],[.74,side*.35,.04,.105,.11]], [.78,.61,.50],arm,10);
 }
 // Neck, jaw and head are custom lofts with a natural profile, not a sphere/box assembly.
 loft([[1.36,0,.02,.10,.11],[1.45,0,.015,.11,.115]], [.91,.72,.61],0,11);
 loft([[1.44,0,.065,.125,.14],[1.50,0,.055,.162,.16],[1.62,0,.025,.212,.192],[1.76,0,.00,.207,.193],[1.86,0,-.015,.13,.125],[1.89,0,-.015,.01,.01]], [.91,.73,.62],0,16);
 // Hairline / swept-over hair layers, minor forehead details.
 loft([[1.72,0,-.026,.197,.178],[1.80,0,-.024,.215,.197],[1.89,0,-.020,.150,.145],[1.922,0,-.014,.015,.015]], [.30,.24,.20],0,16);
 strip([-.20,1.79,.096],[.00,1.82,.191],[.17,1.76,.115],[.04,1.72,.167],[.33,.27,.22],0);
 for(const s of [-1,1]){
  // Tiny painted eye line, subtle and non-cartoonish.
  strip([s*.070,1.691,.193],[s*.074,1.707,.192],[s*.130,1.700,.160],[s*.126,1.686,.160],[.20,.21,.19],0);
 }
 // Pinned neck scarf, short hems, uniform slightly asymmetric hand-crafted appearance.
 strip([-.20,1.37,.158],[-.06,1.29,.20],[.14,1.33,.205],[.20,1.37,.156],[.72,.69,.54],0);
 // Cargo pack appears only for carrier work action. Held in front of chest.
 function cube(x,y,z,w,h,d,col,part=6){let a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2,f=y-h/2,g=y+h/2;
  quad([a,f,c],[b,f,c],[b,g,c],[a,g,c],col,part);quad([b,f,e],[a,f,e],[a,g,e],[b,g,e],col,part);
  quad([a,f,e],[a,f,c],[a,g,c],[a,g,e],col,part);quad([b,f,c],[b,f,e],[b,g,e],[b,g,c],col,part);quad([a,g,c],[b,g,c],[b,g,e],[a,g,e],col,part);
 }
 cube(0,.84,.43,.42,.34,.35,[.61,.45,.27]);
 return {vertices:new Float32Array(v),count:v.length/10,triangles};
}
function makeMarketSupplies(){
 const values=[];let triangles=0;
 function tri(a,b,c,color){const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],d=Math.hypot(...n)||1;n=n.map(x=>x/d);for(let p of [a,b,c])values.push(...p,...n,...color,6);triangles++;}
 function quad(a,b,c,d,color){tri(a,b,c,color);tri(a,c,d,color);}
 // Stitched, irregular grain bags stacked beside the hand cart (not generic cubes).
 function sack(x,z,width,height,seed){const color=[.78+.03*seed,.65+.04*seed,.48+.03*seed],rings=[];
  for(let j=0;j<=7;j++){const t=j/7,r=Math.sin(Math.PI*(.07+.87*t))*(1+.09*Math.sin(seed+t*7)),ring=[];
   for(let i=0;i<=12;i++){let a=i/12*TAU;ring.push([x+Math.cos(a)*width*r*(1+.05*Math.sin(a*5+seed)),.06+t*height,z+Math.sin(a)*width*.72*r]);}rings.push(ring);}
  for(let j=0;j<7;j++)for(let i=0;i<12;i++)quad(rings[j][i],rings[j][i+1],rings[j+1][i+1],rings[j+1][i],color);
 }
 // Wooden packing frames and their seams.
 function crate(x,z,w,h){let x0=x-w/2,x1=x+w/2,z0=z-w*.43,z1=z+w*.43,y=.07,top=y+h,col=[.57,.39,.24];
  quad([x0,y,z0],[x1,y,z0],[x1,top,z0],[x0,top,z0],col);quad([x1,y,z1],[x0,y,z1],[x0,top,z1],[x1,top,z1],col);
  quad([x0,y,z1],[x0,y,z0],[x0,top,z0],[x0,top,z1],col);quad([x1,y,z0],[x1,y,z1],[x1,top,z1],[x1,top,z0],col);quad([x0,top,z0],[x1,top,z0],[x1,top,z1],[x0,top,z1],[.67,.48,.29]);
 }
 crate(-.6,0,.85,.63);sack(.31,-.21,.37,.63,1);sack(.75,.15,.30,.48,2);sack(-.4,.5,.38,.40,3);
 return {array:new Float32Array(values),count:values.length/10,triangles};
}
function createRenderer(gl,sim){
 const source=makeMesh();
 function shader(type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Citizen shader: '+gl.getShaderInfoLog(s));return s;}
 const vs=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;layout(location=2) in vec3 aColor;layout(location=3) in float aPart;
layout(location=4) in vec4 aState;layout(location=5) in vec4 aMotion;layout(location=6) in vec4 aCloth;
uniform vec3 uCam,uForward,uRight,uUp;uniform float uFov,uAspect;
out vec3 vNormal,vColor;out float vDistance;
void main(){
 vec3 p=aPos;float walk=aMotion.y,activity=aMotion.z,id=aMotion.w,phase=aMotion.x;
 float step=sin(phase+((aPart==2.||aPart==4.)?3.14159:0.));
 if(aPart==1.||aPart==2.){float fade=clamp((.77-p.y)/.72,0.,1.);p.z+=step*.25*walk*fade;p.y+=max(0.,step)*.14*walk*fade;}
 if(aPart==3.||aPart==4.){
  float fade=clamp((1.33-p.y)/.67,0.,1.);
  p.z+=-step*.24*walk*fade;
  if(activity==2.)p.z+=.27*fade;
  if(activity==3.){p.y+=.10*sin(phase*.8+id)*fade;p.z+=.24*fade;}
  if(activity==5.)p.z+=.20*fade;
  if(activity==1.)p.z+=.40*fade;
 }
 if(aPart==6.&&activity!=1.)p.y=-200.;
 p.y+=.014*walk*sin(phase*2.);
 float ca=cos(aState.w),sa=sin(aState.w);
 vec3 pos=aState.xyz+vec3(p.x*ca+p.z*sa,p.y,-p.x*sa+p.z*ca);
 vec3 n=normalize(vec3(aNormal.x*ca+aNormal.z*sa,aNormal.y,-aNormal.x*sa+aNormal.z*ca));
 vNormal=n;vDistance=distance(pos,uCam);
 vec3 clothing=aCloth.rgb;
 vec3 primary=aColor;
 if(aColor.r>.8&&aPart==0.)primary=clothing*(.78+.20*aColor.g);
 if(aPart==1.||aPart==2.)primary=clothing*.46;
 if(aPart==3.||aPart==4.)primary=clothing*.79;
 if(aPart==6.)primary=aColor;
 if(aPart==0.&&aColor.r>.9&&aColor.g<.78)primary=vec3(.85,.65,.51)*aCloth.a;
 vColor=primary;
 vec3 rel=pos-uCam;float depth=dot(rel,uForward);
 gl_Position=vec4(dot(rel,uRight)/(uFov*uAspect),dot(rel,uUp)/uFov,depth*1.00024-.18,depth);
}`;
 const fs=`#version 300 es
precision highp float;
in vec3 vNormal,vColor;in float vDistance;out vec4 frag;
uniform vec3 uSun;
void main(){float light=max(dot(normalize(vNormal),normalize(uSun)),0.);vec3 albedo=vColor*(vec3(.77,.85,.87)*.62+vec3(1.06,.94,.72)*light*.59);
float haze=1.-exp(-pow(vDistance*.0039,1.18));albedo=mix(albedo,vec3(.63,.81,.78),min(haze,.67));frag=vec4(clamp(albedo,0.,1.),1.);}`;
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Citizen program: '+gl.getProgramInfoLog(program));
 const vao=gl.createVertexArray();gl.bindVertexArray(vao);
 const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,source.vertices,gl.STATIC_DRAW);
 for(let i=0;i<4;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,[3,3,3,1][i],gl.FLOAT,false,40,[0,12,24,36][i]);}
 const instanceBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,6*12*4,gl.DYNAMIC_DRAW);
 for(let i=4;i<=6;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,4,gl.FLOAT,false,48,(i-4)*16);gl.vertexAttribDivisor(i,1);}
 gl.bindVertexArray(null);
 const goods=makeMarketSupplies(),goodsVao=gl.createVertexArray();gl.bindVertexArray(goodsVao);
 const goodsBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,goodsBuffer);gl.bufferData(gl.ARRAY_BUFFER,goods.array,gl.STATIC_DRAW);
 for(let i=0;i<4;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,[3,3,3,1][i],gl.FLOAT,false,40,[0,12,24,36][i]);}
 const goodsInstances=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,goodsInstances);gl.bufferData(gl.ARRAY_BUFFER,48,gl.DYNAMIC_DRAW);
 for(let i=4;i<=6;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,4,gl.FLOAT,false,48,(i-4)*16);gl.vertexAttribDivisor(i,1);}
 gl.bindVertexArray(null);
 const u={};for(const name of ['uCam','uForward','uRight','uUp','uSun','uFov','uAspect'])u[name]=gl.getUniformLocation(program,name);
 function draw(cam,w,h){
  const data=[];for(const a of sim.getActors())data.push(a.x,sim._region.floorAt(a.x,a.z),a.z,a.facing,a.phase,a.walking?1:0,a.action,a.index,...a.def.color,a.def.skin);
  gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,new Float32Array(data));
  let cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw),roll=cam.roll||0,cr=Math.cos(roll),sr=Math.sin(roll);
  const right=[cy,0,-sy],up=[-sy*sp,cp,-cy*sp];
  gl.useProgram(program);gl.uniform3fv(u.uCam,[cam.x,cam.y,cam.z]);gl.uniform3fv(u.uForward,[sy*cp,sp,cy*cp]);
  gl.uniform3fv(u.uRight,[right[0]*cr+up[0]*sr,right[1]*cr+up[1]*sr,right[2]*cr+up[2]*sr]);
  gl.uniform3fv(u.uUp,[up[0]*cr-right[0]*sr,up[1]*cr-right[1]*sr,up[2]*cr-right[2]*sr]);
  gl.uniform3fv(u.uSun,[.57,.54,.62]);gl.uniform1f(u.uFov,Math.tan(65*Math.PI/360));gl.uniform1f(u.uAspect,w/h);
  gl.bindVertexArray(vao);gl.drawArraysInstanced(gl.TRIANGLES,0,source.count,sim.getActors().length);
  // The same dock cargo becomes visible at the market after the NPC-run midday delivery.
  const supply=sim.snapshot().marketSupply;
  if(supply!=='closing'){
   const pos=supply==='low'?[-28,20]:[5.6,11.8],y=sim._region.floorAt(pos[0],pos[1]);
   const goodsData=new Float32Array([pos[0],y,pos[1],0,0,0,1,0,1,1,1,.95]);
   gl.bindBuffer(gl.ARRAY_BUFFER,goodsInstances);gl.bufferSubData(gl.ARRAY_BUFFER,0,goodsData);
   gl.bindVertexArray(goodsVao);gl.drawArraysInstanced(gl.TRIANGLES,0,goods.count,1);
  }
 }
 return {draw,triangles:source.triangles*sim.getActors().length+goods.triangles,drawCalls:2,modelTriangles:source.triangles};
}
const api={makeMesh,createRenderer};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SerenveltCitizens=api;
})(typeof window==='undefined'?globalThis:window);
