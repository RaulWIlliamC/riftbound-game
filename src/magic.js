import {aimFrom} from './aim.js?v=progression-1';
import {damageProjectile} from './combat.js?v=progression-1';
import { DEFAULT_WORLD_BOUNDS } from './player.js?v=progression-1';
import { drawSpell, drawImpact } from './spell-art.js?v=progression-1';
const SPEED={neutral:700,fire:740,water:620,earth:560,wind:820,lightning:1100};
export class Magic {
  constructor(onImpact){this.worldBounds=DEFAULT_WORLD_BOUNDS;this.shots=[];this.impacts=[];this.onImpact=onImpact;}
  launch(origin,shot){
    if(!origin)return;
    this.shots.push({...shot,aim:shot.target?aimFrom(origin,shot.target,shot.aim):shot.aim,x:origin.x,y:origin.y,age:0,life:shot.target?Math.max(1.25,Math.hypot(shot.target.x-origin.x,shot.target.y-origin.y)/(SPEED[shot.element]||700)+.15):1.25,
      speed:(SPEED[shot.element]||700)*(shot.context?.mods?.speed||1)});
    this.shots=this.shots.slice(-16);
  }
  update(dt,targets=[]){
    for(const hit of this.impacts)hit.life-=dt;
    this.impacts=this.impacts.filter(hit=>hit.life>0);
    for(const shot of this.shots){
      shot.previous={x:shot.x,y:shot.y};
      shot.age+=dt;shot.life-=dt;
      shot.x+=Math.cos(shot.aim)*shot.speed*dt;shot.y+=Math.sin(shot.aim)*shot.speed*dt;
      if(shot.x<this.worldBounds.left||shot.x>this.worldBounds.right||shot.y<this.worldBounds.top||shot.y>this.worldBounds.bottom){
        shot.x=Math.max(this.worldBounds.left,Math.min(this.worldBounds.right,shot.x));
        shot.y=Math.max(this.worldBounds.top,Math.min(this.worldBounds.bottom,shot.y));
        this.onImpact?.(shot.element,{spell:'bolt',power:shot.power,x:shot.x,y:shot.y});
        this.impacts.push({x:shot.x,y:shot.y,element:shot.element,life:.24});shot.life=0;
      }
      const before=shot.hitTargets?.size||0;damageProjectile(shot,targets);if((shot.hitTargets?.size||0)>before)this.onImpact?.(shot.element,{spell:'bolt',power:shot.power,x:shot.x,y:shot.y});
    }
    this.shots=this.shots.filter(shot=>shot.life>0);
    this.impacts=this.impacts.slice(-16);
  }
}
export function drawMagic(ctx,magic){
  for(const shot of magic.shots){
    ctx.save();ctx.translate(Math.round(shot.x),Math.round(shot.y));ctx.rotate(shot.aim);
    const strength=(.85+shot.power*.45)*(shot.context?.mods?.radius||1);
    ctx.scale(strength,strength);
    drawSpell(ctx,shot.element,shot.age);
    ctx.restore();
  }
  for(const hit of magic.impacts)drawImpact(ctx,hit);
}
