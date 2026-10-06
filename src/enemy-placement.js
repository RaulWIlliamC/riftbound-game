import {ENEMIES,EnemyEncounter} from './enemies.js?v=ground-1';
import {decodeCollisionMap,collisionStorageKeys} from './ruins-collision-editor.js?v=enemy-editor-1';
import {canOccupyMapGrid,appliedMapCollision} from './map-collision.js?v=enemy-editor-1';
export function validateEnemySpawns(value,map){
 if(!Array.isArray(value)||value.length>256)throw Error('Use a list of up to 256 enemy spawns.');
 const ids=new Set();return value.map(e=>{
  if(!e||typeof e.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(e.id)||ids.has(e.id)||!Object.hasOwn(ENEMIES,e.kind)||!Number.isFinite(e.x)||!Number.isFinite(e.y)||e.x<0||e.y<0||e.x>=map.width||e.y>=map.height)throw Error('Enemy spawn data contains an invalid type, position or ID.');
  ids.add(e.id);return {id:e.id,kind:e.kind,x:e.x,y:e.y};
 });
}
export function readAppliedEnemySpawns(map,fallback=null){
 try{if(typeof localStorage!=='undefined'){const value=localStorage.getItem(collisionStorageKeys(map.id).active);if(value){const data=JSON.parse(value);decodeCollisionMap(data,map);if(Object.hasOwn(data,'enemySpawns'))return validateEnemySpawns(data.enemySpawns,map);}}}catch{}
 return fallback===null?null:validateEnemySpawns(fallback,map);
}
export function reachableMapGround(mask,map){
 const cols=Math.ceil(map.width/8),rows=Math.ceil(map.height/8),seen=new Uint8Array(cols*rows),anchor=map.spawn||{x:map.width/2,y:map.height/2};let start=-1,best=Infinity;
 for(let n=0;n<mask.length;n++)if(mask[n]){const x=n%cols*8+4,y=Math.floor(n/cols)*8+4,d=(x-anchor.x)**2+(y-anchor.y)**2;if(d<best&&canOccupyMapGrid(mask,map,x,y,14)){start=n;best=d;}}
 if(start<0)return seen;const queue=[start];seen[start]=1;
 for(let i=0;i<queue.length;i++)for(const delta of [-cols,cols,-1,1]){const n=queue[i]+delta;if(n<0||n>=seen.length||seen[n]||Math.abs(n%cols-queue[i]%cols)>1)continue;if(canOccupyMapGrid(mask,map,n%cols*8+4,Math.floor(n/cols)*8+4,14)){seen[n]=1;queue.push(n);}}
 return seen;
}
export function enemyPlacementProblem(e,map,mask,reachable){
 if(!canOccupyMapGrid(mask,map,e.x,e.y,ENEMIES[e.kind].radius))return 'The enemy needs open ground with room for its body.';
 const cols=Math.ceil(map.width/8);if(!reachable[Math.floor(e.y/8)*cols+Math.floor(e.x/8)])return 'This ground is disconnected from the player’s starting area.';
 return null;
}
export function createPlacedEncounter({map,terrainMove,fallback=null,mask=null,projectSpawns=null}){
 const spawns=readAppliedEnemySpawns(map,projectSpawns);if(spawns===null)return fallback;
 mask=mask||appliedMapCollision(map);if(!mask)return fallback;
 const reachable=reachableMapGround(mask,map),valid=spawns.filter(e=>!enemyPlacementProblem(e,map,mask,reachable));
 return new EnemyEncounter({bounds:{left:0,top:0,right:map.width,bottom:map.height},spawnPoint:map.spawn||{x:map.width/2,y:map.height/2},terrainMove,regional:map.id==='whispering-ruins',groundScale:map.id==='arena'?1:.6,waves:[valid.map(e=>[e.kind,e.x,e.y])]});
}
