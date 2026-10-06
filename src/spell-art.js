// Hand-shaped silhouettes and limited layered palettes, rasterized in chunky pixels.
// Animation changes the material itself; small flecks only accent the main shape.
const dot=(ctx,x,y,size,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),size,size);};
function polygon(ctx,points,color){
  ctx.fillStyle=color;
  const min=Math.floor(Math.min(...points.map(p=>p[1]))/2)*2;
  const max=Math.ceil(Math.max(...points.map(p=>p[1]))/2)*2;
  for(let y=min;y<max;y+=2){
    const crossings=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],scan=y+1;
      if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))crossings.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    }
    crossings.sort((a,b)=>a-b);
    for(let i=0;i+1<crossings.length;i+=2){const x=Math.round(crossings[i]/2)*2;ctx.fillRect(x,y,Math.max(2,Math.round((crossings[i+1]-x)/2)*2),2);}
  }
}
function stroke(ctx,points,color,width=2){
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));
    for(let j=0;j<=n;j++){const f=j/n;dot(ctx,a[0]+(b[0]-a[0])*f-width/2,a[1]+(b[1]-a[1])*f-width/2,width,color);}
  }
}
function ribbon(ctx,points,width,color){
  polygon(ctx,[...points.map(([x,y],i)=>[x,y-width*(.25+.75*i/(points.length-1))]),...points.map(([x,y],i)=>[x,y+width*(.25+.75*i/(points.length-1))]).reverse()],color);
}
function fire(ctx,t){
  for(let i=0;i<15;i++){const p=(t*2+i*.618)%1,x=-25-p*120,y=Math.sin(t*11+i*3)*(8+p*22);ctx.save();ctx.globalAlpha*=1-p;stroke(ctx,[[x,y],[x+7,y-3]],i%3?'#f36e33':'#ffcc72',2);ctx.restore();}

  const curl=Math.sin(t*16)*3;
  const outer=[[-104,5],[-88,-1],[-98,-10],[-75,-6],[-61,-15+curl],[-64,-5],[-45,-19],[-32,-13],[-18,-17],[5,-9],[18,0],[5,10],[-15,17],[-30,11],[-48,18],[-43,8],[-65,11],[-78,4]];
  ctx.save();ctx.globalAlpha=.13;polygon(ctx,outer.map(([x,y])=>[x,y*1.45]),'#ff5b30');ctx.restore();
  polygon(ctx,outer,'#a93128');
  polygon(ctx,[[-92,3],[-69,-2],[-74,-9],[-53,-5],[-35,-13],[-22,-9],[4,-7],[16,0],[0,9],[-23,12],[-38,6],[-59,10],[-53,3]],'#f46a31');
  polygon(ctx,[[-74,2],[-48,-2],[-39,-7],[-19,-4],[4,-5],[14,0],[0,6],[-25,7],[-41,3]],'#ffc259');
  polygon(ctx,[[-46,1],[-27,-2],[-5,-3],[10,0],[-7,4],[-25,3]],'#fff3bc');
  // Small curls roll backward along the flame body.
  for(let i=0;i<3;i++){
    const x=-35-i*20,sign=i%2?1:-1;
    stroke(ctx,[[x+8,sign*6],[x,sign*(12+curl)],[x-9,sign*10],[x-10,sign*5]],'#ffb24e',2);
  }
  for(let i=0;i<7;i++){
    const cycle=(t*2+i*.137)%1;
    dot(ctx,-40-cycle*67,Math.sin(i*4)* (10+cycle*9),i%3?2:3,i%2?'#ff8f39':'#ffe2a0');
  }
}
function water(ctx,t){
  for(let i=0;i<16;i++){const p=(t*1.7+i*.618)%1,x=8-p*145,y=Math.sin(t*8+i*5)*(13+p*8);ctx.save();ctx.globalAlpha*=1-p;polygon(ctx,[[x,y-3],[x+3,y],[x,y+4],[x-2,y]],i%3?'#5ccbe0':'#e0ffff');ctx.restore();}

  const wave=[];
  for(let i=0;i<=20;i++){const x=-104+i*5.5;wave.push([x,Math.sin(i*.47-t*9)* (3+i*.22)]);}
  ctx.save();ctx.globalAlpha=.16;ribbon(ctx,wave,14,'#64dfff');ctx.restore();
  ribbon(ctx,wave,9,'#164f94');ribbon(ctx,wave,7,'#238fce');
  ribbon(ctx,wave.map(([x,y])=>[x,y-2]),4,'#55caeb');
  stroke(ctx,wave.map(([x,y],i)=>[x,y-3+Math.sin(i*.6+t*7)]),'#d9ffff',2);
  polygon(ctx,[[0,-10],[10,-7],[17,-1],[13,7],[4,12],[-8,9],[-14,1],[-10,-7]],'#268fc7');
  polygon(ctx,[[0,-8],[10,-5],[13,0],[5,8],[-5,7],[-8,1]],'#8ae8f7');
  stroke(ctx,[[2,-6],[9,-3],[10,1]],'#efffff',3);
  // A twisting secondary current makes the stream feel three-dimensional.
  const twist=wave.map(([x,y],i)=>[x,y+Math.sin(i*.55-t*12)*8]);
  stroke(ctx,twist,'#77e0f5',2);
  for(let i=0;i<6;i++){
    const x=-12-i*15,y=Math.sin(t*7+i*2)*(12+i*.4);
    polygon(ctx,[[x,y-3],[x+3,y],[x+1,y+4],[x-3,y+2]],'#58c8ec');dot(ctx,x,y,1,'#e2ffff');
  }
}
function rock(ctx,x,y,r,angle){
  const points=[[-.9,-.35],[-.5,-.85],[.3,-1],[.85,-.4],[1,.35],[.35,.85],[-.5,.9],[-1,.25]].map(([px,py])=>[x+(px*Math.cos(angle)-py*Math.sin(angle))*r,y+(px*Math.sin(angle)+py*Math.cos(angle))*r]);
  polygon(ctx,points,'#3a3430');
  polygon(ctx,points.map(([px,py])=>[x+(px-x)*.82,y+(py-y)*.82]),'#8d795d');
  polygon(ctx,[points[0],points[1],points[2],[x+2,y-1]],'#c9b48a');
  polygon(ctx,[points[3],points[4],points[5],[x+1,y+1]],'#625640');
  stroke(ctx,[[x-r*.35,y-r*.6],[x-r*.15,y],[x+r*.3,y+r*.2],[x+r*.1,y+r*.6]],'#4a4238',2);
  dot(ctx,x-r*.3,y-r*.4,2,'#e0cba4');
}
function earth(ctx,t){
  for(let i=0;i<8;i++){const p=(t+i*.127)%1,x=-30-p*110,y=Math.sin(i*4)*(12+p*12);ctx.save();ctx.globalAlpha*=.16*(1-p);polygon(ctx,[[x-8,y],[x-4,y-5],[x+7,y-3],[x+10,y+3],[x-5,y+5]],'#b4a077');ctx.restore();}

  // Heavy leading boulder, with a staggered cloud of tumbling fragments.
  ctx.save();ctx.globalAlpha=.20;
  polygon(ctx,[[-110,-4],[-66,-12],[-15,-16],[15,0],[-15,16],[-75,12]],'#a28e68');ctx.restore();
  for(let i=5;i>=1;i--){const x=-17-i*12,y=(i%2?1:-1)*(9+Math.sin(t*5+i)*3);rock(ctx,x,y,5+(6-i)*.9,t*(i%2?2:-2)+i);}
  rock(ctx,1,0,15,Math.sin(t*5)*.18);
  for(let i=0;i<8;i++){const x=-55-((t*37+i*13)%52),y=Math.sin(i*4)*(8+(i%3)*4);dot(ctx,x,y,i%3?2:3,i%2?'#a38c64':'#d1bc93');}
}
function wind(ctx,t){
  // Air has no solid projectile head: translucent streamlines swell, curl and dissipate.
  for(let band=0;band<6;band++){
    const points=[];
    for(let i=0;i<=30;i++){
      const f=i/30,x=-155+f*181;
      points.push([x,(band-2.5)*5*Math.sin(f*Math.PI)+Math.sin(f*8-t*9+band*.7)*(4+Math.sin(f*Math.PI)*9)]);
    }
    ctx.save();ctx.globalAlpha*=band%2?.22:.11;polygon(ctx,[...points.map(([x,y],i)=>[x,y-Math.sin(i/30*Math.PI)*3]),...points.map(([x,y],i)=>[x,y+Math.sin(i/30*Math.PI)*3]).reverse()],'#9ad2c0');ctx.restore();
    ctx.save();ctx.globalAlpha*=.48;stroke(ctx,points.slice(3,26),band%2?'#b2dccb':'#76b6a9',1);ctx.restore();
    ctx.save();ctx.globalAlpha*=.55;stroke(ctx,points.slice(13,21),'#e1f5e7',1);ctx.restore();
  }
  for(let j=0;j<2;j++){
    const curl=[];for(let i=0;i<24;i++){const a=i*.18+t*2,r=15-i*.45;curl.push([-28-j*55+Math.cos(a)*r,Math.sin(a)*r*.65+(j?9:-6)]);}
    ctx.save();ctx.globalAlpha*=.3;stroke(ctx,curl,'#c4e8d5',1);ctx.restore();
  }
  for(let i=0;i<24;i++){
    const p=(t*1.6+i*.618)%1,x=23-p*172,y=Math.sin(i*3+t*4)*(5+Math.sin(p*Math.PI)*23);
    ctx.save();ctx.globalAlpha*=Math.sin(p*Math.PI)*.48;
    stroke(ctx,[[x,y],[x+3+p*7,y+Math.sin(t*7+i)*2]],i%3?'#accfbd':'#dff2da',1);
    if(i%6===0)polygon(ctx,[[x,y-2],[x+3,y],[x,y+2],[x-2,y]],'#8caa87');ctx.restore();
  }
}
function arcane(ctx,t,neutral=false){
  const dark=neutral?'#8054be':'#568f96',mid=neutral?'#b388e5':'#a2d5c9',light=neutral?'#f0dcff':'#f1fff9';
  for(let band=0;band<3;band++){
    const points=[];
    for(let i=0;i<=18;i++){
      const f=i/18,x=-100+f*113;
      const y=Math.sin(f*Math.PI)*((band-1)*21)+Math.sin(t*7+f*8+band)*2;
      points.push([x,y]);
    }
    ctx.save();ctx.globalAlpha=.14;ribbon(ctx,points,5,mid);ctx.restore();
    ctx.save();ctx.globalAlpha=.28;ribbon(ctx,points,4,mid);ctx.restore();
    ribbon(ctx,points,2.5,dark);stroke(ctx,points.map(([x,y])=>[x,y-1]),mid,2);
    stroke(ctx,points.slice(9),light,2);
  }
  // Curled wake and crescent nose, rather than straight generic speed lines.
  const curl=[];
  for(let i=0;i<22;i++){const a=i*.2+t*2;curl.push([-50+Math.cos(a)* (13-i*.35),Math.sin(a)*(10-i*.25)]);}
  stroke(ctx,curl,mid,2);
  polygon(ctx,[[-3,-20],[12,-16],[22,-7],[26,0],[21,10],[10,18],[-3,20],[8,10],[12,0],[8,-9]],mid);
  polygon(ctx,[[2,-17],[14,-12],[22,-3],[24,1],[17,11],[3,18],[12,9],[15,0],[11,-8]],light);
  stroke(ctx,[[-22,-12],[-10,-15],[1,-9],[5,0],[0,10],[-11,14],[-20,10]],mid,3);
  for(let i=0;i<4;i++)dot(ctx,-30-i*19,Math.sin(t*5+i)*18,2,light);
}
function lightning(ctx,t){
  for(let i=0;i<12;i++){const p=(t*3+i*.618)%1,x=-p*125,y=Math.sin(i*7+t*20)*(9+p*19);ctx.save();ctx.globalAlpha*=1-p;stroke(ctx,[[x-3,y],[x,y-4],[x+3,y]],i%2?'#c5b7ff':'#e5ffff',1);ctx.restore();}

  const tick=Math.floor(t*20),points=[];
  for(let i=0;i<13;i++){const x=-112+i*10;points.push([x,i===12?0:(i%2?1:-1)*(4+((i*13+tick*7)%7))]);}
  ctx.save();ctx.globalAlpha=.14;stroke(ctx,points,'#bca3ff',14);ctx.restore();
  stroke(ctx,points,'#8768d9',7);stroke(ctx,points,'#87cfff',4);stroke(ctx,points,'#f5fdff',2);
  for(let i=2;i<11;i+=3){
    const [x,y]=points[i],sign=(i+tick)%2?1:-1;
    const branch=[[x,y],[x-4,y+sign*8],[x+2,y+sign*12],[x-9,y+sign*20]];
    stroke(ctx,branch,'#a390ef',3);stroke(ctx,branch,'#d2f5ff',1);
  }
  polygon(ctx,[[0,-4],[8,-7],[6,-2],[19,0],[6,3],[8,7],[0,4]],'#ffffff');
  dot(ctx,7,-1,3,'#e3faff');
}
export function drawSpell(ctx,element,age){
  // Discrete visual frames retain the character's pixel animation cadence.
  const t=Math.floor(age*24)/24;
  if(element==='fire')fire(ctx,t);
  else if(element==='water')water(ctx,t);
  else if(element==='earth')earth(ctx,t);
  else if(element==='wind')wind(ctx,t);
  else if(element==='lightning')lightning(ctx,t);
  else arcane(ctx,t,true);
}
export function drawImpact(ctx,hit){
  const age=.24-hit.life,p=age/.24,r=7+p*39;
  const palette={fire:['#f36c32','#ffe5a0'],water:['#298fcd','#cbfaff'],earth:['#8d795d','#d1bc93'],wind:['#93c9bd','#edfff8'],lightning:['#9678e1','#dcfaff'],neutral:['#ab80d8','#eadaff']}[hit.element];
  ctx.save();ctx.translate(hit.x,hit.y);ctx.globalAlpha=hit.life/.24;
  for(let band=0;band<2;band++){
    const points=[];for(let i=0;i<=30;i++){const a=i/30*Math.PI*2,rad=r-band*7;points.push([Math.cos(a)*rad,Math.sin(a)*rad*(hit.element==='earth'?.45:.75)]);}
    ctx.save();ctx.globalAlpha*=band?.35:.6;stroke(ctx,points,palette[band],2);ctx.restore();
  }
  for(let i=0;i<20;i++){
    const a=i*Math.PI/10,x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(hit.element==='earth')rock(ctx,x,y,3-i%2,i+age*10);
    else if(hit.element==='lightning')stroke(ctx,[[x*.3,y*.3],[x*.6-y*.12,y*.6+x*.12],[x,y]],palette[1],2);
    else if(hit.element==='wind'){ctx.save();ctx.globalAlpha*=.5;stroke(ctx,[[x*.45,y*.45],[x-y*.2,y+x*.2],[x*1.2,y*1.2]],palette[i%2],1);ctx.restore();}
    else polygon(ctx,[[x,y],[x+Math.cos(a)*7,y+Math.sin(a)*7],[x-y*.12,y+x*.12]],palette[i%2]);
  }
  ctx.restore();
}

export {polygon,stroke,dot};
