// Silhouettes traced in the 1254px source quarters; depth is measured at the base.
const SCALE=2048/1254;
function column(x,top,base,width){const h=width/2;
 return [[x-h,top+7],[x,top],[x+h,top+8],[x+h,top+21],[x+h*.72,top+25],[x+h*.72,base-17],[x+h,base-10],[x+h,base],[x,base+7],[x-h,base],[x-h,base-10],[x-h*.72,base-17],[x-h*.72,top+25],[x-h,top+20]];
}
const quarters=[
 {x:0,y:0,columns:[[107,584,659,38],[200,650,737,36],[408,306,397,33],[578,120,217,35],[705,68,154,33],[760,138,210,35],[648,1040,1184,36],[900,1005,1104,36],[1170,866,958,34],[892,550,640,36],[1138,566,651,34]]},
 {x:2048,y:0,columns:[[147,178,274,34],[307,368,495,36],[385,399,472,30],[833,264,355,37],[950,779,884,37],[365,871,989,39],[1158,919,1012,32],[180,734,822,35]]},
 {x:0,y:2048,columns:[[533,81,196,46],[746,243,378,45],[545,488,612,40],[890,847,977,43]]},
 {x:2048,y:2048,columns:[[446,485,623,39],[838,455,567,39],[347,890,1028,44],[945,854,960,41],[801,987,1077,41],[174,662,804,39],[896,365,438,29],[1035,179,310,43]]}
];
export const RUINS_OCCLUDERS=quarters.flatMap((q,qi)=>q.columns.map((c,i)=>({id:`pillar-${qi}-${i}`,y:q.y+(c[2]+7)*SCALE,points:column(...c).map(([x,y])=>({x:q.x+x*SCALE,y:q.y+y*SCALE}))})));

RUINS_OCCLUDERS.push({id:'fallen-valley-column',y:680*SCALE,points:[[740,643],[877,548],[904,547],[920,579],[785,681],[752,682],[739,661]].map(([x,y])=>({x:2048+x*SCALE,y:y*SCALE}))});

export function prepareOccluders(terrain){
 return RUINS_OCCLUDERS.map(object=>{
  const left=Math.floor(Math.min(...object.points.map(p=>p.x))),top=Math.floor(Math.min(...object.points.map(p=>p.y)));
  const right=Math.ceil(Math.max(...object.points.map(p=>p.x))),bottom=Math.ceil(Math.max(...object.points.map(p=>p.y)));
  const image=document.createElement('canvas');image.width=right-left;image.height=bottom-top;const ctx=image.getContext('2d');
  ctx.beginPath();object.points.forEach((p,i)=>i?ctx.lineTo(p.x-left,p.y-top):ctx.moveTo(p.x-left,p.y-top));ctx.closePath();ctx.clip();
  ctx.drawImage(terrain,left,top,image.width,image.height,0,0,image.width,image.height);
  return {...object,left,top,right,bottom,image};
 });
}
export function depthOrder(actors,objects,view){return [...actors,...objects.filter(o=>o.right>view.left&&o.left<view.right&&o.bottom>view.top&&o.top<view.bottom).map(o=>({y:o.y,order:0,occluder:o}))].sort((a,b)=>a.y-b.y||(a.order||0)-(b.order||0));}
