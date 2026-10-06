import {ART} from './layout.js';
import {shrineSymbol} from './shrine-interaction.js';
import {drawLight} from './effects.js';
import {pixel,stroke} from './pixel-art.js';

const palettes={
 fire:{color:'#ff994b',light:'#ffe6aa',name:'Fire',detail:'FLAME & FURY'},
 water:{color:'#55ceff',light:'#dcfaff',name:'Water',detail:'FLOW & RESTORATION'},
 wind:{color:'#8cf0cf',light:'#e4fff5',name:'Wind',detail:'MOTION & FREEDOM'},
 earth:{color:'#eac078',light:'#fff1c8',name:'Earth',detail:'STONE & RESOLVE'},
 lightning:{color:'#bd90ff',light:'#f1e5ff',name:'Lightning',detail:'SPARK & POWER'}
};

// Keep only luminous element pixels so enlargement never copies the dark scenery.
export function prepareShrineTextures(image,objects){
 const textures={};
 for(const o of objects.filter(o=>o.kind==='shrine')){
  const s=shrineSymbol(o),c=document.createElement('canvas');
  c.width=s.sourceRX*2;c.height=s.sourceRY*2;
  const ctx=c.getContext('2d');ctx.drawImage(image,s.sourceX-s.sourceRX,s.sourceY-s.sourceRY,c.width,c.height,0,0,c.width,c.height);
  const data=ctx.getImageData(0,0,c.width,c.height);
  for(let i=0;i<data.data.length;i+=4){
   const [r,g,b]=data.data.slice(i,i+3);
   const strength=o.element==='fire'?Math.min(r-90,r-g*.95):o.element==='earth'?Math.min(r-100,g-75,r-b*1.15):o.element==='water'?Math.min(b-100,g-85,b-r*1.2):o.element==='wind'?Math.min(g-100,g-r*1.12):Math.min(b-110,r-90,b-g*1.15);
   data.data[i+3]=Math.max(0,Math.min(1,strength/45))*255;
  }
  ctx.putImageData(data,0,0);textures[o.element]=c;
 }
 return textures;
}

export function drawShrineSymbol(ctx,o,textures){
 const a=o.expansion||0;if(a<.005)return;
 const s=shrineSymbol(o),texture=textures[o.element];
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=a*.85;
 ctx.drawImage(texture,s.x-s.rx,s.y-s.ry,s.rx*2,s.ry*2);ctx.restore();
}

function particles(ctx,o,s,t,p,energy){
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=0;i<16;i++){
  const phase=(t*(.16+i%3*.025)+i*.618+o.seed)%1,a=i*2.399+t*.5;
  let x,y,alpha=Math.sin(phase*Math.PI)*energy;
  if(o.element==='fire'){
   x=s.x+Math.sin(i*7+phase*3)*s.rx*.85;y=s.y+s.ry-phase*(s.ry*2+32);
   ctx.globalAlpha=alpha;pixel(ctx,x,y,2,3+i%3,p.light);
  }else if(o.element==='water'){
   x=s.x+Math.sin(a+phase*2)*(s.rx+12);y=s.y+s.ry-phase*(s.ry*2+18);
   ctx.globalAlpha=alpha*.8;ctx.strokeStyle=p.light;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,1.5+i%3,0,Math.PI*2);ctx.stroke();
  }else if(o.element==='wind'){
   const r=s.rx*(.55+phase*.65);x=s.x+Math.cos(a)*r;y=s.y+Math.sin(a)*r*.4-phase*25;
   ctx.globalAlpha=alpha*.65;ctx.strokeStyle=p.light;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(s.x,y,r,r*.3,0,a,a+.55);ctx.stroke();
  }else if(o.element==='earth'){
   x=s.x+Math.cos(a*.55)*(s.rx+14);y=s.y+Math.sin(a*.55)*12+Math.sin(t*1.4+i)*6;
   ctx.globalAlpha=energy*(.35+i%3*.12);ctx.fillStyle=i%2?p.color:'#897354';ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+4,y);ctx.lineTo(x+1,y+4);ctx.lineTo(x-3,y+2);ctx.closePath();ctx.fill();
  }else{
   x=s.x+Math.cos(a)*(s.rx+12);y=s.y+Math.sin(a)*(s.ry+8);
   ctx.globalAlpha=alpha*.75;pixel(ctx,x,y,2,2,p.light);
   if(i<3&&Math.sin(t*7+i*2+o.seed)>.8){ctx.globalAlpha=energy*.8;stroke(ctx,[[s.x,s.y],[x-8,y+5],[x-3,y-4],[x,y]],p.light,1);}
  }
 }
 ctx.restore();
}

