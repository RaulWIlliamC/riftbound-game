import projectCollisions from '../assets/maps/whispering-ruins/collisions.js';
import {decodeCollisionMap,COLLISION_ACTIVE_KEY} from './ruins-collision-editor.js?v=map-library-1';
const CELL=8,SIZE=4096,COLS=SIZE/CELL;
let ground;
function buildGround(useBrowserOverride=true){
 if(useBrowserOverride&&typeof localStorage!=='undefined'){try{const saved=localStorage.getItem(COLLISION_ACTIVE_KEY);if(saved)return decodeCollisionMap(JSON.parse(saved),{id:'whispering-ruins',width:4096,height:4096});}catch{/* Invalid browser data never breaks game startup. */}}
 return decodeCollisionMap(projectCollisions);
}
// Circle against blocked grid cells, not just the center: the player's feet
// cannot overhang a river or slip through a diagonal gap between stones.
export function canOccupyRuins(x,y,radius=14){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0||x-radius<0||y-radius<0||x+radius>=SIZE||y+radius>=SIZE)return false;
 ground??=buildGround();
 for(let row=Math.floor((y-radius)/CELL);row<=Math.floor((y+radius)/CELL);row++)for(let col=Math.floor((x-radius)/CELL);col<=Math.floor((x+radius)/CELL);col++){
  if(ground[row*COLS+col])continue;
  const nx=Math.max(col*CELL,Math.min((col+1)*CELL,x)),ny=Math.max(row*CELL,Math.min((row+1)*CELL,y));
  if((nx-x)**2+(ny-y)**2<=radius**2)return false;
 }
 return true;
}
export function resolveRuinsMovement(entity,previous={x:entity.x,y:entity.y},radius=14){
 const targetX=Math.max(radius,Math.min(SIZE-radius-1,entity.x)),targetY=Math.max(radius,Math.min(SIZE-radius-1,entity.y));
 let x=previous.x,y=previous.y;
 const dx=targetX-x,dy=targetY-y;
 if(!canOccupyRuins(x,y,radius)){
  // Save restores or travel offsets can start inside newly solid scenery.
  // Search from the clamped position so even an out-of-bounds restore recovers.
  x=Math.max(radius,Math.min(SIZE-radius-1,x));y=Math.max(radius,Math.min(SIZE-radius-1,y));
  const origin={x,y};let found=false;
  for(let r=0;r<=SIZE*Math.SQRT2&&!found;r+=CELL)for(let i=0;i<64;i++){
   const a=i*Math.PI*2/64,nx=origin.x+Math.cos(a)*r,ny=origin.y+Math.sin(a)*r;
   if(canOccupyRuins(nx,ny,radius)){x=nx;y=ny;found=true;break;}
  }
  if(!found)return; // No legal ground for an entity wider than the map.
  // Recover in place; do not replay a displacement measured from solid terrain.
  entity.x=x;entity.y=y;return;
 }
 // Sweep the entire displacement, including dash/large-dt movement. Resolve
 // axes separately to keep walking smooth along irregular banks and walls.
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/(CELL/2)));
 for(let i=0;i<steps;i++){
  if(canOccupyRuins(x+dx/steps,y,radius))x+=dx/steps;
  if(canOccupyRuins(x,y+dy/steps,radius))y+=dy/steps;
 }
 entity.x=x;entity.y=y;
}

let reachable;
// Spawn eligibility uses the component reachable by the player, rather than
// any isolated patch of floor. A guardian's larger body is checked separately.
export function isReachableRuinsGround(x,y){
 if(x<0||y<0||x>=SIZE||y>=SIZE)return false;
 if(!reachable){
  reachable=new Uint8Array(COLS*COLS);
  const arrival={x:1000,y:1420};resolveRuinsMovement(arrival);
  let start=-1,best=Infinity;
  const col=Math.floor(arrival.x/CELL),row=Math.floor(arrival.y/CELL);
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
   const nx=(col+dx)*CELL+CELL/2,ny=(row+dy)*CELL+CELL/2,d=(nx-arrival.x)**2+(ny-arrival.y)**2;
   if(d<best&&canOccupyRuins(nx,ny)){start=(row+dy)*COLS+col+dx;best=d;}
  }
  if(start<0)return false;
  const queue=[start];reachable[start]=1;
  for(let i=0;i<queue.length;i++)for(const delta of [-COLS,COLS,-1,1]){
   const n=queue[i]+delta;
   if(n<0||n>=reachable.length||Math.abs(n%COLS-queue[i]%COLS)>1||reachable[n])continue;
   if(canOccupyRuins(n%COLS*CELL+CELL/2,Math.floor(n/COLS)*CELL+CELL/2,14)){reachable[n]=1;queue.push(n);}
  }
 }
 return reachable[Math.floor(y/CELL)*COLS+Math.floor(x/CELL)]===1;
}
export function findOpenRuinsPosition(x,y,radius=14,{avoid=[],arrivalDistance=0,region=null}={}){
 isReachableRuinsGround(1000,1420);
 const arrival={x:1000,y:1420};resolveRuinsMovement(arrival);
 let best=null,bestDistance=Infinity;
 for(let n=0;n<reachable.length;n++){
  if(!reachable[n])continue;
  const nx=n%COLS*CELL+CELL/2,ny=Math.floor(n/COLS)*CELL+CELL/2,d=(nx-x)**2+(ny-y)**2;
  if(d>=bestDistance||region&&(nx<region.left||nx>=region.right||ny<region.top||ny>=region.bottom))continue;
  if(Math.hypot(nx-arrival.x,ny-arrival.y)<arrivalDistance||avoid.some(p=>Math.hypot(nx-p.x,ny-p.y)<radius+(p.radius||14)+24))continue;
  if(!canOccupyRuins(nx,ny,radius))continue;
  best={x:nx,y:ny};bestDistance=d;
 }
 return best;
}

// Copies keep paint edits independent of the collision grid used by the game.
export function copyRuinsGroundMask({original=false}={}){return (original?buildGround(false):(ground??=buildGround())).slice();}
