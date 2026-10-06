import {FIRST_SPELL_DAMAGE} from './balance.js?v=progression-1';
// One refreshing status shared by all lightning damage paths.
export const WET={duration:4,movementMultiplier:.75,lightningMultiplier:1.25};
export function applyWet(target,context){target.wetTime=WET.duration*(context?.mods?.status||1);target.wetSlow=context?.mods?.enhancement?.wetSlow||.25;}
export function targetMovementScale(target){return Math.min(target.slowEffectTime>0?(target.slowEffectScale||.85):1,target.wetTime>0?1-(target.wetSlow||.25):1);}
export function dealDamage(target,amount,element,context){
 const mods=context?.mods||{};
 amount*=mods.damage||1;
  if(mods.conductive&&element==='lightning'&&target.wetTime>0){context.conducted??=new Set();if(!context.conducted.has(target.id)){target.wetTime+=mods.conductive;context.conducted.add(target.id);}}
 const special=mods.enhancement||{};
 if(!context?.dot){
  if(special.burn){target.burnTime=special.burn.duration*(mods.status||1);target.burnDps=special.burn.dps*(mods.damage||1);target.burnContext={...context,dot:true,mods:{...mods,damage:1}};}
  if(special.wet)applyWet(target,context);
  if(special.slow){target.slowEffectTime=special.slow.duration;target.slowEffectScale=special.slow.scale;}
  if(special.wetExtend&&target.wetTime>0){context.extended??=new Set();if(!context.extended.has(target.id)){target.wetTime+=special.wetExtend;context.extended.add(target.id);}}
  if(special.pushSpeed&&!target.captureImmune){target.velocity={x:Math.cos(context.aim||0)*special.pushSpeed,y:Math.sin(context.aim||0)*special.pushSpeed};}
 }

 const shield=target.shieldSource&&target.shieldSource.health>0&&!target.shieldSource.capturedBy&&Math.hypot(target.x-target.shieldSource.x,target.y-target.shieldSource.y)<210;
 const exposed=target.kind==='sentinel'&&target.state==='exposed'&&element&&element!=='neutral';
 const damage=Math.round(amount*(element==='lightning'&&target.wetTime>0?WET.lightningMultiplier:1)*(shield ? .4 : 1)*(exposed?1.6:1));
 if(context?.ownerId&&target.health>0){target.participants??={};target.participants[context.ownerId]=(target.participants[context.ownerId]||0)+Math.min(target.health,damage);}
 target.health=Math.max(0,target.health-damage);target.flash=.18;return damage;
}
// Swept path checks catch targets between frames, including fast projectiles.
export function segmentDistanceSquared(point,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length)):0;
 return (point.x-a.x-dx*t)**2+(point.y-a.y-dy*t)**2;
}
export const FIRST_HITS={earth:{mode:'area',radius:62,damage:FIRST_SPELL_DAMAGE},lightning:{mode:'area',radius:56,damage:FIRST_SPELL_DAMAGE},fire:{mode:'path',radius:19,damage:FIRST_SPELL_DAMAGE},water:{mode:'path',radius:14,damage:FIRST_SPELL_DAMAGE},wind:{mode:'path',radius:44,damage:FIRST_SPELL_DAMAGE}};
export function damageSpell(effect,targets){
 const rule=FIRST_HITS[effect.element];if(!rule)return;
 const a=effect.previous||effect,b=effect;
 if(rule.mode==='area'&&(effect.age<.16||effect.areaResolved))return;
 effect.hitTargets??=new Set();
 for(const target of targets){
  if(target.health<=0||effect.hitTargets.has(target.id))continue;
  let distance;
  if(rule.mode==='area')distance=(target.x-effect.x)**2+(target.y-effect.y)**2;
  else if(effect.element==='fire'){
   if((effect.previousAge||0)>=.16)continue;
   const progress=Math.min(1,effect.age/.16),before=Math.min(1,(effect.previousAge||0)/.16);
   const from={x:effect.origin.x+(effect.x-effect.origin.x)*before,y:effect.origin.y+(effect.y-effect.origin.y)*before};
   const to={x:effect.origin.x+(effect.x-effect.origin.x)*progress,y:effect.origin.y+(effect.y-effect.origin.y)*progress};
   distance=segmentDistanceSquared({...target,y:target.y+(target.hurtOffsetY||0)},from,to);
  }else distance=segmentDistanceSquared({...target,y:target.y+(target.hurtOffsetY||0)},a,b);
  if(distance>(rule.radius*(effect.context?.mods?.radius||1)+(target.radius||0))**2)continue;
  effect.hitTargets.add(target.id);dealDamage(target,rule.damage,effect.element,effect.context);
 }
 if(rule.mode==='area')effect.areaResolved=true;
}
export class TrainingTargets{
 constructor(){this.targets=[[1080,650],[1080,710],[1080,790],[900,450],[700,620]].map(([x,y],id)=>({id:`training-${id}`,x,y,spawnX:x,spawnY:y,radius:14,hurtOffsetY:-20,health:100,maxHealth:100,flash:0,respawn:0}));}
 update(dt){for(const t of this.targets){if(t.kind)continue;
 t.flash=Math.max(0,t.flash-dt);
 const movementScale=targetMovementScale(t);t.wetTime=Math.max(0,(t.wetTime||0)-dt);
 if(t.burnTime>0 && t.health>0){const burning=Math.min(dt,t.burnTime);t.burnTime-=burning;t.health=Math.max(0,t.health-burning*(t.burnDps||6));}
 if(!t.capturedBy){t.lift=0;if(t.velocity){t.x=Math.max(54,Math.min(1746,t.x+t.velocity.x*dt*movementScale));t.y=Math.max(54,Math.min(1246,t.y+t.velocity.y*dt*movementScale));const decay=Math.exp(-dt*6);t.velocity.x*=decay;t.velocity.y*=decay;if(Math.hypot(t.velocity.x,t.velocity.y)<2)t.velocity=null;}}
 if(t.health<=0){t.respawn+=dt;if(t.respawn>=4){t.health=t.maxHealth;t.respawn=0;t.x=t.spawnX;t.y=t.spawnY;t.burnTime=0;t.wetTime=0;t.velocity=null;t.lift=0;}}
 }}
 draw(ctx,targets=this.targets,drawBody){for(const t of targets){ctx.save();ctx.translate(t.x,t.y-(t.lift||0));ctx.globalAlpha=t.health>0?1:.25;ctx.fillStyle='#14131c';ctx.fillRect(-16,-3,32,8);if(drawBody)drawBody(ctx,t);else{ctx.fillStyle=t.flash?'#fff1c7':'#70647f';ctx.fillRect(-11,-34,22,28);ctx.fillRect(-7,-39,14,5);ctx.fillStyle='#373343';ctx.fillRect(-7,-29,14,19);ctx.fillStyle=t.flash?'#ffe195':'#b398cf';ctx.fillRect(-2,-27,4,14);ctx.fillRect(-6,-23,12,4);}ctx.fillStyle='#18151f';ctx.fillRect(-18,10,36,5);ctx.fillStyle='#b65e70';ctx.fillRect(-17,11,34*t.health/t.maxHealth,3);ctx.fillStyle='#c7bdd2';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText(t.health>0?`${Math.ceil(t.health)}/100`:'RESETTING',0,27);if(t.wetTime>0 && t.health>0){
 ctx.fillStyle='#69d5ea';ctx.globalAlpha*=.6;ctx.fillRect(-13,-34,2,28);ctx.fillRect(11,-34,2,28);
 for(let i=0;i<5;i++){const phase=(t.wetTime*.9+i*.618)%1;ctx.fillStyle=i%2?'#b8f6ff':'#57b8d9';ctx.fillRect(-13+i*6,-34+phase*30,2,4);}
 ctx.globalAlpha=1;ctx.fillStyle='#8be5ed';ctx.font='8px monospace';ctx.fillText('WET',0,-45);
 }if(t.burnTime>0 && t.health>0){for(let i=0;i<5;i++){const phase=(t.burnTime*3+i*.618)%1;ctx.fillStyle=i%2?'#ff9135':'#ffd47e';ctx.fillRect(-12+i*5,-12-phase*24,3,5);}}ctx.restore();}}
}

export function damageProjectile(shot,targets){
 shot.hitTargets??=new Set();
 const radii={wind:18,water:12,fire:16,earth:16,lightning:8,neutral:12};
 for(const target of targets){
  if(target.health<=0||shot.hitTargets.has(target.id))continue;
  const radius=(radii[shot.element]||12)*(shot.context?.mods?.radius||1)+(target.radius||0);
  if(segmentDistanceSquared({...target,y:target.y+(target.hurtOffsetY||0)},shot.previous||shot,shot)>radius*radius)continue;
  shot.hitTargets.add(target.id);dealDamage(target,10+Math.round((shot.power||0)*20),shot.element,shot.context);
 }
}
