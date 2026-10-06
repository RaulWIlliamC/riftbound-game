import {drawShrineSymbol,drawShrineAura} from './shrine-art.js';
import {ART,artPoint} from './layout.js';
import {pixel,stroke} from './pixel-art.js';
import {drawLight} from './effects.js';
function circleTexture(image,x,y,r){const c=document.createElement('canvas');c.width=c.height=r*2;const ctx=c.getContext('2d');ctx.drawImage(image,x-r,y-r,r*2,r*2,0,0,r*2,r*2);return c;}
export function prepareEffects(image){return{portal:circleTexture(image,798,190,72),wind:circleTexture(image,1186,539,44)};}
function ember(ctx,x,y,time,seed,count=6,spread=20,height=65){
 for(let i=0;i<count;i++){const f=(time*(.20+i*.013)+i*.173+seed)%1;ctx.globalAlpha=(1-f)*.7;pixel(ctx,x+Math.sin(i*2.4+time*.6)*spread,y-f*height,2,2,i%2?'#ffc377':'#ff944e');}ctx.globalAlpha=1;
}
function texturedFire(ctx,image,x,y,w,h,t,seed){
 // Animate existing flame pixels in narrow bands; no replacement art or opaque overlays.
 ctx.save();ctx.beginPath();ctx.rect(x-w/2,y-h/2,w,h);ctx.clip();
 for(let i=0;i<h;i+=3){const offset=Math.round(Math.sin(t*5+seed+i*.16)*(1+(h-i)/h));ctx.drawImage(image,x-w/2,y-h/2+i,w,Math.min(3,h-i),x-w/2+offset,y-h/2+i,w,Math.min(3,h-i));}
 ctx.restore();ember(ctx,x,y+h*.15,t,seed,6,w*.5,h*1.3);
}
function swirl(ctx,texture,x,y,r,t,speed){
 ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.clip();ctx.rotate(t*speed);ctx.drawImage(texture,-r-1,-r-1,r*2+2,r*2+2);ctx.restore();
}
export function drawImageEffect(ctx,o,t,image,textures){
 ctx.save();ctx.translate(ART.x,ART.y);ctx.scale(ART.scale,ART.scale);
 const x=o.sourceX,y=o.sourceY;
 if(o.kind==='portal'){
  swirl(ctx,textures.portal,798,190,68+(o.expansion||0)*16,t,-.16);
  for(let i=0;i<12;i++){const f=(t*.12+i*.083)%1,r=68*(1-f),a=i*2.399+t*.23+f*1.5;ctx.globalAlpha=.3*(1-f);pixel(ctx,798+Math.cos(a)*r,190+Math.sin(a)*r,2,2,'#b3c8ff');}ctx.globalAlpha=1;
  const pulse=.12+(o.expansion||0)*.18+Math.max(0,Math.sin(t*.9))*.14;
  ctx.globalAlpha=pulse;stroke(ctx,[[696,116],[691,127],[700,136],[706,125],[696,116]],'#a3cbff',2);stroke(ctx,[[886,171],[881,183],[889,192],[895,179]],'#8fabff',2);ctx.globalAlpha=1;
  for(const [sx,sy,w,h] of [[635,116,20,25],[678,55,23,28],[947,150,27,37]]){
   ctx.globalAlpha=.6;const bob=Math.round(Math.sin(t*.8+sx)*2);ctx.drawImage(image,sx-w/2,sy-h/2,w,h,sx-w/2,sy-h/2+bob,w,h);ctx.globalAlpha=1;
  }
 }
 if(o.kind==='campfire')texturedFire(ctx,image,790,540,47,66,t,o.seed);
 if(o.kind==='shrine'){
  if(o.element==='fire')texturedFire(ctx,image,407,552,43,70,t,o.seed);
  if(o.element==='wind')swirl(ctx,textures.wind,1186,539,38,t,.26);
  if(o.element==='water'){
   for(let i=0;i<5;i++){const f=(t*.7+i*.19)%1;ctx.globalAlpha=.22*(1-f);pixel(ctx,420+i%3*8,297+f*36,2,5,'#b8edff');}ctx.globalAlpha=1;
   for(let i=0;i<5;i++){const a=t*.7+i*1.26;ctx.globalAlpha=.35;pixel(ctx,430+Math.cos(a)*30,332+Math.sin(a)*8,2,2,'#c1f1ff');}ctx.globalAlpha=1;
  }
  if(o.element==='earth')for(const [sx,sy,w,h] of [[737,695,22,35],[840,675,20,27]]){const bob=Math.round(Math.sin(t*.8+sx)*2);ctx.globalAlpha=.65;ctx.drawImage(image,sx-w/2,sy-h/2,w,h,sx-w/2,sy-h/2+bob,w,h);ctx.globalAlpha=1;}
  if(o.element==='lightning'&&Math.sin(t*5.3+o.seed)>.6){ctx.globalAlpha=.6;stroke(ctx,[[1159,304],[1146,320],[1152,333],[1138,344]],'#dfa9ff',1);stroke(ctx,[[1171,307],[1187,318],[1180,330],[1193,336]],'#d69eff',1);ctx.globalAlpha=1;}
 }
 if(o.torch){const cy=y-(x<400||x>1200?58:94);texturedFire(ctx,image,x,cy,22,37,t,o.seed);}
 ctx.restore();
 if(o.kind==='shrine')drawShrineSymbol(ctx,o,textures.shrines);
}
export function imageLighting(ctx,objects,t){
 for(const o of objects){
  if(o.kind==='campfire'){const p=artPoint(789,565);drawLight(ctx,p.x,p.y,220,'#ff983e',.07+Math.sin(t*5)*.025);}
  if(o.kind==='portal'){const p=artPoint(798,220);drawLight(ctx,p.x,p.y,160,'#6564ff',.055+(o.expansion||0)*.19+Math.sin(t*1.1)*.025);
   if(o.expansion>.15){const hint=artPoint(798,365);ctx.save();ctx.globalAlpha=o.expansion;ctx.font='11px monospace';ctx.textAlign='center';ctx.fillStyle='#13172d';ctx.fillRect(hint.x-65,hint.y-13,130,20);ctx.fillStyle='#d0c4ff';ctx.fillText('CLICK THE RIFT',hint.x,hint.y);ctx.restore();}}
  if(o.kind==='shrine')drawShrineAura(ctx,o,t);
  if(o.torch)drawLight(ctx,o.x,o.y-90,70,'#ffb45c',.04+Math.sin(t*4.1+o.seed)*.015);
 }
}
export function imageAmbient(ctx,t,image,view){
 ctx.save();ctx.translate(ART.x,ART.y);ctx.scale(ART.scale,ART.scale);
 // Moving blue streaks remain inside the already-painted waterfalls.
 for(const [x,y,w,h] of [[90,74,25,113],[135,295,18,120],[977,58,18,120],[1422,139,22,135],[84,835,29,150],[310,900,30,105],[1200,901,34,106]]){
  ctx.globalAlpha=.10;for(let i=0;i<4;i++){const phase=(t*.23+i*.237)%1;pixel(ctx,x+i*w/4,y+phase*h,2,15,'#a5d5ff');}ctx.globalAlpha=1;
 }
 // Very small texture shifts at leaf tips, rather than shaking whole trees.
 for(const [x,y] of [[210,315],[1026,299],[1370,365],[151,689],[1100,748]]){ctx.globalAlpha=.22;const dx=Math.round(Math.sin(t*.7+x));ctx.drawImage(image,x,y,14,12,x+dx,y,14,12);ctx.globalAlpha=1;}
 ctx.restore();
 for(let i=0;i<22;i++){
  const p=artPoint(330+i*137%920+Math.sin(t*.18+i)*8,390+i*89%420+Math.sin(t*.25+i)*5);
  if(p.x<view.left||p.x>view.right||p.y<view.top||p.y>view.bottom)continue;
  ctx.globalAlpha=.10+Math.max(0,Math.sin(t*.8+i))* .25;pixel(ctx,p.x,p.y,2,2,i%3?'#9eb9c5':'#e9c18c');
 }ctx.globalAlpha=1;
}
