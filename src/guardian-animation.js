export const GUARDIAN_ANIMATIONS={idle:{row:0,count:4,fps:5},move:{row:1,count:6,fps:6},windup:{row:2,count:6},slam:{row:3,count:6},hit:{row:4,count:2},death:{row:5,count:6,fps:5}};
const clamp=(index,last)=>Math.max(0,Math.min(last,index));
export function guardianAnimationFrame(e){
 if(e.health<=0){const time=e.deathTime||0;return time>=1.2?null:{row:5,index:clamp(Math.floor(time*5),5)};}
 if(e.flash>0)return {row:4,index:clamp(Math.floor((.18-e.flash)/.09),1)};
 if(!e.capturedBy){
  if(e.state==='windup')return {row:2,index:clamp(Math.floor((.95-e.timer)/(.95/6)),5)};
  if(e.state==='slam')return {row:3,index:clamp(Math.floor((.6-e.timer)/.1+1e-8),5)};
  if(e.moving)return {row:1,index:Math.floor((e.moveClock||0)*6)%6};
 }
 return {row:0,index:Math.floor((e.clock||0)*5)%4};
}
const frames=[];let loadPromise;
export function getGuardianSprite(frame){return frame?frames[frame.row]?.[frame.index]:null;}
export function loadGuardianSprites(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(const {row,count} of Object.values(GUARDIAN_ANIMATIONS)){
    frames[row]=[];for(let index=0;index<count;index++){
     const tile=document.createElement('canvas');tile.width=tile.height=96;
     tile.getContext('2d').drawImage(image,index*96,row*96,96,96,0,0,96,96);frames[row].push(tile);
    }
   }resolve();
  };image.onerror=()=>reject(new Error('Guardian animation sheet could not load'));image.src=new URL('../assets/guardian-animations.png',import.meta.url).href;
 });
}
