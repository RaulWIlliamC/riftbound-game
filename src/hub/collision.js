export function insidePolygon(x,y,polygon){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
export function canOccupy(x,y,radius,objects,boundary){
 if(!insidePolygon(x,y,boundary))return false;
 for(let i=0;i<boundary.length;i++){
  const a=boundary[i],b=boundary[(i+1)%boundary.length],dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
  if((x-a.x-dx*t)**2+(y-a.y-dy*t)**2<radius*radius)return false;
 }
 for(const o of objects){
  if(!o.collision)continue;
  if(o.collision.points){
   const poly=o.collision.points;
   if(insidePolygon(x,y,poly))return false;
   for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
    if((x-a.x-dx*t)**2+(y-a.y-dy*t)**2<radius*radius)return false;
   }
   continue;
  }
  const {w,h}=o.collision;
  const cx=o.x+(o.collision.offsetX||0),cy=o.y+(o.collision.offsetY||0);
  const nx=Math.max(cx-w/2,Math.min(cx+w/2,x)),ny=Math.max(cy-h/2,Math.min(cy+h/2,y));
  if((x-nx)**2+(y-ny)**2<radius*radius)return false;
 }
 return true;
}
// Substeps prevent dashes from crossing thin fences; axis resolution slides along walls.
export function resolveHubMovement(entity,previous,objects,boundary,radius=14){
 const dx=entity.x-previous.x,dy=entity.y-previous.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));
 let x=previous.x,y=previous.y;
 // A lifted Wind target can be released over a solid prop or beyond a cliff.
 // Land it on the closest available ground before applying its thrown movement.
 if(!canOccupy(x,y,radius,objects,boundary)){
  let found=false;
  for(let r=5;r<=1800&&!found;r+=r<200?5:20)for(let i=0;i<32;i++){
   const a=i*Math.PI*2/32,nx=previous.x+Math.cos(a)*r,ny=previous.y+Math.sin(a)*r;
   if(canOccupy(nx,ny,radius,objects,boundary)){x=nx;y=ny;found=true;break;}
  }
 }
 if(dx===0&&dy===0){entity.x=x;entity.y=y;return;}
 for(let i=0;i<steps;i++){
  if(canOccupy(x+dx/steps,y,radius,objects,boundary))x+=dx/steps;
  if(canOccupy(x,y+dy/steps,radius,objects,boundary))y+=dy/steps;
 }
 entity.x=x;entity.y=y;
}
export const depthOrder=(a,b)=>a.y-b.y||(a.order||0)-(b.order||0);
