import {CONFIG,ATTRIBUTES,ELEMENTS,CARDS,RANKS,RANK_LABELS,SPELL_NAMES,FINISHERS,ENHANCEMENTS} from './config.js';
export {CONFIG,ATTRIBUTES,RANK_LABELS};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
export const xpRequired=level=>CONFIG.xp.base+CONFIG.xp.linear*(level-1)+CONFIG.xp.quadratic*(level-1)**2;
export function newProgression(){return {version:1,selectedElement:'neutral',level:1,xp:0,points:0,attributes:Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,0])),ranks:Object.fromEntries(ELEMENTS.map(e=>[e,[0,0,0]])),cards:[],pending:[],offer:null,clears:[],revision:0,unlocks:{1:true,2:false,3:false},ascensionUnlocked:false};}
function unlock(p){p.unlocks=Object.fromEntries([1,2,3].map(k=>[k,p.level>=CONFIG.unlocks[k]]));p.ascensionUnlocked=p.level>=CONFIG.unlocks.ascension;}
export function validateProgression(value){
 const p=newProgression();if(!value||value.version!==1)return p;
 p.selectedElement=ELEMENTS.includes(value.selectedElement)?value.selectedElement:'neutral';
 p.level=Math.floor(clamp(value.level,1,CONFIG.levelCap));p.xp=p.level===CONFIG.levelCap?0:Math.floor(clamp(value.xp,0,xpRequired(p.level)-1));
 let budget=p.level-1;for(const k of Object.keys(ATTRIBUTES)){p.attributes[k]=Math.floor(clamp(value.attributes?.[k],0,budget));budget-=p.attributes[k];}p.points=budget;
 // Permanent cards and ranks are replayed from a bounded selection history.
 for(const id of (Array.isArray(value.cards)?value.cards:[]).slice(0,CONFIG.cardLevels.filter(l=>l<=p.level).length)){
  const c=cardDefinition(id,p);if(c&&eligible(c,p,c.element||'neutral')){p.cards.push(id);if(c.spell)p.ranks[c.element][c.slot-1]++;}
 }
 const earned=CONFIG.cardLevels.filter(l=>l<=p.level);p.pending=earned.slice(p.cards.length);p.clears=Array.isArray(value.clears)?value.clears.filter(x=>x==='rift-arena').slice(0,1):[];
 p.revision=Math.floor(clamp(value.revision,0,Number.MAX_SAFE_INTEGER));unlock(p);
 const ids=value.offer?.ids,offeredElement=ELEMENTS.includes(value.offer?.element)?value.offer.element:p.selectedElement;if(p.pending.length&&Array.isArray(ids)&&ids.length===3&&new Set(ids).size===3&&ids.every(id=>{const c=cardDefinition(id,p);return c&&eligible(c,p,offeredElement);}))p.offer={level:p.pending[0],element:offeredElement,ids};
 return p;
}
export const abilityUnlocked=(player,slot)=>!player.progression||player.progression.level>=CONFIG.unlocks[slot];
export function grantXP(p,amount){if(!Number.isFinite(amount)||amount<=0||p.level>=CONFIG.levelCap)return [];
 p.xp+=Math.floor(amount);const levels=[];
 while(p.level<CONFIG.levelCap&&p.xp>=xpRequired(p.level)){p.xp-=xpRequired(p.level);p.level++;p.points++;levels.push(p.level);if(CONFIG.cardLevels.includes(p.level))p.pending.push(p.level);}
 if(p.level===CONFIG.levelCap)p.xp=0;unlock(p);p.revision++;return levels;
}
export function allocate(p,key){if(!(key in ATTRIBUTES)||p.points<=0)return false;p.attributes[key]++;p.points--;p.revision++;return true;}
function spellCard(element,slot,p){const rank=p.ranks[element][slot-1],next=Math.min(4,rank+1),a=RANKS[rank],b=RANKS[next];return {id:`rank:${element}:${slot}`,name:`${SPELL_NAMES[element][slot-1]} ${RANK_LABELS[next]}`,category:'SPELL',rarity:next===4?'rare':'uncommon',icon:'✦',element,slot,spell:true,rank,next,description:`Damage +${Math.round((b.damage/a.damage-1)*100)}%; radius +${Math.round((b.radius/a.radius-1)*100)}%; mana cost −${Math.round((1-b.cost/a.cost)*100)}%. Charge/projectiles improve.${next===4?' '+FINISHERS[element][slot-1]:''}`};}
export function cardDefinition(id,p){if(typeof id!=='string')return null;if(id.startsWith('rank:')){const [,e,s]=id.split(':');return ELEMENTS.includes(e)&&[1,2,3].includes(Number(s))?spellCard(e,Number(s),p):null;}return CARDS.find(c=>c.id===id)||null;}
export function eligible(c,p,element){if(c.element&&c.element!==element)return false;if(c.requires?.some(id=>!p.cards.includes(id)))return false;
 return c.spell?p.level>=CONFIG.unlocks[c.slot]&&p.ranks[c.element][c.slot-1]<4:p.cards.filter(id=>id===c.id).length<(c.max||1);}
