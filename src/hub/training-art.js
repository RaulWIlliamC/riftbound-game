import {ART} from './layout.js';
let artwork;
export function setTrainingArtwork(layers){artwork=layers;}
import {pixel,polygon,stroke} from './pixel-art.js';
// Appearance only: health, damage, Wet, burn, lift and respawn remain in TrainingTargets.
export function drawTrainingDummyBody(ctx,target){
 const layer=artwork?.[Number(target.id.split('-').at(-1))];
 if(layer){
  const anchors=[[280,753],[345,775],[410,801]],anchor=anchors[Number(target.id.split('-').at(-1))];
  ctx.drawImage(layer.canvas,(layer.left-anchor[0])*ART.scale,(layer.top-anchor[1])*ART.scale,layer.width*ART.scale,layer.height*ART.scale);
  if(target.flash>0){ctx.globalAlpha=.4;ctx.strokeStyle='#fff1b8';ctx.lineWidth=2;ctx.strokeRect(-18,-49,36,31);ctx.globalAlpha=1;}
  return;
 }
 const flash=target.flash>0;
 pixel(ctx,-3,-55,6,59,flash?'#ffe5ac':'#826046');
 pixel(ctx,-16,-1,32,5,'#302b2d');pixel(ctx,-12,-2,24,3,'#6e5340');
 polygon(ctx,[[-21,-35],[-31,-39],[-32,-34],[-23,-27],[-17,-27],[-10,-16],[10,-16],[17,-27],[25,-26],[32,-33],[29,-40],[21,-34],[15,-36],[-14,-36]],flash?'#ffe2a1':'#a9875a');
 polygon(ctx,[[-9,-52],[-12,-46],[-10,-36],[-5,-32],[7,-32],[12,-39],[11,-47],[6,-53]],flash?'#fff2c4':'#b89967');
 stroke(ctx,[[-7,-47],[-3,-45]],'#4e3b32',2);stroke(ctx,[[5,-47],[8,-45]],'#4e3b32',2);stroke(ctx,[[-3,-39],[4,-39]],'#594331',2);
 for(let ring=0;ring<3;ring++){ctx.strokeStyle=['#3b2c2b','#cfb187','#8c4b42'][ring];ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-25,11-ring*3,0,Math.PI*2);ctx.stroke();}
 for(const x of [-23,24]){pixel(ctx,x,-38,2,14,'#d0b481');pixel(ctx,x+3,-34,2,10,'#82633e');}
}
