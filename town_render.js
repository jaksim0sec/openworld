/* Kael Harbor residents: source-derived HumanModelAsset/1 skinned mesh, no invented mannequin. */
(function(root){'use strict';
const TAU=Math.PI*2;
const model=root.SerenveltHumanLOD;
// Original user model has a 47-bone hierarchy, local skin indices per part and
// packed Int16/Int8/U8 buffers. Generated LODs keep original surface morphology.
function decodeBase64(value){const b=atob(value),out=new Uint8Array(b.length);for(let i=0;i<b.length;i++)out[i]=b.charCodeAt(i);return out;}
function unpackLOD(lod){const bytes=decodeBase64(lod.vertices);const indices=decodeBase64(lod.indices);
 return {vertices:bytes,indices:new Uint16Array(indices.buffer),vertexCount:lod.vertexCount,count:lod.indexCount,triangles:lod.triangleCount};
}
function multiply(left,right){const o=new Float32Array(9);for(let c=0;c<3;c++)for(let r=0;r<3;r++)o[c*3+r]=left[r]*right[c*3]+left[3+r]*right[c*3+1]+left[6+r]*right[c*3+2];return o;}
function rotate(m,v){return [m[0]*v[0]+m[3]*v[1]+m[6]*v[2],m[1]*v[0]+m[4]*v[1]+m[7]*v[2],m[2]*v[0]+m[5]*v[1]+m[8]*v[2]];}
function turn(axis,degrees){const [x,y,z]=axis,a=degrees*Math.PI/180,s=Math.sin(a),c=Math.cos(a),t=1-c;
 return new Float32Array([c+x*x*t,y*x*t+z*s,z*x*t-y*s,x*y*t-z*s,c+y*y*t,z*y*t+x*s,x*z*t+y*s,y*z*t-x*s,c+z*z*t]);}
const I=new Float32Array([1,0,0,0,1,0,0,0,1]);
function poseAngle(bone,i,a){
 if(a.rest)return 0;
 const walk=a.walking?1:0,step=Math.sin(a.phase),other=Math.cos(a.phase);
 switch(bone.id){
  case 'pelvis':return i===0?2.0*step*walk:1.2*other*walk;
  case 'waist':return i===0?3.0*step*walk:2.0*other*walk;
  case 'ribcage':return i===0?2.3*other*walk:2.2*step*walk;
  case 'head':return i===0?2.4*Math.sin(a.phase*.36+a.index):0;
  case 'thigh_left':return i===0?24*step*walk:0;
  case 'thigh_right':return i===0?-24*step*walk:0;
  case 'shin_left':return i===0?Math.max(0,-step)*36*walk:0;
  case 'shin_right':return i===0?Math.max(0,step)*36*walk:0;
  case 'foot_left':return i===0?-8*step*walk:0;
  case 'foot_right':return i===0?8*step*walk:0;
  case 'upper_arm_left':return i===0?(-18*step*walk+(a.action===1?13:a.action===3?20:0)):0;
  case 'upper_arm_right':return i===0?(18*step*walk+(a.action===1?13:a.action===3?20:0)):0;
  case 'forearm_left':case 'forearm_right':return i===0?(a.action===1?38:a.action===3?48:a.action===2?14:8):0;
  case 'hand_left':case 'hand_right':return i===0?(a.action===3?11:0):0;
  default:
   if(bone.id.includes('_0')||bone.id.includes('_1')||bone.id.includes('_2'))return i===0?(a.action===1?13:a.action===3?20:7):0;
   return 0;
 }
}
function computeSkinMatrices(bones,actor){
 const trans=new Map(),out=new Float32Array(bones.length*16);
 for(let i=0;i<bones.length;i++){
  const bone=bones[i],parent=trans.get(bone.parent)||{rotation:I,offset:[0,0,0]};let local=I;
  for(let j=0;j<bone.axes.length;j++){const a=poseAngle(bone,j,actor);if(a)local=multiply(local,turn(bone.axes[j].d,Math.max(bone.axes[j].min,Math.min(bone.axes[j].max,a))));}
  const pivot=bone.pivot.map(v=>v/1428),turned=rotate(local,pivot),delta=pivot.map((x,k)=>x-turned[k]);
  const shift=rotate(parent.rotation,delta),t=shift.map((x,k)=>x+parent.offset[k]),r=multiply(parent.rotation,local);
  trans.set(bone.id,{rotation:r,offset:t});
  // Column-major 4x4 skinning transform in source-local coordinates.
  out.set([r[0],r[1],r[2],0,r[3],r[4],r[5],0,r[6],r[7],r[8],0,t[0],t[1],t[2],1],i*16);
 }
 return out;
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
 if(!model||model.format!=='SerenveltHumanLOD/1'||model.bones.length!==47)throw Error('Missing source-derived user human model asset');
 const near=unpackLOD(model.lods.near),far=unpackLOD(model.lods.far);
 function shader(type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Human NPC shader: '+gl.getShaderInfoLog(s));return s;}
 const vs=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aJoints;
layout(location=3) in vec4 aWeights;
layout(location=4) in float aMaterial;
uniform mat4 uSkin[47];
uniform vec3 uActor,uCam,uForward,uRight,uUp,uColor;
uniform float uYaw,uFov,uAspect,uSkinTint;
out vec3 vNormal,vColor;out float vDistance;
void main(){
 vec4 p=vec4(aPos/45696.,1.);
 mat4 skin=aWeights.x*uSkin[int(aJoints.x)] + aWeights.y*uSkin[int(aJoints.y)] + aWeights.z*uSkin[int(aJoints.z)] + aWeights.w*uSkin[int(aJoints.w)];
 skin*=1.0/max(dot(aWeights,vec4(1.0)),0.001);
 vec3 skinned=(skin*p).xyz;
 vec3 skinnedNormal=normalize(mat3(skin)*normalize(aNormal));
 float scale=1.84;
 vec3 local=vec3(skinned.x*scale,(skinned.y+.5)*scale,skinned.z*scale);
 float c=cos(uYaw),s=sin(uYaw);
 vec3 pos=uActor+vec3(local.x*c+local.z*s,local.y,-local.x*s+local.z*c);
 vNormal=normalize(vec3(skinnedNormal.x*c+skinnedNormal.z*s,skinnedNormal.y,-skinnedNormal.x*s+skinnedNormal.z*c));
 float grain=.97+.04*sin(aPos.y*259.0+aPos.x*111.0);
 if(aMaterial<.5)vColor=vec3(.82,.66,.55)*uSkinTint;
 else if(aMaterial<1.5)vColor=uColor*grain;
 else if(aMaterial<2.5)vColor=mix(uColor,vec3(.19,.24,.28),.68)*grain;
 else vColor=vec3(.28,.22,.17);
 vDistance=distance(pos,uCam);
 vec3 rel=pos-uCam;float depth=dot(rel,uForward);
 gl_Position=vec4(dot(rel,uRight)/(uFov*uAspect),dot(rel,uUp)/uFov,depth*1.00024-.18,depth);
}`;
 const fs=`#version 300 es
precision highp float;
in vec3 vNormal,vColor;in float vDistance;out vec4 frag;uniform vec3 uSun;
void main(){float light=max(dot(normalize(vNormal),normalize(uSun)),0.);vec3 c=vColor*(vec3(.75,.83,.86)*.67+vec3(1.06,.94,.77)*light*.53);
 float haze=1.-exp(-pow(vDistance*.0039,1.18));c=mix(c,vec3(.63,.81,.78),min(haze,.67));frag=vec4(clamp(c,0.,1.),1.);}`;
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Human NPC program: '+gl.getProgramInfoLog(program));
 const uploads=[];
 for(const mesh of [near,far]){
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.SHORT,false,20,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.BYTE,true,20,6);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.UNSIGNED_BYTE,false,20,9);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.UNSIGNED_BYTE,true,20,13);
  gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,1,gl.UNSIGNED_BYTE,false,20,17);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
  uploads.push({vao,count:mesh.count,triangles:mesh.triangles});gl.bindVertexArray(null);
 }
 const goods=makeMarketSupplies(),goodsVao=gl.createVertexArray();gl.bindVertexArray(goodsVao);
 const goodsBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,goodsBuffer);gl.bufferData(gl.ARRAY_BUFFER,goods.array,gl.STATIC_DRAW);
 for(let i=0;i<4;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,[3,3,3,1][i],gl.FLOAT,false,40,[0,12,24,36][i]);}
 const goodsInstances=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,goodsInstances);gl.bufferData(gl.ARRAY_BUFFER,48,gl.DYNAMIC_DRAW);
 for(let i=4;i<=6;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,4,gl.FLOAT,false,48,(i-4)*16);gl.vertexAttribDivisor(i,1);}
 gl.bindVertexArray(null);
 const goodsVs=`#version 300 es
 precision highp float;
 layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNorm;layout(location=2) in vec3 aCol;layout(location=3) in float ignored;
 layout(location=4) in vec4 aState;
 uniform vec3 uCam,uForward,uRight,uUp;uniform float uFov,uAspect;
 out vec3 vN,vC;out float vD;
 void main(){vec3 pos=aPos+aState.xyz;vN=aNorm;vC=aCol;vD=distance(pos,uCam);vec3 d=pos-uCam;float z=dot(d,uForward);
 gl_Position=vec4(dot(d,uRight)/(uFov*uAspect),dot(d,uUp)/uFov,z*1.00024-.18,z);}`;
 const goodsFs=`#version 300 es
 precision highp float;in vec3 vN,vC;in float vD;out vec4 frag;
 void main(){float l=max(dot(normalize(vN),normalize(vec3(.57,.54,.62))),0.);vec3 c=vC*(.69+.35*l);c=mix(c,vec3(.63,.81,.78),min(.7,1.-exp(-vD*.005)));frag=vec4(c,1.);}`;
 const gp=gl.createProgram();gl.attachShader(gp,shader(gl.VERTEX_SHADER,goodsVs));gl.attachShader(gp,shader(gl.FRAGMENT_SHADER,goodsFs));gl.linkProgram(gp);
 if(!gl.getProgramParameter(gp,gl.LINK_STATUS))throw Error('Market supply shader: '+gl.getProgramInfoLog(gp));
 function getLocations(p,keys){const o={};for(const k of keys)o[k]=gl.getUniformLocation(p,k);return o;}
 const u=getLocations(program,['uCam','uForward','uRight','uUp','uSun','uFov','uAspect','uActor','uYaw','uColor','uSkinTint','uSkin[0]']);
 const gu=getLocations(gp,['uCam','uForward','uRight','uUp','uFov','uAspect']);
 const api={draw,triangles:0,drawCalls:0,modelTriangles:near.triangles,source:'HumanModelAsset/1',bones:model.bones.length};
 function draw(cam,w,h){
  let cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw),roll=cam.roll||0,cr=Math.cos(roll),sr=Math.sin(roll);
  const right=[cy,0,-sy],up=[-sy*sp,cp,-cy*sp];
  const vec={cam:[cam.x,cam.y,cam.z],forward:[sy*cp,sp,cy*cp],right:[right[0]*cr+up[0]*sr,right[1]*cr+up[1]*sr,right[2]*cr+up[2]*sr],up:[up[0]*cr-right[0]*sr,up[1]*cr-right[1]*sr,up[2]*cr-right[2]*sr]};
  gl.useProgram(program);
  gl.uniform3fv(u.uCam,vec.cam);gl.uniform3fv(u.uForward,vec.forward);gl.uniform3fv(u.uRight,vec.right);gl.uniform3fv(u.uUp,vec.up);
  gl.uniform3fv(u.uSun,[.57,.54,.62]);gl.uniform1f(u.uFov,Math.tan(65*Math.PI/360));gl.uniform1f(u.uAspect,w/h);
  let triangleCount=0,drawCalls=0;
  for(const a of sim.getActors()){
   const distance=Math.hypot(a.x-cam.x,a.z-cam.z);
   if(distance>95)continue;
   const mesh=uploads[distance<24?0:1];
   const matrix=computeSkinMatrices(model.bones,a);
   gl.uniformMatrix4fv(u['uSkin[0]'],false,matrix);
   gl.uniform3fv(u.uActor,[a.x,sim._region.floorAt(a.x,a.z),a.z]);
   gl.uniform1f(u.uYaw,a.facing);
   gl.uniform3fv(u.uColor,a.def.color);
   gl.uniform1f(u.uSkinTint,a.def.skin);
   gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
   triangleCount+=mesh.triangles;drawCalls++;
  }
  // Existing town-market supply state stays in place, and never becomes an NPC feature stub.
  const supply=sim.snapshot().marketSupply;
  if(supply!=='closing'){
   const pos=supply==='low'?[-28,20]:[5.6,11.8],y=sim._region.floorAt(pos[0],pos[1]);
   gl.useProgram(gp);
   gl.uniform3fv(gu.uCam,vec.cam);gl.uniform3fv(gu.uForward,vec.forward);gl.uniform3fv(gu.uRight,vec.right);gl.uniform3fv(gu.uUp,vec.up);
   gl.uniform1f(gu.uFov,Math.tan(65*Math.PI/360));gl.uniform1f(gu.uAspect,w/h);
   const goodsData=new Float32Array([pos[0],y,pos[1],0,0,0,1,0,1,1,1,.95]);
   gl.bindBuffer(gl.ARRAY_BUFFER,goodsInstances);gl.bufferSubData(gl.ARRAY_BUFFER,0,goodsData);
   gl.bindVertexArray(goodsVao);gl.drawArraysInstanced(gl.TRIANGLES,0,goods.count,1);
   triangleCount+=goods.triangles;drawCalls++;
  }
  api.triangles=triangleCount;api.drawCalls=drawCalls;
 }
 return api;
}
const api={unpackLOD,computeSkinMatrices,createRenderer,sourceModel:model?.sourceFile||null};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SerenveltCitizens=api;
})(typeof window==='undefined'?globalThis:window);