export function ensureOffer(p,element,rng=Math.random){if(!p.pending.length)return null;if(p.offer)return p.offer;
 const pool=[...CARDS,...(ELEMENTS.includes(element)?[1,2,3].map(s=>spellCard(element,s,p)):[])].filter(c=>eligible(c,p,element));const ids=[];
 while(pool.length&&ids.length<3){const total=pool.reduce((n,c)=>n+CONFIG.rarityWeights[c.rarity],0);let r=clamp(rng(),0,.999999)*total,index=0;for(;index<pool.length-1;index++){r-=CONFIG.rarityWeights[pool[index].rarity];if(r<0)break;}ids.push(pool.splice(index,1)[0].id);}
 if(ids.length!==3)return null;p.offer={level:p.pending[0],element,ids};p.revision++;return p.offer;
}
export function chooseCard(p,id,element){if(p.offer?.element&&p.offer.element!==element||!p.offer?.ids.includes(id))return false;const c=cardDefinition(id,p);if(!c||!eligible(c,p,element))return false;
 p.cards.push(id);if(c.spell)p.ranks[c.element][c.slot-1]++;p.pending.shift();p.offer=null;p.revision++;return true;}
export function cardMods(p,element){const m={};for(const id of p?.cards||[]){const c=CARDS.find(c=>c.id===id);if(!c||c.element&&c.element!==element)continue;for(const [k,v] of Object.entries(c.mods))m[k]=(m[k]||0)+v;}return m;}
export function stats(p){const a=p?.attributes||{},s=CONFIG.attributes,b=CONFIG.base,m=cardMods(p);const dr=(v,k)=>v/(v+k);const ag=a.agility||0,co=a.control||0,re=a.resilience||0;
 return {hp:b.hp+(a.vitality||0)*s.vitality.hp+(m.hp||0),mana:b.mana+(a.focus||0)*s.focus.mana+(m.mana||0),regen:b.regen+(a.focus||0)*s.focus.regen+(m.regen||0),damage:1+s.arcana.damage*dr(a.arcana||0,s.arcana.knee),cooldown:1-Math.min(CONFIG.caps.cooldownReduction,s.control.cooldown*dr(co,s.control.knee)+(m.cooldown||0)),dash:1-Math.min(CONFIG.caps.dashReduction,s.agility.dash*dr(ag,s.agility.knee)+(m.dash||0)),movement:Math.min(CONFIG.caps.movement,1+Math.floor(ag/s.agility.movementStep)*s.agility.movementBonus+(m.movement||0)),charge:1+s.control.charge*dr(co,s.control.knee),reduction:Math.min(CONFIG.caps.resilience,s.resilience.reduction*dr(re,s.resilience.knee)),resistance:Math.min(CONFIG.caps.statusResistance,s.resilience.status*dr(re,s.resilience.knee)),dashCharges:1+(m.dashCharges||0),killMana:m.killMana||0};}
