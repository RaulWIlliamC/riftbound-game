import {abilityUnlocked,payMana,damageContext} from './progression/progression.js';
import {firstSpellCooldown} from './balance.js?v=progression-1';
import {aimFrom} from './aim.js?v=progression-1';
import {NO_COOLDOWNS} from './testing.js?v=progression-1';
import {damageSpell} from './combat.js?v=progression-1';
import {DEFAULT_WORLD_BOUNDS,SPELL_CAST_DURATION,SPELL_CAST_WINDUP} from './player.js?v=progression-1';
export const FIRST_SPELLS={fire:'Flame Pillar',earth:'Stone Spikes',water:'Ice Lance',lightning:'Thunder Strike',wind:'Wind Blade'};
export const FIRST_SPELL_COOLDOWN=firstSpellCooldown(null);
export class FirstSpells {
  constructor(onRelease,onImpact,{noCooldowns=NO_COOLDOWNS}={}){this.worldBounds=DEFAULT_WORLD_BOUNDS;this.noCooldowns=noCooldowns;this.cooldownDuration=firstSpellCooldown(null,noCooldowns);this.onRelease=onRelease;this.onImpact=onImpact;this.impacts=[];this.cooldown=0;this.effects=[];this.pending=null;this.releases=[];}
  cast(player,origin,target){
    if(!FIRST_SPELLS[player.element]||this.cooldown>0||player.spellChannel||player.charging||player.castTime>0||!origin)return false;
    if(!abilityUnlocked(player,1))return false;
    const context=damageContext(player,1);if(!payMana(player,1,context.mods))return false;
    this.cooldownDuration=firstSpellCooldown(player.element,this.noCooldowns)*context.mods.cooldown;
    const element=player.element,projectile=element==='water'||element==='wind';
    const x=Math.max(this.worldBounds.left,Math.min(this.worldBounds.right,target.x));
    const y=Math.max(this.worldBounds.top,Math.min(this.worldBounds.bottom,target.y));
    this.pending={context,element,x,y,aim:player.aim,target:{...target},projectile,origin,player,age:0};
    this.cooldown=this.cooldownDuration;
    player.castStyle=null;player.castTime=SPELL_CAST_DURATION/context.mods.charge;player.castAim=player.aim;player.attackTime=0;player.releaseTime=0;
    return true;
  }
  update(dt,getOrigin,targets=[]){
    this.cooldown=Math.max(0,this.cooldown-dt);
    for(const hit of this.impacts)hit.life-=dt;
    this.impacts=this.impacts.filter(hit=>hit.life>0);
    for(const release of this.releases)release.age+=dt;
    this.releases=this.releases.filter(release=>release.age<.22);
    for(const effect of this.effects){
      const before=effect.age;effect.previousAge=before;effect.previous={x:effect.x,y:effect.y};effect.age+=dt;
      if(!effect.projectile && before<.16 && effect.age>=.16)this.onImpact?.(effect.element,{spell:'first',x:effect.x,y:effect.y});
      if(effect.projectile){const speed=(effect.element==='water'?680:560)*(effect.context?.mods?.speed||1);effect.x+=Math.cos(effect.aim)*speed*dt;effect.y+=Math.sin(effect.aim)*speed*dt;
        if(effect.x<this.worldBounds.left||effect.x>this.worldBounds.right||effect.y<this.worldBounds.top||effect.y>this.worldBounds.bottom){effect.x=Math.max(this.worldBounds.left,Math.min(this.worldBounds.right,effect.x));effect.y=Math.max(this.worldBounds.top,Math.min(this.worldBounds.bottom,effect.y));effect.age=effect.life;this.onImpact?.(effect.element,{spell:'first',x:effect.x,y:effect.y});this.impacts.push({element:effect.element,x:Math.max(this.worldBounds.left,Math.min(this.worldBounds.right,effect.x)),y:Math.max(this.worldBounds.top,Math.min(this.worldBounds.bottom,effect.y)),life:.24});}
      }
    }
    for(const effect of this.effects){const before=effect.hitTargets?.size||0;damageSpell(effect,targets);if(effect.projectile&&(effect.hitTargets?.size||0)>before)this.onImpact?.(effect.element,{spell:'first',x:effect.x,y:effect.y});}
    if(this.pending){
      this.pending.age+=dt;
      if(this.pending.age>=SPELL_CAST_WINDUP/(this.pending.context?.mods?.charge||1)){
        const p=this.pending;this.onRelease?.(p.element,{spell:'first',x:p.origin.x,y:p.origin.y});const origin=getOrigin?.(p.player)||p.origin;
        const aim=aimFrom(origin,p.projectile?p.target:{x:p.x,y:p.y},p.aim);
        this.effects.push({context:p.context,element:p.element,x:p.projectile?origin.x:p.x,y:p.projectile?origin.y:p.y,aim,projectile:p.projectile,origin:{...origin},age:0,life:p.element==='earth'?1.65:p.element==='fire'?1.3:p.element==='lightning'?.8:Math.max(1.05,Math.hypot(p.target.x-origin.x,p.target.y-origin.y)/(p.element==='water'?680:560)+.15)});
        this.releases.push({element:p.element,x:origin.x,y:origin.y,aim,targetX:p.x,targetY:p.y,projectile:p.projectile,age:0});this.pending=null;
      }
    }
    this.effects=this.effects.filter(effect=>effect.age<effect.life);
  }
}
