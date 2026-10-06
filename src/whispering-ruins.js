import {prepareOccluders,depthOrder} from './ruins-depth.js';
import {canOccupyRuins,resolveRuinsMovement} from './ruins-collision.js?v=map-library-1';
export const RUINS_BOUNDS=Object.freeze({left:0,top:0,right:4096,bottom:4096});
// Ground footprints constrain movement independently of foreground depth sorting.
export class WhisperingRuins {
 constructor({loadArt=true}={}){
  this.groundScale=.6;this.bounds=RUINS_BOUNDS;this.worldBounds=RUINS_BOUNDS;this.image=null;this.sections=[];this.joins=[];this.occluders=[];
  this.readyPromise=loadArt?this.load():Promise.resolve();
 }
 async load(){
  const load=async name=>{const image=new Image();image.src=new URL(`../assets/maps/whispering-ruins/${name}.png`,import.meta.url).href;await image.decode();return image;};
  const [base,...originals]=await Promise.all(['map','source-ruins','source-valley','source-grove','forest-detail-v2'].map(load));
  this.image=base;
  this.sections=originals.map((image,i)=>({image,x:i===1||i===2?2048:0,y:i>=2?2048:0}));
  const repaired=await Promise.all(['join-horizontal','join-vertical','join-north','join-east'].map(load));
  this.joins=repaired.map((image,i)=>{
   const layer=document.createElement('canvas');layer.width=image.naturalWidth;layer.height=image.naturalHeight;
   const ctx=layer.getContext('2d');ctx.drawImage(image,0,0);ctx.globalCompositeOperation='destination-in';
   // Only patch perimeters fade; repaired terrain stays opaque.
   for(const [w,horizontal] of [[layer.width,true],[layer.height,false]]){
    const fade=Math.min(48,w*.06),g=ctx.createLinearGradient(0,0,horizontal?w:0,horizontal?0:w);
    g.addColorStop(0,'transparent');g.addColorStop(fade/w,'#fff');g.addColorStop(1-fade/w,'#fff');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,layer.width,layer.height);
   }
   const [x,y,width,height]=[[0,1664,2048,768],[1664,2048,768,2048],[1664,0,768,2048],[2048,1664,2048,768]][i];
   return {image:layer,x,y,width,height};
  });
  const terrain=document.createElement('canvas');terrain.width=4096;terrain.height=4096;this.drawGround(terrain.getContext('2d'));this.occluders=prepareOccluders(terrain);
 }
 placePlayer(p){p.x=1000;p.y=1420;p.worldBounds=this.worldBounds;p.visualScale=1.1;p.invulnerable=2;this.move(p,{x:p.x,y:p.y});}
 placeTraining(training){training.targets=[];}
 canOccupy(x,y,radius=14){return canOccupyRuins(x,y,radius);}
 move(p,previous,radius=p.radius||14){resolveRuinsMovement(p,previous,radius);}
 update(){} nearby(){return [];}
 drawGround(ctx){
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.fillStyle='#233f35';ctx.fillRect(0,0,this.bounds.right,this.bounds.bottom);
  if(this.image)ctx.drawImage(this.image,0,0,this.bounds.right,this.bounds.bottom);
  for(const section of this.sections)ctx.drawImage(section.image,section.x,section.y,2048,2048);
  ctx.fillStyle='#15332d';ctx.globalAlpha=.07;ctx.fillRect(0,0,this.bounds.right,this.bounds.bottom);
  ctx.globalAlpha=1;for(const join of this.joins)ctx.drawImage(join.image,join.x,join.y,join.width,join.height);
  ctx.restore();
 }
 drawObjects(ctx,view,actors){for(const a of depthOrder(actors,this.occluders,view)){if(a.occluder){const o=a.occluder;ctx.drawImage(o.image,o.left,o.top);}else a.draw();}}
 drawAtmosphere(ctx,view){
  const cx=(view.left+view.right)/2,cy=(view.top+view.bottom)/2,r=Math.hypot(view.right-view.left,view.bottom-view.top)/2;
  ctx.save();const shade=ctx.createRadialGradient(cx,cy,r*.3,cx,cy,r);shade.addColorStop(0,'transparent');shade.addColorStop(1,'#071b23a0');ctx.fillStyle=shade;ctx.fillRect(view.left,view.top,view.right-view.left,view.bottom-view.top);ctx.restore();
 }
 snapshot(){return {id:'whispering-ruins',bounds:this.bounds,sceneryCollisions:true,depthObjects:this.occluders.length,groundScale:this.groundScale,repairedJoins:this.joins.length,terrainSections:this.sections.map(s=>({x:s.x,y:s.y,width:s.image.naturalWidth,height:s.image.naturalHeight}))};}
}