export function spellModifiers(player,element,slot){const p=player.progression;if(!p)return {damage:1,radius:1,duration:1,cost:1,charge:1,speed:1,status:1,cooldown:1,rank:0};const s=stats(p),m=cardMods(p,element),rank=p.ranks[element]?.[slot-1]||0,r=RANKS[rank],cap=CONFIG.caps;
 return {damage:Math.min(cap.damage,s.damage*r.damage*(1+(m.damage||0))),radius:Math.min(cap.radius,r.radius*(1+(m.radius||0))),duration:Math.min(cap.duration,r.duration*(1+(m.duration||0))),cost:Math.max(1-cap.manaReduction,r.cost*(1-(m.cost||0))),charge:Math.min(cap.charge,s.charge*r.charge*(1+(m.charge||0))),speed:Math.min(cap.projectile,r.speed*(1+(m.speed||0))),status:Math.min(cap.statusDuration,r.status*(1+(m.status||0))),cooldown:s.cooldown,rank,enhancement:rank===4?ENHANCEMENTS[element]?.[slot-1]||{}:{},conductive:m.conductive||0};}
export function syncStats(player,fill=false){const s=stats(player.progression);const delta=Math.max(0,s.hp-(player.maxHealth||100));player.maxHealth=s.hp;player.health=fill?s.hp:Math.min(s.hp,player.health+delta);player.maxMana=s.mana;player.mana=fill?s.mana:Math.min(s.mana,player.mana??s.mana);player.progressionStats=s;player.dashMaxCharges=s.dashCharges;player.dashCharges=Math.min(s.dashCharges,player.dashCharges??s.dashCharges);return s;}
export function payMana(player,slot,mods){if(!player.progression)return true;const cost=CONFIG.manaCosts[slot]*mods.cost;if((player.mana||0)+1e-8<cost)return false;player.mana-=cost;return true;}
export const damageContext=(player,slot)=>({ownerId:player.actorId,aim:player.aim,slot,mods:spellModifiers(player,player.element,slot)});
export function xpReward(kind,level){const x=CONFIG.xp;return Math.max(1,Math.round((x.rewards[kind]||0)*Math.max(x.minimumMultiplier,1-Math.max(0,level-(x.enemyLevels[kind]||1)-x.underlevelGrace)*x.underlevelDecay)));}
// Called before encounter wave replacement: each dead target is rewarded once.
export function rewardEncounter(actors,targets,encounter){for(const t of targets){if(t.health>0||t.xpAwarded||!t.kind)continue;t.xpAwarded=true;
 for(const [id,damage] of Object.entries(t.participants||{})){const a=actors.get(id);if(!a||damage<t.maxHealth*CONFIG.xp.participation)continue;grantXP(a.player.progression,xpReward(t.kind,a.player.progression.level));a.player.mana=Math.min(a.player.maxMana,a.player.mana+stats(a.player.progression).killMana);encounter.progressionParticipants??=new Set();encounter.progressionParticipants.add(id);}}
 if(encounter.complete&&!encounter.xpAwarded){encounter.xpAwarded=true;for(const id of encounter.progressionParticipants||[]){const p=actors.get(id)?.player.progression;if(!p)continue;const first=!p.clears.includes('rift-arena');const multiplier=Math.max(CONFIG.xp.minimumMultiplier,1-Math.max(0,p.level-CONFIG.xp.areaLevel-CONFIG.xp.underlevelGrace)*CONFIG.xp.underlevelDecay);grantXP(p,Math.round(CONFIG.xp.area*multiplier)+(first?CONFIG.xp.firstClear:0));if(first)p.clears.push('rift-arena');}}}
