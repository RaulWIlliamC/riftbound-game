import {drawMagic} from './magic.js?v=progression-1';
import {drawFirstSpells} from './first-spell-art.js?v=progression-1';
import {drawSecondGround,drawSecondSpells} from './second-spell-art.js?v=progression-1';
import {drawThirdGround,drawThirdSpells} from './third-spell-art.js?v=progression-1';
import {drawSurfaceContact} from './spell-surface.js';

export function drawSpellGround(ctx,actor){
  const contact=(e,radius,trail=0)=>drawSurfaceContact(ctx,{...e,radius,trail,alpha:Math.min(1,Math.max(0,e.life===undefined?1:(e.life-e.age)/.2))});
  for(const s of actor.magic.shots)drawSurfaceContact(ctx,{...s,y:s.y+18,radius:18+s.power*12,trail:50});
  for(const e of actor.first.effects)contact({...e,y:e.y+(e.projectile?18:0)},e.projectile?24:60,e.projectile?100:0);
  for(const e of actor.second.effects)if(e.age>=0&&e.kind!=='dragon')contact({...e,y:e.y+(e.kind==='wave'?0:22)},e.kind==='wave'?85:e.radius||20,60);
  for(const b of actor.second.bursts)drawSurfaceContact(ctx,{...b,radius:b.radius*(.4+b.age/b.life),alpha:Math.max(0,1-b.age/b.life)});
  const channel=actor.second.channel;
  if(channel)drawSurfaceContact(ctx,{x:channel.player.x,y:channel.player.y,element:channel.element,radius:40+channel.power*25});
  drawSecondGround(ctx,actor.second);
  drawThirdGround(ctx,actor.third);
}

// Each body participates in the same painter's order as characters and scenery.
// These are render-only views: the authoritative spell arrays are never changed.
export function spellDepthItems(ctx,actor,firstOptions){
  const items=[],add=(y,draw)=>items.push({y,order:2,draw});
  for(const shot of actor.magic.shots)add(shot.y+18,()=>drawMagic(ctx,{shots:[shot],impacts:[]}));
  for(const hit of actor.magic.impacts)add(hit.y,()=>drawMagic(ctx,{shots:[],impacts:[hit]}));
  const first=(effects=[],releases=[],impacts=[])=>drawFirstSpells(ctx,{effects,releases,impacts},firstOptions);
  for(const e of actor.first.effects)add(e.y+(e.projectile?18:0),()=>first([e]));
  for(const e of actor.first.releases||[])add(e.y,()=>first([],[e]));
  for(const e of actor.first.impacts||[])add(e.y,()=>first([],[],[e]));
  const second=(effects=[],bursts=[],channel=null)=>drawSecondSpells(ctx,{effects,bursts,channel});
  if(actor.second.channel)add(actor.second.channel.player.y,()=>second([],[],actor.second.channel));
  for(const e of actor.second.effects)add(e.y??e.nodes?.at(-1)?.y??actor.player.y,()=>second([e]));
  for(const b of actor.second.bursts)add(b.y,()=>second([],[b]));
  for(const e of actor.third.effects||[]){
    if(e.element==='fire'){
      add(e.y,()=>drawThirdSpells(ctx,{effects:[{...e,meteors:[]}],bursts:[]}));
      for(const m of e.meteors||[])if(!m.impacted&&m.age>=0)add(m.y,()=>drawThirdSpells(ctx,{effects:[{...e,meteors:[m]}],bursts:[]}));
    }else add(e.y,()=>drawThirdSpells(ctx,{effects:[e],bursts:[]}));
  }
  for(const b of actor.third.bursts||[])add(b.y,()=>drawThirdSpells(ctx,{effects:[],bursts:[b]}));
  return items;
}
