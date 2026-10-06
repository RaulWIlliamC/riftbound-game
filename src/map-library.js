import {WhisperingRuins} from './whispering-ruins.js?v=map-library-1';
import {SanctuaryHub} from './hub/hub.js?v=map-library-1';
import {PracticeArena} from './practice-arena.js?v=map-library-1';
import {copyRuinsGroundMask} from './ruins-collision.js?v=map-library-1';
import {canOccupy} from './hub/collision.js';
import {appliedMapCollision} from './map-collision.js?v=map-library-1';
const root=new URL('../assets/maps/',import.meta.url);
export async function listGameMaps(){
 let ids=[];
 try{const response=await fetch(new URL('catalog.json',root),{cache:'no-store'});if(response.ok)ids=await response.json();}catch{}
 // Local static servers list folders. New map folders with map.json appear
 // automatically; catalog.json also supports hosts without directory listings.
 try{const response=await fetch(root,{cache:'no-store'}),doc=new DOMParser().parseFromString(await response.text(),'text/html');for(const a of doc.querySelectorAll('a[href]')){const match=a.getAttribute('href').match(/^([a-z0-9-]+)\/$/);if(match)ids.push(match[1]);}}catch{}
 const maps=[];
 for(const id of new Set(ids.filter(id=>typeof id==='string'&&/^[a-z0-9-]+$/.test(id))))try{
  const response=await fetch(new URL(id+'/map.json',root),{cache:'no-store'});if(!response.ok)continue;const map=await response.json();
  if(map.id!==id||typeof map.name!=='string'||!Number.isInteger(map.width)||!Number.isInteger(map.height)||map.width<40||map.height<40||map.width>8192||map.height>8192)continue;
  if(!['whispering-ruins','sanctuary','arena'].includes(map.renderer)&&!(typeof map.image==='string'&&/^[a-zA-Z0-9_.-]+$/.test(map.image)))continue;
  maps.push(map);
 }catch{}
 return maps;
}
export async function loadEditorMap(map){
 let scene;
 if(map.renderer==='whispering-ruins')scene=new WhisperingRuins();
 else if(map.renderer==='sanctuary')scene=new SanctuaryHub();
 else if(map.renderer==='arena')scene=new PracticeArena();
 else{const image=new Image();image.src=new URL(map.id+'/'+map.image,root).href;await image.decode();scene={drawGround:ctx=>ctx.drawImage(image,0,0,map.width,map.height)};}
 await scene.readyPromise;
 const cols=Math.ceil(map.width/8),rows=Math.ceil(map.height/8);let original;
 if(map.renderer==='whispering-ruins')original=copyRuinsGroundMask({original:true});
 else{original=new Uint8Array(cols*rows);for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=col*8+4,y=row*8+4;original[row*cols+col]=map.renderer==='sanctuary'?Number(canOccupy(x,y,0,scene.objects,scene.boundary)):Number(x>=40&&y>=40&&x<map.width-40&&y<map.height-40);}}
 if(map.collision&&map.renderer!=='whispering-ruins'){const {decodeCollisionMap}=await import('./ruins-collision-editor.js?v=map-library-1');try{const response=await fetch(new URL(map.id+'/'+map.collision,root),{cache:'no-store'});if(response.ok)original=decodeCollisionMap(await response.json(),map);}catch{}}
 return {scene,original,initial:map.renderer==='whispering-ruins'?copyRuinsGroundMask():appliedMapCollision(map)||original};
}
