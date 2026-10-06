import {polygon,stroke,dot} from './spell-art.js?v=progression-1';
const COLORS={fire:['#f35422','#ffad32','#fff3b4'],earth:['#777f64','#c1b184','#eee2b4'],water:['#3674c6','#65d7f1','#e1fcff'],wind:['#589986','#a3e1c8','#e8fff7'],lightning:['#8251e8','#87b7ff','#f1fbff']};
const TAU=Math.PI*2;
function line(ctx,pts,color,width=2,alpha=1){ctx.save();ctx.globalAlpha*=alpha;stroke(ctx,pts,color,width);ctx.restore();}
function poly(ctx,pts,color,alpha=1){ctx.save();ctx.globalAlpha*=alpha;polygon(ctx,pts,color);ctx.restore();}
function circle(ctx,x,y,r,color,alpha=1,flat=1){const p=[];for(let i=0;i<24;i++){const a=i/24*TAU;p.push([x+Math.cos(a)*r,y+Math.sin(a)*r*flat]);}poly(ctx,p,color,alpha);}
function ring(ctx,x,y,r,color,alpha=1,flat=1){const p=[];for(let i=0;i<=32;i++){const a=i/32*TAU;p.push([x+Math.cos(a)*r,y+Math.sin(a)*r*flat]);}line(ctx,p,color,2,alpha);}
function halo(ctx,x,y,r,color){ctx.save();ctx.globalCompositeOperation='lighter';circle(ctx,x,y,r*1.6,color,.045);circle(ctx,x,y,r*1.25,color,.085);circle(ctx,x,y,r,color,.1);ctx.restore();}
function spark(ctx,x,y,color,size=3){dot(ctx,x,y,size,color);line(ctx,[[x-size*2,y],[x+size*2,y]],color,1,.5);line(ctx,[[x,y-size*2],[x,y+size*2]],color,1,.5);}
function stone(ctx,x,y,size,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);
 polygon(ctx,[[size*1.8,0],[-size*.6,-size*.6],[-size,-size*.1],[-size*.5,size*.6]],'#3c4439');
 polygon(ctx,[[size*1.65,0],[-size*.6,-size*.52],[-size*.25,0]],'#b8b18a');
 polygon(ctx,[[size*1.65,0],[-size*.25,0],[-size*.48,size*.5]],'#798367');
 line(ctx,[[-size*.75,-size*.12],[-size*.25,0],[size*.55,-size*.06]],'#e1d4a5',1);
 line(ctx,[[-size*.3,size*.26],[size*.15,size*.08],[size*.55,size*.13]],'#465044',2);ctx.restore();}
