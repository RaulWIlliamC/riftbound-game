import {pixel,polygon,stroke,stone,rune} from './pixel-art.js';
const colors={fire:'#f78840',water:'#40beee',earth:'#e2ba68',wind:'#8de0c8',lightning:'#b46df3',portal:'#5264f9'};
const glowCache=new Map();
function glowSprite(color){
 if(glowCache.has(color))return glowCache.get(color);
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
 const g=ctx.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,color+'a0');g.addColorStop(.35,color+'55');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);glowCache.set(color,c);return c;
}
export function drawLight(ctx,x,y,r,color,intensity=1){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha*=intensity;ctx.drawImage(glowSprite(color),x-r,y-r*.65,r*2,r*1.3);ctx.restore();}
export function flame(ctx,x,y,size,time,seed=0){
 const t=time*7+seed,base=size*.32;
 // Stepped, curling tongues instead of a single triangular flame silhouette.
 for(let i=0;i<4;i++){
  const height=size*(1-i*.18),width=base*(1-i*.22),sway=Math.sin(t+i*2)*size*.15;
  polygon(ctx,[[x-width,y],[x-width,y-height*.18],[x-width*1.1,y-height*.3],
   [x-width*.65,y-height*.45],[x-width*.72+sway,y-height*.59],[x+sway-width*.2,y-height*.76],
   [x+sway*1.6+width*.15,y-height],[x+sway*1.2+width*.3,y-height*.8],
   [x+sway+width*.15,y-height*.58],[x+width*.58,y-height*.49],
   [x+width*.66,y-height*.69],[x+width*1.2,y-height*.43],[x+width*.85,y-height*.24],[x+width,y]],['#b94430','#ed6c2d','#ffad45','#ffe58e'][i]);
 }
 pixel(ctx,x-size*.15,y-5,size*.3,6,'#fff0b1');
 for(let i=0;i<7;i++){
  const f=(time*(.26+i*.018)+i*.173+seed*.1)%1,xx=x+Math.sin(i*3+time)*size*.3+Math.sin(f*4)*12;
  ctx.globalAlpha=(1-f)*.8;pixel(ctx,xx,y-f*size*1.9,2+i%2,3,i%2?'#ffbf60':'#f37d3c');
 }
 ctx.globalAlpha=1;
 for(let i=0;i<3;i++){const f=(time*.17+i*.33+seed*.08)%1;ctx.globalAlpha=(1-f)*.14;pixel(ctx,x+Math.sin(f*4+i)*14,y-size*.6-f*size*1.2,10+f*12,6+f*8,'#b5aaa8');}ctx.globalAlpha=1;
}
function portal(ctx,o,t){
 const x=o.x,y=o.y-135;
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle='#080e28';ctx.beginPath();ctx.arc(0,0,108,0,Math.PI*2);ctx.fill();
 // Rasterized elliptical energy annuli, with a dark swirling core.
 for(let ring=0;ring<10;ring++){
  const radius=106-ring*9,n=155;
  for(let i=0;i<n;i++){
   const a=i*Math.PI*2/n,tone=Math.sin(a*3-t*1.3-ring*.6),r=radius+Math.sin(a*5+t+ring)*2;
   if(ring>2&&tone<.4)continue;
   pixel(ctx,Math.cos(a)*r,Math.sin(a)*r*.98,4+ring%2,4,['#405dd6','#263586','#28226a','#14183b'][Math.min(3,Math.floor(ring/3))]);
   if(tone>.25)pixel(ctx,Math.cos(a)*r,Math.sin(a)*r*.98,4,4,ring<2?'#6984ff':ring<5?'#5241b8':'#30235f');
  }
 }
 for(let arm=0;arm<4;arm++)for(let i=0;i<42;i++){
  const r=9+i*2,a=arm*Math.PI*.5+i*.085-t*.6;
  ctx.globalAlpha=.25+i/80;pixel(ctx,Math.cos(a)*r,Math.sin(a)*r,4,3,i>33?'#798dff':'#5542b1');
 }
 ctx.globalAlpha=1;
 for(let i=0;i<22;i++){
  const f=(t*.13+i*.071)%1,r=110*(1-f),a=i*2.399+t*.22+f*2;
  pixel(ctx,Math.cos(a)*r,Math.sin(a)*r,2+(i%3===0?2:0),3,i%2?'#96c7ff':'#8778fb');
 }
 ctx.restore();

 for(const side of [-1,1]){
  ctx.save();ctx.globalAlpha=.75+Math.sin(t*1.5)*.25;rune(ctx,o.x+side*120,o.y-90,'#91b3ff',12);ctx.restore();
  for(let i=0;i<4;i++){
   const xx=o.x+side*(157+i%2*16),yy=o.y-65-i*49+Math.sin(t*.9+i+side)*6;
   ctx.save();ctx.translate(xx,yy);ctx.rotate(Math.sin(t*.3+i)*.14);stone(ctx,0,0,18+i%2*12,17,i+4);pixel(ctx,-4,-6,4,3,'#566ecd');ctx.restore();
  }
 }
 // Sparse travelling streak, rather than one flashing full-screen effect.
 const phase=t%7;if(phase<.7){ctx.globalAlpha=Math.sin(phase/.7*Math.PI)*.6;stroke(ctx,[[x-68,y-74],[x-28,y-92],[x+15,y-75]],'#b8caff',3);ctx.globalAlpha=1;}
}
function shrine(ctx,o,t){
 const x=o.x,y=o.y-93,bob=Math.sin(t*1.6+o.seed)*4;
 if(o.element==='fire')flame(ctx,x,y+10,68,t,o.seed);
 if(o.element==='water'){
  for(let i=0;i<18;i++){const a=i*Math.PI*2/18+t*.9;pixel(ctx,x+Math.cos(a)*32,y+16+Math.sin(a)*12,5,3,'#55c2e5');}
  for(let i=0;i<3;i++)pixel(ctx,x-14+i*11,y+10,4,30,'#307dac');
  for(let r=19;r>0;r-=4){ctx.fillStyle=['#226994','#328fbf','#57c7e8','#b1edf5'][Math.min(3,Math.floor((19-r)/4))];ctx.beginPath();ctx.arc(x-3+(19-r)*.25,y-25+bob,r,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<6;i++){const f=(t*.45+i*.163)%1;pixel(ctx,x+Math.sin(i*5)*32,y-5+f*35,2,4,'#94deed');}
 }
 if(o.element==='earth'){
  polygon(ctx,[[x-22,y+bob],[x-5,y-38+bob],[x+22,y-8+bob],[x+8,y+18+bob]],'#92764f');polygon(ctx,[[x-5,y-38+bob],[x+7,y-12+bob],[x+8,y+18+bob],[x+22,y-8+bob]],'#cfb679');stroke(ctx,[[x-18,y+bob],[x-5,y-28+bob],[x+5,y-8+bob]],'#ebd496',2);
  for(let i=0;i<4;i++){const a=i*Math.PI*.5+t*.3;stone(ctx,x+Math.cos(a)*47,y+Math.sin(a)*12+Math.sin(t+i)*5,17,15,i+5);}
 }
 if(o.element==='wind'){
  for(let ring=0;ring<6;ring++)for(let i=0;i<25;i++){
   const a=i*Math.PI*2/25+t*(1.2+ring*.09),r=12+ring*5;
   ctx.globalAlpha=.3+(Math.sin(a)+1)*.2;pixel(ctx,x+Math.cos(a)*r,y-ring*10+Math.sin(a)*r*.32+bob,6,3,'#91dccc');
  }ctx.globalAlpha=1;
  for(let i=0;i<5;i++){const a=t+i*1.25;pixel(ctx,x+Math.cos(a)*42,y-20+Math.sin(a)*18,5,3,'#a0ae6d');}
 }
 if(o.element==='lightning'){
  polygon(ctx,[[x,y-48+bob],[x-18,y-18+bob],[x,y+17+bob],[x+18,y-18+bob]],'#896bba');polygon(ctx,[[x,y-48+bob],[x,y+17+bob],[x+18,y-18+bob]],'#c7a6ec');stroke(ctx,[[x,y-42+bob],[x-12,y-18+bob],[x,y+10+bob]],'#f1daff',3);
  if(Math.sin(t*5.7+o.seed)>.45)for(const side of [-1,1])stroke(ctx,[[x+side*8,y-27],[x+side*28,y-38],[x+side*21,y-17],[x+side*42,y-8],[x+side*36,y+13]],'#c393ff',2);
 }
}
export function drawObjectEffect(ctx,o,time){
 if(o.kind==='portal')portal(ctx,o,time);
 if(o.kind==='campfire')flame(ctx,o.x,o.y-15,100,time,o.seed);
 if(o.kind==='shrine')shrine(ctx,o,time);
 if(o.torch){pixel(ctx,o.x-9,o.y-67,18,10,'#735039');flame(ctx,o.x,o.y-68,34,time,o.seed);}
 if(o.kind==='pillar')pixel(ctx,o.x-25+Math.sin(time*.65+o.seed)*2,o.y-o.height+90,6,3,'#5b6b50');
 if(o.kind==='lantern'){const a=.18+Math.sin(time*3+o.seed)*.04;ctx.globalAlpha=a;pixel(ctx,o.x-7,o.y-54,14,17,'#fff1bd');ctx.globalAlpha=1;}
}
export function objectLight(ctx,o,t){
 if(o.kind==='campfire'){drawLight(ctx,o.x,o.y-15,310,'#e78738',.85+Math.sin(t*5.3)*.04+Math.sin(t*8)*.03);drawLight(ctx,o.x,o.y-30,110,'#fda745',.6);}
 if(o.kind==='portal'){drawLight(ctx,o.x,o.y-140,255,'#354fea',.9+Math.sin(t*1.5)*.08);drawLight(ctx,o.x,o.y-140,120,'#7161ff',.5);}
 if(o.kind==='shrine')drawLight(ctx,o.x,o.y-65,140,colors[o.element],.5+Math.sin(t*2+o.seed)*.035);
 if(o.torch)drawLight(ctx,o.x,o.y-60,90,'#f69d4e',.6+Math.sin(t*5+o.seed)*.04);
 if(o.kind==='lantern')drawLight(ctx,o.x,o.y-45,65,'#f1ad60',.55);
}
export function drawWaterfalls(ctx,t){
 for(const [x,y,length] of [[230,390,260],[1545,595,275],[495,1140,160],[1270,1160,140]]){
  polygon(ctx,[[x-21,y],[x+20,y-8],[x+12,y+length],[x-19,y+length+12]],'#142e51');
  for(let i=0;i<8;i++){
   const f=(t*.45+i*.121)%1;
   pixel(ctx,x-18+i*5,y+f*length,3,25+i%3*15,i%2?'#30608a':'#234870');
  }
  for(let i=0;i<9;i++)pixel(ctx,x-25+i*6,y+length+Math.sin(t*3+i)*5,5,3,'#406b88');
  drawLight(ctx,x,y+length,50,'#306994',.25);
 }
}
export function ambient(ctx,t,view){
 for(let i=0;i<38;i++){
  const x=240+(i*139.7)%1270+Math.sin(t*.23+i)*18,y=200+(i*97.3)%980+Math.sin(t*.3+i*2)*10;
  if(x<view.left||x>view.right||y<view.top||y>view.bottom)continue;
  ctx.globalAlpha=.16+Math.max(0,Math.sin(t+i*2))*.32;pixel(ctx,x,y,2,2,i%3?'#91bcb5':'#dcbb82');
 }ctx.globalAlpha=1;
 // A few sparse leaf tips shift, leaving the cached vegetation inexpensive.
 for(let i=0;i<30;i++){const x=280+(i*193)%1200,y=350+(i*137)%780;pixel(ctx,x+Math.sin(t*.8+i)*2,y,3,4,'#4a6046');}
}
