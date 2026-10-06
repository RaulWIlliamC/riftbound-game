import {appliedMapCollision,resolveMapGrid} from '../map-collision.js?v=map-library-1';
import {prepareShrineTextures} from './shrine-art.js';
import {updateShrines} from './shrine-interaction.js';
import {nearRift,approachRift} from './rift-interaction.js';
import {ART,createHubObjects,HUB_BOUNDARY,HUB_SPAWN,TRAINING_SPAWNS} from './layout.js';
import {resolveHubMovement,depthOrder} from './collision.js';
import {extractLayer,drawLayer,cleanGround,trainingLayers} from './art-layers.js';
import {prepareEffects,drawImageEffect,imageLighting,imageAmbient} from './image-effects.js?v=progression-1';
import {setTrainingArtwork} from './training-art.js';
export class SanctuaryHub{
 constructor(){
  this.groundScale=.6;
  this.objects=createHubObjects();this.boundary=HUB_BOUNDARY;this.time=0;this.riftExpansion=0;this.ready=false;this.layers=new Map();
  this.readyPromise=this.load();
 }
 async load(){
  const image=new Image(),clean=new Image();
  image.src=new URL('../../assets/maps/sanctuary/sanctuary-source.png',import.meta.url).href;
  clean.src=new URL('../../assets/maps/sanctuary/sanctuary-clean-yard.png',import.meta.url).href;
  await Promise.all([image.decode(),clean.decode()]);
  this.image=image;this.terrain=cleanGround(image,clean);this.effects=prepareEffects(image);this.effects.shrines=prepareShrineTextures(image,this.objects);
  for(const o of this.objects)this.layers.set(o.id,extractLayer(image,o.artPolygon));
  setTrainingArtwork(trainingLayers(image));this.ready=true;
 }
 placePlayer(player){Object.assign(player,HUB_SPAWN);}
 placeTraining(training){training.targets=training.targets.slice(0,3);training.targets.forEach((t,i)=>{const p=TRAINING_SPAWNS[i];Object.assign(t,p,{spawnX:p.x,spawnY:p.y});});}
 update(dt){this.time+=dt;}
 updateRift(player,dt,pointer=null){updateShrines(this.objects,player,dt,pointer);this.riftExpansion=approachRift(this.riftExpansion,nearRift(player),dt);const portal=this.objects.find(o=>o.kind==='portal');portal.expansion=this.riftExpansion;}
 move(entity,previous,radius=14){const map={id:'sanctuary',width:1800,height:1300},grid=appliedMapCollision(map);if(grid){resolveMapGrid(entity,previous,grid,map,radius);return;}resolveHubMovement(entity,previous,this.objects,this.boundary,radius);}
 nearby(position){return this.objects.filter(o=>o.interaction&&Math.hypot(o.x-position.x,o.y-position.y)<o.radius).map(o=>({id:o.id,name:o.name,action:o.interaction,element:o.element}));}
 visible(o,view){const layer=this.layers.get(o.id);return layer&&ART.x+(layer.left+layer.width)*ART.scale>view.left&&ART.x+layer.left*ART.scale<view.right&&ART.y+(layer.top+layer.height)*ART.scale>view.top&&ART.y+layer.top*ART.scale<view.bottom;}
 drawGround(ctx){if(this.ready)ctx.drawImage(this.terrain,ART.x,ART.y,ART.width*ART.scale,ART.height*ART.scale);}
 drawObjects(ctx,view,actors){
  const items=this.ready?this.objects.filter(o=>this.visible(o,view)).map(o=>({y:o.y,order:0,draw:()=>{drawLayer(ctx,this.layers.get(o.id));drawImageEffect(ctx,o,this.time,this.image,this.effects);}})):[];
  items.push(...actors);items.sort(depthOrder);for(const item of items)item.draw();
 }
 drawAtmosphere(ctx,view){if(this.ready){imageLighting(ctx,this.objects.filter(o=>this.visible(o,view)),this.time);imageAmbient(ctx,this.time,this.image,view);}}
 snapshot(){return{riftExpansion:this.riftExpansion,time:this.time,ready:this.ready,art:{...ART},spawn:{...HUB_SPAWN},boundary:this.boundary,objects:this.objects.map(({id,kind,x,y,sourceX,sourceY,element,interaction,collision})=>({id,kind,x,y,sourceX,sourceY,element,interaction,collision}))};}
}
