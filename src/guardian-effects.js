import {ENEMIES} from './enemies.js';
// Four rows of eight effects in the approved padded atlas. Timers come from combat.
const index=t=>Math.max(0,Math.min(7,Math.floor(t*8+1e-8)));
export function guardianEffectFrame(e){
 if(e.health<=0||e.capturedBy)return null;
 if(e.state==='windup')return {row:0,index:index((.95-e.timer)/.95)};
 if(e.state==='slam')return {row:1,index:index((.6-e.timer)/.6)};
 return null;
}
export function guardianImpactFrames(life){
 if(life<=0)return null;const age=Math.max(0,.5-life);
 return {impact:{row:2,index:index(age/.5)},shockwave:age<.1?null:{row:3,index:index((age-.1)/.4)}};
}
const frames=[];let loadPromise;
export function loadGuardianEffects(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(let row=0;row<4;row++){frames[row]=[];for(let col=0;col<8;col++){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,col*256,row*256,256,256,0,0,128,128);frames[row].push(tile);
   }}resolve();
  };image.onerror=()=>reject(new Error('Guardian attack effects could not load'));image.src=new URL('../assets/guardian-effects-padded.png',import.meta.url).href;
 });
}
function draw(c,frame,x,y,size,anchorX=.5,anchorY=.5){
 const tile=frame&&frames[frame.row]?.[frame.index];if(!tile)return;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(tile,Math.round(x-size*anchorX),Math.round(y-size*anchorY),size,size);c.restore();
}
// Hammer head positions follow the six supplied overhead preparation poses.
const hammerHeads=[[-45,-23],[-48,-63],[-28,-82],[-42,-103],[-50,-93],[-42,-107]];
export function drawGuardianHammerEffect(c,e){
 const frame=guardianEffectFrame(e);if(!frame)return;c.save();c.scale(e.facing||1,1);
 if(frame.row===0){const pose=Math.max(0,Math.min(5,Math.floor((.95-e.timer)/(.95/6))));const [x,y]=hammerHeads[pose];draw(c,frame,x,y,96);}
 else draw(c,frame,26,-52,208);
 c.restore();
}
// Peak visible widths in the 256px padded atlas: impact 161px, fracture 163px.
// Match visible artwork to the damage diameter; preserve growth across frames.
export function drawGuardianShockwave(c,h){const f=guardianImpactFrames(h.life);if(f?.shockwave)draw(c,f.shockwave,h.x,h.y,(h.radius??ENEMIES.guardian.slamRadius)*2*256/163);}
export function drawGuardianImpact(c,h){const f=guardianImpactFrames(h.life);if(f)draw(c,f.impact,h.x,h.y,(h.radius??ENEMIES.guardian.slamRadius)*2*256/161,.5,.69);}

// A quick ground rupture links the saved hammer contact to the locked attack target.
export function drawGuardianRockTrail(c,h){
 if(!h.origin||h.life<=0)return;
 const age=Math.max(0,.5-h.life),dx=h.x-h.origin.x,dy=h.y-h.origin.y,d=Math.hypot(dx,dy);
 const count=Math.max(2,Math.ceil(d/12)),nx=d?-dy/d:0,ny=d?dx/d:0;
 c.save();
 for(let i=0;i<=count;i++){
  const t=i/count,local=age-t*.08;if(local<0)continue;
  const fade=Math.max(0,1-local/.42),rise=Math.min(1,local/.035+.25),offset=i===0||i===count?0:Math.sin(i*2.4)*5;
  const x=h.origin.x+dx*t+nx*offset,y=h.origin.y+dy*t+ny*offset;
  const size=7+(i%3)*2,lift=Math.sin(Math.min(1,local/.3)*Math.PI)*8;
  c.globalAlpha=fade;c.fillStyle='#302a25';c.beginPath();c.ellipse(x,y,size+4,4,0,0,Math.PI*2);c.fill();
  // Amber fissure under angular stone chunks, matching the existing earth impact.
  c.strokeStyle='#edb86c';c.lineWidth=3;c.beginPath();c.moveTo(x-nx*9,y-ny*9);c.lineTo(x+nx*9,y+ny*9);c.stroke();
  const top=y-size*rise-lift;
  c.fillStyle='#73634f';c.beginPath();c.moveTo(x-size,y-lift);c.lineTo(x-size*.7,top-3);c.lineTo(x+size*.2,top-7);c.lineTo(x+size,top);c.lineTo(x+size*.8,y-lift+3);c.closePath();c.fill();
  c.fillStyle='#ba9a6a';c.beginPath();c.moveTo(x-size*.7,top-3);c.lineTo(x+size*.2,top-7);c.lineTo(x+size,top);c.lineTo(x,top+3);c.closePath();c.fill();
  c.fillStyle='#4c4136';c.beginPath();c.moveTo(x,top+3);c.lineTo(x+size,top);c.lineTo(x+size*.8,y-lift+3);c.lineTo(x,y-lift);c.closePath();c.fill();
  c.fillStyle='#d6b27a';c.fillRect(Math.round(x-size-4),Math.round(y-lift-5-local*12),3,3);
 }
 c.restore();
}
