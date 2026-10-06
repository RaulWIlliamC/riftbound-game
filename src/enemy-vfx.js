import {drawSeerProjectile,drawSeerImpact,drawSeerShield} from './seer-effects.js';
import {drawArcherProjectile,drawArcherImpact} from './archer-effects.js';
import {drawSlimeSplash,drawSlimePuddle} from './slime-effects.js';
import {ENEMIES} from './enemies.js';
import {drawGuardianShockwave,drawGuardianImpact,drawGuardianRockTrail} from './guardian-effects.js';
import {drawRiftlingAftershock,drawRiftlingImpact} from './riftling-effects.js';
// Effects derive from authoritative timers: no random state, particles or network messages.
const TAU=Math.PI*2;
const clamp=n=>Math.max(0,Math.min(1,n));
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const palettes={mossImp:['#719747','#d1c48d'],runeWisp:['#55cabc','#c4fff0'],mossGuardian:['#a38b62','#dccea2'],riftling:['#9d43fa','#edacff'],guardian:['#d18b43','#fff0bb'],slime:['#5bdf87','#d3ffad'],archer:['#ff5124','#fff3aa'],seer:['#a252ff','#ead5ff'],sentinel:['#34c9ef','#e6ffff']};
function glow(c,x,y,r,color,alpha=.5){
 if(r<=0||alpha<=0)return;c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(.25,color+'99');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
}
function circle(c,x,y,r,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);c.stroke();}
function diamond(c,x,y,size,color){c.fillStyle=color;c.beginPath();c.moveTo(x,y-size);c.lineTo(x+size*.6,y);c.lineTo(x,y+size);c.lineTo(x-size*.6,y);c.closePath();c.fill();}
function rune(c,x,y,r,color,phase=0,progress=1,flat=1){
 c.save();c.translate(x,y);c.scale(1,flat);c.strokeStyle=color;c.lineWidth=1.5;circle(c,0,0,r,color,2);circle(c,0,0,r-7,color+'70',1);
 c.beginPath();c.arc(0,0,r+4,-Math.PI/2,-Math.PI/2+TAU*clamp(progress));c.lineWidth=3;c.stroke();
 for(let i=0;i<8;i++){const a=i/8*TAU+phase;c.save();c.rotate(a);c.strokeStyle=color;c.beginPath();c.moveTo(r-12,-3);c.lineTo(r-5,0);c.lineTo(r-12,3);c.moveTo(r-10,0);c.lineTo(r-16,0);c.stroke();c.restore();}
 c.restore();
}
function sparks(c,x,y,r,count,color,phase,lift=0){
 c.fillStyle=color;for(let i=0;i<count;i++){const a=noise(i+4)*TAU,travel=(phase+noise(i+32))%1,rr=r*travel;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.65-lift*travel;const size=1+noise(i+81)*3;c.globalAlpha=(1-travel)*.8;c.fillRect(Math.round(px),Math.round(py),size,size);}c.globalAlpha=1;
}
function danger(c,x,y,r,color,progress,time,flat=1){
 c.save();c.fillStyle=color+'16';c.beginPath();c.ellipse(x,y,r,r*flat,0,0,TAU);c.fill();rune(c,x,y,r,color,time*.08,progress,flat);
 c.save();c.translate(x,y);c.scale(1,flat);circle(c,0,0,r*(1-.6*progress),color+'55',1);c.restore();c.fillStyle=color;c.globalAlpha=.8;c.fillRect(x-5,y-1,10,2);c.fillRect(x-1,y-5,2,10);c.restore();
}
export function drawAbilityGround(c,world){
 c.save();
 for(const h of world.hazards){
  if(h.source==='mossImp'&&h.kind==='slam'){
   const age=clamp(1-h.life/.5);c.save();c.globalAlpha=1-age;c.strokeStyle='#8b7046';c.lineWidth=3;
   for(let i=0;i<5;i++){const a=i/5*TAU;c.beginPath();c.moveTo(h.x,h.y);c.lineTo(h.x+Math.cos(a)*h.radius*age,h.y+Math.sin(a)*h.radius*age);c.stroke();}
   sparks(c,h.x,h.y,h.radius,8,'#9bac58',age,12);c.restore();continue;
  }
  if(h.source==='guardian'&&h.kind==='slam'){drawGuardianRockTrail(c,h);drawGuardianShockwave(c,h);continue;}
  if(h.source==='riftling'&&h.kind==='impact'){drawRiftlingAftershock(c,h);continue;}
  if(h.kind==='puddle'){drawSlimePuddle(c,h);continue;}
  if(h.kind==='splash'||h.kind==='impact'&&['ember','inferno','rift'].includes(h.element)){continue;}
  if(h.kind==='slam'||h.kind==='splash'||h.kind==='impact'){
   const age=clamp(1-h.life/.5),kind=h.source||(h.kind==='splash'?'slime':h.element==='rune'?'runeWisp':h.element==='rift'?'seer':h.element==='core'?'sentinel':h.kind==='impact'?'archer':'guardian');
   const [color,light]=palettes[kind]||palettes.guardian,r=h.radius;c.save();c.globalAlpha=1-age;
   glow(c,h.x,h.y,r*.9,color,.65);circle(c,h.x,h.y,r*(.3+.7*age),light,5*(1-age)+1);circle(c,h.x,h.y,r*(.1+.8*age),color,3);
   if(kind==='guardian'||kind==='sentinel'){
    for(let i=0;i<10;i++){const a=i/10*TAU+noise(i)*.4;c.strokeStyle=color+'bb';c.lineWidth=2;c.beginPath();c.moveTo(h.x,h.y);for(let j=1;j<=4;j++){const rr=r*j/4,aa=a+(noise(i*9+j)-.5)*.18;c.lineTo(h.x+Math.cos(aa)*rr,h.y+Math.sin(aa)*rr);}c.stroke();}
   }
   for(let i=0;i<22;i++){const a=noise(i+8)*TAU,rr=r*(.15+age)*(.4+noise(i+30)*.6),lift=Math.sin(age*Math.PI)*(kind==='slime'?35:24);const x=h.x+Math.cos(a)*rr,y=h.y+Math.sin(a)*rr*.65-lift;diamond(c,x,y,(1-age)*(kind==='guardian'?5:3)+1,i%3?color:light);}
   c.restore();
  }else if(h.kind==='shieldPulse'){
   const age=clamp(1-h.life/.6);c.save();c.globalAlpha=1-age;rune(c,h.x,h.y,Math.max(12,h.radius*age),'#c58aff',age,1);glow(c,h.x,h.y,h.radius*.5,'#9854e6',.2);c.restore();
  }
 }
 for(const e of world.targets){
  if(e.health<=0||e.capturedBy)continue;
  if(e.kind==='seer')for(const ally of world.targets){
   if(ally===e||ally.health<=0||!ally.shielded||Math.hypot(ally.x-e.x,ally.y-e.y)>=210)continue;
   const sx=e.x,sy=e.y-34,tx=ally.x,ty=ally.y-30,mx=(sx+tx)/2,my=Math.min(sy,ty)-28;
   c.save();c.strokeStyle='#9955e644';c.lineWidth=7;c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(mx,my,tx,ty);c.stroke();c.strokeStyle='#d4aaffbb';c.lineWidth=1.5;c.stroke();
   for(let i=0;i<3;i++){const p=((e.clock||0)*.5+i/3)%1,q=1-p;diamond(c,q*q*sx+2*q*p*mx+p*p*tx,q*q*sy+2*q*p*my+p*p*ty,3,'#f0d8ff');}c.restore();
  }
  const casting=e.state==='windup'||['slam','slimeAttack','archerShot','seerCast','ruinsAttack'].includes(e.state)&&!e.slamResolved;
  if(!casting)continue;
  const duration=e.kind==='archer'&&e.attackKind==='inferno'?1.15:ENEMIES[e.kind].windup;
  const p=e.state==='windup'?clamp(1-e.timer/duration):1,time=e.clock||0,[color]=palettes[e.kind];
  if(e.kind==='mossImp'||e.kind==='mossGuardian')danger(c,e.aimPoint.x,e.aimPoint.y,ENEMIES[e.kind].slamRadius,color,p,time,world.groundScale||1);
  else if(e.kind==='guardian'||e.kind==='sentinel'&&e.attackKind!=='blast')danger(c,e.aimPoint.x,e.aimPoint.y,e.kind==='sentinel'?115:ENEMIES.guardian.slamRadius,color,p,time,world.groundScale||1);
  else if(e.kind==='seer'&&e.attackKind==='shield')rune(c,e.x,e.y,210,'#a981d5',time*.12,p);
  else if(e.kind==='slime'&&e.attackKind==='puddle')danger(c,e.x,e.y,ENEMIES.slime.puddleRadius,color,p,time);
  else{
   const dx=e.aimPoint.x-e.x,dy=e.aimPoint.y-e.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
   c.save();c.translate(e.x,e.y);c.rotate(a);c.strokeStyle=color+'80';c.lineWidth=e.kind==='sentinel'?3:1.5;c.setLineDash([12,8]);c.lineDashOffset=-time*18;c.beginPath();c.moveTo(12,0);c.lineTo(d,0);c.stroke();c.setLineDash([]);
   for(let i=0;i<3;i++){const x=d*.3+i*24;c.strokeStyle=color;c.beginPath();c.moveTo(x-7,-5);c.lineTo(x,0);c.lineTo(x-7,5);c.stroke();}c.restore();
   if(e.kind==='riftling')danger(c,e.aimPoint.x,e.aimPoint.y,20,color,p,time);
   if(e.kind==='slime')danger(c,e.aimPoint.x,e.aimPoint.y,55,color,p,time);
  }
 }
 c.restore();
}
// Called in the enemy's local ground coordinates, after its sprite is drawn.
export function drawAbilityAura(c,e){
 if(e.health<=0||e.capturedBy)return;
 const t=e.clock||0,[color,light]=palettes[e.kind];c.save();
 if(e.shielded)drawSeerShield(c,e);
 const charging=e.state==='windup',active=['pounce','slam','slimeAttack','archerShot','seerCast'].includes(e.state);
 if((charging||active)&&!['riftling','guardian','slime','archer','seer'].includes(e.kind)){
  const duration=e.kind==='archer'&&e.attackKind==='inferno'?1.15:({riftling:.48,guardian:.95,slime:.7,archer:.8,seer:.95,sentinel:1.25}[e.kind]);
  const p=charging?clamp(1-e.timer/duration):1;
  c.globalCompositeOperation='lighter';
  if(e.kind==='archer'||e.kind==='seer'){
   const x=(e.facing||1)*24,y=-37;glow(c,x,y,20+p*18,color,.3+p*.4);sparks(c,x,y,26,10,light,t*1.8,8);
   if(e.kind==='seer') {circle(c,x,y,10+p*6,color,1);diamond(c,x,y,4+p*3,light);}
   else for(let i=0;i<4;i++){const phase=(t*2+i/4)%1;diamond(c,x+(noise(i)-.5)*14,y-phase*27,4*(1-phase),i%2?color:light);}
  }else if(e.kind==='guardian')sparks(c,0,-8,40,13,light,t*.7,18);
  else if(e.kind==='slime'){glow(c,0,-12,38,color,.2+p*.25);sparks(c,0,-5,40,14,light,t*.8,20);}
  else if(e.kind==='sentinel'){glow(c,0,-58,70,color,.3+p*.35);sparks(c,0,-60,70,22,light,t,50);rune(c,0,-60,28+p*10,color,-t,1);}
  else {glow(c,0,-22,32,color,.35);sparks(c,0,-20,27,9,light,t*2,12);}
 }
 if(e.kind==='seer')sparks(c,0,-20,25,7,'#d69cff',t*.3,30);
 if(e.kind==='sentinel'&&e.state==='exposed'){
  c.globalCompositeOperation='lighter';for(const [x,y,col] of [[5,-79,'#6ff2ff'],[-24,-98,'#ffd174'],[43,-98,'#d998ff']]){
   glow(c,x,y,27+Math.sin(t*8)*5,col,.65);c.strokeStyle=col+'88';c.lineWidth=1.5;circle(c,x,y,13+Math.sin(t*5)*2,col+'bb',1);sparks(c,x,y,20,10,col,t*.7,55);
   const g=c.createLinearGradient(0,y,0,y-100);g.addColorStop(0,col+'88');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(x-3,y-100,6,100);
  }
 }
 c.restore();
}
export function drawAbilityProjectiles(c,world){
 c.save();c.globalCompositeOperation='lighter';
 for(const h of world.hazards){
  if(h.kind==='splash'){c.save();c.globalCompositeOperation='source-over';drawSlimeSplash(c,h);c.restore();continue;}
  if(h.source==='guardian'&&h.kind==='slam'){c.save();c.globalCompositeOperation='source-over';drawGuardianImpact(c,h);c.restore();continue;}
  if(h.source==='riftling'&&h.kind==='impact'){c.save();c.globalCompositeOperation='source-over';drawRiftlingImpact(c,h);c.restore();continue;}
  if(h.kind==='impact'&&['ember','inferno'].includes(h.element)){c.save();c.globalCompositeOperation='source-over';drawArcherImpact(c,h);c.restore();continue;}
  if(h.kind==='impact'&&h.element==='rift'){c.save();c.globalCompositeOperation='source-over';drawSeerImpact(c,h);c.restore();continue;}
  if(h.kind!=='projectile')continue;
  if(h.element==='rift'){c.save();c.globalCompositeOperation='source-over';drawSeerProjectile(c,h);c.restore();continue;}
  if(['ember','inferno'].includes(h.element)){c.save();c.globalCompositeOperation='source-over';drawArcherProjectile(c,h);c.restore();continue;}
  const fire=h.element==='ember'||h.element==='inferno',charged=h.element==='inferno',core=h.element==='core';
  const color=fire?'#ff6127':h.element==='rune'?'#55cabc':core?'#48dafa':'#b75dff',light=fire?'#fff2a3':h.element==='rune'?'#c4fff0':core?'#efffff':'#f2d8ff',time=3.5-h.life;
  c.save();c.translate(h.x,h.y-24);c.rotate(Math.atan2(h.dy,h.dx));
  const length=charged?90:fire?55:core?65:45,r=charged?22:core?20:14;
  glow(c,0,0,r*2,color,.65);
  const g=c.createLinearGradient(-length,0,12,0);g.addColorStop(0,color+'00');g.addColorStop(.7,color+'99');g.addColorStop(1,light);c.fillStyle=g;
  c.beginPath();c.moveTo(12,0);c.quadraticCurveTo(-15,-r*.6,-length,0);c.quadraticCurveTo(-15,r*.6,12,0);c.fill();
  for(let i=0;i<12;i++){const phase=(time*2.5+noise(i))%1;diamond(c,-phase*length,(noise(i+8)-.5)*r*2*(phase+.2),3*(1-phase)+.5,i%3?color:light);}
  if(fire){c.strokeStyle=light;c.lineWidth=2.5;c.beginPath();c.moveTo(-30,0);c.lineTo(12,0);c.stroke();diamond(c,6,0,7,light);}
  else {diamond(c,0,0,core?12:8,light);c.save();c.scale(1,.6);circle(c,0,0,r,color,2);c.rotate(time*6);c.strokeStyle=light;c.beginPath();c.arc(0,0,r+5,0,Math.PI*1.3);c.stroke();c.restore();}
  c.restore();
 }
 c.restore();
}
