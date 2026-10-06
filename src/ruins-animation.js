import {ENEMIES} from './enemies.js';

export const RUINS_KINDS=['mossImp','runeWisp','mossGuardian'];
const paths={mossImp:'moss-imp',runeWisp:'rune-wisp',mossGuardian:'moss-guardian'};
// World pixels traveled per full cycle; slowing/displacement cannot speed up feet.
export const RUINS_STRIDES={mossImp:38,runeWisp:68,mossGuardian:28};
const sprites=new Map();
let loading;

// Original idle/action poses, followed by six dedicated travel frames (8–13).
// Attack contact uses pose 5 at the same authoritative timer as combat damage.
export function ruinsAnimationFrame(e){
 if(e.health<=0)return (e.deathTime||0)>=.9?null:7;
 if(e.flash>0)return 6;
 if(!e.capturedBy){
  if(e.state==='windup')return 4;
  if(e.state==='ruinsAttack')return e.timer>.3?4:5;
  if(e.state==='recover')return 5;
  if(e.moving)return 8+Math.floor((e.moveClock||0)*ENEMIES[e.kind].speed/RUINS_STRIDES[e.kind]*6)%6;
 }
 return Math.floor((e.clock||0)*3)%2;
}

export function loadRuinsSprites(){
 return loading??=Promise.all(RUINS_KINDS.map(async kind=>{
  const frames=[];
  await Promise.all([
   loadSheet(kind,frames,'animations',8,4,0),
   loadSheet(kind,frames,'movement',6,3,8)
  ]);
  sprites.set(kind,frames);
 }));
}

function loadSheet(kind,frames,suffix,count,columns,offset){
 return new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>{
   for(let i=0;i<count;i++){
    const frame=document.createElement('canvas');frame.width=frame.height=64;
    frame.getContext('2d').drawImage(image,(i%columns)*64,Math.floor(i/columns)*64,64,64,0,0,64,64);
    frames[offset+i]=frame;
   }
   resolve();
  };
  image.onerror=()=>reject(new Error(`${ENEMIES[kind].name} ${suffix} sheet could not load`));
  image.src=new URL(`../assets/${paths[kind]}-${suffix}.png`,import.meta.url).href;
 });
}

export function drawRuinsEnemy(ctx,e){
 const index=ruinsAnimationFrame(e),body=index===null?null:sprites.get(e.kind)?.[index];
 if(!body)return;
 ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));
 if(e.stoneEnclosed)ctx.scale(e.stoneEnclosed,e.stoneEnclosed);
 ctx.fillStyle='#12131c99';ctx.fillRect(-e.radius-3,-2,e.radius*2+6,5);
 const floating=e.kind==='runeWisp';
 // Grounded walk poses carry their own weight shift; avoid an extra bouncing layer.
 const bob=e.health<=0?0:floating?Math.round(Math.sin(e.clock*2.4)*(e.moving?.7:1.5))-6:0;
 ctx.translate(0,-(e.lift||0)+bob);
 if(e.health<=0)ctx.globalAlpha=Math.max(0,1-(e.deathTime||0)/.9);
 ctx.save();ctx.scale(e.facing||1,1);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(body,-64,-120,128,128);ctx.restore();
 if(e.wetTime>0){ctx.fillStyle='#75c7d5';for(let i=0;i<3;i++)ctx.fillRect(-10+i*10,-28+Math.round((e.clock*13+i*8)%24),2,4);}
 if(e.burnTime>0){ctx.fillStyle='#e8a267';for(let i=0;i<3;i++)ctx.fillRect(-10+i*10,-12-Math.round((e.clock*20+i*7)%18),3,5);}
 if(e.shielded){ctx.strokeStyle='#a981d5';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-25,e.radius+8,34,0,0,Math.PI*2);ctx.stroke();}
 if(e.health>0){
  ctx.fillStyle='#181724';ctx.fillRect(-22,9,44,5);
  ctx.fillStyle=e.shielded?'#9273b9':'#a55765';ctx.fillRect(-21,10,42*e.health/e.maxHealth,3);
 }
 ctx.restore();
}
