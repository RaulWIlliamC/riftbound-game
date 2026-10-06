import {decodeCollisionMap,collisionStorageKeys} from './ruins-collision-editor.js?v=map-library-1';
const cache=new Map();
export function appliedMapCollision(map){
 if(cache.has(map.id))return cache.get(map.id);
 let grid=null;try{if(typeof localStorage!=='undefined'){const value=localStorage.getItem(collisionStorageKeys(map.id).active);if(value)grid=decodeCollisionMap(JSON.parse(value),map);}}catch{}
 cache.set(map.id,grid);return grid;
}
export function canOccupyMapGrid(mask,map,x,y,radius=14){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x-radius<0||y-radius<0||x+radius>=map.width||y+radius>=map.height)return false;
 const cols=Math.ceil(map.width/8);
 for(let row=Math.floor((y-radius)/8);row<=Math.floor((y+radius)/8);row++)for(let col=Math.floor((x-radius)/8);col<=Math.floor((x+radius)/8);col++){
  if(mask[row*cols+col])continue;const nx=Math.max(col*8,Math.min((col+1)*8,x)),ny=Math.max(row*8,Math.min((row+1)*8,y));if((nx-x)**2+(ny-y)**2<=radius**2)return false;
 }return true;
}
export function resolveMapGrid(entity,previous={x:entity.x,y:entity.y},mask,map,radius=14){
 let x=previous.x,y=previous.y;const dx=entity.x-x,dy=entity.y-y;
 if(!canOccupyMapGrid(mask,map,x,y,radius)){
  const cols=Math.ceil(map.width/8);let best=null,distance=Infinity;
  for(let i=0;i<mask.length;i++)if(mask[i]){const nx=i%cols*8+4,ny=Math.floor(i/cols)*8+4,d=(nx-x)**2+(ny-y)**2;if(d<distance&&canOccupyMapGrid(mask,map,nx,ny,radius)){best={x:nx,y:ny};distance=d;}}
  if(best)Object.assign(entity,best);return;
 }
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));for(let i=0;i<steps;i++){if(canOccupyMapGrid(mask,map,x+dx/steps,y,radius))x+=dx/steps;if(canOccupyMapGrid(mask,map,x,y+dy/steps,radius))y+=dy/steps;}entity.x=x;entity.y=y;
}
