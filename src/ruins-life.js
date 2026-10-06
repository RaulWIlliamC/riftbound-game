import {createPlacedEncounter} from './enemy-placement.js?v=enemy-editor-1';
import projectMap from '../assets/maps/whispering-ruins/collisions.js';
import {copyRuinsGroundMask} from './ruins-collision.js?v=map-library-1';
import {EnemyEncounter,ENEMIES} from './enemies.js?v=ground-1';
import {findOpenRuinsPosition,resolveRuinsMovement} from './ruins-collision.js?v=map-library-1';

export const RUINS_ZONES=[
 {name:'Overgrown Courtyard',x:700,y:970,mobs:[['mossImp',-95,-40],['mossImp',110,30],['runeWisp',0,-165],['mossGuardian',-20,120]]},
 {name:'Eastern Ruins',x:1750,y:1450,mobs:[['mossImp',-70,-50],['mossImp',80,60],['runeWisp',30,-155]]},
 {name:'Whispering Valley',x:2890,y:770,mobs:[['mossImp',-160,0],['mossImp',100,50],['runeWisp',0,-150],['runeWisp',180,-130],['mossGuardian',0,150]]},
 {name:'Fallen Column Meadow',x:3300,y:1350,mobs:[['mossImp',-100,60],['runeWisp',70,-130],['mossGuardian',70,80]]},
 {name:'Forest Crossing',x:1390,y:2950,mobs:[['mossImp',-60,-100],['mossImp',120,80],['mossImp',-130,75],['runeWisp',30,-230]]},
 {name:'Southern Forest Path',x:1220,y:3620,mobs:[['mossImp',-85,60],['mossImp',110,0],['runeWisp',0,-140]]},
 {name:'Guardian Approach',x:3040,y:3230,mobs:[['mossImp',-155,30],['mossImp',140,70],['runeWisp',0,-130],['mossGuardian',0,145]]},
 {name:'Guardian Courtyard',x:3110,y:3660,mobs:[['mossGuardian',-130,20],['mossGuardian',130,40],['runeWisp',0,-150],['mossImp',0,165]]}
];
export function createRuinsEncounter(bounds){
 const occupied=[],wave=[];
 for(const zone of RUINS_ZONES)for(const [kind,dx,dy] of zone.mobs){
  const x=zone.x+dx,y=zone.y+dy,left=x<2048?0:2048,top=y<2048?0:2048;
  const position=findOpenRuinsPosition(x,y,ENEMIES[kind].radius+24,{avoid:occupied,arrivalDistance:460,region:{left,top,right:left+2048,bottom:top+2048}});
  if(!position)continue; // Never fall back to spawning in solid or isolated terrain.
  occupied.push({...position,radius:ENEMIES[kind].radius});wave.push([kind,position.x,position.y]);
 }
 const spawnPoint={x:1000,y:1420};resolveRuinsMovement(spawnPoint);
 const fallback=new EnemyEncounter({bounds,groundScale:.6,regional:true,spawnPoint,terrainMove:resolveRuinsMovement,waves:[wave]});
 return createPlacedEncounter({map:{id:'whispering-ruins',width:4096,height:4096,spawn:spawnPoint},terrainMove:resolveRuinsMovement,fallback,mask:copyRuinsGroundMask(),projectSpawns:projectMap.enemySpawns??null});
}

export class RuinsLife {
 constructor(){this.time=0;this.seen=new Map();this.arrivals=[];this.arrivalCount=0;}
 update(dt,actors,active){
  if(!active){this.seen.clear();this.arrivals=[];return;}
  this.time+=dt;
  this.arrivals=this.arrivals.filter(a=>(a.age+=dt)<1.8);
  const keep=new Set();
  for(const a of actors){const p=a.player;keep.add(a.id);const previous=this.seen.get(a.id);
   if(!previous||previous.health<=0&&p.health>0){this.arrivals.push({id:a.id,x:p.x,y:p.y,age:0});this.arrivalCount++;}
   this.seen.set(a.id,{health:p.health});
  }
  for(const id of this.seen.keys())if(!keep.has(id))this.seen.delete(id);
 }
 draw(ctx,view){
  const t=this.time;ctx.save();
  // Small world-anchored leaves keep the background itself intact.
  for(let i=0;i<90;i++){const x=(i*719+t*(8+i%4))%4096,y=(i*431+t*5)%4096;
   if(x<view.left-20||x>view.right+20||y<view.top-20||y>view.bottom+20)continue;
   ctx.globalAlpha=.2+.22*Math.sin(t+i)**2;ctx.fillStyle=i%3?'#a4a25a':'#d4ba70';ctx.fillRect(x+Math.sin(t+i)*8,y,3,2);
  }
  // Tiny migrating silhouettes, spaced in three flocks across the world.
  for(let i=0;i<12;i++){const x=(t*30+i*29+Math.floor(i/4)*1270)%4400-150,y=460+Math.floor(i/4)*1080+Math.sin(t*.16+i)*85;
   ctx.globalAlpha=.5;ctx.strokeStyle='#182c2b';ctx.lineWidth=1.5;const wing=2+Math.sin(t*9+i)*3;
   ctx.beginPath();ctx.moveTo(x-5,y-wing);ctx.lineTo(x,y);ctx.lineTo(x+5,y-wing);ctx.stroke();
  }
  // Fleeting water sparkles follow the map's streams instead of whole-screen shimmer.
  for(const [x,y] of [[1550,1020],[1460,1620],[490,640],[280,2800],[2090,2890],[3750,2840]]){
   for(let i=0;i<5;i++){ctx.globalAlpha=.13*Math.max(0,Math.sin(t*2+i));ctx.fillStyle='#b4ece5';ctx.fillRect(x+Math.sin(i*8)*22,y+i*9,5,1);}
  }
  ctx.globalAlpha=1;
  for(const a of this.arrivals){const opacity=Math.min(1,a.age/.12)*Math.max(0,1-(a.age-1)/.8);
   ctx.save();ctx.globalAlpha=opacity;const beam=ctx.createLinearGradient(a.x-35,0,a.x+35,0);
   beam.addColorStop(0,'#55afff00');beam.addColorStop(.4,'#61c9ff66');beam.addColorStop(.5,'#d2f6ffcc');beam.addColorStop(.6,'#61c9ff66');beam.addColorStop(1,'#55afff00');
   ctx.fillStyle=beam;ctx.fillRect(a.x-35,view.top-20,70,a.y-view.top+20);
   ctx.strokeStyle='#95e4ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(a.x,a.y,20+a.age*16,8+a.age*5,0,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<10;i++){ctx.fillStyle='#d5f6ff';ctx.fillRect(a.x+Math.sin(i*13)*25,a.y-((a.age*130+i*21)%190),2,4);}
   ctx.restore();
  }
  ctx.restore();
 }
 snapshot(){return {time:this.time,arrivalCount:this.arrivalCount,arrivals:this.arrivals.map(a=>({...a})),zones:RUINS_ZONES.map(({name,x,y,mobs})=>({name,x,y,count:mobs.length}))};}
}
