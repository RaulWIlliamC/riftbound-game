import {abilityUnlocked,payMana,damageContext} from './progression/progression.js';
import {secondSpellCooldown} from './balance.js?v=progression-1';
import {NO_COOLDOWNS} from './testing.js?v=progression-1';
import {DEFAULT_WORLD_BOUNDS,SPELL_CAST_DURATION,SPELL_CAST_WINDUP} from './player.js?v=progression-1';
import {aimFrom} from './aim.js?v=progression-1';
import {segmentDistanceSquared,applyWet,dealDamage} from './combat.js?v=progression-1';
export const SECOND_SPELLS={lightning:'Lightning Dragon',wind:'Cyclone Grip',water:'Surging Wave',earth:'Stone Shard Barrage',fire:'Inferno Orb'};
export const SECOND_CHARGE_LIMIT=4;
export const SECOND_FULL_CHARGE=3.2;
export const EARTH_SECOND_CHARGE=2;
export const FIRE_SIZE_MULTIPLIER=1.2;
const point=t=>({x:t.x,y:t.y+(t.hurtOffsetY||0)});
const clamp=(p,bounds)=>({x:Math.max(bounds.left,Math.min(bounds.right,p.x)),y:Math.max(bounds.top,Math.min(bounds.bottom,p.y))});
function hit(t,damage,element,context){dealDamage(t,damage,element,context);}
function push(t,angle,speed){if(t.captureImmune)return;t.velocity={x:Math.cos(angle)*speed,y:Math.sin(angle)*speed};}
// Preserve press/release order even when a HUD tap falls between render frames.
export function handleSecondSpellRequests(spells,player,origin,target,requests){
 for(const phase of requests){
  if(phase==='cancel')spells.cancel();
  if(phase==='start'||phase==='tap')spells.start(player,origin,target);
  if(phase==='release'||phase==='tap')spells.release();
 }
}
export class SecondSpells{
 constructor(onSound,onImpact,{noCooldowns=NO_COOLDOWNS}={}){this.worldBounds=DEFAULT_WORLD_BOUNDS;this.onSound=onSound;this.onImpact=onImpact;this.noCooldowns=noCooldowns;this.cooldownDuration=secondSpellCooldown(null,noCooldowns);this.cooldown=0;this.channel=null;this.pending=null;this.effects=[];this.bursts=[];this.serial=0;}
 start(player,origin,target){
  if(!SECOND_SPELLS[player.element]||!origin||this.channel||this.pending||this.cooldown>0||player.spellChannel||player.charging||player.castTime>0||player.attackTime>0||player.dashTime>0)return false;
  if(!abilityUnlocked(player,2))return false;
  const context=damageContext(player,2);if(!payMana(player,2,context.mods))return false;
  this.cooldownDuration=secondSpellCooldown(player.element,this.noCooldowns)*context.mods.cooldown;
  const c={context,id:++this.serial,player,element:player.element,origin:{...origin},target:clamp(target,this.worldBounds),age:0,power:0,aim:aimFrom(origin,target,player.aim),captured:[]};
  player.attackTime=0;player.releaseTime=0;player.holdTime=0;player.charge=0;
  if(['fire','earth','wind'].includes(c.element)){
   this.channel=c;player.spellChannel=c.element;player.spellCharge=0;player.dashTime=0;
   if(c.element==='wind'){c.x=c.target.x;c.y=c.target.y;c.radius=76*c.context.mods.radius;}
   this.onSound?.(c.element,'charge',{spell:'second',power:0});
  }else this.queue(c);
  return true;
 }
 queue(c){this.pending={...c,age:0};c.player.spellChannel=null;c.player.spellCharge=0;c.player.castTime=SPELL_CAST_DURATION/c.context.mods.charge;c.player.castAim=c.aim;c.player.castStyle=c.element;this.cooldown=this.cooldownDuration;}
 aim(target){if(this.channel){this.channel.target=clamp(target,this.worldBounds);this.channel.aim=aimFrom(this.channel.origin,this.channel.target,this.channel.aim);}}
 release(){
  const c=this.channel;if(!c)return false;
  this.channel=null;c.player.spellChannel=null;c.player.spellCharge=0;
  if(c.element==='wind'){
   const angle=c.player.aim??c.aim;
   for(const t of c.captured){t.capturedBy=null;t.lift=0;if(t.health>0){hit(t,50,'wind',c.context);push(t,angle,350);}}
   this.bursts.push({element:'wind',x:c.x,y:c.y,radius:100,age:0,life:.65});
   this.onSound?.('wind','cast',{spell:'second',power:c.power,x:c.x,y:c.y});this.onImpact?.('wind',{spell:'second',power:c.power,x:c.x,y:c.y});this.cooldown=this.cooldownDuration;c.player.castTime=.3;c.player.castAim=angle;c.player.castStyle='wind';
  }else this.queue(c);
  return true;
 }
 cancel(){const c=this.channel;if(c){for(const t of c.captured){t.capturedBy=null;t.lift=0;}c.player.spellChannel=null;c.player.spellCharge=0;this.channel=null;}if(this.pending){this.pending.player.castTime=0;this.pending=null;}}
 update(dt,getOrigin,targets=[]){
  this.cooldown=Math.max(0,this.cooldown-dt);
  for(const b of this.bursts)b.age+=dt;this.bursts=this.bursts.filter(b=>b.age<b.life);
  const c=this.channel;
  if(c){
   if(c.player.element!==c.element)this.cancel();
   else{
    const limit=c.element==='earth'?EARTH_SECOND_CHARGE:SECOND_CHARGE_LIMIT;
    c.age=Math.min(limit,c.age+dt*c.context.mods.charge);c.power=Math.min(1,c.age/(c.element==='earth'?EARTH_SECOND_CHARGE:c.element==='wind'?SECOND_CHARGE_LIMIT:SECOND_FULL_CHARGE));c.player.spellCharge=c.power;c.origin=getOrigin?.(c.player)||c.origin;
    if(c.element==='wind')this.updateCyclone(c,dt,targets);
    if(c.age>=limit-1e-8)this.release();
   }
  }
  for(const e of this.effects){
   const previous={x:e.x,y:e.y};e.age+=dt;
   if(e.age<0)continue;
   if(e.kind==='dragon')continue;
   const travel=Math.min(e.speed*dt,e.remaining);e.remaining-=travel;e.x+=Math.cos(e.aim)*travel;e.y+=Math.sin(e.aim)*travel;
   let stop=e.remaining<=0;
   if(e.x<this.worldBounds.left||e.x>this.worldBounds.right||e.y<this.worldBounds.top||e.y>this.worldBounds.bottom){Object.assign(e,clamp(e,this.worldBounds));stop=true;}
   for(const t of targets){
    if(t.health<=0||e.hits.has(t.id))continue;
    if(segmentDistanceSquared(point(t),previous,e)>(e.radius+(t.radius||0))**2)continue;
    if(e.kind==='fireball'){stop=true;break;}
    e.hits.add(t.id);hit(t,e.damage,e.element,e.context);
    if(e.kind==='wave'){applyWet(t,e.context);push(t,e.aim,150*(e.context?.mods?.enhancement?.push||1));this.onImpact?.('water',{spell:'second',x:e.x,y:e.y});}
    if(e.kind==='shard'){this.bursts.push({element:'earth',x:t.x,y:t.y+(t.hurtOffsetY||0),radius:22,age:0,life:.35});this.onImpact?.('earth',{spell:'second',x:t.x,y:t.y,power:e.power});}
   }
   if(stop){
    if(e.kind==='fireball'){
     for(const t of targets)if(t.health>0&&Math.hypot(point(t).x-e.x,point(t).y-e.y)<e.blastRadius+(t.radius||0)){hit(t,e.damage,e.element,e.context);t.burnTime=(3+(e.context?.mods?.enhancement?.burnExtra||0))*(e.context?.mods?.status||1);t.burnDps=6;t.burnContext=e.context;}
     this.bursts.push({element:'fire',x:e.x,y:e.y,radius:e.blastRadius,age:0,life:.65});
    }else if(e.kind==='wave')this.bursts.push({element:'water',x:e.x,y:e.y,radius:75,age:0,life:.45});
    e.age=e.life;this.onImpact?.(e.element,{spell:'second',power:e.power,x:e.x,y:e.y});
   }
  }
  this.effects=this.effects.filter(e=>e.age<e.life);
  if(this.pending){
   this.pending.age+=dt;
   if(this.pending.age>=SPELL_CAST_WINDUP/(this.pending.context?.mods?.charge||1)){const p=this.pending;this.pending=null;this.launch(p,getOrigin?.(p.player)||p.origin,targets);}
  }
 }
 updateCyclone(c,dt,targets){
  // Cursor steers a bounded-speed vortex; it never teleports its captured targets.
  const d=Math.hypot(c.target.x-c.x,c.target.y-c.y),step=Math.min(d,220*dt);
  if(d){c.x+=(c.target.x-c.x)/d*step;c.y+=(c.target.y-c.y)/d*step;}
  for(const t of targets){
   if(t.health<=0||t.captureImmune||t.capturedBy&&t.capturedBy!==c.id||c.captured.length>=(6+(c.context?.mods?.enhancement?.captureExtra||0)))continue;
   if(!c.captured.includes(t)&&Math.hypot(t.x-c.x,t.y-c.y)<c.radius+(t.radius||0)){c.captured.push(t);t.capturedBy=c.id;t.velocity=null;}
  }
  for(let i=0;i<c.captured.length;i++){
   const t=c.captured[i];if(t.health<=0)continue;
   const a=c.age*4+i*Math.PI*2/Math.max(1,c.captured.length),r=20+i*5;
   const desired={x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r*.5};
   const follow=1-Math.exp(-dt*9);t.x=Math.max(this.worldBounds.left+14,Math.min(this.worldBounds.right-14,t.x+(desired.x-t.x)*follow));t.y=Math.max(this.worldBounds.top+14,Math.min(this.worldBounds.bottom-14,t.y+(desired.y-t.y)*follow));t.lift=12+Math.sin(c.age*7+i)*5;
  }
 }
 launch(p,origin,targets){
  const before=this.effects.length;
  const aim=aimFrom(origin,p.target,p.aim),distance=Math.hypot(p.target.x-origin.x,p.target.y-origin.y),base={context:p.context,element:p.element,x:origin.x,y:origin.y,origin:{...origin},aim,age:0,hits:new Set(),life:3};
  this.onSound?.(p.element,'cast',{spell:'second',power:p.power,x:origin.x,y:origin.y});
  if(p.element==='lightning'){
   const end={x:origin.x+Math.cos(aim)*Math.min(distance,650),y:origin.y+Math.sin(aim)*Math.min(distance,650)};
   const eligible=targets.filter(t=>t.health>0&&segmentDistanceSquared(point(t),origin,end)<(24*(p.context?.mods?.radius||1)+(t.radius||0))**2).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y));
   const chain=[],nodes=[origin];let next=eligible[0];
   while(next&&chain.length<(3+(p.context?.mods?.enhancement?.extraChain||0))){chain.push(next);nodes.push(point(next));const near=targets.filter(t=>t.health>0&&!chain.includes(t)&&Math.hypot(t.x-next.x,t.y-next.y)<190*(p.context?.mods?.radius||1)).sort((a,b)=>Math.hypot(a.x-next.x,a.y-next.y)-Math.hypot(b.x-next.x,b.y-next.y));next=near[0];}
   chain.forEach((t,i)=>hit(t,[50,35,24,p.context?.mods?.enhancement?.extraChainDamage||0][i],'lightning',p.context));if(nodes.length===1)nodes.push(end);
   this.effects.push({...base,kind:'dragon',nodes,life:.7});if(chain.length)this.onImpact?.('lightning',{spell:'second',x:nodes.at(-1).x,y:nodes.at(-1).y});
  }else if(p.element==='water')this.effects.push({...base,kind:'wave',speed:400,remaining:950,radius:74,damage:50,life:2.7});
  else if(p.element==='fire')this.effects.push({...base,kind:'fireball',power:p.power,speed:420,remaining:Math.max(35,distance),radius:(16+p.power*22)*FIRE_SIZE_MULTIPLIER,blastRadius:(48+p.power*48)*FIRE_SIZE_MULTIPLIER,damage:40+Math.round(p.power*45),life:Math.max(3,distance/420+.1)});
  else if(p.element==='earth'){
   const count=3+Math.floor(p.power*9);
   for(let i=0;i<count;i++){
    const side=(i-(count-1)/2)*7,from={x:origin.x-Math.sin(aim)*side,y:origin.y+Math.cos(aim)*side};
    const angle=aimFrom(from,p.target,aim);
    this.effects.push({...base,...from,origin:from,aim:angle,kind:'shard',speed:490+i%3*35,remaining:1100,radius:8,damage:8,power:p.power,life:3,age:-i*.025,hits:new Set()});
   }
  }
  for(const e of this.effects.slice(before)){if(Number.isFinite(e.speed))e.speed*=p.context?.mods?.speed||1;if(Number.isFinite(e.radius))e.radius*=p.context?.mods?.radius||1;if(e.kind==='shard')e.radius*=p.context?.mods?.enhancement?.hitWidth||1;if(e.blastRadius)e.blastRadius*=p.context?.mods?.radius||1;}
 }
}
