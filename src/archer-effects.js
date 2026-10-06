const index=t=>Math.max(0,Math.min(7,Math.floor(t*8+1e-8)));
export function archerChargeFrame(e){
 if(e.health<=0||e.capturedBy)return null;
 if(e.state==='windup'){const duration=e.attackKind==='inferno'?1.15:.8;return {row:0,index:index(1-e.timer/duration)};}
 if(e.state==='archerShot'&&e.timer>.3)return {row:0,index:7};
 return null;
}
export function archerProjectileFrame(h){return {row:h.element==='inferno'?3:1,index:Math.floor(Math.max(0,3.5-h.life)*16+1e-8)%8};}
export function archerImpactFrame(life){return life>0?{row:2,index:index((.5-life)/.5)}:null;}
const frames=[];let loadPromise;
export function loadArcherEffects(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(let row=0;row<4;row++){frames[row]=[];for(let col=0;col<8;col++){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,col*256,row*256,256,256,0,0,128,128);frames[row].push(tile);
   }}resolve();
  };image.onerror=()=>reject(new Error('Ash Archer attack effects could not load'));image.src=new URL('../assets/archer-effects-padded.png',import.meta.url).href;
 });
}
function draw(c,f,x,y,size,anchorX=.5,anchorY=.5){
 const tile=f&&frames[f.row]?.[f.index];if(!tile)return;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(tile,Math.round(x-size*anchorX),Math.round(y-size*anchorY),size,size);c.restore();
}
export function drawArcherCharge(c,e){draw(c,archerChargeFrame(e),(e.facing||1)*24,-37,e.attackKind==='inferno'?104:80);}
export function drawArcherProjectile(c,h){
 c.save();c.translate(h.x,h.y-24);c.rotate(Math.atan2(h.dy,h.dx));
 draw(c,archerProjectileFrame(h),0,0,h.element==='inferno'?184:144,.82,.5);c.restore();
}
export function drawArcherImpact(c,h){draw(c,archerImpactFrame(h.life),h.x,h.y-24,h.element==='inferno'?160:112);}
