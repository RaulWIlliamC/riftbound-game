// Ritual geometry and material animation follow host-owned timers on every client.
const TAU=Math.PI*2;
function ground(c,x,y,flat,draw){c.save();c.translate(x,y);c.scale(1,flat||1);c.translate(-x,-y);draw();c.restore();}
const palette={fire:['#ff7638','#ffe6a0'],earth:['#ddb86b','#fff2c1'],water:['#39c9ed','#d1ffff'],lightning:['#9c9aff','#f5ffff'],wind:['#76e7bd','#edfff8']};
const clamp=v=>Math.max(0,Math.min(1,v));
const noise=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function circle(c,x,y,r,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);c.stroke();}
function glow(c,x,y,r,color,alpha=.3){c.save();c.globalAlpha*=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'bb');g.addColorStop(.5,color+'30');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function star(c,x,y,s,color){poly(c,[[x,y-s],[x+s*.25,y-s*.25],[x+s,y],[x+s*.25,y+s*.25],[x,y+s],[x-s*.25,y+s*.25],[x-s,y],[x-s*.25,y-s*.25]],color);}
function rock(c,x,y,size,a=0){c.save();c.translate(x,y);c.rotate(a);poly(c,[[-size,-size*.3],[-size*.4,-size],[size*.6,-size*.7],[size,size*.25],[size*.25,size],[-size*.7,size*.6]],'#66544a');poly(c,[[-size,-size*.3],[-size*.4,-size],[size*.6,-size*.7],[0,0]],'#d0b183');poly(c,[[0,0],[size*.6,-size*.7],[size,size*.25],[size*.25,size]],'#9c805b');line(c,[[-size*.4,-size],[0,0],[size*.25,size]],'#f0d79a',1);c.restore();}
function ritual(c,e){
 const [color,light]=palette[e.element],r=e.radius,t=e.age,p=clamp(t/.3),fade=e.ended?clamp(1-(t-e.endedAt)/.65):1;
 c.save();c.translate(e.x,e.y);c.globalAlpha*=fade;
 glow(c,0,0,r*1.1,color,.25*p);
 c.globalAlpha*=p;c.fillStyle=color+'12';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
 circle(c,0,0,r,color,2);circle(c,0,0,r-9,light+'a0',1);circle(c,0,0,r*.72,color+'70',1);
 c.save();c.rotate(t*.16);const points=[];for(let i=0;i<7;i++){const a=i*TAU/6-Math.PI/2;points.push([Math.cos(a)*r*.7,Math.sin(a)*r*.7]);}line(c,points,color+'88',1.5);
 for(let i=0;i<6;i++)line(c,[points[i],points[(i+2)%6]],color+'55',1);c.restore();
 for(let i=0;i<18;i++){const a=i/18*TAU-t*.11;c.save();c.rotate(a);line(c,[[r-27,-5],[r-20,0],[r-27,5],[r-32,0],[r-27,-5]],light+'b0',1.5);line(c,[[r-17,-3],[r-12,-3],[r-12,3]],color,1.5);c.restore();}
 c.save();c.rotate(-t*.2);for(let i=0;i<4;i++){const a=i*TAU/4;c.strokeStyle=light;c.lineWidth=3;c.beginPath();c.arc(0,0,r+4,a,a+.35);c.stroke();}c.restore();
 for(let i=0;i<8;i++){const a=i*TAU/8+t*.4;star(c,Math.cos(a)*r,Math.sin(a)*r,3+Math.sin(t*8+i),light);}
 c.restore();
}
function shark(c,x,y,a,size){
 c.save();c.translate(x,y);c.rotate(a);c.globalAlpha*=.85;
 poly(c,[[-size*1.4,0],[-size*1.9,-size*.6],[-size*1.7,0],[-size*1.9,size*.6],[-size*1.1,0],[-size*.5,-size*.35],[size*.7,-size*.25],[size,0],[size*.7,size*.25],[-size*.5,size*.35]],'#40647f');
 poly(c,[[-size*.8,0],[size,0],[size*.65,size*.2],[-size*.5,size*.22]],'#e0f6f3');
 poly(c,[[-size*.4,-size*.1],[-size*.9,-size*.7],[size*.05,-size*.25]],'#72bad4');
 poly(c,[[-size*.2,size*.15],[-size*.7,size*.65],[size*.2,size*.25]],'#5c9fb9');
 c.fillStyle='#162d4b';c.fillRect(size*.65,-size*.12,2,2);line(c,[[-size*.6,-size*.4],[-size*1.7,-size*.35]],'#c6ffff99',1);c.restore();
}
function whirlpool(c,e){
 const t=e.age-.3,r=e.radius,p=clamp(t/.35);c.save();c.translate(e.x,e.y);c.globalAlpha*=p*(e.ended?clamp(1-(e.age-e.endedAt)/.65):1);
 const g=c.createRadialGradient(0,0,5,0,0,r);g.addColorStop(0,'#0f346f99');g.addColorStop(.35,'#217cb6aa');g.addColorStop(.75,'#34b9d399');g.addColorStop(1,'#7de9e844');c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
 for(let j=0;j<5;j++){const points=[];for(let i=0;i<80;i++){const u=i/79,a=u*TAU*1.7-t*1.8+j*TAU/5,rr=10+u*(r-13);points.push([Math.cos(a)*rr,Math.sin(a)*rr]);}line(c,points,j%2?'#a9ffff88':'#48d4e8aa',2+j%2);}
 for(let i=0;i<7;i++){const a=t*(.8+i*.06)+i*TAU/7,rr=r*(.38+(i%3)*.18);shark(c,Math.cos(a)*rr,Math.sin(a)*rr,a+Math.PI/2,24+i%3*4);}
 for(let i=0;i<28;i++){const a=i*2.399+t*.7,rr=r*(.3+noise(i)*.67);c.fillStyle=i%3?'#7dedf0':'#efffff';c.fillRect(Math.round(Math.cos(a)*rr),Math.round(Math.sin(a)*rr),2+i%2,2);}
 circle(c,0,0,r-3,'#b3ffff99',3);circle(c,0,0,14+Math.sin(t*5)*3,'#abf5ff',2);c.restore();
}
export function drawThirdGround(c,s){
 for(const e of s.effects||[]){ground(c,e.x,e.y,e.groundScale,()=>ritual(c,e));if(e.element==='water'&&e.age>=.3)ground(c,e.x,e.y,e.groundScale,()=>whirlpool(c,e));
  if(e.element==='fire')for(const m of e.meteors||[]){if(m.impacted)continue;c.save();c.globalAlpha=.2+.5*clamp(m.age/m.fall);ground(c,m.x,m.y,e.groundScale,()=>{circle(c,m.x,m.y,m.radius,m.great?'#ffe9a2':'#ff9c60',m.great?3:1);glow(c,m.x,m.y,m.radius,'#ff7138',.25);});c.restore();}
 }
 for(const b of s.bursts||[]){if(b.bolt||b.slash||b.bite)continue;const p=clamp(b.age/b.life),[color,light]=palette[b.element];c.save();c.globalAlpha=1-p;c.translate(b.x,b.y);c.scale(1,b.groundScale||1);c.translate(-b.x,-b.y);glow(c,b.x,b.y,b.radius,color,.4);circle(c,b.x,b.y,b.radius*(.3+.7*p),light,4*(1-p)+1);
  for(let i=0;i<12;i++){const a=i*TAU/12,points=[[b.x,b.y]];for(let j=1;j<=4;j++){const rr=b.radius*j/4,aa=a+(noise(i*4+j)-.5)*.2;points.push([b.x+Math.cos(aa)*rr,b.y+Math.sin(aa)*rr]);}line(c,points,color+'aa',2);}c.restore();}
}
function greatMeteor(c,size,time){
 // Curved flame ribbons stream behind a rounded, molten stone body.
 const flame=(length,width,color,phase)=>{
  const flutter=Math.sin(time*24+phase)*size*.12;
  c.fillStyle=color;c.beginPath();c.moveTo(size*.45,-width*.6);
  c.bezierCurveTo(-size*.7,-width*1.2,-length*.58,-width*.42,-length,flutter-width*.08);
  c.quadraticCurveTo(-length*.58,width*.08,-length*.78,flutter+width*.4);
  c.bezierCurveTo(-length*.36,width*.45,-size*.55,width*1.2,size*.45,width*.6);
  c.quadraticCurveTo(size*.9,0,size*.45,-width*.6);c.fill();
 };
 flame(size*4.3,size*1.1,'#892635',0);flame(size*3.6,size*.95,'#e64727',1);
 flame(size*2.9,size*.72,'#ff8b32',2);flame(size*2.2,size*.42,'#ffcf68',3);
 for(let i=0;i<7;i++){
  const side=i%2?1:-1,phase=time*15+i*1.7,x=-size*(1.2+i*.38),y=side*size*(.3+Math.sin(phase)*.12),length=size*(.55+(i%3)*.25);
  c.strokeStyle=i%3?'#ffb345':'#ffe3a0';c.lineWidth=size*(i%3?.025:.04);c.beginPath();c.moveTo(x+length*.4,y);c.quadraticCurveTo(x-length*.4,y+side*size*.18,x-length,y+Math.sin(phase)*size*.12);c.stroke();
 }
 const contour=[];for(let i=0;i<32;i++){const a=i/32*TAU,r=size*(.94+noise(i+63)*.06);contour.push([Math.cos(a)*r,Math.sin(a)*r]);}
 c.save();c.beginPath();contour.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 const g=c.createRadialGradient(-size*.3,-size*.35,size*.1,0,0,size);g.addColorStop(0,'#77615a');g.addColorStop(.4,'#4b3c3b');g.addColorStop(.8,'#292630');g.addColorStop(1,'#191c28');c.fillStyle=g;c.fillRect(-size,-size,size*2,size*2);
 for(let i=0;i<16;i++){
  const a=i*2.39996,rr=size*(.2+noise(i+8)*.7),x=Math.cos(a)*rr,y=Math.sin(a)*rr,s=size*(.15+noise(i+17)*.12);
  poly(c,[[x-s,y-s*.5],[x-s*.2,y-s],[x+s*.75,y-s*.6],[x+s,y+s*.3],[x,y+s*.6],[x-s*.8,y+s*.2]],i%3===0?'#7a6255':i%3===1?'#352e35':'#574540');
  line(c,[[x-s,y-s*.5],[x-s*.2,y-s],[x+s*.75,y-s*.6]],'#9b776044',size*.012);
 }
 for(let i=0;i<11;i++){
  const a=i*TAU/11+.13,points=[];for(let j=0;j<5;j++){const r=size*(1-j*.2),aa=a+(noise(i*11+j)-.5)*.26;points.push([Math.cos(aa)*r,Math.sin(aa)*r]);}
  line(c,points,'#af3324',size*.065);line(c,points,'#ff8030',size*.032);line(c,points,'#ffd27a',size*.009);
  const v=points[2];line(c,[v,[v[0]+Math.cos(a+.8)*size*.17,v[1]+Math.sin(a+.8)*size*.17]],'#ffae48',size*.017);
 }
 c.restore();
 // White-gold leading edge and small embers replace the oversized star sticker.
 c.strokeStyle='#ff842f';c.lineWidth=size*.09;c.beginPath();c.arc(0,0,size*.99,-1.3,1.3);c.stroke();
 c.strokeStyle='#ffe3a1';c.lineWidth=size*.025;c.beginPath();c.arc(0,0,size*1.02,-.95,.95);c.stroke();
 for(let i=0;i<18;i++){const phase=(time*2+i*.618)%1,x=-size*(.4+phase*4),y=(noise(i+32)-.5)*size*(1+phase),s=size*(.015+noise(i)*.025);c.save();c.globalAlpha*=1-phase;poly(c,[[x,y-s],[x+s*.7,y],[x,y+s],[x-s*.7,y]],i%3?'#ff9441':'#ffe8a3');c.restore();}
}
function meteor(c,m){
 if(m.impacted||m.age<0)return;const p=clamp(m.age/m.fall),x=m.x-(1-p)*160,y=m.y-(1-p)*340,size=m.great?145:12;
 c.save();glow(c,x,y,size*(m.great?1.8:3),'#ff953f',m.great?.35:.6);c.translate(x,y);c.rotate(Math.atan2(340,160));
 if(m.great)greatMeteor(c,size,m.age);
 else{
  poly(c,[[size,0],[-size,-size],[-size*5,-size*.3],[-size*8,-size*.6],[-size*5,size*.4],[-size,size]],'#ce352d');
  poly(c,[[size,0],[-size,-size*.7],[-size*5,0],[-size,size*.7]],'#ff9b3f');line(c,[[-size*5,0],[0,0]],'#ffeab0',size*.4);rock(c,0,0,size,p*4);star(c,size*.4,0,size*.4,'#fff2c4');
 }
 c.restore();
}
function earthSphere(c,e){
 const p=e.power,t=e.age,r=e.radius,cx=e.x,cy=e.y-26,stage=clamp((t-.3)/1.1),shell=48-12*p;
 // A shaded, closed globe is built from many interlocking chunks, then compressed.
 c.save();c.globalAlpha*=stage;c.fillStyle='#18171899';c.beginPath();c.ellipse(cx,e.y+6,shell*1.15,8,0,0,TAU);c.fill();
 const solid=clamp((stage-.45)/.55);c.globalAlpha*=solid;
 const g=c.createRadialGradient(cx-shell*.35,cy-shell*.4,2,cx,cy,shell);
 g.addColorStop(0,'#e2c398');g.addColorStop(.4,'#a68b6c');g.addColorStop(.8,'#685647');g.addColorStop(1,'#3b332e');c.fillStyle=g;c.beginPath();c.arc(cx,cy,shell,0,TAU);c.fill();
 for(let i=0;i<8;i++){const a=i*TAU/8+t*.08;line(c,[[cx+Math.cos(a)*shell*.92,cy+Math.sin(a)*shell*.92],[cx+Math.cos(a+.2)*shell*.5,cy+Math.sin(a+.2)*shell*.5],[cx+Math.cos(a-.3)*shell*.24,cy+Math.sin(a-.3)*shell*.24]],'#392e2799',2);}
 c.restore();
 const stones=[];for(let i=0;i<64;i++){
  const a=i*2.39996+t*.22,latitude=1-2*(i+.5)/64,band=Math.sqrt(1-latitude*latitude)*shell,depth=Math.sin(a);
  const startX=cx+Math.cos(a)*(r+65),startY=cy+Math.sin(a)*(r+65)*.65;
  stones.push({i,a,depth,x:startX*(1-stage)+(cx+Math.cos(a)*band)*stage,y:startY*(1-stage)+(cy+latitude*shell)*stage});
 }
 stones.sort((a,b)=>a.depth-b.depth);
 for(const s of stones){const {i,a,depth,x,y}=s;if(stage===1&&depth<-.35)continue;
  line(c,[[x+Math.cos(a)*24*(1-stage),y+20*(1-stage)],[x,y]],'#d7b77055',2);
  c.save();c.globalAlpha*=.8+.2*(depth+1)/2;rock(c,x,y,5+p*3+noise(i)*4,a+t*.1);c.restore();
 }
 // Thin gold fissures communicate mounting pressure without opening the enclosure.
 c.save();c.globalAlpha*=stage*p;for(let i=0;i<4;i++){const a=i*TAU/4+t*.04;line(c,[[cx+Math.cos(a)*shell,cy+Math.sin(a)*shell],[cx+Math.cos(a+.2)*shell*.6,cy+Math.sin(a+.2)*shell*.6],[cx+Math.cos(a-.2)*shell*.3,cy+Math.sin(a-.2)*shell*.3]],'#ffe5a3',1.5);}c.restore();
}
function bolt(c,b){
 const p=clamp(b.age/b.life),seed=Math.floor(b.age*35),height=185+(b.decorative?30:0);const points=[[b.x,b.y-height]];
 for(let i=1;i<=9;i++)points.push([b.x+(i===9?0:(noise(i+seed*13)-.5)*28),b.y-height+i*height/9]);
 c.save();c.globalAlpha=1-p;line(c,points,'#6c6de866',12);line(c,points,'#aaa9ff',5);line(c,points,'#f4ffff',2);
 for(let i=2;i<8;i+=2){const v=points[i],side=i%4?1:-1;line(c,[v,[v[0]+side*25,v[1]+12],[v[0]+side*40,v[1]+9]],'#c5e9ff',2);}star(c,b.x,b.y,13*(1-p)+3,'#ffffff');glow(c,b.x,b.y,55,'#acb9ff',.6);circle(c,b.x,b.y,35*p,'#dbf8ff',2);c.restore();
}
function windBlade(c,x,y,a,size){
 c.save();c.translate(x,y);c.rotate(a);glow(c,size*.4,0,size,'#80e7c6',.15);
 c.fillStyle='#79d8b9';c.beginPath();c.moveTo(0,-size);c.quadraticCurveTo(size*1.8,0,0,size);c.quadraticCurveTo(size*.7,0,0,-size);c.fill();
 c.strokeStyle='#f1fff8';c.lineWidth=3;c.beginPath();c.moveTo(0,-size);c.quadraticCurveTo(size*1.8,0,0,size);c.stroke();
 for(let i=0;i<3;i++){c.strokeStyle=i===0?'#bdffeccc':'#71d1b677';c.lineWidth=1.5;c.beginPath();c.moveTo(-15-i*12,-size*.7);c.quadraticCurveTo(size*.8-i*8,0,-15-i*12,size*.7);c.stroke();}
 c.restore();
}
export function drawThirdSpells(c,s){
 for(const e of s.effects||[]){const t=e.age,fade=e.ended?clamp(1-(t-e.endedAt)/.65):1;
  if(e.origin&&!e.ended&&(t<.3||['fire','earth'].includes(e.element))){const [color,light]=palette[e.element];glow(c,e.origin.x,e.origin.y,22,color,.5);circle(c,e.origin.x,e.origin.y,14+Math.sin(t*12)*2,light,1);for(let i=0;i<4;i++){const a=t*5+i*TAU/4;star(c,e.origin.x+Math.cos(a)*20,e.origin.y+Math.sin(a)*12,3,light);}}
  if(t<.3)continue;c.save();c.globalAlpha*=fade;
  if(e.element==='fire'){c.globalAlpha=1;for(const m of e.meteors||[])meteor(c,m);}
  if(e.element==='earth')earthSphere(c,e);
  if(e.element==='lightning'){
   // Sparse cloud wisps leave the field and enemies visible.
   c.globalAlpha*=.25;for(let i=0;i<7;i++){const x=e.x+(i-3)*35,y=e.y-155+Math.sin(i+t)*12;glow(c,x,y,55,'#8278ce',.4);line(c,[[x-28,y],[x-12,y-9],[x+14,y-6],[x+35,y]],'#c2c3f4',3);}c.globalAlpha=fade;
   for(let i=0;i<5;i++){const a=t*.7+i*TAU/5;star(c,e.x+Math.cos(a)*e.radius*.65,e.y+Math.sin(a)*e.radius*.65*(e.groundScale||1),3,'#c4efff');}
  }
  if(e.element==='wind')for(let i=0;i<6;i++){const a=t*1.4+i*TAU/6,rr=e.radius*(i%2?.58:.8);windBlade(c,e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr*(e.groundScale||1),a+Math.PI/2,32+Math.sin(t*5+i)*6);}
  c.restore();
 }
 for(const b of s.bursts||[]){const p=clamp(b.age/b.life);if(b.bolt){bolt(c,b);continue;}c.save();c.globalAlpha=1-p;
  if(b.element==='fire'){for(let i=0;i<12;i++){const a=i*TAU/12,rr=b.radius*(.15+p*.75),x=b.x+Math.cos(a)*rr,y=b.y+Math.sin(a)*rr*(b.groundScale||1)-Math.sin(p*Math.PI)*25;poly(c,[[x-6,y+12],[x-10,y-5],[x,y-25*(1-p)],[x+9,y-6],[x+5,y+10]],i%2?'#ff8841':'#ffcc66');if(i%3===0)rock(c,x,y,6*(1-p)+2,a+p*3);}star(c,b.x,b.y,30*(1-p),'#fff0bb');}
  if(b.collapse){for(let i=0;i<18;i++){const a=i*TAU/18,rr=40+p*b.radius*.7;rock(c,b.x+Math.cos(a)*rr,b.y+Math.sin(a)*rr*.65-Math.sin(p*Math.PI)*28,8*(1-p)+2,a+p*5);}star(c,b.x,b.y-20,25*(1-p),'#fff5d1');}
  if(b.slash)for(let i=0;i<3;i++){const a=b.age*9+i*TAU/3;windBlade(c,b.x+Math.cos(a)*b.radius*.45,b.y+Math.sin(a)*b.radius*.45*(b.groundScale||1),a,50*(1-p)+15);}
  if(b.bite){for(let i=0;i<3;i++){const a=i*TAU/3+b.age*6;star(c,b.x+Math.cos(a)*b.radius*.6,b.y+Math.sin(a)*b.radius*.6*(b.groundScale||1),8*(1-p),'#e1ffff');}}
  c.restore();
 }
}
