import {HUB_BOUNDARY} from './layout.js';
import {insidePolygon} from './collision.js';
import {polygon,pixel,stroke,random,foliage,stone} from './pixel-art.js';
function boundary(ctx,offset=0){polygon(ctx,HUB_BOUNDARY.map(p=>[p.x+(p.x-900)*offset,p.y+(p.y-680)*offset]),'#29333e');}
export function createTerrain(){
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=650;
 const ctx=canvas.getContext('2d');ctx.scale(.5,.5);const rng=random(42013);
 pixel(ctx,0,0,1800,1300,'#0b1222');
 // Layered cliff faces recede into the night beneath the sanctuary.
 for(let i=7;i>=0;i--){ctx.save();ctx.translate(0,i*17);boundary(ctx,.035);ctx.fillStyle=['#273246','#202d42','#1d293f','#19253b','#162237','#142034','#121d30','#101a2c'][i];ctx.fill();ctx.restore();}
 boundary(ctx);ctx.save();ctx.beginPath();HUB_BOUNDARY.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
 // Offset flagstones have deliberately irregular corners and a restrained palette.
 for(let row=0;row<38;row++)for(let col=0;col<42;col++){
  const x=col*46+(row%2)*23,y=row*37,w=40+rng()*5,h=30+rng()*5;
  polygon(ctx,[[x+3,y+2],[x+w-3,y],[x+w,y+h-7],[x+w-7,y+h],[x+2,y+h-2],[x,y+8]],['#363d4a','#343b47','#3d414d','#303b43','#41434f'][Math.floor(rng()*5)]);
  stroke(ctx,[[x+5,y+3],[x+w-5,y+2]],'#4b4e58',2);
  if(rng()>.5)stroke(ctx,[[x+13,y+3],[x+17,y+14],[x+12,y+22]],'#252e3b');
 }
 // The camp plaza uses concentric worn paving, matching the reference composition.
 for(let ring=1;ring<9;ring++){
  const r=ring*47,n=Math.max(10,Math.floor(r/12));
  for(let i=0;i<n;i++){
   const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n,gap=.007;
   const point=(angle,radius)=>[900+Math.cos(angle)*radius,700+Math.sin(angle)*radius*.76];
   const outer=r-3,inner=r-44;
   polygon(ctx,[point(a+gap,inner),point(b-gap,inner),point(b-gap,outer),point(a+gap,outer)],['#403a42','#383740','#453c43','#34353e'][Math.floor(rng()*4)]);
   stroke(ctx,[point(a+gap,outer),point(b-gap,outer)],'#55505b',2);
   if(rng()>.65)stroke(ctx,[point(a+.02,inner+9),point(a+.035,inner+20),point(a+.025,outer-10)],'#272c39');
   for(let chip=0;chip<5;chip++){const q=point(a+(b-a)*rng(),inner+rng()*38);pixel(ctx,q[0],q[1],2+rng()*4,2,rng()>.5?'#5e545b':'#30343e');}
  }
 }
 // Well-worn path north, and an earth practice yard southwest.
 for(let i=0;i<10;i++)for(let j=0;j<5;j++){
  const x=790+j*44+(i%2)*8,y=365+i*25;
  polygon(ctx,[[x,y],[x+40,y+1],[x+42,y+28],[x+1,y+27]],['#4b4855','#454350','#514b57'][Math.floor(rng()*3)]);
  stroke(ctx,[[x+3,y+2],[x+36,y+2]],'#656071');
 }
 polygon(ctx,[[300,905],[590,925],[650,1045],[310,1025]],'#423b38');
 for(let i=0;i<45;i++)pixel(ctx,320+rng()*300,925+rng()*110,3,2,'#75634e');
 for(const [x,y] of [[380,940],[480,960],[585,985]]){
  ctx.strokeStyle='#877557';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+3,28,13,0,0,Math.PI*2);ctx.stroke();
 }
 for(let i=0;i<2200;i++){
  const x=190+rng()*1400,y=110+rng()*1100;
  if(!insidePolygon(x,y,HUB_BOUNDARY))continue;
  const d=Math.hypot((x-900)/1.1,(y-700)/.8);
  if(d<310&&rng()>.12)continue;
  pixel(ctx,x,y,2+rng()*6,2+rng()*4,['#354638','#394c3c','#4d5843','#242f34','#62605e'][Math.floor(rng()*5)]);
  if(i%13===0){pixel(ctx,x,y-4,2,5,'#637252');pixel(ctx,x+2,y-6,3,3,'#876b83');}
 }
 for(let i=0;i<110;i++){
  const p=HUB_BOUNDARY[i%HUB_BOUNDARY.length];
  const x=p.x+(rng()-.5)*110,y=p.y+(rng()-.5)*95;
  foliage(ctx,x,y,22+rng()*25,i+2);
  if(i%4===0)stone(ctx,x+15,y+15,20+rng()*20,17,i);
 }
 // Small rubble piles remain ground decoration, never invisible blockers.
 for(const [x,y] of [[580,470],[1240,530],[610,880],[1210,970],[700,345]])for(let i=0;i<9;i++)stone(ctx,x+(rng()-.5)*75,y+(rng()-.5)*36,12+rng()*19,9+rng()*9,i+20);
 ctx.restore();
 return canvas;
}
