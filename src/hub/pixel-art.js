export const PALETTE={dark:'#111828',shadow:'#172135',stone:'#41475b',top:'#626278',edge:'#292f44',moss:'#34483d',gold:'#ad8960'};
export function random(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function polygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x/2)*2,Math.round(y/2)*2):ctx.moveTo(Math.round(x/2)*2,Math.round(y/2)*2));ctx.closePath();ctx.fill();}
export function pixel(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h);}
export function stroke(ctx,points,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x/2)*2,Math.round(y/2)*2):ctx.moveTo(Math.round(x/2)*2,Math.round(y/2)*2));ctx.stroke();}
export function stone(ctx,x,y,w,h,seed=1){
 const rng=random(seed*987+23),p=PALETTE;
 polygon(ctx,[[x-w/2,y-h*.5],[x-w*.5,y+h*.25],[x-w*.30,y+h*.55],[x+w*.4,y+h*.4],[x+w*.5,y-h*.25]],p.edge);
 polygon(ctx,[[x-w*.5,y-h*.5-8],[x-w*.48,y-h*.15],[x-w*.25,y+h*.16],[x+w*.42,y],[x+w*.5,y-h*.35-8],[x+w*.26,y-h*.6-8]],p.stone);
 stroke(ctx,[[x-w*.44,y-h*.42-7],[x-w*.25,y-h*.54-7],[x+w*.25,y-h*.54-7]],p.top,3);
 for(let i=0;i<7;i++)pixel(ctx,x+(rng()-.5)*w*.8,y-h*.5+rng()*h*.6,4+rng()*6,2,rng()>.6?'#747184':'#333b50');
 stroke(ctx,[[x+w*.1,y-h*.55],[x-w*.05,y-h*.22],[x+w*.08,y]],'#242d42');
}
export function masonry(ctx,x,y,w,h,seed=1){
 const p=PALETTE,rng=random(seed*321+4);
 pixel(ctx,x-w/2,y-h,w,h,p.edge);
 for(let row=0;row<Math.ceil(h/22);row++){
  for(let col=0;col<Math.ceil(w/30)+1;col++){
   const left=Math.max(x-w/2,x-w/2+col*30-(row%2)*15),right=Math.min(x+w/2,x-w/2+(col+1)*30-(row%2)*15);
   if(right<=left)continue;
   const yy=y-h+row*22,hh=Math.min(20,y-yy);
   pixel(ctx,left+1,yy+1,right-left-2,hh,['#45495d','#3b4358','#4e5063'][Math.floor(rng()*3)]);
   pixel(ctx,left+2,yy+1,right-left-4,2,'#67657a');
   if(rng()>.5)pixel(ctx,left+4,yy+hh-5,6,3,'#303c37');
  }
 }
}
export function foliage(ctx,x,y,size,seed){
 const rng=random(seed*431+15);
 for(let i=0;i<36;i++){
  const angle=rng()*Math.PI*2,r=rng()*size,xx=x+Math.cos(angle)*r,yy=y+Math.sin(angle)*r*.55;
  pixel(ctx,xx,yy,6+rng()*10,4+rng()*7,['#1a3032','#243a38','#30463c','#3b5141','#506047'][Math.floor(rng()*5)]);
 }
}
export function rune(ctx,x,y,color,size=12){stroke(ctx,[[x,y-size],[x+size*.55,y],[x,y+size],[x-size*.55,y],[x,y-size]],color,2);stroke(ctx,[[x,y-size*.6],[x,y+size*1.4]],color,2);pixel(ctx,x-size*.75,y-2,size*1.5,2,color);}
export function makeSprite(object){
 const w=object.kind==='portal'?380:object.kind==='tree'?180:object.kind==='table'?180:object.kind==='fence'?240:200;
 const h=object.kind==='portal'?370:object.kind==='tree'?260:240;
 const canvas=document.createElement('canvas');canvas.width=w/2;canvas.height=h/2;
 const ctx=canvas.getContext('2d');ctx.scale(.5,.5);ctx.translate(w/2,h-30);
 ctx.save();ctx.globalAlpha=.27;ctx.fillStyle='#070d18';ctx.beginPath();ctx.ellipse(0,4,object.collision?.w*.65||25,object.collision?.h*.6||12,0,0,Math.PI*2);ctx.fill();ctx.restore();
 drawProp(ctx,object);
 return {canvas,w,h,anchor:h-30};
}
function drawProp(ctx,o){
 const p=PALETTE;
 if(o.kind==='portal'){
  for(let i=0;i<5;i++){pixel(ctx,-135-i*8,-i*9,270+i*16,9,'#292e45');pixel(ctx,-135-i*8,-i*9,270+i*16,2,'#606078');for(let j=0;j<8;j++)pixel(ctx,-125+j*36,-i*9+2,2,6,'#1b243a');}
  // Broken arch assembled from individual wedge blocks around the live energy opening.
  for(let i=0;i<15;i++){
   const a=Math.PI+i*Math.PI/14,x=Math.cos(a)*128,y=-100+Math.sin(a)*135;
   ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);stone(ctx,0,0,48,47,30+i);ctx.restore();
  }
  masonry(ctx,-123,-15,55,115,8);masonry(ctx,123,-15,55,110,9);
  for(const [x,y] of [[-145,-170],[135,-205],[-165,-100],[155,-45]])stone(ctx,x,y,38,35,x+y);
  foliage(ctx,-140,-20,35,6);foliage(ctx,135,-210,30,7);
  for(const x of [-115,115])rune(ctx,x,-88,'#476ba5',13);
 }else if(o.kind==='shrine'){
  stone(ctx,0,5,142,65,o.seed);masonry(ctx,0,-8,96,64,o.seed+4);stone(ctx,0,-68,122,43,o.seed+1);
  rune(ctx,0,-33,{fire:'#dba761',water:'#7da7bb',earth:'#c0ae7b',wind:'#75b7a7',lightning:'#ad8aca'}[o.element],12);
  foliage(ctx,-57,12,20,o.seed+1);foliage(ctx,54,11,17,o.seed+6);
 }else if(o.kind==='campfire'){
  for(let i=0;i<13;i++){const a=i*Math.PI*2/13;stone(ctx,Math.cos(a)*48,Math.sin(a)*27,27,23,i+8);}
  polygon(ctx,[[-27,-12],[31,-25],[38,-17],[-20,-5]],'#55362c');polygon(ctx,[[-27,-26],[33,-7],[25,0],[-34,-18]],'#6d4030');stroke(ctx,[[-25,-22],[27,-6]],'#ac6a3a',3);
 }else if(o.kind==='bench'){
  pixel(ctx,-43,-8,10,12,'#292326');pixel(ctx,33,-8,10,12,'#292326');
  polygon(ctx,[[-56,-23],[-40,-36],[58,-12],[44,1]],'#35282a');polygon(ctx,[[-56,-25],[-40,-40],[58,-16],[44,-3]],'#754e35');stroke(ctx,[[-39,-36],[53,-15]],'#a87c4b',3);stroke(ctx,[[-49,-23],[40,-4]],'#a47747',2);
 }else if(o.kind==='pillar'||o.kind==='wall'){
  const w=o.kind==='wall'?68:62;stone(ctx,0,6,w+15,36,o.seed);masonry(ctx,0,-12,w,o.height-25,o.seed);
  stone(ctx,0,-o.height+8,w+9,32,o.seed+1);
  if(o.kind==='pillar'){stroke(ctx,[[8,-o.height+22],[-5,-o.height/2],[9,-29]],'#252d40',3);foliage(ctx,-27,3,22,o.seed);stroke(ctx,[[-24,-o.height+12],[-28,-o.height+38],[-19,-o.height+56],[-25,-o.height+83]],'#405445',3);for(let i=0;i<4;i++)pixel(ctx,-28+(i%2)*7,-o.height+29+i*15,7,4,'#52614b');}
  else foliage(ctx,18,-o.height+3,19,o.seed);
 }else if(o.kind==='tree'){
  polygon(ctx,[[-7,0],[-4,-85],[-25,-110],[-20,-120],[3,-93],[15,-134],[20,-130],[9,-85],[13,0]],'#252e30');
  for(let i=0;i<5;i++)foliage(ctx,(i%2?1:-1)*22,-o.height+28+i*20,46,o.seed+i);
 }else if(o.kind==='banner'){
  pixel(ctx,-42,-150,84,7,'#4e3931');pixel(ctx,-38,-157,6,160,'#342d2c');pixel(ctx,32,-157,6,160,'#342d2c');
  polygon(ctx,[[-29,-143],[28,-143],[26,-51],[0,-28],[-27,-49]],'#342b43');stroke(ctx,[[-26,-142],[-24,-52],[0,-32],[24,-53],[26,-142]],'#8c6850',3);rune(ctx,0,-94,'#817087',19);
 }else if(o.kind==='crate'){
  pixel(ctx,-23,-43,46,43,'#44322c');polygon(ctx,[[-23,-43],[-12,-53],[32,-53],[23,-43]],'#75573d');
  for(let i=0;i<4;i++)pixel(ctx,-20+i*11,-40,2,35,'#8a6342');stroke(ctx,[[-20,-40],[20,-4]],'#9b7350',5);stroke(ctx,[[-21,-41],[21,-41],[21,-2],[-21,-2],[-21,-41]],'#2d292b',4);
 }else if(o.kind==='barrel'){
  polygon(ctx,[[-14,-35],[-19,-27],[-17,-3],[-10,2],[12,2],[18,-5],[18,-26],[13,-35]],'#705039');
  for(const x of [-9,0,9])pixel(ctx,x,-32,2,32,'#352d2a');for(const y of [-28,-8])pixel(ctx,-17,y,34,4,'#363742');stone(ctx,0,-33,26,10,o.seed);
 }else if(o.kind==='lantern'){
  pixel(ctx,-3,-57,6,60,'#57422f');pixel(ctx,-12,-64,24,4,'#9c7750');pixel(ctx,-11,-57,22,24,'#302930');pixel(ctx,-7,-54,14,17,'#c8803e');pixel(ctx,-4,-51,8,12,'#ffe0a0');pixel(ctx,-14,-33,28,4,'#6d5240');
 }else if(o.kind==='fence'){
  if(o.vertical){for(let y=-o.w/2;y<=o.w/2;y+=30){pixel(ctx,-6,y-40,12,43,'#614736');pixel(ctx,-4,y-40,6,3,'#a58252');}pixel(ctx,-3,-o.w/2-25,6,o.w,'#8a6545');}
  else{for(let x=-o.w/2;x<=o.w/2;x+=45){pixel(ctx,x-5,-42,10,47,'#654a35');pixel(ctx,x-4,-42,8,3,'#a08053');}for(const y of [-32,-14])pixel(ctx,-o.w/2,y,o.w,6,'#866346');}
 }else if(o.kind==='table'){
  for(const x of [-53,44])pixel(ctx,x,-26,9,30,'#3b2d29');pixel(ctx,-66,-41,132,15,'#533d30');pixel(ctx,-66,-43,132,4,'#a47b50');
  for(let i=0;i<5;i++)pixel(ctx,-60+i*25,-38,2,8,'#33282a');pixel(ctx,-40,-52,35,10,'#a28a68');pixel(ctx,-39,-50,20,2,'#544951');pixel(ctx,15,-58,14,17,'#7d537e');pixel(ctx,35,-53,12,13,'#aaa98b');
 }
}