function groundRunes(ctx,o,t,p,energy){
 ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle=p.color;
 ctx.globalAlpha=energy*.42;ctx.lineWidth=1;
 const y=o.y-12,r=57+(o.expansion||0)*10;
 ctx.beginPath();ctx.ellipse(o.x,y,r,r*.32,0,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+t*.07,x=o.x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.32;
  ctx.globalAlpha=energy*(.3+Math.sin(t*1.5+i)*.1);
  stroke(ctx,[[x-3,yy],[x,yy-4],[x+3,yy],[x,yy+4],[x-3,yy]],p.light,1);
 }
 ctx.restore();
}

function prompt(ctx,o,p,a){
 const hover=o.hover||0,x=o.x,y=o.y+36-(1-a)*8,w=184,h=56;
 ctx.save();ctx.globalAlpha=a;
 ctx.shadowColor='#000';ctx.shadowBlur=12;ctx.shadowOffsetY=4;
 ctx.fillStyle='#0b1425';ctx.beginPath();ctx.moveTo(x-w/2+7,y);ctx.lineTo(x+w/2-7,y);ctx.lineTo(x+w/2,y+7);ctx.lineTo(x+w/2,y+h-7);ctx.lineTo(x+w/2-7,y+h);ctx.lineTo(x-w/2+7,y+h);ctx.lineTo(x-w/2,y+h-7);ctx.lineTo(x-w/2,y+7);ctx.closePath();ctx.fill();
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle=p.color;ctx.globalAlpha=a*(.35+hover*.4);ctx.lineWidth=1;ctx.stroke();
 ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.fillRect(x-24,y,48,1);
 ctx.textAlign='center';ctx.font='9px monospace';ctx.fillStyle=p.color;ctx.fillText(p.detail,x,y+15);
 ctx.font='600 15px Georgia, serif';ctx.fillStyle=p.light;ctx.fillText(o.selected?`${p.name} Attuned`:`Attune to ${p.name}`,x,y+33);
 ctx.font='8px monospace';ctx.fillStyle=o.selected?p.color:hover>.3?p.light:'#9eafbf';ctx.fillText(o.selected?'◆  YOUR ELEMENT':hover>.3?'◆  CLICK TO ATTUNE  ◆':'CLICK THE ELEMENT ABOVE',x,y+47);
 ctx.restore();
}

export function drawShrineAura(ctx,o,t){
 const p=palettes[o.element],s=shrineSymbol(o),a=o.expansion||0,hover=o.hover||0,pulse=o.attunePulse||0;
 const energy=.12+a*.65+(o.selected?.18:0)+hover*.15;
 drawLight(ctx,o.x,o.y-25,125+a*45,p.color,energy*.26);
 drawLight(ctx,s.x,s.y,62+a*38,p.color,energy*.55);
 drawLight(ctx,s.x,s.y,26+a*16,p.light,energy*.3);
 groundRunes(ctx,o,t,p,energy);particles(ctx,o,s,t,p,energy);
 if(a>.02){
  ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle=p.color;ctx.lineWidth=1;ctx.globalAlpha=a*(.2+hover*.4);
  for(const start of [-Math.PI*.85,Math.PI*.15]){ctx.beginPath();ctx.ellipse(s.x,s.y,s.rx+10,s.ry+10,0,start,start+Math.PI*.55);ctx.stroke();}
  ctx.restore();prompt(ctx,o,p,a);
 }
 if(pulse>0){
  const phase=1-pulse;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=pulse*.7;ctx.strokeStyle=p.light;ctx.lineWidth=2*pulse;
  ctx.beginPath();ctx.ellipse(s.x,s.y,s.rx+phase*80,s.ry+phase*60,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  drawLight(ctx,s.x,s.y,100+phase*60,p.color,pulse*.4);
 }
}
