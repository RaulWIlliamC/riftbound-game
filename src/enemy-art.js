import {loadSeerEffects,drawSeerCharge} from './seer-effects.js';
import {loadArcherEffects,drawArcherCharge} from './archer-effects.js';
import {loadSlimeEffects,drawSlimeChargeTrail} from './slime-effects.js';
import {loadGuardianEffects,drawGuardianHammerEffect} from './guardian-effects.js';
import {loadRiftlingEffects,drawRiftlingChargeTrail} from './riftling-effects.js';
import {drawAbilityGround,drawAbilityAura,drawAbilityProjectiles} from './enemy-vfx.js?v=progression-1';
import {seerAnimationFrame,getSeerSprite,loadSeerSprites} from './seer-animation.js';
import {archerAnimationFrame,getArcherSprite,loadArcherSprites} from './archer-animation.js';
import {slimeAnimationFrame,getSlimeSprite,loadSlimeSprites} from './slime-animation.js';
import {guardianAnimationFrame,getGuardianSprite,loadGuardianSprites} from './guardian-animation.js';
import {riftlingAnimationFrame,getRiftlingSprite,loadRiftlingSprites} from './enemy-animation.js';
import {ENEMIES,WAVE_NAMES} from './enemies.js';
import {RUINS_KINDS,loadRuinsSprites,drawRuinsEnemy} from './ruins-animation.js';
// Individual alpha bounds keep weapons and silhouettes intact when importing the atlas.
export const ENEMY_FRAMES={
 riftling:{x:119,y:157,w:306,h:286,height:48,anchor:.57},
 guardian:{x:549,y:114,w:403,h:326,height:96,anchor:.41},
 slime:{x:1100,y:213,w:310,h:228,height:48,anchor:.5},
 archer:{x:138,y:600,w:322,h:318,height:72,anchor:.38},
 seer:{x:608,y:569,w:274,h:341,height:72,anchor:.52},
 sentinel:{x:994,y:496,w:482,h:433,height:136,anchor:.52}
};
const cache=new Map();let spritePromise;
export function loadEnemySprites(){
 return spritePromise??=Promise.all([loadRuinsSprites(),loadSeerEffects(),loadArcherEffects(),loadSlimeEffects(),loadGuardianEffects(),loadRiftlingEffects(),loadRiftlingSprites(),loadGuardianSprites(),loadSlimeSprites(),loadArcherSprites(),loadSeerSprites(),new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(const [kind,f] of Object.entries(ENEMY_FRAMES)){
    if(['riftling','guardian','slime','archer','seer'].includes(kind))continue;
    const canvas=document.createElement('canvas');canvas.height=Math.round(f.height/2);canvas.width=Math.round(f.w/f.h*canvas.height);
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.drawImage(image,f.x,f.y,f.w,f.h,0,0,canvas.width,canvas.height);cache.set(kind,canvas);
   }resolve();
  };image.onerror=()=>reject(new Error('Enemy sprite atlas could not load'));image.src=new URL('../assets/enemy-sprites-simple.png',import.meta.url).href;
 })]);
}
export function drawEnemy(ctx,e){
 if(RUINS_KINDS.includes(e.kind)){drawRuinsEnemy(ctx,e);return;}
 if(e.health<=0&&!['riftling','guardian','slime','archer','seer'].includes(e.kind))return;
 const guardian=e.kind==='guardian',riftling=e.kind==='riftling',slime=e.kind==='slime',archer=e.kind==='archer',seer=e.kind==='seer',animated=guardian||riftling||slime||archer||seer;
 const frame=animated?{anchor:.5}:ENEMY_FRAMES[e.kind],body=guardian?getGuardianSprite(guardianAnimationFrame(e)):riftling?getRiftlingSprite(riftlingAnimationFrame(e)):slime?getSlimeSprite(slimeAnimationFrame(e)):archer?getArcherSprite(archerAnimationFrame(e)):seer?getSeerSprite(seerAnimationFrame(e)):cache.get(e.kind);if(!body)return;
 const width=body.width*2,height=body.height*2;
 ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));if(e.stoneEnclosed)ctx.scale(e.stoneEnclosed,e.stoneEnclosed);
 ctx.fillStyle='#12131cc0';ctx.fillRect(-e.radius-5,-3,e.radius*2+10,7);
 const motion=e.state==='pounce'||e.state==='leap',bob=animated?0:e.kind==='seer'?Math.sin(e.clock*2)*3:motion?-9:Math.sin(e.clock*4)*1;
 ctx.translate(0,-(e.lift||0)+bob);

 if(slime)drawSlimeChargeTrail(ctx,e);
 if(riftling)drawRiftlingChargeTrail(ctx,e);
 ctx.save();ctx.scale(e.facing||1,1);if(!animated&&e.state==='windup')ctx.translate(-2,0);
 ctx.imageSmoothingEnabled=false;
 // Wind-up / recovery lean and a small lift communicate weight without stretchy poses.
 const lean=animated?0:e.state==='windup'?-.055:e.state==='recover'?.045:0;
 ctx.save();ctx.rotate(lean);ctx.drawImage(body,-width*frame.anchor,guardian?-184:slime||archer||seer?-120:-height,width,height);ctx.restore();
 if(!animated&&e.state==='windup'&&e.kind==='seer'){
  ctx.fillStyle=e.kind==='archer'?'#f8ce91':'#c5a0ef';ctx.fillRect(width*.23,-height*.48,4,4);
 }
 if(e.kind==='sentinel'&&e.state==='exposed'){
  for(const [x,y,col] of [[width*.08,-height*.58,'#92e6e9'],[-width*.165,-height*.72,'#f4cd79'],[width*.31,-height*.72,'#ca97eb']]){ctx.fillStyle=col+'35';ctx.fillRect(x-11,y-10,22,22);ctx.fillStyle=col;ctx.fillRect(x-6,y-6,12,13);ctx.fillStyle='#fff5df';ctx.fillRect(x-2,y-3,4,6);}
 }
 ctx.restore();
 if(e.flash>0&&!animated){ctx.globalAlpha=e.flash/.18*.5;ctx.fillStyle='#fff0d0';ctx.fillRect(-e.radius,-height*.5,e.radius*2,3);ctx.globalAlpha=1;}
 if(e.wetTime>0){ctx.fillStyle='#75c7d5';for(let i=0;i<3;i++)ctx.fillRect(-e.radius+i*e.radius,Math.round(-25+((e.clock*13+i*8)%24)),2,4);}
 if(e.burnTime>0){ctx.fillStyle='#e8a267';for(let i=0;i<3;i++)ctx.fillRect(-10+i*10,-13-Math.round((e.clock*20+i*7)%18),3,5);}
 if(seer)drawSeerCharge(ctx,e);
 if(archer)drawArcherCharge(ctx,e);
 if(guardian)drawGuardianHammerEffect(ctx,e);
 drawAbilityAura(ctx,e);
 if(e.health>0){ctx.fillStyle='#181724';ctx.fillRect(-22,9,44,5);ctx.fillStyle=e.shielded?'#9273b9':e.kind==='sentinel'&&e.state==='exposed'?'#6abfc3':'#a55765';ctx.fillRect(-21,10,42*e.health/e.maxHealth,3);}
 ctx.restore();
}
export function drawEnemyGround(ctx,world){drawAbilityGround(ctx,world);}
export function drawEnemyProjectiles(ctx,world){drawAbilityProjectiles(ctx,world);}
export function drawEncounterHud(ctx,world,width){
 ctx.save();const top=width<800?148:60;ctx.translate(0,top-60);ctx.textAlign='center';ctx.font='12px monospace';ctx.fillStyle='#c6bacd';
 const label=world.complete?'RIFT CLEARED · RETURN TO SANCTUARY':world.intro>0?`WAVE ${world.wave+1} / ${WAVE_NAMES.length} · ${WAVE_NAMES[world.wave]}`:`WAVE ${world.wave+1} / ${WAVE_NAMES.length} · ${world.targets.filter(e=>e.health>0).length} ENEMIES`;
 ctx.fillStyle='#151523d9';ctx.fillRect(width/2-215,60,430,32);ctx.fillStyle='#c6bacd';ctx.fillText(label,width/2,81);
 const boss=world.targets.find(e=>e.kind==='sentinel'&&e.health>0);
 if(boss){ctx.fillStyle='#171623';ctx.fillRect(width/2-180,101,360,7);ctx.fillStyle=boss.state==='exposed'?'#7fced4':'#a56472';ctx.fillRect(width/2-179,102,358*boss.health/boss.maxHealth,5);ctx.font='10px monospace';ctx.fillStyle=boss.state==='exposed'?'#a3e2e4':'#bcb1c4';ctx.fillText(boss.state==='exposed'?'CORES EXPOSED · ELEMENTAL DAMAGE +60%':'BROKEN SENTINEL',width/2,125);}
 ctx.restore();
}
