const index=t=>Math.max(0,Math.min(7,Math.floor(t*8+1e-8)));
export function slimeEffectFrame(e){
 if(e.health<=0||e.capturedBy)return null;
 if(e.state==='windup')return {row:0,index:index((.7-e.timer)/.7)};
 if(e.state==='slimeAttack'&&e.attackKind==='bash')return {row:1,index:index((.6-e.timer)/.6)};
 return null;
}
export function slimeSplashFrame(life){return life>0?{row:2,index:index((.5-life)/.5)}:null;}
export function slimePuddleFrame(life){return life>0?{row:3,index:Math.floor(Math.max(0,5-life)*8+1e-8)%8}:null;}
const frames=[];let loadPromise;
export function loadSlimeEffects(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(let row=0;row<4;row++){frames[row]=[];for(let col=0;col<8;col++){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,col*256,row*256,256,256,0,0,128,128);frames[row].push(tile);
   }}resolve();
  };image.onerror=()=>reject(new Error('Bog Slime attack effects could not load'));image.src=new URL('../assets/slime-effects-v2-padded.png',import.meta.url).href;
 });
}
function draw(c,frame,x,y,size,anchorX=.5,anchorY=.5){
 const tile=frame&&frames[frame.row]?.[frame.index];if(!tile)return;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(tile,Math.round(x-size*anchorX),Math.round(y-size*anchorY),size,size);c.restore();
}
// Local enemy coordinates: the ribbon trails behind its moving body.
export function drawSlimeChargeTrail(c,e){
 const f=slimeEffectFrame(e);if(!f)return;c.save();
 if(f.row===0)draw(c,f,0,-9,150,.5,.78);
 else{
  const dx=e.aimPoint.x-e.x,dy=e.aimPoint.y-e.y;
  c.translate(0,-12);c.rotate(Math.hypot(dx,dy)>1?Math.atan2(dy,dx):e.facing<0?Math.PI:0);
  draw(c,f,16,0,180,.78,.5);
 }
 c.restore();
}
export function drawSlimeSplash(c,h){draw(c,slimeSplashFrame(h.life),h.x,h.y,h.radius*2*256/166,.5,.77);}
export function drawSlimePuddle(c,h){
 const f=slimePuddleFrame(h.life);if(!f)return;
 c.save();c.globalAlpha=.85*Math.min(1,h.life/.4);
 // New artwork is already a circular pool viewed from above; keep its proportions.
 draw(c,f,h.x,h.y,h.radius*2*256/150,.5,121/256);c.restore();
}
