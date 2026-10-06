// Supplied Riftling sheet: idle 4, run 6, wind-up 4, pounce 6, hit 3, death 6.
export const RIFTLING_ANIMATIONS={idle:{row:0,count:4,fps:8},move:{row:1,count:6,fps:12},windup:{row:2,count:4},pounce:{row:3,count:6},hit:{row:4,count:3},death:{row:5,count:6,fps:8}};
const clamp=(index,last)=>Math.max(0,Math.min(last,index));
export function riftlingAnimationFrame(e){
 if(e.health<=0){const time=e.deathTime||0;return time>=.75?null:{row:5,index:clamp(Math.floor(time*8),5)};}
 if(e.flash>0)return {row:4,index:clamp(Math.floor((.18-e.flash)/.06),2)};
 if(!e.capturedBy){
  if(e.state==='windup')return {row:2,index:clamp(Math.floor((.48-e.timer)/.12),3)};
  if(e.state==='pounce')return {row:3,index:clamp(Math.floor((.32-e.timer)/.08),3)};
  if(e.state==='recover')return {row:3,index:4+clamp(Math.floor((.35-e.timer)/.175),1)};
  if(e.moving)return {row:1,index:Math.floor((e.moveClock||0)*12)%6};
 }
 return {row:0,index:Math.floor((e.clock||0)*8)%4};
}
const frames=[];let loadPromise;
export function getRiftlingSprite(frame){return frame?frames[frame.row]?.[frame.index]:null;}
export function loadRiftlingSprites(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(const {row,count} of Object.values(RIFTLING_ANIMATIONS)){
    frames[row]=[];for(let index=0;index<count;index++){
     const tile=document.createElement('canvas');tile.width=tile.height=32;
     const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,index*64,row*64,64,64,0,0,32,32);frames[row].push(tile);
    }
   }resolve();
  };image.onerror=()=>reject(new Error('Riftling animation sheet could not load'));image.src=new URL('../assets/riftling-animations.png',import.meta.url).href;
 });
}
