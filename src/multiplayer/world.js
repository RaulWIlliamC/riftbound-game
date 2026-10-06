import {newProgression,syncStats,ensureOffer,allocate,chooseCard,damageContext} from '../progression/progression.js';
import {DASH_COOLDOWN} from '../balance.js?v=progression-1';
import {ThirdSpells,handleThirdSpellRequests} from '../third-spells.js?v=progression-1';
import {dealDamage} from '../combat.js?v=progression-1';
import {Player,DEFAULT_WORLD_BOUNDS} from '../player.js?v=progression-1';
import {Magic} from '../magic.js?v=progression-1';
import {FirstSpells} from '../first-spells.js?v=progression-1';
import {SecondSpells,handleSecondSpellRequests} from '../second-spells.js?v=progression-1';
import {getStaffTipPosition} from '../wizard.js?v=ruins-polish-3';

import {ELEMENTS as PROGRESSION_ELEMENTS} from '../progression/config.js';
export const ELEMENTS=['neutral',...PROGRESSION_ELEMENTS];
const edges=['dash','ability','attack','attackReleased','attackCancelled'];
export const idleIntent=()=>({x:0,y:0,run:false,attackHeld:false,requests:[],thirdRequests:[],progressionRequests:[],hasAim:false});
// Clients send controls only. Position, elapsed time, damage and cooldowns are host-owned.
export function sanitizeIntent(value){
 if(!value||typeof value!=='object')return null;
 const finite=(n,low,high)=>Number.isFinite(n)?Math.max(low,Math.min(high,n)):0;
 const result={x:finite(value.x,-1,1),y:finite(value.y,-1,1),run:value.run===true,progressionOpen:value.progressionOpen===true,attackHeld:value.attackHeld===true,hasAim:value.hasAim===true,
  travel:['arena','sanctuary','whispering-ruins'].includes(value.travel)?value.travel:null,element:ELEMENTS.includes(value.element)?value.element:'neutral',target:{x:finite(value.target?.x,0,4096),y:finite(value.target?.y,0,4096)},
  thirdRequests:Array.isArray(value.thirdRequests)?value.thirdRequests.filter(p=>['start','release','cancel','tap'].includes(p)).slice(0,8):[],
  requests:Array.isArray(value.requests)?value.requests.filter(p=>['start','release','cancel','tap'].includes(p)).slice(0,8):[]};
 result.progressionRequests=Array.isArray(value.progressionRequests)?value.progressionRequests.slice(0,8).filter(r=>r&&['allocate','choose'].includes(r.type)&&typeof r.key==='string'&&r.key.length<80).map(r=>({type:r.type,key:r.key})):[];
 for(const edge of edges)result[edge]=value[edge]===true;
 return result;
}
export function createActor(id,player,onSound=()=>{}){
 const p=player||new Player({noCooldowns:false}),emit=(e,kind='cast',details={})=>onSound(e,kind,{actorId:id,x:p.x,y:p.y,...details});
 p.progression??=newProgression();p.actorId=id;syncStats(p);
 return {id,player:p,magic:new Magic((e,d)=>emit(e,'impact',{spell:'bolt',...d})),first:new FirstSpells((e,d)=>emit(e,'cast',{spell:'first',...d}),(e,d)=>emit(e,'impact',{spell:'first',...d}),{noCooldowns:false}),
  third:new ThirdSpells((e,k,d)=>emit(e,k,{spell:'third',...d}),(e,d)=>emit(e,'impact',{spell:'third',...d}),{ownerId:id,noCooldowns:false}),
  second:new SecondSpells((e,k,d)=>emit(e,k,{spell:'second',...d}),(e,d)=>emit(e,'impact',{spell:'second',...d}),{noCooldowns:false}),intent:idleIntent(),queue:[],lastInput:0};
}
export function queueIntent(actor,value,now){
 const intent=sanitizeIntent(value);if(!intent)return false;
 // Bound bursts; current held controls supersede earlier held controls, edges retain order.
 if(actor.queue.length>=32)return false;
 actor.queue.push(intent);actor.lastInput=now;return true;
}
export function consumeIntent(actor,now){
 let result={...actor.intent,requests:[],thirdRequests:[],progressionRequests:[],travel:null};for(const edge of edges)result[edge]=false;
 for(const next of actor.queue.splice(0)){
  const old=result;result={...next,travel:next.travel||old.travel,requests:[...old.requests,...next.requests].slice(-32),thirdRequests:[...(old.thirdRequests||[]),...(next.thirdRequests||[])].slice(-32),progressionRequests:[...(old.progressionRequests||[]),...(next.progressionRequests||[])].slice(-32)};
  for(const edge of edges)result[edge]=old[edge]||next[edge];
 }
 if(now-actor.lastInput>.3){result={...idleIntent(),element:actor.player.element,attackCancelled:true,requests:['cancel'],thirdRequests:['cancel']};}
 actor.intent=result;return result;
}
export function stepActor(actor,dt,intent,hub,targets,onSound=()=>{}){
 const p=actor.player;p.actorId=actor.id;
 p.worldBounds=hub.worldBounds||DEFAULT_WORLD_BOUNDS;actor.third.groundScale=hub.groundScale||1;
 for(const controller of [actor.magic,actor.first,actor.second,actor.third])controller.worldBounds=p.worldBounds;
 if(!p.progression.offer&&p.element&&p.progression.selectedElement!==p.element){p.progression.selectedElement=p.element;p.progression.revision++;}
 for(const r of intent.progressionRequests||[]){if(r.type==='allocate')allocate(p.progression,r.key);if(r.type==='choose')chooseCard(p.progression,r.key,p.element);}
 const stats=syncStats(p);p.dashCooldownDuration=DASH_COOLDOWN*stats.dash;
 ensureOffer(p.progression,p.element);
 p.progressionOpen=!!p.progression.offer||intent.progressionOpen===true;
 if(p.health<=0){actor.third.cancel();actor.second.cancel();actor.first.pending=null;actor.magic.shots=[];actor.first.effects=[];actor.second.effects=[];p.state='downed';return;}
 if(p.progressionOpen){
  // Stop new input while choices are open; already flying spells continue resolving.
  actor.third.release();actor.second.release();p.charging=false;p.holdTime=0;p.attackTime=0;p.shotQueued=null;
  p.update(dt,{x:0,y:0,attackCancelled:true});
  actor.third.update(dt,getStaffTipPosition,targets);actor.magic.update(dt,targets);actor.second.update(dt,getStaffTipPosition,targets);actor.first.update(dt,getStaffTipPosition,targets);return;
 }
 if(!p.progression.offer&&intent.element&&p.element!==intent.element){actor.third.cancel();actor.second.cancel();p.element=intent.element;p.progression.selectedElement=p.element;p.progression.revision++;}
 p.hasAim=intent.hasAim;
 if(intent.hasAim){p.aimTarget={...intent.target};p.aim=Math.atan2(intent.target.y-(p.y-24*(p.visualScale||1)),intent.target.x-p.x);}
 const target=intent.hasAim?intent.target:{x:p.x+Math.cos(p.aim)*220,y:p.y+Math.sin(p.aim)*220};
 actor.third.aim(target);handleThirdSpellRequests(actor.third,p,getStaffTipPosition(p),target,intent.thirdRequests||[]);
 actor.second.aim(target);handleSecondSpellRequests(actor.second,p,getStaffTipPosition(p),target,intent.requests||[]);
 const charging=p.charging,attack=p.attackTime,previous={x:p.x,y:p.y};
 p.update(dt,intent);hub.move(p,previous);
 if(p.trails.at(-1)?.time===p.time&&p.state==='dashing')Object.assign(p.trails.at(-1),{x:p.x,y:p.y});
 if(p.charging&&!charging)onSound(p.element,'charge',{spell:'bolt',actorId:actor.id,x:p.x,y:p.y});if(p.attackTime>attack)onSound(p.element,'swing',{actorId:actor.id,x:p.x,y:p.y});
 if(p.attackTime>attack)actor.meleeResolved=false;
 if(!actor.meleeResolved&&p.attackTime>0&&p.attackTime<=.3){
  actor.meleeResolved=true;for(const t of targets){const dx=t.x-p.x,dy=t.y-p.y;if(t.health>0&&Math.hypot(dx,dy)<65+(t.radius||0)&&dx*Math.cos(p.attackAim)+dy*Math.sin(p.attackAim)>-8)dealDamage(t,22,'neutral',{ownerId:actor.id,slot:0,mods:{damage:1}});}
 }
 actor.third.update(dt,getStaffTipPosition,targets);actor.magic.update(dt,targets);actor.second.update(dt,getStaffTipPosition,targets);actor.first.update(dt,getStaffTipPosition,targets);
 if(intent.ability)actor.first.cast(p,getStaffTipPosition(p),target);
 if(p.shotQueued){onSound(p.shotQueued.element,'cast',{spell:'bolt',power:p.shotQueued.power,actorId:actor.id,x:p.x,y:p.y});actor.magic.launch(getStaffTipPosition(p),{...p.shotQueued,context:damageContext(p,0)});p.shotQueued=null;}
}
const playerFields='x y visualScale aim hasAim aimTarget phase time state visualDirection trails footfalls attackTime attackAim castTime castAim castStyle holdTime charging charge releaseTime dashTime cooldown dashDirection attackCooldown spellChannel spellCharge thirdChannel thirdCastAge element progression profileSaveStatus mana maxMana dashCharges dashMaxCharges health maxHealth invulnerable hitFlash slowTime downTime'.split(' ');
const targetFields='id x y spawnX spawnY radius hurtOffsetY health maxHealth flash respawn wetTime burnTime burnDps velocity lift capturedBy kind state timer clock cooldown aimPoint facing attackKind attackCount captureImmune stoneEnclosed shielded moving moveClock deathTime slamResolved'.split(' ');
const pick=(object,fields)=>Object.fromEntries(fields.filter(key=>object[key]!==undefined).map(key=>[key,object[key]]));
// Serialize presentation data only, never live player references or hit-tracking Sets.
function visual(value){
 return JSON.parse(JSON.stringify(value,(key,item)=>['player','captured','hits','hitTargets','conducted','extended'].includes(key)?undefined:item));
}
export function worldSnapshot(actors,targets,tick,encounter){
 return {type:'world',version:1,tick,encounter:encounter?.snapshot(),targets:targets.map(t=>pick(t,targetFields)),actors:[...actors.values()].map(a=>({id:a.id,player:pick(a.player,playerFields),
  magic:visual({shots:a.magic.shots,impacts:a.magic.impacts}),first:visual({effects:a.first.effects,impacts:a.first.impacts,releases:a.first.releases,cooldown:a.first.cooldown,cooldownDuration:a.first.cooldownDuration}),
  third:visual({effects:a.third.effects,bursts:a.third.bursts,channel:a.third.channel,cooldown:a.third.cooldown,cooldownDuration:a.third.cooldownDuration}),
  second:visual({effects:a.second.effects,bursts:a.second.bursts,channel:a.second.channel,cooldown:a.second.cooldown,cooldownDuration:a.second.cooldownDuration})}))};
}
export function applySnapshot(message,actors,localId,localPlayer,training,encounter){
 if(message?.type!=='world'||message.version!==1||!Array.isArray(message.actors)||message.actors.length>4||!Array.isArray(message.targets))return false;
 const keep=new Set();
 for(const data of message.actors){
  keep.add(data.id);let a=actors.get(data.id);
  if(!a){a=createActor(data.id,data.id===localId?localPlayer:undefined);actors.set(data.id,a);}
  const old={x:a.player.x,y:a.player.y};Object.assign(a.player,data.player);
  // Rendering interpolates between authoritative positions; combat never runs on a guest.
  a.renderPosition??=old;
  if(data.third){Object.assign(a.third,data.third);if(a.third.channel)a.third.channel.player=a.player;}
  Object.assign(a.magic,data.magic);Object.assign(a.first,data.first);Object.assign(a.second,data.second);
  if(a.second.channel){a.second.channel.player=a.player;a.second.channel.captured=[];}
 }
 for(const id of actors.keys())if(!keep.has(id))actors.delete(id);
 training.targets=message.targets;
 if(encounter&&message.encounter){Object.assign(encounter,message.encounter);encounter.targets=message.targets;}
 return true;
}
