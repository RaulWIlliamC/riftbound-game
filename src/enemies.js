import {dealDamage,segmentDistanceSquared,targetMovementScale} from './combat.js?v=progression-1';

export const ENEMIES={
 mossImp:{name:'Moss Imp',health:60,speed:86,radius:12,reach:78,slamRadius:44,windup:.55,recovery:1.6,damage:9},
 runeWisp:{name:'Rune Wisp',health:55,speed:90,radius:11,reach:420,windup:.85,recovery:2.2,damage:11},
 mossGuardian:{name:'Moss Guardian',health:135,speed:44,radius:18,reach:105,slamRadius:65,windup:.85,recovery:2.2,damage:16},
 riftling:{name:'Riftling',health:65,speed:105,radius:12,reach:125,windup:.48,recovery:1.2,damage:10},
 guardian:{name:'Ruined Guardian',health:240,speed:48,radius:23,reach:115,slamRadius:104,windup:.95,recovery:2.1,damage:24},
 slime:{name:'Bog Slime',health:140,speed:55,radius:19,reach:110,puddleRadius:75,windup:.7,recovery:2.4,damage:12},
 archer:{name:'Ash Archer',health:110,speed:68,radius:14,reach:500,windup:.8,recovery:1.7,damage:14},
 seer:{name:'Rift Seer',health:150,speed:54,radius:15,reach:450,windup:.95,recovery:2.7,damage:12},
 sentinel:{name:'Broken Sentinel',health:1200,speed:38,radius:42,reach:240,windup:1.25,recovery:2.8,damage:32}
};
const WAVES=[
 [['mossImp',720,640],['mossImp',1080,640],['runeWisp',720,420],['runeWisp',1080,420],['mossGuardian',900,550]],
 [['riftling',720,480],['riftling',1070,490],['riftling',620,680],['riftling',1200,780],['guardian',1030,350]],
 [['slime',650,480],['slime',1180,800],['archer',1160,390],['archer',650,880],['seer',1040,510]],
 [['sentinel',900,390]]
];
export const WAVE_NAMES=['WHISPERING RUINS','THE RUINED SWARM','THE BOG COVEN','BROKEN SENTINEL'];
export function createEnemy(kind,x,y,id){
 const c=ENEMIES[kind];return {id,kind,x,y,spawnX:x,spawnY:y,health:c.health,maxHealth:c.health,radius:c.radius,hurtOffsetY:kind==='sentinel'?-42:-20,
 state:'idle',timer:0,clock:0,moveClock:0,moving:false,deathTime:null,cooldown:0,flash:0,lift:0,attackCount:0,captureImmune:kind==='sentinel',slamResolved:false,aimPoint:{x,y},facing:1};
}
export function hurtPlayer(p,damage){
 if(p.progressionOpen||p.health<=0||p.dashTime>0||p.state==='dashing'||p.invulnerable>0)return false;
 p.health=Math.max(0,(p.health??100)-Math.round(damage*(1-(p.progressionStats?.reduction||0))));p.invulnerable=.65;p.hitFlash=.2;
 if(p.health===0){p.downTime=3;p.charging=false;p.holdTime=0;p.charge=0;p.attackTime=0;p.castTime=0;p.dashTime=0;p.shotQueued=null;}
 return true;
}
function moveTowards(e,point,distance){const dx=point.x-e.x,dy=point.y-e.y,d=Math.hypot(dx,dy);if(d){const step=Math.min(d,Math.max(0,distance));e.x+=dx/d*step;e.y+=dy/d*step;}}
function constrain(e){const b=e.worldBounds||{left:54,top:54,right:1746,bottom:1246};e.x=Math.max(b.left+e.radius,Math.min(b.right-e.radius,e.x));e.y=Math.max(b.top+e.radius,Math.min(b.bottom-e.radius,e.y));}
export class EnemyEncounter {
 constructor({waves=WAVES,bounds=null,groundScale=1,regional=false,spawnPoint={x:900,y:1040},terrainMove=null}={}){this.terrainMove=terrainMove;this.waves=waves;this.bounds=bounds;this.groundScale=groundScale;this.regional=regional;this.spawnPoint=spawnPoint;this.reset();}
 reset(){this.wave=0;this.complete=false;this.xpAwarded=false;this.progressionParticipants=new Set();this.nextWaveTime=null;this.hazards=[];this.serial=0;this.intro=1.8;this.targets=this.spawnWave();}
 spawnWave(){return this.waves[this.wave].map(([kind,x,y],i)=>({...createEnemy(kind,x,y,`${this.regional?'ruins':'wave'}-${this.wave}-${i}`),...(this.bounds?{worldBounds:this.bounds}:{})}));}
 snapshot(){return {wave:this.wave,complete:this.complete,intro:this.intro,groundScale:this.groundScale,hazards:this.hazards};}
 update(dt,players){
  for(const p of players){
   p.invulnerable=Math.max(0,(p.invulnerable||0)-dt);p.hitFlash=Math.max(0,(p.hitFlash||0)-dt);p.slowTime=Math.max(0,(p.slowTime||0)-dt);
   if(p.health<=0){p.downTime=Math.max(0,p.downTime-dt);if(p.downTime===0){p.health=p.maxHealth;p.x=this.spawnPoint.x;p.y=this.spawnPoint.y;p.invulnerable=2;p.slowTime=0;}}
  }
  const livePlayers=players.filter(p=>p.health>0);
  const previousPositions=this.targets.map(e=>({e,x:e.x,y:e.y}));
  for(const e of this.targets){
   e.flash=Math.max(0,e.flash-dt);e.clock+=dt;e.moving=false;
   if(e.health<=0)e.deathTime=e.deathTime===null?0:e.deathTime+dt;
   const burning=Math.min(dt,e.burnTime||0);e.burnTime=Math.max(0,(e.burnTime||0)-dt);
   if(e.health>0&&burning){e.burnTick=(e.burnTick||0)+burning;if(e.burnTick>=1||e.burnTime===0){dealDamage(e,e.burnTick*(e.burnDps||6),'fire',e.burnContext);e.burnTick=0;}}
   e.slowEffectTime=Math.max(0,(e.slowEffectTime||0)-dt);e.wetTime=Math.max(0,(e.wetTime||0)-dt);e.shieldSource=null;e.shielded=false;
  }
  // Shields come from a live, un-captured seer; killing it removes mitigation immediately.
  for(const seer of this.targets.filter(e=>e.kind==='seer'&&e.health>0&&!e.capturedBy))for(const e of this.targets){
   if(e!==seer&&e.health>0&&e.kind!=='seer'&&Math.hypot(e.x-seer.x,e.y-seer.y)<210){e.shieldSource=seer;e.shielded=true;}
  }
  this.updateHazards(dt,livePlayers);
  this.intro=Math.max(0,this.intro-dt);
  if(this.complete)return;
  if(this.targets.every(e=>e.health<=0)){
   this.nextWaveTime=(this.nextWaveTime??2)-dt;
   if(this.nextWaveTime<=0){this.nextWaveTime=null;this.hazards=[];if(this.wave===this.waves.length-1)this.complete=true;else{this.wave++;this.targets=this.spawnWave();this.intro=1.8;}}
   return;
  }
  if(this.intro>0)return;
  for(const e of this.targets){
   if(e.health<=0)continue;
   if(e.capturedBy){e.state='idle';e.timer=0;e.cooldown=Math.max(e.cooldown,.5);continue;}
   e.lift=0;
   if(e.velocity){const scale=targetMovementScale(e);e.x+=e.velocity.x*dt*scale;e.y+=e.velocity.y*dt*scale;const decay=Math.exp(-dt*6);e.velocity.x*=decay;e.velocity.y*=decay;if(Math.hypot(e.velocity.x,e.velocity.y)<2)e.velocity=null;constrain(e);e.state='idle';e.cooldown=Math.max(e.cooldown,.4);continue;}
   const candidates=this.regional?livePlayers.filter(p=>Math.hypot(p.x-e.spawnX,p.y-e.spawnY)<420):livePlayers;
   if(this.regional&&!candidates.length){e.state='idle';e.timer=0;e.cooldown=Math.max(0,e.cooldown-dt);moveTowards(e,{x:e.spawnX,y:e.spawnY},ENEMIES[e.kind].speed*dt);constrain(e);continue;}
   const target=candidates.reduce((best,p)=>!best||Math.hypot(p.x-e.x,p.y-e.y)<Math.hypot(best.x-e.x,best.y-e.y)?p:best,null);
   if(!target)continue;
   const c=ENEMIES[e.kind];if(!(['guardian','slime','archer','seer','mossImp','runeWisp','mossGuardian'].includes(e.kind)&&['windup','slam','slimeAttack','archerShot','seerCast','ruinsAttack'].includes(e.state)))e.facing=target.x<e.x?-1:1;e.cooldown=Math.max(0,e.cooldown-dt);
   if(e.state==='windup'){
    e.timer-=dt;if(e.timer<=0)this.attack(e,c,livePlayers);continue;
   }
   if(e.state==='ruinsAttack'){
    e.timer-=dt;
    if(!e.slamResolved&&e.timer<=.3){
     if(e.kind==='runeWisp')this.projectile(e,c,0,'rune',230);
     else{
      this.area(e.aimPoint.x,e.aimPoint.y,c.slamRadius,c.damage,livePlayers,'slam',e.kind);
      // Root swipe briefly slows players who remain in its marked footprint.
      if(e.kind==='mossImp')for(const p of livePlayers){
       if(p.dashTime<=0&&p.state!=='dashing'&&!p.progressionOpen&&Math.hypot(p.x-e.aimPoint.x,(p.y-e.aimPoint.y)/this.groundScale)<c.slamRadius+14)p.slowTime=Math.max(p.slowTime,.8);
      }
     }
     e.slamResolved=true;
    }
    if(e.timer<=0){e.state='recover';e.timer=.35;}continue;
   }
   if(e.state==='slam'){
    e.timer-=dt;if(!e.slamResolved&&e.timer<=.3){this.area(e.aimPoint.x,e.aimPoint.y,c.slamRadius,c.damage,livePlayers,'slam',e.kind,{x:e.x-42*(e.facing||1),y:e.y-4});e.slamResolved=true;}
    if(e.timer<=0)e.state='idle';continue;
   }
   if(e.state==='seerCast'){
    e.timer-=dt;if(!e.slamResolved&&e.timer<=.3){
     if(e.attackKind==='shield')this.hazards.push({id:++this.serial,kind:'shieldPulse',x:e.x,y:e.y,radius:210,life:.6});
     else this.projectile(e,c,0,'rift',200);
     e.slamResolved=true;
    }
    if(e.timer<=0){e.state='recover';e.timer=.3;}continue;
   }
   if(e.state==='archerShot'){
    e.timer-=dt;if(!e.slamResolved&&e.timer<=.3){
     const inferno=e.attackKind==='inferno';this.projectile(e,{damage:inferno?22:c.damage},0,inferno?'inferno':'ember',inferno?420:340);e.slamResolved=true;
    }
    if(e.timer<=0){e.state='recover';e.timer=.3;}continue;
   }
   if(e.state==='slimeAttack'){
    e.timer-=dt;
    if(e.attackKind==='bash'&&!e.slamResolved){moveTowards(e,e.aimPoint,340*dt);constrain(e);}
    if(!e.slamResolved&&e.timer<=.3){
     this.area(e.x,e.y,e.attackKind==='puddle'?c.puddleRadius:55,c.damage,livePlayers,'splash');
     if(e.attackKind==='puddle')this.hazards.push({id:++this.serial,kind:'puddle',x:e.x,y:e.y,radius:c.puddleRadius,life:5});
     e.slamResolved=true;
    }
    if(e.timer<=0){e.state='recover';e.timer=.35;}continue;
   }
   if(e.state==='pounce'){
    e.timer-=dt;moveTowards(e,e.aimPoint,460*dt);constrain(e);
    if(e.state==='pounce'&&e.timer<=.16)for(const p of livePlayers)if(Math.hypot(p.x-e.x,p.y-e.y)<e.radius+14&&hurtPlayer(p,c.damage))this.hazards.push({id:++this.serial,kind:'impact',source:'riftling',angle:Math.atan2(e.aimPoint.y-e.y,e.aimPoint.x-e.x),x:p.x,y:p.y,radius:28,life:.5});
    if(e.timer<=0){
     e.state='recover';e.timer=.35;e.cooldown=c.recovery;
    }continue;
   }
   if(e.state==='recover'||e.state==='exposed'){
    e.timer-=dt;if(e.timer<=0)e.state='idle';continue;
   }
   const distance=Math.hypot(e.x-target.x,e.y-target.y);
   if(distance<=c.reach&&e.cooldown===0){
    e.state='windup';e.timer=c.windup;e.aimPoint={x:target.x,y:target.y};e.attackKind=e.kind==='seer'?(e.attackCount%2===1&&this.targets.some(ally=>ally!==e&&ally.kind!=='seer'&&ally.health>0&&Math.hypot(ally.x-e.x,ally.y-e.y)<210)?'shield':'bolt'):e.kind==='archer'?(e.attackCount%3===2?'inferno':'fire'):e.kind==='slime'?(e.attackCount%2===0?'puddle':'bash'):e.kind==='sentinel'&&e.attackCount%2===1?'blast':'slam';if(e.kind==='archer'&&e.attackKind==='inferno')e.timer=1.15;
   }else{
    const ranged=e.kind==='archer'||e.kind==='seer'||e.kind==='runeWisp',speed=c.speed*targetMovementScale(e)*dt;
    if(ranged&&distance<180)moveTowards(e,{x:e.x+(e.x-target.x),y:e.y+(e.y-target.y)},speed);
    else if(distance>(ranged?300:55))moveTowards(e,target,speed);
    constrain(e);
   }
  }
  // Soft separation keeps swarms readable without forcing captured creatures apart.
  const live=this.targets.filter(e=>e.health>0&&!e.capturedBy);
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
   const a=live[i],b=live[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy),min=a.radius+b.radius;
   if(d>0&&d<min){const push=Math.min((min-d)/2,45*dt);a.x+=dx/d*push;a.y+=dy/d*push;b.x-=dx/d*push;b.y-=dy/d*push;constrain(a);constrain(b);}
  }
  for(const {e,x,y} of previousPositions){if(this.terrainMove&&!e.capturedBy)this.terrainMove(e,{x,y},e.radius);const distance=Math.hypot(e.x-x,e.y-y);e.moving=e.health>0&&!e.capturedBy&&!e.velocity&&e.state==='idle'&&distance>dt*5;if(e.moving)e.moveClock+=distance/ENEMIES[e.kind].speed;}
 }
 attack(e,c,players){
  e.attackCount++;e.cooldown=c.recovery;
  if(['mossImp','runeWisp','mossGuardian'].includes(e.kind)){e.state='ruinsAttack';e.timer=.6;e.slamResolved=false;return;}
  if(e.kind==='riftling'){e.state='pounce';e.timer=.32;return;}
  if(e.kind==='slime'){e.state='slimeAttack';e.timer=.6;e.slamResolved=false;return;}
  if(e.kind==='seer'){e.state='seerCast';e.timer=.6;e.slamResolved=false;return;}
  if(e.kind==='archer'){e.state='archerShot';e.timer=.6;e.slamResolved=false;return;}
  if(e.kind==='guardian'){e.state='slam';e.timer=.6;e.slamResolved=false;return;}
  if(e.kind==='sentinel'){
   if(e.attackKind==='blast')for(const offset of [-.3,0,.3])this.projectile(e,c,offset,'core',270);
   else this.area(e.aimPoint.x,e.aimPoint.y,115,c.damage,players,'slam',e.kind);
   e.state='exposed';e.timer=2.6;return;
  }
  e.state='recover';e.timer=.45;
 }
 projectile(e,c,offset,element,speed){
  const aim=Math.atan2(e.aimPoint.y-e.y,e.aimPoint.x-e.x)+offset;
  this.hazards.push({id:++this.serial,kind:'projectile',element,x:e.x,y:e.y,dx:Math.cos(aim)*speed,dy:Math.sin(aim)*speed,radius:element==='ember'?7:element==='inferno'?9:11,damage:c.damage,life:3.5});
 }
 area(x,y,radius,damage,players,kind,source,origin){for(const p of players)if(Math.hypot(p.x-x,(p.y-y)/this.groundScale)<radius+14)hurtPlayer(p,damage);this.hazards.push({id:++this.serial,kind,source,x,y,radius,life:.5,...(origin?{origin}: {})});}
 updateHazards(dt,players){
  for(const h of this.hazards){
   h.life-=dt;
   if(h.kind==='puddle'){for(const p of players)if(Math.hypot(p.x-h.x,p.y-h.y)<h.radius+10&&p.dashTime<=0)p.slowTime=.25;}
   if(h.kind==='projectile'){
    const previous={x:h.x,y:h.y};h.x+=h.dx*dt;h.y+=h.dy*dt;
    for(const p of players)if(segmentDistanceSquared(p,previous,h)<(h.radius+14)**2){if(hurtPlayer(p,h.damage)){h.life=0;this.hazards.push({id:++this.serial,kind:'impact',element:h.element,x:h.x,y:h.y,radius:h.element==='inferno'?42:28,life:.5});break;}}
    const b=this.bounds||{left:40,top:40,right:1760,bottom:1260};if(h.x<b.left||h.x>b.right||h.y<b.top||h.y>b.bottom)h.life=0;
   }
  }
  this.hazards=this.hazards.filter(h=>h.life>0).slice(-64);
 }
}
