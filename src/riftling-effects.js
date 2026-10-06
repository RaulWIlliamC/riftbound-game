// Four rows of eight effects in the approved padded atlas. Timers come from combat.
const index=t=>Math.max(0,Math.min(7,Math.floor(t*8+1e-8)));
export function riftlingEffectFrame(e){
 if(e.health<=0||e.capturedBy)return null;
 if(e.state==='windup')return {row:0,index:index((.48-e.timer)/.48)};
 if(e.state==='pounce')return {row:1,index:index((.32-e.timer)/.32)};
 return null;
}
export function riftlingImpactFrames(life){
 if(life<=0)return null;const age=Math.max(0,.5-life);
 return {impact:{row:2,index:index(age/.5)},aftershock:age<.1?null:{row:3,index:index((age-.1)/.4)}};
}
const frames=[];let loadPromise;
export function loadRiftlingEffects(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(let row=0;row<4;row++){frames[row]=[];for(let col=0;col<8;col++){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,col*256,row*256,256,256,0,0,128,128);frames[row].push(tile);
   }}resolve();
  };image.onerror=()=>reject(new Error('Riftling attack effects could not load'));image.src=new URL('../assets/riftling-effects-padded.png',import.meta.url).href;
 });
}
function draw(c,frame,x,y,size,anchorX=.5,anchorY=.5){
 const tile=frame&&frames[frame.row]?.[frame.index];if(!tile)return;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(tile,Math.round(x-size*anchorX),Math.round(y-size*anchorY),size,size);c.restore();
}
// Behind the creature, with the trail tip anchored to its body rather than its tail.
export function drawRiftlingChargeTrail(c,e){
 const frame=riftlingEffectFrame(e);if(!frame)return;
 c.save();c.translate(0,-24);
 if(frame.row===1){
  const dx=e.aimPoint.x-e.x,dy=e.aimPoint.y-e.y,angle=Math.hypot(dx,dy)>1?Math.atan2(dy,dx):e.facing<0?Math.PI:0;
  c.rotate(angle);draw(c,frame,10,0,176,.84,.5);
 }else {c.globalAlpha=.8;draw(c,frame,-(e.facing||1)*8,-6,100);}
 c.restore();
}
export function drawRiftlingAftershock(c,h){const f=riftlingImpactFrames(h.life);if(f?.aftershock)draw(c,f.aftershock,h.x,h.y,144);}
export function drawRiftlingImpact(c,h){
 const f=riftlingImpactFrames(h.life);if(!f)return;c.save();c.translate(h.x,h.y-24);c.rotate(h.angle||0);draw(c,f.impact,0,0,144);c.restore();
}
