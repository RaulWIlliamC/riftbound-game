import {attackCooldown,chargedAttackCooldown,effectiveCooldown,DASH_COOLDOWN} from './balance.js?v=progression-1';
import {NO_COOLDOWNS} from './testing.js?v=progression-1';
import {CONFIG} from './progression/config.js';
export const ARENA = { width: 1800, height: 1300, wall: 40 };
export const DEFAULT_WORLD_BOUNDS=Object.freeze({left:ARENA.wall,top:ARENA.wall,right:ARENA.width-ARENA.wall,bottom:ARENA.height-ARENA.wall});
export const MOTION = { walk: 170, run: 280, dash: 860, dashDuration: 0.16, dashCooldown: effectiveCooldown(DASH_COOLDOWN), radius: 14 };
export const CHARGE = {threshold:.3, buildTime:1, speed:52};
export const STAFF_ATTACK_DURATION = 0.52;
export const SPELL_CAST_DURATION=.5;
export const SPELL_CAST_WINDUP=.18;
function spendMana(player,cost){
 if(player.mana+1e-8<cost)return false;
 player.mana=Math.max(0,player.mana-cost);return true;
}
export class Player {
  constructor({noCooldowns=NO_COOLDOWNS}={}) {
    this.dashCooldownDuration=effectiveCooldown(DASH_COOLDOWN,noCooldowns);this.chargedAttackCooldownDuration=chargedAttackCooldown(noCooldowns);this.attackCooldownDuration=attackCooldown(noCooldowns);this.attackCooldown=0;
    this.health=100;this.maxHealth=100;this.invulnerable=0;this.hitFlash=0;this.slowTime=0;this.downTime=0;
    this.mana=CONFIG.base.mana;this.maxMana=CONFIG.base.mana;
    this.worldBounds=DEFAULT_WORLD_BOUNDS;this.visualScale=1;
    this.x = ARENA.width / 2;
    this.y = ARENA.height / 2;
    this.aim = 0;
    this.phase = 0;
    this.time = 0;
    this.state = 'idle';
    this.visualDirection = { x: 0, y: 0 };
    this.trails = [];
    this.footfalls = [];
    this.trailClock = 0;
    this.thirdChannel=false;this.thirdCastAge=0;
    this.attackTime = 0;
    this.castTime=0;this.castAim=0;
    this.holdTime=0;this.charging=false;this.charge=0;this.shotQueued=null;this.releaseTime=0;
    this.dashTime = 0;
    this.cooldown = 0;
    this.dashDirection = { x: 1, y: 0 };
  }
  update(dt, input) {
    this.time += dt;
    this.attackCooldown=Math.max(0,this.attackCooldown-dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if(this.progression){this.mana=Math.min(this.maxMana,this.mana+this.progressionStats.regen*dt);if(this.dashCharges<this.dashMaxCharges&&this.cooldown===0){this.dashCharges++;if(this.dashCharges<this.dashMaxCharges)this.cooldown=this.dashCooldownDuration;}}
    this.attackTime = Math.max(0, this.attackTime - dt);
    this.castTime=Math.max(0,this.castTime-dt);
    this.releaseTime=Math.max(0,this.releaseTime-dt);
    if(this.castTime>0||this.spellChannel){this.holdTime=0;this.charging=false;this.charge=0;}
    else if(input.attackCancelled) {this.holdTime=0;this.charging=false;this.charge=0;}
    else if(input.attackHeld && this.attackCooldown===0) {
      this.holdTime+=dt;
      this.charging=this.holdTime-CHARGE.threshold>1e-8;
      this.charge=this.charging?Math.min(1,(this.holdTime-CHARGE.threshold)/CHARGE.buildTime):0;
      if(this.charging) {this.attackTime=0;this.dashTime=0;}
    } else if(input.attackReleased && this.attackCooldown===0) {
      if(this.charging) {
        const cost=this.charge>=1-1e-8?CONFIG.actionManaCosts.fullyChargedM1:0;
        if(spendMana(this,cost)){
          this.shotQueued={aim:this.hasAim?this.aim:Math.PI/2,element:this.element||'neutral',power:this.charge};
          if(this.hasAim && this.aimTarget)this.shotQueued.target={...this.aimTarget};
          this.releaseTime=.20;this.attackCooldown=this.chargedAttackCooldownDuration;
        }
      } else if(this.holdTime>0 || input.attack) {
        if(this.attackTime===0) {this.attackCooldown=this.attackCooldownDuration;this.attackTime=STAFF_ATTACK_DURATION;this.attackAim=this.hasAim?this.aim:Math.PI/2;}
      }
      this.holdTime=0;this.charging=false;this.charge=0;
    }
    // Direct attack intent is retained for non-pointer controllers.
    if (!this.spellChannel && this.castTime===0 && this.attackCooldown===0 && input.attack && input.attackHeld===undefined && this.attackTime === 0) {
      this.attackCooldown=this.attackCooldownDuration;
      this.attackTime = STAFF_ATTACK_DURATION;
      this.attackAim = this.hasAim ? this.aim : Math.PI / 2;
    }
    let dx = input.x;
    let dy = input.y;
    const length = Math.hypot(dx, dy);
    if (length) { dx /= length; dy /= length; }
    if (input.dash && !this.spellChannel && !this.charging && this.dashTime === 0 && (this.progression?this.dashCharges>0:this.cooldown===0) && spendMana(this,CONFIG.actionManaCosts.dash)) {
      this.dashTime = MOTION.dashDuration;
      if(this.progression){this.dashCharges--;if(this.cooldown===0)this.cooldown=this.dashCooldownDuration;}else this.cooldown = this.dashCooldownDuration;
      this.dashDirection = length ? { x: dx, y: dy } : { x: Math.cos(this.aim), y: Math.sin(this.aim) };
    }
    const dashing = this.dashTime > 0;
    this.visualDirection = dashing ? { ...this.dashDirection } : { x: dx, y: dy };
    this.state = this.spellChannel ? 'channeling' : this.charging ? 'charging' : dashing ? 'dashing' : length ? input.run ? 'running' : 'walking' : 'idle';
    if (dashing) {
      const travelTime = Math.min(dt, this.dashTime);
      this.x += this.dashDirection.x * MOTION.dash * travelTime;
      this.y += this.dashDirection.y * MOTION.dash * travelTime;
      this.dashTime = Math.max(0, this.dashTime - dt);
      this.trailClock -= dt;
      if (this.trailClock <= 0) {
        this.trails.push({ x:this.x,y:this.y,aim:this.aim,hasAim:this.hasAim,state:this.state,visualScale:this.visualScale,
          phase:this.phase,time:this.time,attackTime:0,element:this.element,
          visualDirection:{...this.visualDirection},life:0.2 });
        this.trailClock=0.04;
      }
    } else {
      const speed = this.spellChannel&&!(this.thirdChannel&&this.spellChannel==='lightning') ? 52 : this.charging ? CHARGE.speed : input.run ? MOTION.run : MOTION.walk;
      this.x += dx * speed * dt * (this.progressionStats?.movement||1) * (this.slowTime>0?1-.45*(1-(this.progressionStats?.resistance||0)):1);
      this.y += dy * speed * dt * (this.progressionStats?.movement||1) * (this.slowTime>0?1-.45*(1-(this.progressionStats?.resistance||0)):1);
    }
    const bounds=this.worldBounds;
    this.x = Math.max(bounds.left+MOTION.radius, Math.min(bounds.right-MOTION.radius, this.x));
    this.y = Math.max(bounds.top+MOTION.radius, Math.min(bounds.bottom-MOTION.radius, this.y));
    for (const trail of this.trails) trail.life -= dt;
    this.trails = this.trails.filter(trail => trail.life > 0).slice(-3);
    for(const puff of this.footfalls) puff.life-=dt;
    this.footfalls=this.footfalls.filter(puff=>puff.life>0);
    const previousStep=Math.floor(this.phase/Math.PI);
    if (length || dashing) this.phase += dt * (this.charging ? 5 : dashing ? 22 : input.run ? 18 : 11);
    const step=Math.floor(this.phase/Math.PI);
    if(this.state==='running' && step!==previousStep) {
      this.footfalls.push({x:this.x+(step%2?7:-7),y:this.y,dx:-dx,dy:-dy,life:.32});
      this.footfalls=this.footfalls.slice(-4);
    }
  }
}
