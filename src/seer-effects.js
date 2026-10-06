const index=t=>Math.max(0,Math.min(7,Math.floor(t*8+1e-8)));
export function seerChargeFrame(e){
 if(e.health<=0||e.capturedBy)return null;
 if(e.state==='windup')return {row:0,index:index(1-e.timer/.95)};
 if(e.state==='seerCast'&&e.timer>.3)return {row:0,index:7};
 return null;
}
export function seerProjectileFrame(life){return {row:1,index:Math.floor(Math.max(0,3.5-life)*16+1e-8)%8};}
export function seerImpactFrame(life){return life>0?{row:2,index:index((.5-life)/.5)}:null;}
export function seerShieldFrame(e){return e.health>0&&e.shielded?{row:3,index:Math.floor((e.clock||0)*8)%8}:null;}
const frames=[];let loadPromise;
export function loadSeerEffects(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(let row=0;row<4;row++){frames[row]=[];for(let col=0;col<8;col++){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,col*256,row*256,256,256,0,0,128,128);frames[row].push(tile);
   }}resolve();
  };image.onerror=()=>reject(new Error('Rift Seer attack effects could not load'));image.src=new URL('../assets/seer-effects-padded.png',import.meta.url).href;
 });
}
function draw(c,f,x,y,size,anchorX=.5,anchorY=.5){
 const tile=f&&frames[f.row]?.[f.index];if(!tile)return;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(tile,Math.round(x-size*anchorX),Math.round(y-size*anchorY),size,size);c.restore();
}
export function drawSeerCharge(c,e){draw(c,seerChargeFrame(e),(e.facing||1)*24,-37,100);}
export function drawSeerProjectile(c,h){
 c.save();c.translate(h.x,h.y-24);c.rotate(Math.atan2(h.dy,h.dx));draw(c,seerProjectileFrame(h.life),0,0,150,.82,.5);c.restore();
}
export function drawSeerImpact(c,h){draw(c,seerImpactFrame(h.life),h.x,h.y-24,128);}
export function drawSeerShield(c,e){
 const f=seerShieldFrame(e);if(!f)return;
 const height={riftling:76,guardian:174,slime:90,archer:106,seer:106,sentinel:160}[e.kind]||90;
 const size=height*256/160,y=-height*.43;
 // Keep the protection readable: faint interior, bright rim around the creature.
 c.save();c.beginPath();c.ellipse(0,y,size*.28,size*.34,0,0,Math.PI*2);c.clip();
 c.globalAlpha=.12;draw(c,f,0,y,size);
 c.beginPath();c.ellipse(0,y,size*.28,size*.34,0,0,Math.PI*2);
 c.ellipse(0,y,size*.21,size*.25,0,0,Math.PI*2);c.clip('evenodd');
 c.globalAlpha=.8;draw(c,f,0,y,size);c.restore();
}
