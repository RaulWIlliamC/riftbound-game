import {abilityUnlocked,payMana,damageContext} from './progression/progression.js';
import {ultimateCooldown} from './balance.js?v=progression-1';
import {NO_COOLDOWNS} from './testing.js?v=progression-1';
import {DEFAULT_WORLD_BOUNDS} from './player.js?v=progression-1';
import {dealDamage,applyWet} from './combat.js?v=progression-1';
export const THIRD_SPELLS={fire:'Meteor Shower',earth:'Stone Collapse',water:'Shark Whirlpool',lightning:'Thunderstorm',wind:'Tempest Blades'};
export const THIRD_STARTUP=.3,THIRD_DURATION=4;
export const THIRD_RADII={fire:300,earth:230,water:275,lightning:325,wind:260};
export const THIRD_DURATIONS={fire:4,earth:4,water:5,lightning:6,wind:5};
const pulseInterval=element=>element==='earth'?4/7:element==='lightning'?.4:.5;
const clamp=(p,bounds)=>({x:Math.max(bounds.left,Math.min(bounds.right,p.x)),y:Math.max(bounds.top,Math.min(bounds.bottom,p.y))});
const inside=(t,c,r=c.radius)=>t.health>0&&Math.hypot(t.x-c.x,(t.y-c.y)/(c.groundScale||1))<=r+(t.radius||0);
export function handleThirdSpellRequests(s,p,origin,target,requests=[]){
 for(const phase of requests){if(phase==='cancel')s.cancel();if(phase==='start'||phase==='tap')s.start(p,origin,target);if(phase==='release')s.release();}
}
export class ThirdSpells{
 constructor(onSound,onImpact,{noCooldowns=NO_COOLDOWNS,ownerId='local'}={}){this.worldBounds=DEFAULT_WORLD_BOUNDS;this.ownerId=ownerId;this.onSound=onSound;this.onImpact=onImpact;this.noCooldowns=noCooldowns;this.cooldown=0;this.cooldownDuration=ultimateCooldown(null,noCooldowns);this.channel=null;this.effects=[];this.bursts=[];this.serial=0;this.targets=[];}
 start(player,origin,target){
  if(!THIRD_SPELLS[player.element]||!origin||player.health<=0||player.spellChannel||player.charging||player.castTime>0||player.attackTime>0||player.dashTime>0||this.effects.some(e=>!e.ended)||this.cooldown>0)return false;
  if(!abilityUnlocked(player,3))return false;
  const context=damageContext(player,3);if(!['fire','earth'].includes(player.element))context.mods.damage/=context.mods.duration;if(!payMana(player,3,context.mods))return false;
  const pos=clamp(player.element==='lightning'?player:target,this.worldBounds),e={context,groundScale:this.groundScale||1,id:++this.serial,element:player.element,x:pos.x,y:pos.y,target:pos,origin:{...origin},radius:THIRD_RADII[player.element]*context.mods.radius,duration:THIRD_DURATIONS[player.element]*(player.element==='earth'||player.element==='fire'?1:context.mods.duration),age:0,power:0,nextPulse:pulseInterval(player.element),nextMeteor:0,meteors:[],greatSpawned:false,ended:false,player};
  this.cooldownDuration=ultimateCooldown(player.element,this.noCooldowns)*context.mods.cooldown;this.cooldown=this.cooldownDuration;
  e.captureKey=`stone-${this.ownerId}-${e.id}`;this.effects.push(e);this.channel=e;player.spellChannel=e.element;player.thirdChannel=true;player.thirdCastAge=0;player.spellCharge=0;player.attackTime=0;player.charging=false;player.holdTime=0;
  this.onSound?.(e.element,'charge',{spell:'third',x:e.x,y:e.y,power:0});return true;
 }
 aim(target){const e=this.channel;if(e&&e.element==='fire'){e.target=clamp(target,this.worldBounds);e.x=e.target.x;e.y=e.target.y;}}
 detach(e,keepOwner=false){
  if(e.element==='earth')for(const t of this.targets)if(t.capturedBy===e.captureKey){t.capturedBy=null;t.stoneEnclosed=null;t.lift=0;}
  if(e.player){if(this.channel===e){e.player.spellChannel=null;e.player.spellCharge=0;e.player.thirdChannel=false;e.player.thirdCastAge=0;}if(!keepOwner)e.player=null;}
  if(this.channel===e)this.channel=null;
 }
 release(){const e=this.channel;if(!e||!['fire','earth'].includes(e.element))return false;this.finish(e);return true;}
 cancel(){for(const e of this.effects)this.detach(e);this.effects=[];this.bursts=[];this.channel=null;}
 clear(){this.cancel();this.cooldown=0;}
 area(e,damage,radius=e.radius){for(const t of this.targets)if(inside(t,e,radius))dealDamage(t,damage,e.element,e.context);}
 burst(e,extra={}){const b={groundScale:e.groundScale||1,element:e.element,x:e.x,y:e.y,radius:e.radius,age:0,life:.7,...extra};this.bursts.push(b);this.onImpact?.(e.element,{spell:'third',x:b.x,y:b.y,power:e.power});}
 finish(e){
  if(e.ended)return;e.ended=true;e.endedAt=e.age;
  if(e.element==='earth'&&e.age>=THIRD_STARTUP){this.area(e,55+Math.round(e.power*55));this.burst(e,{collapse:true,power:e.power});}
  else if(e.element!=='fire'&&e.age>=THIRD_STARTUP)this.burst(e,{power:e.power});
  this.detach(e);
 }
 update(dt,getOrigin,targets=[]){
  this.targets=targets;this.cooldown=Math.max(0,this.cooldown-dt);
  for(const b of this.bursts)b.age+=dt;this.bursts=this.bursts.filter(b=>b.age<b.life).slice(-64);
  for(const e of this.effects){
   if(e.player&&(e.player.health<=0||e.player.element!==e.element)){e.cancelled=true;this.detach(e);continue;}
   const previous=e.age;e.age+=e.age<THIRD_STARTUP?Math.min(THIRD_STARTUP-e.age,dt*(e.context?.mods?.charge||1))+Math.max(0,dt-(THIRD_STARTUP-e.age)/(e.context?.mods?.charge||1)):dt;const active=Math.min(e.duration,Math.max(0,e.age-THIRD_STARTUP));e.power=active/e.duration;
   if(e.element==='lightning'&&e.player&&!e.ended){e.x=e.player.x;e.y=e.player.y;}
   if(this.channel===e){e.player.thirdCastAge=e.age;e.player.spellCharge=e.power;e.origin=getOrigin?.(e.player)||e.origin;}
   if(e.age<THIRD_STARTUP)continue;
   if(previous<THIRD_STARTUP){this.onSound?.(e.element,'cast',{spell:'third',x:e.x,y:e.y,power:.8});if(!['fire','earth'].includes(e.element))this.detach(e,e.element==='lightning');}
   if(e.element==='fire'){
    if(!e.ended){while(e.nextMeteor<=active+1e-8&&e.nextMeteor<4){const i=Math.round(e.nextMeteor/.045),angle=i*2.39996,r=i%4===0?0:e.radius*Math.sqrt(.15+.8*((i*7)%83)/83);e.meteors.push({id:i,born:e.nextMeteor,x:e.x+Math.cos(angle)*r,y:e.y+Math.sin(angle)*r*(e.groundScale||1),radius:48*e.context.mods.radius,damage:5,great:false,fall:.55,impacted:false});e.nextMeteor+=.045;}
     if(active>=3.1&&!e.greatSpawned){e.greatSpawned=true;e.meteors.push({id:'great',born:3.1,x:e.x,y:e.y,radius:220*e.context.mods.radius*(e.context.mods.enhancement?.impactRadius||1),damage:65,great:true,fall:.7,impacted:false});}
    }
    const elapsed=Math.max(0,e.age-THIRD_STARTUP);
    for(const m of e.meteors){m.age=elapsed-m.born;if(!m.impacted&&m.age>=m.fall){m.impacted=true;this.area({...e,x:m.x,y:m.y},m.damage,m.radius);this.burst(e,{x:m.x,y:m.y,radius:m.radius,great:m.great,life:m.great?.9:.45});}}
    e.meteors=e.meteors.filter(m=>m.age<m.fall+.5);
   }else if(!e.ended){
    if(e.element==='earth')for(const t of targets){if(!inside(t,e)||t.captureImmune||t.capturedBy&&t.capturedBy!==e.captureKey)continue;const dx=e.x-t.x,dy=e.y-t.y,d=Math.hypot(dx,dy),step=Math.min(Math.max(0,d-14),dt*(90+90*e.power)*(e.context?.mods?.enhancement?.pull||1));if(d){t.x+=dx/d*step;t.y+=dy/d*step;t.velocity=null;}if(d<45){t.capturedBy=e.captureKey;t.stoneEnclosed=1-.65*Math.min(1,Math.max(0,(e.age-1)/.8));}}
    if(e.element==='wind')for(const t of targets){
     if(!inside(t,e)||t.captureImmune||t.capturedBy)continue;
     const dx=e.x-t.x,dy=e.y-t.y,d=Math.hypot(dx,dy),step=Math.min(Math.max(0,d-35),30*dt*(e.context?.mods?.enhancement?.pull||1));
     if(d){Object.assign(t,clamp({x:t.x+dx/d*step,y:t.y+dy/d*step},this.worldBounds));}
    }
    if(e.element==='water')for(const t of targets)if(inside(t,e))applyWet(t,e.context);
    while(e.nextPulse<=active+1e-8){
     const pulse=e.nextPulse;
     if(e.element==='earth')this.area(e,25);
     if(e.element==='wind')for(const t of targets){
     if(!inside(t,e)||t.captureImmune||t.capturedBy)continue;
     const dx=e.x-t.x,dy=e.y-t.y,d=Math.hypot(dx,dy),step=Math.min(Math.max(0,d-35),30*dt*(e.context?.mods?.enhancement?.pull||1));
     if(d){Object.assign(t,clamp({x:t.x+dx/d*step,y:t.y+dy/d*step},this.worldBounds));}
    }
    if(e.element==='water'){this.area(e,20);this.burst(e,{bite:true,radius:e.radius*.8,life:.22});}
     if(e.element==='wind'){this.area(e,25);this.burst(e,{slash:true,life:.25});}
     if(e.element==='lightning'){
      // Steady area damage is separate from the chaotic, sparse visible bolts.
      const candidates=targets.filter(t=>inside(t,e));for(const t of candidates)dealDamage(t,18,'lightning',e.context);
      const selected=new Set();for(let i=0;i<Math.min(3,candidates.length);i++){
       let index=(Math.round(pulse*37)+i*5)%candidates.length;while(selected.has(index))index=(index+1)%candidates.length;selected.add(index);
       const t=candidates[index];this.burst(e,{x:t.x,y:t.y,radius:32,bolt:true,life:.3});
      }
      const a=pulse*23,rr=e.radius*(.3+(Math.round(pulse*100)%11)/17);this.burst(e,{x:e.x+Math.cos(a)*rr,y:e.y+Math.sin(a)*rr*(e.groundScale||1),radius:25,bolt:true,decorative:true,life:.22});
     }
     e.nextPulse+=pulseInterval(e.element);
    }
   }
   if(!e.ended&&e.age>=THIRD_STARTUP+e.duration-1e-8)this.finish(e);
  }
  this.effects=this.effects.filter(e=>!e.cancelled&&(!e.ended||e.age-e.endedAt<(e.element==='fire'?1.1:.65)));
 }
}
