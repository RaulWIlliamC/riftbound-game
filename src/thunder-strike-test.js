const index=t=>Math.max(0,Math.min(7,Math.floor(t*8+1e-8)));
export function thunderTestFrames(age){
 if(age<0||age>=.8)return [];
 if(age<.16)return [{row:0,index:index(age/.16)}];
 const frame=index((age-.16)/.64);return [1,2,3].map(row=>({row,index:frame}));
}
const frames=[];let loadPromise;
export function loadThunderStrikeTest(){
 return loadPromise??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   for(let row=0;row<4;row++){frames[row]=[];for(let col=0;col<8;col++){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,col*256,row*256,256,256,0,0,128,128);frames[row].push(tile);
   }}resolve();
  };image.onerror=()=>reject(new Error('Thunder Strike test sheet could not load'));image.src=new URL('../assets/thunder-strike-test-padded.png',import.meta.url).href;
 });
}
export function drawThunderStrikeTest(c,age,radius){
 const selected=thunderTestFrames(age);if(!selected.length||!frames.length)return false;
 c.save();c.imageSmoothingEnabled=false;
 // Draw the circular ground discharge first, then the bolt and contact flash.
 for(const row of [0,3,1,2]){
  const f=selected.find(f=>f.row===row);if(!f)continue;
  const size=row===1?290:radius*2*256/166;
  const anchorY=row===0?.7:row===1?.81:.5;
  c.drawImage(frames[row][f.index],Math.round(-size*.5),Math.round(-size*anchorY),size,size);
 }
 c.restore();return true;
}
