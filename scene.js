/* Serenvelt environment art study 03. Standalone WebGL2, no runtime dependencies. */
(()=>{'use strict';
const canvas=document.querySelector('#world'),err=document.querySelector('#error'),status=document.querySelector('#stats');
const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:true,powerPreference:'high-performance'});
if(!gl){err.textContent='이 기기에서 WebGL2를 사용할 수 없습니다';err.classList.add('show');return;}
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const h=n=>{let q=Math.sin(n*127.1+49.73)*43758.5453123;return q-Math.floor(q);};
function noise(x,z){let ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);let n=(a,b)=>h(a*117.71+b*43.97);return lerp(lerp(n(ix,iz),n(ix+1,iz),fx),lerp(n(ix,iz+1),n(ix+1,iz+1),fx),fz);}
const river=z=>-35+Math.sin(z*.022)*14+Math.sin(z*.006)*11;
function ridge(x,z){
 // Sculpted escarpments belong to the terrain itself. No isolated cylinder-topped mesas.
 let wrinkle=(noise(x*.032,z*.030)-.5)*16+(noise(x*.12,z*.11)-.5)*5;
 let left=(1-smooth(-52,42,x))*smooth(140,154,z+wrinkle)*(32+4*Math.sin(x*.018+z*.009));
 let right=smooth(75,145,x)*smooth(194,208,z+wrinkle)*(46+5*Math.sin(z*.025-x*.009));
 let distant=smooth(200,330,z)*(9+6*Math.sin(x*.012+z*.008));
 return left+right+distant;
}
function ground(x,z){let broad=3.2*(noise(x*.015,z*.014)-.5)+1.25*Math.sin(z*.021+x*.017)+.76*Math.sin(x*.07)*Math.cos(z*.061)+.38*Math.sin(x*.12+z*.037)*Math.cos(z*.078);
let bank=Math.abs(x-river(z)),valley=(1-smooth(4.8,32,bank))*(3.8+.8*Math.sin(z*.03));return 1.6+broad+ridge(x,z)-valley;}
function normalAt(x,z){let s=1.2,dx=ground(x+s,z)-ground(x-s,z),dz=ground(x,z+s)-ground(x,z-s),l=Math.hypot(dx,2*s,dz);return [-dx/l,2*s/l,-dz/l];}
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
function unit(v){let s=Math.hypot(...v)||1;return v.map(x=>x/s);}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
class Batch{
 constructor(){this.data=[];this.tris=0;}
 tri(a,b,c,color,na=null,nb=null,nc=null,uv=[[0,0],[1,0],[0,1]]){
 let n=unit(cross(minus(b,a),minus(c,a)));let v=this.data;
 [[a,na||n,uv[0]],[b,nb||n,uv[1]],[c,nc||n,uv[2]]].forEach(([p,no,t])=>v.push(...p,...no,...color,...t));this.tris++;
 }
 quad(a,b,c,d,col,normals=null,uv=[[0,0],[0,1],[1,1],[1,0]]){let n=normals||[];this.tri(a,b,c,col,n[0],n[1],n[2],[uv[0],uv[1],uv[2]]);this.tri(a,c,d,col,n[0],n[2],n[3],[uv[0],uv[2],uv[3]]);}
 upload(){let array=new Float32Array(this.data),vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);
 for(let i=0;i<4;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,[3,3,3,2][i],gl.FLOAT,false,44,[0,12,24,36][i]);}
 gl.bindVertexArray(null);this.count=array.length/11;this.vao=vao;this.data=null;return this;}
}
const terrain=new Batch(),opaque=new Batch(),water=new Batch(),canopy=new Batch(),leaves=new Batch(),grass=new Batch();
function makeTerrain(){
 const spacing=3.6,xb=-220,zb=-100,nx=123,nz=128;
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
 let x=xb+i*spacing,z=zb+j*spacing,x1=x+spacing,z1=z+spacing;
 let a=[x,ground(x,z),z],b=[x,ground(x,z1),z1],c=[x1,ground(x1,z1),z1],d=[x1,ground(x1,z),z];
 let slope=normalAt(x,z)[1],n=noise(x*.017,z*.018),v=.5+.5*Math.sin(z*.037+x*.01);
 let co=[.34+.11*n+.037*v,.52+.17*n+.046*v,.26+.066*n];
 let rock=(1-smooth(.59,.88,slope))*smooth(8,21,(a[1]+c[1])*.5);
 co=co.map((q,k)=>lerp(q,[.45,.46,.42][k],rock*.84));
 // Ground is smooth shaded, not a mosaic of flat low-poly facets.
 terrain.quad(a,b,c,d,co,[normalAt(x,z),normalAt(x,z1),normalAt(x1,z1),normalAt(x1,z)]);
 }
 // River follows its excavated bed, with wider banks and no floating flat blue strip.
 for(let z=-99;z<356;z+=1.9){let z1=z+1.9,x=river(z),x1=river(z1),w=5.7+.75*Math.sin(z*.06),w1=5.7+.75*Math.sin(z1*.06);
 water.quad([x-w,-.59,z],[x1-w1,-.59,z1],[x1+w1,-.59,z1],[x+w,-.59,z],[.18,.58,.65]);}
}
function tube(points,rad,col,seed){
 let sections=10,rows=[];
 for(let j=0;j<points.length;j++){
 let direction=unit(minus(points[Math.min(j+1,points.length-1)],points[Math.max(j-1,0)])),t=unit(cross(direction,[0,0,1]));if(Math.hypot(...t)<.2)t=[1,0,0];let b=unit(cross(direction,t)),ring=[];
 for(let i=0;i<=sections;i++){let a=i*TAU/sections,r=rad[j]*(.93+.07*h(seed+i*19+j*47));ring.push(points[j].map((n,k)=>n+(t[k]*Math.cos(a)+b[k]*Math.sin(a))*r));}rows.push(ring);
 }
 for(let j=0;j<rows.length-1;j++)for(let i=0;i<sections;i++)opaque.quad(rows[j][i],rows[j][i+1],rows[j+1][i+1],rows[j+1][i],col);
}
function rock(x,z,s,seed){
 let y=ground(x,z),layers=5,segs=11,rows=[];
 for(let j=0;j<=layers;j++){let phi=j/layers*Math.PI,row=[];for(let i=0;i<=segs;i++){let a=i*TAU/segs,r=Math.sin(phi)*(1+.2*(h(seed+i*7+j*19)-.5));row.push([x+Math.cos(a)*r*s,y+Math.cos(phi)*.62*s+.28*s,z+Math.sin(a)*r*s]);}rows.push(row);}
 let color=[.47,.49,.43];for(let j=0;j<layers;j++)for(let i=0;i<segs;i++)opaque.quad(rows[j][i],rows[j][i+1],rows[j+1][i+1],rows[j+1][i],color);
}
function card(batch,center,w,h,seed,tint,tile=0){
 // Position stores the card centre; the normal.xy slots hold billboard offsets.
 let verts=[[-w/2,-h/2],[-w/2,h/2],[w/2,h/2],[w/2,-h/2]];
 let ox=tile%2*.5,oy=Math.floor(tile/2)*.5;
 let corners=[[ox,oy+.5],[ox,oy],[ox+.5,oy],[ox+.5,oy+.5]];
 const pass=(indices)=>{let data=batch.data;for(let i of indices){let v=verts[i],uv=corners[i];data.push(...center,v[0],v[1],seed,...tint,...uv);}batch.tris++;};
 pass([0,1,2]);pass([0,2,3]);
}
function crownSurface(cx,cy,cz,rx,ry,rz,seed,bloom){
 // One sculpted, lobed canopy surface; detailed leaf cards break its silhouette.
 let rings=13,segments=32,rows=[];
 for(let j=0;j<=rings;j++){
  let phi=Math.PI*j/rings,row=[];
  for(let i=0;i<=segments;i++){
   let a=i/segments*TAU,rough=1+.14*Math.sin(a*7+seed)+.07*Math.sin(a*13+phi*5+seed*.7)+.075*Math.cos(phi*11+a*5+seed);
   let radial=Math.sin(phi)*rough;
   let y=cy+Math.cos(phi)*ry-(Math.sin(a*2+seed)+1)*.11*ry*radial;
   row.push([cx+rx*radial*Math.cos(a),y,cz+rz*radial*Math.sin(a)]);
  }
  rows.push(row);
 }
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
  let a=rows[j][i],b=rows[j+1][i],c=rows[j+1][i+1],d=rows[j][i+1];
  let norms=[a,b,c,d].map(v=>unit([(v[0]-cx)/rx,(v[1]-cy)/ry,(v[2]-cz)/rz]));
  let top=.5+.5*Math.cos((j+.5)*Math.PI/rings),dapple=noise(cx*.31+i*.24,cz*.37+j*.3);
  let co=bloom?[.64+.18*top,.44+.25*top,.53+.20*top]:[.30+.13*top+.05*dapple,.45+.20*top+.05*dapple,.26+.10*top];
  canopy.quad(a,b,c,d,co,norms);
 }
}
function bigTree(x,z,scale,seed,bloom=false){
 let y=ground(x,z),height=(10.2+1.8*h(seed))*scale,lean=(h(seed+4)-.5)*2.2*scale;
 let trunk=[[x,y-.38*scale,z],[x+.08*lean,y+height*.18,z+.22*scale],[x+.34*lean,y+height*.44,z+.5*scale],[x+lean,y+height*.78,z+.6*scale]];
 tube(trunk,[.94,.67,.40,.085].map(v=>v*scale),[.39,.31,.24],seed);
 // Bark flares into ground as separate curved roots, then fans outward into boughs.
 for(let j=0;j<5;j++){let a=j*TAU/5+seed,p=trunk[1],span=(4.0+1.3*h(j+seed))*scale;
 let b=[x+Math.cos(a)*span*.52,y+height*.51,z+Math.sin(a)*span*.52],c=[x+Math.cos(a)*span+lean,y+height*(.70+.08*h(j*3+seed)),z+Math.sin(a)*span];
 tube([p,b,c],[.38,.24,.018].map(v=>v*scale),[.36,.28,.22],seed+30+j);
 }
 let cx=x+lean,cy=y+height*.75,cz=z+.6*scale,hero=scale>1.8;
 crownSurface(cx,cy,cz,(hero?6.25:4.05)*scale,(hero?1.9:2.05)*scale,(hero?4.5:3.45)*scale,seed,bloom);
 if(hero){
  const lobes=[[-3.8,.18,-1.8,3.5,1.6,2.8],[3.3,.55,.4,3.9,1.8,2.8],[-.9,1.45,2.2,3.8,1.65,2.5],[-1.1,-.62,-3.,3.25,1.38,2.4],[3.5,-.65,-2.7,2.9,1.25,2.3]];
  for(let i=0;i<lobes.length;i++){let b=lobes[i];crownSurface(cx+b[0]*scale,cy+b[1]*scale,cz+b[2]*scale,b[3]*scale,b[4]*scale,b[5]*scale,seed+i*7,bloom);}
 }
 // Foliage is a nested canopy of alpha-tested painted twig/leaf clusters.
 // Asymmetric, overlapping but porous silhouette; cards face the camera in 3D.
 let total= Math.round((hero?290:150)*scale*.75);
 for(let i=0;i<total;i++){
 let a=i*2.399963+seed,r=Math.sqrt((i+.5)/total),tt=(h(i*13+seed)-.5)*2;
 let px=cx+Math.cos(a)*r*(hero?7.85:5.6)*scale,pz=cz+Math.sin(a)*r*(hero?5.8:4.65)*scale;
 let py=cy+(1-r*r)*1.8*scale+(h(i*7+seed)-.5)*(hero?2.9:3.8)*scale-r*1.2*scale;
 let size=(1.55+1.25*h(i+seed*5))*(1-r*.22)*scale;
 let tint=bloom?[.98+.07*h(i),.76+.11*h(i+19),.85+.08*h(i+8)]:[.70+.13*h(i),.77+.14*h(i+9),.60+.10*h(i+15)];
 card(leaves,[px,py,pz],size*1.33,size*.92,i+seed,tint,i%4);
 }
}
function conifer(x,z,s,seed){
 let y=ground(x,z),height=(8+h(seed)*3)*s;tube([[x,y,z],[x+.1*s,y+height*.55,z],[x+.2*s,y+height,z]],[.33,.18,.015].map(v=>v*s),[.31,.28,.23],seed);
 for(let j=0;j<14;j++){let t=j/14,rad=(2.45*(1-t)+.23)*s,k=j*2.399963+seed;
 for(let i=0;i<3;i++){let a=k+i*TAU/3,x1=x+Math.cos(a)*rad,z1=z+Math.sin(a)*rad;
 card(leaves,[x1,y+height*(.20+t*.71)+h(j+i+seed)*.35*s,z1],(2.2-t*.9)*s,(2.2-t*.7)*s,j+i+seed,[.39,.61,.47],(i+j)%4);}
 }
}
function scatter(){
 bigTree(25,68,2.35,21,false);bigTree(-8,111,.96,27,true);bigTree(73,105,.86,36,false);
 for(let i=0;i<61;i++){
 let x=-168+h(i*19+2)*340,z=32+h(i*31+8)*250;
 if(Math.abs(x-river(z))<14||Math.hypot(x-25,z-68)<40)continue;
 let scale=.3+.45*h(i*13+10);if(i%4===0)conifer(x,z,scale,i+119);else bigTree(x,z,scale,i+78,i%17===0);
 }
 for(let i=0;i<44;i++){
 let x=-185+h(i*29+3)*248,z=164+h(i*31+9)*33;
 let scale=.27+.19*h(i*37);if(i%3===0)conifer(x,z,scale,340+i);else bigTree(x,z,scale,500+i,false);
 }
 for(let i=0;i<70;i++){let x=-130+h(i*37)*300,z=-40+h(i*51+14)*300;if(Math.abs(x-river(z))>10)rock(x,z,.3+1.5*h(i*17+20),i+13);}
 // Pebble clusters on the bank and shrub masses in the middle distance, without tile repetition.
 for(let i=0;i<142;i++){
  let z=-35+h(i*31+18)*202,side=i%2?1:-1,x=river(z)+side*(8.8+h(i*23+6)*10);
  rock(x,z,.14+.51*h(i*29+5),400+i);
 }
 for(let i=0;i<340;i++){
  let x=-125+h(i*17+1)*244,z=6+h(i*53+9)*156,patch=noise(x*.034+3,z*.051+8);
  if(Math.abs(x-river(z))<11||patch<.48||Math.hypot(x-25,z-68)<15)continue;
  let size=.3+.75*h(i*47+4),y=ground(x,z)+size*.4;
  card(leaves,[x,y,z],1.3*size,size*.95,900+i,[.47+.20*h(i*7),.62+.20*h(i*9),.47+.15*h(i*13)],i%4);
 }
 // Foreground shrub silhouettes frame the vista without static UI or fake depth layers.
 for(let i=0;i<45;i++){
  let left=i%2===0,x=left?-24+h(i*19)*15:11+h(i*19)*17,z=-24+h(i*23+3)*31;
  let group=noise(x*.09,z*.11);if(group<.34)continue;
  let size=.36+.72*h(i*17+4),y=ground(x,z)+size*.37;
  card(leaves,[x,y,z],size*1.9,size*1.5,i+1600,[.59+.15*h(i*13),.70+.16*h(i*17),.54+.11*h(i*11)],i%4);
 }
 // Layered tall grass cards. No opaque triangular-cone blades.
 for(let i=0;i<18500;i++){
 let near=i<13500;
 let x=near?-49+h(i*17)*122:-160+h(i*17)*320;
 let z=near?-43+h(i*37+4)*130:-61+h(i*37+4)*268;
 let patch=.57*noise(x*.033,z*.038)+.43*noise(x*.091+8,z*.08+13);
 if(h(i*19+3)>smooth(.26,.70,patch)||Math.abs(x-river(z))<13)continue;
 let path=8+.14*z+5*Math.sin(z*.03);
 if(z<90&&Math.abs(x-path)<3.9)continue;
 let w=.38+.28*h(i*7+9),height=.22+.25*h(i*19+3),scale=(.75+.34*h(i*43));
 let v=.82+.12*h(i*13),seed=i+7;
 card(grass,[x,ground(x,z)+height*.47*scale,z],w*scale,height*scale,seed,[v,v,v],i%4);
 }
}
function drawAtlas(kind){
 let c=document.createElement('canvas');c.width=512;c.height=512;let ctx=c.getContext('2d');
 function rng(n){let t=Math.sin(n*92.17+37)*15493.713;return t-Math.floor(t);}
 for(let tile=0;tile<4;tile++){
  let x0=(tile%2)*256,y0=Math.floor(tile/2)*256;
  if(kind==='leaves'){
   let cx=x0+128,cy=y0+127;
   // Broad painterly masses first. Leaves are strokes layered over an irregular silhouette.
   for(let b=0;b<9;b++){
    let a=b*2.39996+tile*.7,rd=(.15+.72*Math.sqrt(rng(tile*23+b*17)));
    let px=cx+Math.cos(a)*rd*73,py=cy+Math.sin(a)*rd*65;
    let radius=29+rng(b*31+tile*7)*35;
    ctx.beginPath();
    for(let j=0;j<=23;j++){
      let ang=j/23*TAU,ruff=1+.22*Math.sin(5*ang+b)+.12*Math.sin(11*ang+tile*7+b);
      let xx=px+Math.cos(ang)*radius*ruff,yy=py+Math.sin(ang)*radius*.82*ruff;
      if(!j)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
    }
    ctx.closePath();ctx.fillStyle=['#426547','#5b8453','#749961','#93b175'][Math.floor(rng(b*7+tile)*4)];ctx.fill();
   }
   for(let b=0;b<1100;b++){
    let angle=rng(tile*89+b*7)*TAU,radius=Math.sqrt(rng(b*43+tile*11))*105;
    let px=cx+Math.cos(angle)*radius,py=cy+Math.sin(angle)*radius*.86;
    if(ctx.getImageData(Math.floor(px),Math.floor(py),1,1).data[3]<10)continue;
    let leaf=3+rng(tile*37+b*17)*7,shade=rng(b*29+tile*15);
    ctx.save();ctx.translate(px,py);ctx.rotate((rng(b*11+tile*9)-.5)*2.5);
    ctx.fillStyle=shade<.18?'#40644b':shade<.55?'#608455':shade<.84?'#83a465':'#adc687';
    ctx.beginPath();ctx.moveTo(-leaf*.75,0);ctx.quadraticCurveTo(0,-leaf*.5,leaf,0);ctx.quadraticCurveTo(0,leaf*.5,-leaf*.75,0);ctx.fill();ctx.restore();
   }
  }else{
   for(let j=0;j<65;j++){
    let x=x0+13+rng(tile*83+j*13)*231,base=y0+249-rng(tile*41+j*7)*10,hgt=35+145*Math.pow(rng(j*73+tile*7),1.5),bend=(rng(j*11+tile*25)-.5)*51;
    let shade=rng(j*37+tile*19);
    ctx.strokeStyle=shade<.3?'#5b8150':shade<.67?'#7aa566':'#a6c584';ctx.lineWidth=1.1+rng(j*17)*3;
    ctx.beginPath();ctx.moveTo(x,base);ctx.quadraticCurveTo(x+bend*.15,base-hgt*.67,x+bend,base-hgt);ctx.stroke();
   }
  }
 }
 let tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.generateMipmap(gl.TEXTURE_2D);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return tex;
}
const skyVS=`#version 300 es
precision highp float;void main(){vec2 p=gl_VertexID==0?vec2(-1.,-1.):gl_VertexID==1?vec2(3.,-1.):vec2(-1.,3.);gl_Position=vec4(p,0.,1.);}`;
const skyFS=`#version 300 es
precision highp float;
out vec4 frag;uniform vec3 uForward,uRight,uUp,uSun;uniform vec2 uSize;uniform float uFov,uTime;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float c=0.,w=.52;for(int i=0;i<4;i++){c+=w*n(p);p=p*2.03+vec2(13.7,9.2);w*=.5;}return c;}
void main(){
 vec2 uv=gl_FragCoord.xy/uSize*2.-1.;vec3 d=normalize(uForward+uRight*uv.x*uFov*uSize.x/uSize.y+uUp*uv.y*uFov);
 float elev=max(0.,d.y),sun=max(dot(d,uSun),0.);
 vec3 sky=mix(vec3(.65,.86,.83),vec3(.095,.50,.73),pow(elev,.51));sky+=vec3(1.,.78,.42)*.055*exp(-elev*14.);
 // Cloud banks: warped broad masses, fine cumulus edge breakup and solar facing shade.
 vec2 p=d.xz/(max(.035,elev)+.23)*1.13+vec2(uTime*.0036,0.);
 vec2 warp=vec2(n(p*.6+vec2(3.,0.)),n(p*.6+vec2(0.,4.)))-.5;
 float density=fbm(p*.82+warp*.62)+n(p*2.1)*.045;
 float alpha=smoothstep(.505,.585,density)*smoothstep(.013,.12,elev);
 float towardSun=fbm(p*.82+warp*.62-uSun.xz*.35);
 float bright=clamp(.48+(density-towardSun)*2.8+elev*.26,0.,1.);
 float depth=smoothstep(.55,.68,density);
 vec3 clouds=mix(vec3(.57,.69,.73),vec3(1.,.99,.94),bright);
 clouds*=1.-depth*.13*(1.-bright);
 float edge=(smoothstep(.49,.56,density)-smoothstep(.60,.69,density))*.22;
 clouds+=vec3(.92,.86,.65)*edge*(.3+.7*sun);
 sky=mix(sky,clouds,alpha*.96);
 sky+=vec3(1.,.82,.48)*pow(sun,20.)*.1+vec3(1.,.92,.63)*pow(sun,500.)*.65;
 frag=vec4(clamp(sky,0.,1.),1.);
}`;
const worldVS=`#version 300 es
precision highp float;layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNorm;layout(location=2) in vec3 aColor;layout(location=3) in vec2 aUv;
uniform vec3 uCam,uForward,uRight,uUp;uniform float uFov,uAspect,uTime,uKind;
out vec3 vWorld,vNorm,vColor;out vec2 vUv;out float vDistance;
void main(){
 vec3 pos=aPos;vec3 norm=aNorm;
 if(uKind>1.5&&uKind<3.5){vec2 sway=vec2(.08,.04)*sin(uTime*.7+aPos.x*.16+aPos.z*.1)*max(0.,aNorm.y);pos+=uRight*aNorm.x+uUp*aNorm.y+vec3(sway.x,0.,sway.y);norm=vec3(.12,.62,.76);}
 vWorld=pos;vNorm=norm;vColor=aColor;vUv=aUv;vDistance=distance(pos,uCam);
 vec3 rel=pos-uCam;float depth=dot(rel,uForward);
 gl_Position=vec4(dot(rel,uRight)/(uFov*uAspect),dot(rel,uUp)/uFov,depth*1.00024-.18,depth);
}`;
const worldFS=`#version 300 es
precision highp float;
in vec3 vWorld,vNorm,vColor;in vec2 vUv;in float vDistance;out vec4 frag;
uniform vec3 uSun,uCam;uniform float uKind,uTime;uniform sampler2D uAtlas;
float h(vec2 x){return fract(sin(dot(x,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
void main(){
 vec3 N=normalize(vNorm);float sun=max(dot(N,uSun),0.);
 vec3 c=vColor*(.69+.39*sun);
 if(uKind<.5){
   vec2 p=vWorld.xz;
   float broad=noise(p*.018),medium=noise(p*.075+vec2(7.,13.)),fine=noise(p*.39);
   float lime=smoothstep(.24,.78,.54*broad+.46*medium);
   vec3 meadow=mix(vec3(.18,.39,.23),vec3(.58,.73,.36),lime);
   meadow+=vec3(.11,.12,.024)*(fine-.5);
   // Sunlit middle distance with darker vegetation at the camera, preserving painterly depth.
   float opening=smoothstep(-27.,40.,p.y)*(1.-smoothstep(130.,230.,p.y));
   meadow+=vec3(.10,.14,.028)*opening*(.55+.45*noise(p*.027+vec2(8.,19.)));
   c=mix(c,meadow*(.83+.28*sun),.88);
   float slope=1.-clamp(N.y,0.,1.);
   float stone=smoothstep(.26,.57,slope)*smoothstep(5.,18.,vWorld.y);
   float stripe=noise(vec2(p.x*.049+p.y*.035,vWorld.y*.14+noise(p*.15)*.45));
   float vertical=noise(vec2(p.x*.18+p.y*.07+noise(p*.05)*1.6,vWorld.y*.031));
   vec3 cliff=mix(vec3(.36,.43,.42),vec3(.58,.60,.52),clamp(.15+.57*stripe+.17*vertical,0.,1.));
   c=mix(c,cliff*(.72+.38*sun),stone*.97);
   // Riverbank shallows reveal moss, stones and pale sandy edges.
   float riverX=-35.+sin(p.y*.022)*14.+sin(p.y*.006)*11.;
   float bank=abs(p.x-riverX);
   float shore=(1.-smoothstep(7.2,13.8,bank));
   vec3 silt=mix(vec3(.49,.55,.43),vec3(.69,.67,.49),noise(p*.17));
   c=mix(c,silt,shore*(1.-stone)*.85);
   // A quiet walking trail guides the landscape toward the old tree.
   float track=8.+p.y*.14+5.*sin(p.y*.03)+(noise(p*.05)-.5)*2.;
   float trail=(1.-smoothstep(1.3,4.5,abs(p.x-track)))*smoothstep(-52.,-24.,p.y)*(1.-smoothstep(72.,91.,p.y));
   c=mix(c,vec3(.57,.60,.42)+vec3(.06,.04,.015)*(fine-.5),trail*(1.-stone)*.82);
   vec2 shadowPos=(p-vec2(32.5,57.));
   float shadow=.32*exp(-2.0*(shadowPos.x*shadowPos.x/(18.*18.)+shadowPos.y*shadowPos.y/(12.*12.)));
   float nearShade=1.-smoothstep(8.,43.,length(p-vec2(0.,-23.)));
   c*=1.-shadow-.29*nearShade;
 }else if(uKind>.5&&uKind<1.5){
   float q=sin(vWorld.z*.53-vWorld.x*.17+uTime*.8)*sin(vWorld.x*.96+vWorld.z*.08-uTime*.71);
   float q2=noise(vWorld.xz*.48+vec2(uTime*.035,uTime*.02));
   float center=-35.+sin(vWorld.z*.022)*14.+sin(vWorld.z*.006)*11.;
   float rim=smoothstep(3.2,5.7,abs(vWorld.x-center));
   float fresnel=pow(1.-abs(dot(normalize(uCam-vWorld),N)),2.);
   c=mix(vec3(.16,.52,.58),vec3(.42,.74,.73),clamp(.45+.29*q+.23*q2,0.,1.));
   c+=vec3(.09,.12,.09)*fresnel+vec3(.12,.15,.09)*rim*(.3+.2*q);
   c*=.94+.08*sin((vWorld.x+vWorld.z*.2)*1.4+uTime*.6);
 }else if(uKind>3.5){
   float stain=noise(vWorld.xz*.28+vWorld.y*.18);
   float dapples=noise(vWorld.xz*1.7+vWorld.y*.67);
   float upper=smoothstep(-.32,.7,N.y);
   c*=.83+.25*upper+.10*dapples;
   c+=vec3(.035,.050,.011)*smoothstep(.39,.82,stain)+vec3(.015,.028,.009)*stain;
 }else{
   vec4 t=texture(uAtlas,vUv);
   float threshold= uKind<2.5?.39:.28;
   if(t.a<threshold)discard;
   c*=t.rgb*(uKind<2.5?1.22:.99);
   if(uKind>2.5){float fade=1.-smoothstep(10.,34.,vDistance);float d=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);if(d>fade)discard;}
   c+=vec3(.08,.065,.021)*sun;
 }
 float haze=1.-exp(-pow(vDistance*.0036,1.21));
 c=mix(c,vec3(.62,.80,.78),clamp(haze,0.,.84));
 frag=vec4(clamp(c,0.,1.),1.);
}`;
function shader(type,code){let sh=gl.createShader(type);gl.shaderSource(sh,code);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
function link(v,f){let p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
let sky,world,leafTex,grassTex;
try{sky=link(skyVS,skyFS);world=link(worldVS,worldFS);makeTerrain();scatter();[terrain,opaque,water,canopy,leaves,grass].forEach(x=>x.upload());leafTex=drawAtlas('leaves');grassTex=drawAtlas('grass');}
catch(e){console.error(e);err.textContent='시각화 초기화 실패\n'+e.message;err.classList.add('show');return;}
const views={meadow:{x:0,z:-23,y:ground(0,-23)+4.2,yaw:.12,pitch:-.05},grove:{x:19,z:30,y:ground(19,30)+4.4,yaw:.18,pitch:.01},cliff:{x:-90,z:47,y:ground(-90,47)+6,yaw:.12,pitch:.09}};
let cam={...views.meadow},quality=window.innerWidth<600?1:0;const buttons=[...document.querySelectorAll('[data-vista]')],qualityNames=['화질 · 높음','화질 · 보통','화질 · 절전'];
const qb=document.querySelector('[data-vista=quality]');qb.textContent=qualityNames[quality];
buttons.forEach(btn=>btn.addEventListener('click',()=>{let kind=btn.dataset.vista;if(kind==='quality'){quality=(quality+1)%3;qb.textContent=qualityNames[quality];return;}cam={...views[kind]};buttons.forEach(x=>{if(x!==qb)x.classList.toggle('active',x===btn);});}));
let drag=null;canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;cam.yaw-=(e.clientX-drag.x)*.0026;cam.pitch=clamp(cam.pitch+(e.clientY-drag.y)*.0021,-.48,.6);drag.x=e.clientX;drag.y=e.clientY;});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,()=>drag=null));
let w=0,hh=0,frame=0,ms=0,prev=performance.now();const locations=new WeakMap();
function loc(p,k){let cache=locations.get(p);if(!cache){cache={};locations.set(p,cache);}if(!(k in cache))cache[k]=gl.getUniformLocation(p,k);return cache[k];}
function set1(p,k,v){let u=loc(p,k);if(u!==null)gl.uniform1f(u,v);}
function set3(p,k,v){let u=loc(p,k);if(u!==null)gl.uniform3fv(u,v);}
function uniform(p,t){gl.useProgram(p);let cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);
 set3(p,'uCam',[cam.x,cam.y,cam.z]);set3(p,'uForward',[sy*cp,sp,cy*cp]);set3(p,'uRight',[cy,0,-sy]);set3(p,'uUp',[-sy*sp,cp,-cy*sp]);set3(p,'uSun',[-.36,.77,.52]);
 set1(p,'uFov',Math.tan(65*Math.PI/360));set1(p,'uAspect',w/hh);set1(p,'uTime',t);
 let u=loc(p,'uSize');if(u!==null)gl.uniform2f(u,w,hh);
}
let empty=gl.createVertexArray();function render(now){
 let q=Math.min(devicePixelRatio||1,1.6)*[1,.7,.5][quality],width=Math.max(2,Math.round(canvas.clientWidth*q)),height=Math.max(2,Math.round(canvas.clientHeight*q));
 if(w!==width||hh!==height){w=canvas.width=width;hh=canvas.height=height;gl.viewport(0,0,w,hh);}
 gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);uniform(sky,now*.001);gl.bindVertexArray(empty);gl.drawArrays(gl.TRIANGLES,0,3);
 gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.depthFunc(gl.LEQUAL);
 uniform(world,now*.001);
 [[terrain,0,null],[water,1,null],[opaque,0,null],[canopy,4,null],[leaves,2,leafTex],[grass,3,grassTex]].forEach(([mesh,kind,tex])=>{
 set1(world,'uKind',kind);if(tex){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);let u=loc(world,'uAtlas');if(u!==null)gl.uniform1i(u,0);}gl.bindVertexArray(mesh.vao);gl.drawArrays(gl.TRIANGLES,0,mesh.count);
 });
 frame++;ms+=Math.min(100,now-prev);prev=now;
 if(ms>1000){let fps=Math.round(frame*1000/ms),tris=[terrain,opaque,water,canopy,leaves,grass].reduce((sum,x)=>sum+x.tris,0);
  status.textContent=fps+' FPS · '+Math.round(tris/1000)+'K TRI · '+w+'×'+hh;
  window.__SERENVELT_DIAGNOSTICS__={fps,triangles:tris,drawCalls:7,width:w,height:hh,quality,glError:gl.getError()};frame=0;ms=0;
 }
 requestAnimationFrame(render);
}
requestAnimationFrame(render);
})();
