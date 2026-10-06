export const ARCHER_ANIMATIONS={idle:{row:0,count:4,fps:5},move:{row:1,count:6,fps:7},fire:{row:2,count:6},inferno:{row:3,count:6},hit:{row:4,count:3},death:{row:5,count:6,fps:5}};
const clamp=(i,max)=>Math.max(0,Math.min(max,i));
export function archerAnimationFrame(e){
 if(e.health<=0){const t=e.deathTime||0;return t>=1.2?null:{row:5,index:clamp(Math.floor(t*5),5)};}
 if(e.flash>0)return {row:4,index:clamp(Math.floor((.18-e.flash)/.06),2)};
 if(!e.capturedBy){
  const row=e.attackKind==='inferno'?3:2;
  if(e.state==='windup')return {row,index:2};
  if(e.state==='archerShot')return {row,index:clamp(Math.floor((.6-e.timer)/.1+1e-8),5)};
  if(e.moving)return {row:1,index:Math.floor((e.moveClock||0)*7)%6};
 }
 return {row:0,index:Math.floor((e.clock||0)*5)%4};
}
const frames=[];let loadPromise;
export function getArcherSprite(frame){return frame?frames[frame.row]?.[frame.index]:null;}
export function loadArcherSprites(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(const {row,count} of Object.values(ARCHER_ANIMATIONS)){
    frames[row]=[];for(let index=0;index<count;index++){
     const tile=document.createElement('canvas');tile.width=tile.height=64;
     tile.getContext('2d').drawImage(image,index*64,row*64,64,64,0,0,64,64);frames[row].push(tile);
    }
   }resolve();
  };image.onerror=()=>reject(new Error('Ash Archer animation sheet could not load'));image.src=new URL('../assets/archer-animations.png',import.meta.url).href;
 });
}