function fireOrb(ctx,r,t,power=0){
 halo(ctx,0,0,r,'#ff792c');
 const edge=[];for(let i=0;i<32;i++){const a=i/32*TAU,rr=r*(1+Math.sin(i*4+t*18)*.10);edge.push([Math.cos(a)*rr,Math.sin(a)*rr]);}
 polygon(ctx,edge,'#ae2b28');circle(ctx,-r*.06,-r*.06,r*.87,'#f45122');circle(ctx,-r*.15,-r*.16,r*.67,'#ff9d2f');circle(ctx,-r*.2,-r*.2,r*.42,'#ffe16f');
 for(let j=0;j<6;j++){const pts=[];for(let i=0;i<15;i++){const f=i/14,a=f*4+t*(j%2?3:-3)+j;pts.push([Math.cos(a)*r*(.2+f*.7),Math.sin(a)*r*(.2+f*.7)]);}line(ctx,pts,j%2?'#fff4b1':'#df4822',j%2?2:3,.7);}
 for(let i=0;i<12;i++){const a=i/12*TAU+t*.6,s=r*(1.03+Math.sin(t*7+i)*.08);poly(ctx,[[Math.cos(a)*s,Math.sin(a)*s],[Math.cos(a+.13)*r*.88,Math.sin(a+.13)*r*.88],[Math.cos(a+.15)*r*(1.3+power*.3),Math.sin(a+.15)*r*(1.3+power*.3)],[Math.cos(a+.25)*r*.92,Math.sin(a+.25)*r*.92]],i%2?'#ffbd3d':'#f87523',.8);}
 for(let i=0;i<24;i++){const f=(t*(.5+power)+i*.618)%1,a=i*2.399-t;const x=Math.cos(a)*(r+f*(25+power*20)),y=Math.sin(a)*(r+f*22)-f*20;ctx.save();ctx.globalAlpha*=1-f;dot(ctx,x,y,i%4?2:4,i%3?'#ff9b35':'#ffe9a0');ctx.restore();}
 spark(ctx,-r*.25,-r*.28,'#fff4c1',3);
}
function wave(ctx,t){
 // A heavy curling wall of water: shaded volume, rolling crest and broken foam.
 ctx.save();ctx.scale(1.18,1.23);
 circle(ctx,-15,0,84,'#348bba',.05);
 poly(ctx,[[-82,-63],[-61,-78],[-28,-84],[8,-78],[32,-62],[48,-32],[55,0],[48,32],[32,62],[8,78],[-28,84],[-61,78],[-82,63],[-55,37],[-40,0],[-55,-37]],'#173954',.7);
 poly(ctx,[[-68,-58],[-51,-72],[-22,-77],[7,-69],[28,-53],[40,-28],[47,0],[40,28],[28,53],[7,69],[-22,77],[-51,72],[-68,58],[-45,31],[-31,0],[-45,-31]],'#216f9e',.85);
 for(let j=0;j<5;j++){
  const front=[],back=[];
  for(let i=0;i<=30;i++){const y=-72+i/30*144,x=27-(y/72)**2*77-j*13+Math.sin(t*8+i*.28+j)*4;front.push([x,y]);back.push([x-15,y]);}
  poly(ctx,[...front,...back.reverse()],['#379aca','#267fac','#2b8eb6','#226c9a','#1c577d'][j],.75);
  line(ctx,front,j<2?'#75d5e6':'#42a9c4',j<2?3:2,j<2?.55:.3);
 }
 // Fold the bright lip back into the blue body instead of making a solid blade.
 const crest=[],curl=[];
 for(let i=0;i<=32;i++){const y=-74+i/32*148,x=43-(y/74)**2*72+Math.sin(t*9+i*.44)*3;crest.push([x,y]);curl.push([x-18-Math.sin(i*.28+t*6)*3,y]);}
 poly(ctx,[...crest,...curl.reverse()],'#6bd5e4',.85);
 line(ctx,curl,'#277caf',4,.8);line(ctx,crest,'#bdf7f6',3,.7);
 for(let i=0;i<36;i++){
  const y=-73+i/35*146,x=43-(y/74)**2*72+Math.sin(t*9+i*.44)*3;
  const size=2+(i%5),drift=Math.sin(t*12+i*1.7)*3;
  dot(ctx,x+drift,y,size,i%4?'#dcffff':'#8ddeec');dot(ctx,x-5,y-2,size*.6,'#79c8dc');
  if(i%3===0){line(ctx,[[x-11,y+2],[x-14,y-1],[x-16,y-6]],'#b3ecee',2,.65);dot(ctx,x+5,y+3,2,'#eaffff');}
 }
 // Swept spray and droplets break away from the moving wave front.
 for(let i=0;i<32;i++){
  const f=(t*1.3+i*.618)%1,y=Math.sin(i*2.399)*76,x=42-(y/76)**2*63+f*42;
  ctx.save();ctx.globalAlpha*=1-f;const size=2+i%3;line(ctx,[[x-7,y+4],[x-2,y],[x,y-3]],i%3?'#95dce6':'#f0ffff',2,.8);dot(ctx,x,y-3,size,'#c7f9fa');ctx.restore();
 }
 for(let j=0;j<7;j++){
  const pts=[];for(let i=0;i<20;i++){const f=i/19;pts.push([-200+f*175,(j-3)*18+Math.sin(f*8-t*7+j)*7]);}
  line(ctx,pts,j%2?'#357b9b':'#73c6d6',2,.12+j%2*.06);
 }
 ctx.restore();
}
function cyclone(ctx,c){
 const t=c.age,r=66,top=-115;
 circle(ctx,0,5,88,'#98eacb',.07,.35);circle(ctx,0,5,78,'#598574',.1,.35);ring(ctx,0,5,72,'#98bfa0',.35,.35);
 for(let j=0;j<10;j++){
  const h=j/9,y=top*h,width=16+h*r,pts=[];
  for(let i=0;i<=26;i++){const a=i/26*TAU+t*6+j*.6;pts.push([Math.cos(a)*width,y+Math.sin(a)*width*.26]);}
  line(ctx,pts,j%3?'#70bfa7':'#d6ffef',j%3?3:4,.16+h*.24);
 }
 for(let j=0;j<5;j++){
  const pts=[];for(let i=0;i<=44;i++){const f=i/44,a=f*TAU*2.2-t*7+j*1.1,w=18+f*62;pts.push([Math.cos(a)*w,-f*118+Math.sin(a)*w*.25]);}
  poly(ctx,[...pts.map(([x,y])=>[x,y-3]),...pts.map(([x,y])=>[x,y+3]).reverse()],j%2?'#86c5ae':'#d1ffea',.22);line(ctx,pts,j%2?'#a5e0c7':'#e4fff2',j%2?3:2,.5);
 }
 for(let i=0;i<25;i++){const f=(t*.5+i*.618)%1,a=t*6+i*2.399,w=25+f*63,x=Math.cos(a)*w,y=-f*120+Math.sin(a)*w*.2;ctx.save();ctx.globalAlpha*=Math.sin(f*Math.PI);if(i%4===0)stone(ctx,x,y,3,a);else if(i%3===0)poly(ctx,[[x-3,y],[x+1,y-3],[x+5,y],[x,y+2]],'#b8b88b');else line(ctx,[[x,y],[x+Math.sin(a)*8,y-Math.cos(a)*3]],'#caffec',2,.7);ctx.restore();}
 for(let i=0;i<8;i++){const a=t*4+i/8*TAU,x=Math.cos(a)*55,y=Math.sin(a)*17;circle(ctx,x,y,5+i%3,'#b6ae96',.18,.6);}
}
function dragon(ctx,e){
 const p=Math.min(1,e.age/.16),fade=e.age>.4?(e.life-e.age)/.3:1,path=[];
 for(let n=1;n<e.nodes.length;n++){
  const a=e.nodes[n-1],b=e.nodes[n],d=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(6,Math.ceil(d/7));
  for(let i=0;i<=steps;i++){const f=i/steps,w=Math.sin(f*Math.PI)*(12+Math.sin(f*10-e.age*16)*7),dx=(b.x-a.x)/Math.max(d,1),dy=(b.y-a.y)/Math.max(d,1);path.push([a.x+(b.x-a.x)*f-dy*w,a.y+(b.y-a.y)*f+dx*w]);}
 }
 const visible=path.slice(0,Math.max(2,Math.ceil(path.length*p)));if(visible.length<2)return;
 ctx.save();ctx.globalAlpha*=Math.max(0,fade);
 line(ctx,visible,'#7043ec',35,.08);line(ctx,visible,'#8993ff',23,.2);
 const left=[],right=[],normals=[];
 for(let i=0;i<visible.length;i++){
  const a=visible[Math.max(0,i-1)],b=visible[Math.min(visible.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
  const f=i/Math.max(1,visible.length-1),width=(5+Math.sin(f*Math.PI)*7)*(1+Math.sin(i*.8-e.age*12)*.08);
  normals.push([nx,ny]);left.push([visible[i][0]+nx*width,visible[i][1]+ny*width]);right.push([visible[i][0]-nx*width,visible[i][1]-ny*width]);
 }
 poly(ctx,[...left,...right.reverse()],'#4059b2',.9);
 line(ctx,left,'#a2c5ff',3,.85);line(ctx,visible,'#57b8f5',12,.8);line(ctx,visible,'#b1f1ff',5,.9);line(ctx,visible,'#f3fdff',2,.85);
 // Scales, dorsal fins and small forks make the chain read as a living dragon.
 for(let i=3;i<visible.length-3;i+=3){
  const [x,y]=visible[i],[nx,ny]=normals[i],tx=ny,ty=-nx;
  poly(ctx,[[x+nx*7,y+ny*7],[x+nx*19-tx*9,y+ny*19-ty*9],[x+nx*5-tx*9,y+ny*5-ty*9]],i%2?'#b5adff':'#9adaff',.8);
  line(ctx,[[x-nx*7-tx*3,y-ny*7-ty*3],[x-tx*8,y-ty*8],[x+nx*5-tx*5,y+ny*5-ty*5]],'#647bc7',2,.85);
  if(i%6===3)line(ctx,[[x+nx*12,y+ny*12],[x+nx*25-tx*8,y+ny*25-ty*8],[x+nx*28+tx*4,y+ny*28+ty*4],[x+nx*38-tx*7,y+ny*38-ty*7]],'#b5a0ff',2,.6);
 }
 // Two pairs of curled, clawed forelegs along the serpentine body.
 for(const f of [.38,.7]){
  const i=Math.min(visible.length-2,Math.floor(visible.length*f)),[x,y]=visible[i],[nx,ny]=normals[i];
  for(const side of [-1,1]){const limb=[[x,y],[x+nx*side*19-7,y+ny*side*19],[x+nx*side*25+3,y+ny*side*25+7]];line(ctx,limb,'#587cca',6,.9);line(ctx,limb,'#bcdeff',2,.9);const claw=limb.at(-1);for(let j=-1;j<=1;j++)line(ctx,[claw,[claw[0]+7+j*2,claw[1]+j*4]],'#e7faff',2,.85);}
 }
 const head=visible.at(-1),before=visible.at(-2),angle=Math.atan2(head[1]-before[1],head[0]-before[0]);ctx.save();ctx.translate(...head);ctx.rotate(angle);
 halo(ctx,0,0,31,'#868dff');
 // Swept mane, branching antlers, brow, open jaw and luminous fangs.
 poly(ctx,[[-31,-8],[-39,-24],[-23,-18],[-28,-30],[-11,-19],[-4,-11],[-13,9],[-30,21],[-24,8],[-39,13]],'#817adf',.8);
 polygon(ctx,[[-26,-7],[-18,-18],[-5,-17],[5,-11],[23,-8],[31,-2],[27,5],[15,7],[7,15],[-6,18],[-22,11]],'#3568b2');
 polygon(ctx,[[-20,-8],[-13,-13],[-3,-12],[9,-8],[23,-5],[27,-1],[15,3],[2,5],[-6,12],[-16,7]],'#91d7fa');
 poly(ctx,[[-15,-13],[-8,-18],[3,-12],[7,-8],[-1,-8]],'#d7f6ff');
 polygon(ctx,[[11,6],[28,4],[21,12],[8,16],[1,12]],'#354b92');
 line(ctx,[[4,13],[16,13],[24,8]],'#b6d8fd',3);poly(ctx,[[14,5],[18,5],[16,10]],'#f0ffff');poly(ctx,[[23,3],[27,2],[25,7]],'#e8fdff');
 line(ctx,[[-15,-14],[-24,-26],[-26,-37],[-31,-41]],'#aabdf6',5);line(ctx,[[-15,-14],[-24,-26],[-26,-37],[-31,-41]],'#ebfaff',2);line(ctx,[[-24,-26],[-35,-29],[-40,-36]],'#d1dcff',2);
 line(ctx,[[-7,-15],[-10,-27],[-4,-35],[-5,-43]],'#d4edff',3);line(ctx,[[-10,-27],[-17,-31],[-17,-36]],'#e5faff',2);
 line(ctx,[[-6,-8],[2,-9],[8,-6]],'#344f97',3);dot(ctx,0,-7,5,'#fff3ad');dot(ctx,3,-7,2,'#e2875b');dot(ctx,22,-3,2,'#4778b8');
 for(const side of [-1,1]){const whisker=[];for(let i=0;i<9;i++){const f=i/8;whisker.push([20+f*32,side*(4+f*22)+Math.sin(f*8-e.age*14)*3]);}line(ctx,whisker,'#b7deff',2,.75);}
 line(ctx,[[-22,10],[-29,21],[-21,18],[-26,29]],'#cbbdff',2,.75);ctx.restore();
 // Impact branches remain small enough that targets and their status stay visible.
 for(let i=1;i<e.nodes.length;i++){const n=e.nodes[i];ring(ctx,n.x,n.y,10+e.age*15,'#b39bff',.45);for(let j=0;j<5;j++){const a=j*2.399+e.age*4,r=15+e.age*20;line(ctx,[[n.x,n.y],[n.x+Math.cos(a)*r*.6,n.y+Math.sin(a)*r*.6],[n.x+Math.cos(a+.3)*r,n.y+Math.sin(a+.3)*r]],j%2?'#a7a2ff':'#dbfaff',2,.65);}spark(ctx,n.x,n.y,'#edfcff',3);}
 ctx.restore();
}
export function drawSecondGround(ctx,spells){
 for(const b of spells.bursts){
 const f=b.age/b.life,[,color,bright]=COLORS[b.element];ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha*=1-f;
 ctx.save();ctx.scale(1,.38);halo(ctx,0,0,b.radius*(.5+f),color);ring(ctx,0,0,b.radius*(.35+f*.8),color,.5);
 ring(ctx,0,0,b.radius*(.25+f*.8),bright,.4);ctx.restore();
 ctx.restore();
 }
}
function burst(ctx,b){
 const f=b.age/b.life,[dark,color,bright]=COLORS[b.element];ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha*=1-f;
 for(let i=0;i<28;i++){const a=i*2.399,r=b.radius*(.2+f*(.7+i%4*.1)),x=Math.cos(a)*r,y=Math.sin(a)*r*(b.element==='fire'?1:.6);if(b.element==='earth')stone(ctx,x,y,3+i%3,a);else if(b.element==='fire')poly(ctx,[[x,y-7],[x+4,y+2],[x,y+6],[x-4,y+2]],i%3?color:bright);else line(ctx,[[x,y],[x-Math.cos(a)*12,y-Math.sin(a)*6]],i%4?color:bright,2);}
 if(b.element==='fire')for(let i=0;i<6;i++){const a=i*2.399;circle(ctx,Math.cos(a)*f*b.radius*.7,Math.sin(a)*f*b.radius*.7,8+f*15,dark,.2);}
 ctx.restore();
}
export function drawSecondSpells(ctx,spells){
 const c=spells.channel;
 if(c){
  if(c.element==='fire'){
   ctx.save();ctx.translate(c.origin.x,c.origin.y);const r=(13+c.power*29)*1.2;ring(ctx,0,0,r+10,'#ffad4a',.35);fireOrb(ctx,r,c.age,c.power);ctx.restore();
   ctx.save();ctx.translate(c.player.x,c.player.y);ring(ctx,0,0,23+c.power*14,'#d87230',.4,.3);ctx.restore();
  }else if(c.element==='earth'){
   const count=3+Math.floor(c.power*9);ctx.save();ctx.translate(c.player.x,c.player.y);ring(ctx,0,0,45,'#a9986c',.3,.4);
   for(let i=0;i<count;i++){const a=i/count*TAU+c.age*.65,r=35+c.power*22,x=Math.cos(a)*r,y=Math.sin(a)*r*.45-28-Math.sin(c.age*3+i)*5;circle(ctx,x,Math.sin(a)*r*.45,8,'#c1a96e',.12,.3);stone(ctx,x,y,11+c.power*5,c.aim);line(ctx,[[x,y+8],[x-3,y+22],[x+1,y+29]],'#b1a57b',1,.25);dot(ctx,x+6,y+10,2,'#ddcfa6');}
   for(let i=0;i<15;i++){const a=i*2.399,f=(c.age*.8+i*.618)%1;dot(ctx,Math.cos(a)*55,Math.sin(a)*24-f*25,2,'#b2a080');}ctx.restore();
  }else{ctx.save();ctx.translate(c.x,c.y);cyclone(ctx,c);ctx.restore();}
  // A small channel meter sits below the resources, clear of the raised fireball.
  ctx.save();ctx.translate(c.player.x,c.player.y+32);ctx.fillStyle='#15141f';ctx.fillRect(-23,-3,46,6);ctx.fillStyle=COLORS[c.element][1];ctx.fillRect(-22,-2,44*c.power,4);ctx.restore();
 }
 for(const e of spells.effects){if(e.age<0)continue;if(e.kind==='dragon'){dragon(ctx,e);continue;}ctx.save();ctx.translate(e.x,e.y);if(e.kind==='wave')ctx.scale(1,.65);ctx.rotate(e.aim);
  if(e.kind==='wave')wave(ctx,e.age);
  else if(e.kind==='fireball'){
   for(let i=0;i<6;i++){const f=i/6;circle(ctx,-f*(80+e.radius),Math.sin(e.age*14+i)*8,e.radius*(1-f*.7),'#ef6526',(1-f)*.14);}
   fireOrb(ctx,e.radius,e.age,e.power);
  }else{
   const pts=[];for(let i=0;i<9;i++)pts.push([-i*7,Math.sin(e.age*16+i)*2]);line(ctx,pts,'#b9bd8d',3,.25);line(ctx,pts,'#f0d9a1',1,.4);stone(ctx,0,0,8+e.power*3);for(let i=0;i<4;i++)dot(ctx,-15-i*9,Math.sin(e.age*8+i)*6,2,'#ac9f76');
  }ctx.restore();
 }
 for(const b of spells.bursts)burst(ctx,b);
}
