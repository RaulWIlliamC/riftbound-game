import {ART,artPoint} from './layout.js';

const symbols={water:[430,292,24,34],lightning:[1163,291,24,34],fire:[407,550,28,44],wind:[1186,539,44,40],earth:[793,700,28,30]};
export function shrineSymbol(o){
 const [x,y,rx,ry]=symbols[o.element],center=artPoint(x,y-12*(o.expansion||0)),scale=1+(o.expansion||0)*.38+(o.hover||0)*.07;
 return {...center,rx:rx*ART.scale*scale,ry:ry*ART.scale*scale,sourceX:x,sourceY:y,sourceRX:rx,sourceRY:ry,scale};
}
export function nearShrine(o,player){return Math.hypot(o.x-player.x,o.y-player.y)<o.radius;}
export function updateShrines(objects,player,dt,pointer=null){
 const hovered=pointer?hitsShrine(objects,player,pointer):null;
 for(const o of objects.filter(o=>o.kind==='shrine')){
  o.expansion=(o.expansion||0)+((nearShrine(o,player)?1:0)-(o.expansion||0))*(1-Math.exp(-8*dt));
  const selected=o.element===player.element;
  o.attunePulse=Math.max(0,(o.attunePulse||0)-dt*1.4);
  if(selected&&!o.selected&&o.selected!==undefined)o.attunePulse=1;
  o.selected=selected;
  o.hover=(o.hover||0)+((hovered===o?1:0)-(o.hover||0))*(1-Math.exp(-12*dt));
 }
}
export function hitsShrine(objects,player,point){
 return objects.find(o=>{
  if(o.kind!=='shrine'||!nearShrine(o,player))return false;
  const s=shrineSymbol(o);
  return ((point.x-s.x)/s.rx)**2+((point.y-s.y)/s.ry)**2<=1;
 });
}
