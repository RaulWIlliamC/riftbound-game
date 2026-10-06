import {appliedMapCollision,resolveMapGrid} from './map-collision.js?v=map-library-1';
import {ARENA} from './player.js?v=progression-1';
import {TrainingTargets} from './combat.js?v=progression-1';
// Original combat sandbox: a grid floor and the original five rune targets.
export class PracticeArena {
 constructor(){this.bounds={left:0,top:0,right:ARENA.width,bottom:ARENA.height};}
 placePlayer(p){p.x=900;p.y=650;}
 placeTraining(training){training.targets=new TrainingTargets().targets;}
 move(p,previous){const r=p.radius||14,map={id:'arena',width:1800,height:1300},grid=appliedMapCollision(map);if(grid){resolveMapGrid(p,previous,grid,map,r);return;}p.x=Math.max(ARENA.wall+r,Math.min(ARENA.width-ARENA.wall-r,p.x));p.y=Math.max(ARENA.wall+r,Math.min(ARENA.height-ARENA.wall-r,p.y));}
 update(){} nearby(){return [];}
 drawGround(ctx){ctx.fillStyle='#242b3b';ctx.fillRect(0,0,ARENA.width,ARENA.height);ctx.fillStyle='#293142';for(let y=40;y<ARENA.height-40;y+=40)for(let x=40;x<ARENA.width-40;x+=40)if((x/40+y/40)%2===0)ctx.fillRect(x,y,40,40);ctx.strokeStyle='#343c4d';ctx.lineWidth=1;ctx.beginPath();for(let x=40;x<ARENA.width;x+=40){ctx.moveTo(x,40);ctx.lineTo(x,ARENA.height-40);}for(let y=40;y<ARENA.height;y+=40){ctx.moveTo(40,y);ctx.lineTo(ARENA.width-40,y);}ctx.stroke();ctx.strokeStyle='#101725';ctx.lineWidth=40;ctx.strokeRect(20,20,ARENA.width-40,ARENA.height-40);}
 drawObjects(ctx,view,actors){for(const a of actors.sort((a,b)=>a.y-b.y||a.order-b.order))a.draw();}
 drawAtmosphere(){} snapshot(){return {id:'arena',bounds:this.bounds};}
}
