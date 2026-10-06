import {THUNDER_STRIKE_SHEET_TEST} from './testing.js?v=progression-1';
import {drawThunderStrikeTest} from './thunder-strike-test.js';
import {FIRST_HITS} from './combat.js?v=progression-1';
import {polygon,stroke,dot,drawImpact} from './spell-art.js?v=progression-1';
// World-space pixel silhouettes with layered light, material motion and bounded particles.
function glint(ctx,x,y,color,size=3){stroke(ctx,[[x-size,y],[x+size,y]],color,2);stroke(ctx,[[x,y-size],[x,y+size]],color,2);}
function light(ctx,points,color,width){
  ctx.save();ctx.globalCompositeOperation='lighter';
  const alpha=ctx.globalAlpha;
  for(const [scale,opacity] of [[2.5,.06],[1.6,.1]]){
    const edge=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;const taper=i===0||i===points.length-1?.3:1;return [-dy/length*width*scale*taper/2,dx/length*width*scale*taper/2];});
    ctx.globalAlpha=alpha*opacity;polygon(ctx,[...points.map((p,i)=>[p[0]+edge[i][0],p[1]+edge[i][1]]),...points.map((p,i)=>[p[0]-edge[i][0],p[1]-edge[i][1]]).reverse()],color);
  }
  ctx.restore();
}
function chips(ctx,t,count,color,vertical=false){
  for(let i=0;i<count;i++){
    const p=(t*(.8+(i%4)*.17)+i*.618)%1,a=i*2.399;
    const x=vertical?Math.sin(a+t)*(20+p*37):Math.cos(a)*(22+p*58);
    const y=vertical?-p*175:Math.sin(a)*(8+p*25)-Math.sin(p*Math.PI)*(12+i%5*4);
    ctx.save();ctx.globalAlpha*=Math.sin(p*Math.PI)*.8;
    const size=i%4===0?4:2;dot(ctx,x,y,size,color);
    if(i%3===0)stroke(ctx,[[x,y],[x-(vertical?Math.sin(a)*2:Math.cos(a)*5),y+4]],color,2);
    if(i%9===0)glint(ctx,x,y,'#fff0c2',3);ctx.restore();
  }
}
function wake(ctx,t,color,bright,spread){
  for(let j=0;j<5;j++){
    const points=[];for(let i=0;i<=22;i++){const f=i/22;points.push([-185+f*180,Math.sin(f*8-t*10+j*.9)*(1-f)*spread+(j-2)*(1-f)*6]);}
    ctx.save();ctx.globalAlpha*=j===2?.65:.28;stroke(ctx,points,j===2?bright:color,j===2?3:2);ctx.restore();
  }
  for(let i=0;i<24;i++){
    const p=(t*1.6+i*.618)%1,x=-15-p*175,y=Math.sin(i*7+t*3)*(8+p*spread);
    ctx.save();ctx.globalAlpha*=(1-p)*.8;stroke(ctx,[[x,y],[x+4+p*9,y-1]],i%4?color:bright,2);
    if(i%6===0)glint(ctx,x,y,bright,2);ctx.restore();
  }
}
function ring(ctx,r,color,t=0){const points=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;points.push([Math.cos(a)*r,Math.sin(a)*r*.36]);}stroke(ctx,points,color,2);for(let i=0;i<4;i++){const a=i*Math.PI/2+t;dot(ctx,Math.cos(a)*r,Math.sin(a)*r*.36,3,color);}}
function glow(ctx,r,color){ctx.save();ctx.globalAlpha*=.15;polygon(ctx,[[-r,0],[-r*.65,-r*.32],[0,-r*.45],[r*.65,-r*.32],[r,0],[r*.65,r*.32],[0,r*.45],[-r*.65,r*.32]],color);ctx.restore();}
function spike(ctx,x,y,h,w){
  polygon(ctx,[[x-w,y],[x-w*.65,y-h*.48],[x+2,y-h],[x+w*.75,y-h*.3],[x+w,y]],'#383c39');
  polygon(ctx,[[x-w+3,y-2],[x-w*.5,y-h*.5],[x+2,y-h+3],[x+1,y-3]],'#8b9270');
  polygon(ctx,[[x+2,y-h+3],[x+w*.65,y-h*.3],[x+w-3,y-2],[x+1,y-3]],'#5d6655');
  stroke(ctx,[[x+2,y-h+5],[x-w*.45,y-h*.46],[x-w+5,y-4]],'#c9c392',2);
  stroke(ctx,[[x-w*.45,y-h*.42],[x+1,y-h*.27],[x+w*.48,y-h*.25]],'#414d41',3);
  polygon(ctx,[[x-w*.35,y-h*.2],[x-w*.3,y-h*.35],[x+1,y-h*.3],[x+w*.3,y-h*.12]],'#737f58');
  stroke(ctx,[[x+3,y-h*.75],[x+5,y-h*.54],[x+w*.4,y-h*.35]],'#b1aa7a',1);
}
function earth(ctx,t){
  ring(ctx,51,'#7b795b');glow(ctx,80,'#c2b074');
  const shock=Math.min(1,Math.max(0,(t-.16)/.5));
  ctx.save();ctx.globalAlpha*=1-shock;ring(ctx,28+shock*65,'#d0bb81');ring(ctx,22+shock*65,'#655e4b');ctx.restore();
  const rise=Math.min(1,Math.max(0,(t-.16)/.18)),sink=t>1.2?Math.max(0,(1.65-t)/.45):1;
  const size=rise*sink;
  for(const [x,y,h,w] of [[-33,-8,29,10],[30,-6,35,11],[-25,12,24,9],[28,13,21,8]])spike(ctx,x,y,h*size,w);
  spike(ctx,0,5,104*size,25);
  if(size>.1){
    polygon(ctx,[[-11,-50*size],[2,-88*size],[7,-48*size],[3,-22*size]],'#a5ad81');
    polygon(ctx,[[4,-80*size],[17,-36*size],[6,-44*size]],'#707e63');
    stroke(ctx,[[-12,-38*size],[-3,-48*size],[3,-45*size],[9,-60*size]],'#303d38',3);
    stroke(ctx,[[-3,-47*size],[1,-44*size],[8,-58*size]],'#c3ba89',1);
  }
  for(let i=0;i<12;i++){
    const p=Math.min(1,Math.max(0,(t-.18)/.65)),a=i*2.399,r=20+p*(35+i%4*8),x=Math.cos(a)*r,y=Math.sin(a)*r*.35-Math.sin(p*Math.PI)*(35+i%3*14);
    ctx.save();ctx.globalAlpha*=1-p;polygon(ctx,[[x-4,y],[x,y-6],[x+6,y-2],[x+4,y+4],[x-3,y+3]],'#747c64');stroke(ctx,[[x-3,y],[x,y-4],[x+4,y-2]],'#c5ba8d',2);ctx.restore();
  }
  for(let i=0;i<8;i++){
    const p=(t*.65+i*.13)%1,x=Math.cos(i*5)*(30+p*37),y=Math.sin(i*5)*12-p*11;
    ctx.save();ctx.globalAlpha*=.16*(1-p);polygon(ctx,[[x-13-p*10,y],[x-10,y-7-p*5],[x+5,y-9-p*5],[x+17+p*7,y],[x+8,y+6],[x-8,y+5]],'#c3b28a');ctx.restore();
  }
  for(let i=0;i<10;i++){const a=i*2.4,r=25+(t*38+i*7)%32;dot(ctx,Math.cos(a)*r,Math.sin(a)*r*.35-((t*20+i*3)%12),i%3?3:5,i%2?'#8c8667':'#b8a57c');}
  for(let i=0;i<6;i++){const a=i*Math.PI/3;stroke(ctx,[[Math.cos(a)*20,Math.sin(a)*8],[Math.cos(a+.12)*38,Math.sin(a+.12)*15],[Math.cos(a)*55,Math.sin(a)*22]],'#171d20',3);}
}
function fire(ctx,t){
  ring(ctx,47,'#c35337',t);glow(ctx,86,'#ff7a39');
  ctx.save();ctx.globalAlpha*=.5;ring(ctx,37+Math.sin(t*11)*4,'#ffaf54',-t*2);ctx.restore();
  if(t<.16)return;
  const grow=Math.min(1,(t-.16)/.14),h=(148+Math.sin(t*21)*7)*grow,w=31*(.9+Math.sin(t*17)*.08);
  const outer=[[-w,3],[-w-7,-h*.3],[-w*.65,-h*.25],[-w*.8,-h*.64],[-w*.4,-h*.53],[-w*.25,-h],[4,-h*.77],[w*.5,-h*.94],[w*.55,-h*.56],[w,-h*.71],[w*.8,-h*.29],[w+8,-h*.36],[w,3]];
  ctx.save();ctx.globalAlpha*=.18;polygon(ctx,outer.map(([x,y])=>[x*1.25,y*1.03]),'#ff7a35');ctx.restore();
  polygon(ctx,outer,'#a72d35');polygon(ctx,outer.map(([x,y])=>[x*.79,y*.93]),'#ee5730');polygon(ctx,outer.map(([x,y])=>[x*.54,y*.8]),'#ffa83e');polygon(ctx,outer.map(([x,y])=>[x*.26,y*.63]),'#fff2aa');
  for(let band=0;band<2;band++){
    const spiral=[];for(let i=0;i<38;i++){const f=i/37,a=f*Math.PI*5-t*8+band*Math.PI;spiral.push([Math.sin(a)*w*(.95-f*.45),-f*h*.85+Math.cos(a)*5]);}
    ctx.save();ctx.globalAlpha*=band?.5:.8;stroke(ctx,spiral,band?'#f97834':'#ffd36b',3);ctx.restore();
  }
  for(let i=0;i<5;i++){
    const a=i*Math.PI*.4+t*3,p=(t*1.7+i*.2)%1,x=Math.cos(a)*(24+p*28),y=Math.sin(a)*(8+p*12);
    ctx.save();ctx.globalAlpha*=1-p;polygon(ctx,[[x-7,y+3],[x-3,y-4],[x+Math.sin(t*20+i)*5,y-17*(1-p)],[x+5,y-2],[x+8,y+3]],'#ef7b35');ctx.restore();
  }
  chips(ctx,t,32,'#ff9c44',true);
  for(let j=0;j<4;j++){
    const p=(t*1.4+j*.25)%1,y=-p*h,side=j%2?1:-1,x=side*(16+Math.sin(p*5+t*7)*12);
    ctx.save();ctx.globalAlpha*=Math.sin(p*Math.PI);polygon(ctx,[[x,y+12],[x-5,y+2],[x+Math.sin(t*15+j)*8,y-16],[x+6,y],[x+4,y+10]],'#ffc157');ctx.restore();
  }
  for(let i=0;i<11;i++){const p=(t*.8+i*.091)%1;dot(ctx,Math.sin(i*9+t*2)*(22+p*22),-p*155, i%3?2:4,i%2?'#ffa43f':'#ffe7a0');}
}
function thunder(ctx,t){
  ring(ctx,44,'#7770bb',t);glow(ctx,90,'#8172ec');ctx.save();ctx.globalAlpha*=.4;ring(ctx,33,'#b4acff',-t*3);ctx.restore();if(t<.16)return;
  const flicker=Math.floor(t*22),points=[[0,-210]];
  for(let i=1;i<=12;i++)points.push([i===12?0:Math.sin(i*8+flicker)*15,-210+i*17.5]);
  light(ctx,points,'#929dff',12);
  stroke(ctx,points,'#4c428a',13);stroke(ctx,points,'#8379dd',8);stroke(ctx,points,'#9bdcff',5);stroke(ctx,points,'#f1ffff',2);
  for(let i=0;i<3;i++){const p=points[3+i*3],sign=i%2?1:-1;stroke(ctx,[p,[p[0]+sign*30,p[1]+12],[p[0]+sign*20,p[1]+25],[p[0]+sign*46,p[1]+38]],'#a3bfff',2);}
  chips(ctx,t*2,24,'#b5c7ff');
  const pulse=(t*4)%1;ctx.save();ctx.globalAlpha*=1-pulse;ring(ctx,24+pulse*52,'#b5c5ff');ctx.restore();
  for(let i=0;i<5;i++){const p=points[2+i*2];glint(ctx,p[0]+Math.sin(t*19+i)*22,p[1],i%2?'#8c82d5':'#e1fcff',3);}
  for(let i=0;i<8;i++){const a=i*Math.PI/4+t;stroke(ctx,[[0,-4],[Math.cos(a)*19,Math.sin(a)*8-9],[Math.cos(a)*34,Math.sin(a)*15]],i%2?'#eefcff':'#a79de9',3);dot(ctx,Math.cos(a)*48,Math.sin(a)*20-12,3,'#bbc6ff');}
}
function ice(ctx,t){
  // One long crystalline lance; faceted spearhead and a braided frozen wake.
  wake(ctx,t,'#61b9d8','#c6faff',22);
  light(ctx,[[-105,0],[-28,0],[27,0]],'#70dfff',9);
  polygon(ctx,[[-110,0],[-65,-5],[-27,-13],[28,0],[-27,13],[-65,5]],'#285d96');
  polygon(ctx,[[-104,0],[-42,-4],[-26,-10],[28,0],[-26,3]],'#80d7ee');
  polygon(ctx,[[28,0],[-27,13],[-42,4],[-104,0]],'#469bbb');
  polygon(ctx,[[-27,-10],[-10,-3],[-27,3],[-46,-3]],'#b9f1fa');
  polygon(ctx,[[-27,3],[-10,-3],[-3,1],[-27,12]],'#5bb8d8');
  stroke(ctx,[[-27,-9],[-10,-3],[-27,10]],'#ecffff',1);
  glint(ctx,-28+Math.sin(t*10)*13,-3,'#ffffff',4);
  for(let i=0;i<4;i++){const x=-35-i*22,y=Math.sin(t*10+i*4)*17;stroke(ctx,[[x-3,y],[x+3,y]],'#cdfbff',1);stroke(ctx,[[x,y-3],[x,y+3]],'#cdfbff',1);}
  stroke(ctx,[[-90,0],[-27,-1],[24,0]],'#e9ffff',3);stroke(ctx,[[-26,-9],[-39,-3]],'#cdf6ff',2);
  for(let j=0;j<2;j++){const points=[];for(let i=0;i<14;i++)points.push([-125+i*8,Math.sin(i*.6-t*12+j*Math.PI)*(5+j*3)]);stroke(ctx,points,j?'#4367a5':'#9be3f0',2);}
  for(let i=0;i<8;i++){const x=-20-i*14,y=Math.sin(t*7+i*4)*(14+i*.9);polygon(ctx,[[x-5,y],[x,y-3],[x+5,y],[x,y+3]],i%2?'#65b9d7':'#c0f4ff');}
}
function wind(ctx,t){
  // Exactly one crescent. Thin wake lines are air currents, not extra blades.
  wake(ctx,t,'#64ae9e','#d7fff0',32);
  const crescent=[[0,-48],[19,-33],[33,-12],[36,4],[29,25],[10,43],[-9,49],[6,30],[15,10],[13,-10],[6,-31]];
  ctx.save();ctx.globalAlpha*=.2;polygon(ctx,crescent.map(([x,y])=>[x*1.2,y*1.1]),'#7bd2bb');ctx.restore();
  polygon(ctx,crescent,'#3d837e');polygon(ctx,crescent.map(([x,y])=>[x-3,y*.94]),'#a1e0cd');
  light(ctx,[[0,-45],[16,-29],[28,-10],[30,5],[24,23],[8,40],[-6,46]],'#b4ffda',7);
  stroke(ctx,[[0,-45],[16,-29],[28,-10],[30,5],[24,23],[8,40],[-6,46]],'#ecfff1',4);
  stroke(ctx,[[7,-32],[19,-15],[22,4],[17,22],[6,36]],'#65b5a6',2);
  for(let i=0;i<5;i++){const a=-1.3+i*.6;glint(ctx,8+Math.cos(a)*23,Math.sin(a)*42,'#e5fff1',i%2?2:3);}
  for(let j=0;j<3;j++){const points=[];for(let i=0;i<12;i++)points.push([-95+i*8,Math.sin(i*.45-t*8+j)*4+(j-1)*13]);stroke(ctx,points,j===1?'#91cfbe':'#4b8e89',2);}
  for(let i=0;i<7;i++){const p=(t+i*.14)%1;dot(ctx,-15-p*95,Math.sin(i*8+t*5)*30,i%2?2:3,'#b1ead8');}
}
const ART={fire,earth,lightning:thunder,water:ice,wind};
export function drawFirstSpells(ctx,spells,{lightningTest=THUNDER_STRIKE_SHEET_TEST}={}){
  for(const hit of spells.impacts||[])drawImpact(ctx,hit);
  const colors={fire:'#ffb85b',earth:'#c9c291',water:'#baf4ff',wind:'#d6ffec',lightning:'#c3c9ff'};
  for(const release of spells.releases||[]){
    if(!release.projectile && Number.isFinite(release.targetX)){
      const head=Math.min(1,release.age/.12),tail=Math.max(0,head-.2),points=[];
      for(let i=0;i<=7;i++){const f=tail+(head-tail)*i/7;points.push([release.x+(release.targetX-release.x)*f,release.y+(release.targetY-release.y)*f-Math.sin(f*Math.PI)*15]);}
      ctx.save();ctx.globalAlpha=Math.max(0,1-release.age/.22);stroke(ctx,points,colors[release.element],3);glint(ctx,points[7][0],points[7][1],colors[release.element],4);ctx.restore();
    }
    ctx.save();ctx.translate(release.x,release.y);ctx.rotate(release.aim);
    const p=release.age/.22;ctx.globalAlpha=(1-p)*.85;
    const color=colors[release.element];
    polygon(ctx,[[0,-3-p*8],[13+p*20,-8-p*12],[7+p*27,0],[13+p*20,8+p*12],[0,3+p*8]],color);
    for(let i=0;i<7;i++){const a=-1.3+i*.43,r=9+p*(17+i%3*5);dot(ctx,Math.cos(a)*r,Math.sin(a)*r,2,color);}
    glint(ctx,0,0,'#f6fff5',5*(1-p));ctx.restore();
  }
  for(const e of spells.effects){
    if(e.element==='fire' && e.origin && e.age<.32){
      const end=Math.min(1,e.age/.16),points=[];for(let i=0;i<=28;i++){const f=i/28*end;points.push([e.origin.x+(e.x-e.origin.x)*f,e.origin.y+(e.y-e.origin.y)*f+Math.sin(i*.8-e.age*24)*4]);}
      ctx.save();ctx.globalAlpha=Math.min(1,(.32-e.age)/.12);stroke(ctx,points,'#a93631',20);stroke(ctx,points,'#f88138',11);stroke(ctx,points,'#ffe4a0',3);ctx.restore();
    }
    ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));ctx.scale(e.context?.mods?.radius||1,e.context?.mods?.radius||1);
    if(e.element==='lightning'&&lightningTest&&drawThunderStrikeTest(ctx,e.age,FIRST_HITS.lightning.radius)){ctx.restore();continue;}
    ctx.globalAlpha=Math.min(1,(e.life-e.age)/.2);if(FIRST_HITS[e.element]?.mode==='area'){
      // The material's existing elliptical base follows the terrain plane.
      ctx.scale(1.2,1.2);
    }
    if(e.projectile){ctx.rotate(e.aim);const travel=Math.min(210,e.age*(e.element==='water'?680:560));ctx.beginPath();ctx.rect(-travel,-100,travel+90,200);ctx.clip();}ART[e.element](ctx,e.age);ctx.restore();}
}
