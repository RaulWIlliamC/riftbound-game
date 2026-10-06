import {soundPlacement} from './audio.js?v=progression-1';

// An original, quiet pentatonic score and forest foley, synthesized locally.
export class RuinsAudio {
 constructor(){this.nodes=new Set();this.steps=new Map();this.bus=null;this.beat=0;this.nextNote=0;this.nextBird=0;this.played={music:0,birds:0,footsteps:0,arrivals:0};this.arrivals=new Set();}
 stop(){for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();this.bus?.disconnect();this.bus=null;this.steps.clear();this.arrivals.clear();this.beat=0;}
 tone(ctx,freq,duration,volume,{pan=0,type='sine',end=freq}={}){
  const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner(),now=ctx.currentTime;
  o.type=type;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(end,now+duration);p.pan.value=pan;
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(volume,now+Math.min(.035,duration*.2));g.gain.exponentialRampToValueAtTime(.0001,now+duration);
  o.connect(g);g.connect(p);p.connect(this.bus);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();p.disconnect();};o.start();o.stop(now+duration+.03);
 }
 noise(ctx,duration,volume,frequency,pan=0){
  const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),p=ctx.createStereoPanner();s.buffer=b;f.type='lowpass';f.frequency.value=frequency;p.pan.value=pan;
  g.gain.setValueAtTime(volume,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);s.connect(f);f.connect(g);g.connect(p);p.connect(this.bus);
  this.nodes.add(s);s.onended=()=>{this.nodes.delete(s);s.disconnect();f.disconnect();g.disconnect();p.disconnect();};s.start();
 }
 update(sound,active,actors,listener,arrivals){
  const ctx=sound.context;
  if(!active||!sound.enabled||!ctx||ctx.state!=='running'||(typeof document!=='undefined'&&document.hidden)){if(this.bus)this.stop();return;}
  if(!this.bus){this.bus=ctx.createGain();this.bus.gain.value=.55;this.bus.connect(sound.master);this.nextNote=ctx.currentTime;this.nextBird=ctx.currentTime+2;}
  const now=ctx.currentTime;
  if(now>=this.nextNote){
   const melody=[0,7,12,14,7,4,2,7,0,4,7,12,9,7,4,2],n=melody[this.beat%melody.length];
   this.tone(ctx,220*2**(n/12),1.4,.055,{type:'sine',pan:Math.sin(this.beat*.4)*.18});
   if(this.beat%4===0){const root=[110,98,82.41,98][Math.floor(this.beat/4)%4];this.tone(ctx,root,3.4,.05);this.tone(ctx,root*1.5,3.2,.025,{pan:-.2});}
   this.nextNote=now+.72;this.beat++;this.played.music++;
  }
  if(now>=this.nextBird){const pan=Math.sin(now*.37)*.7;this.tone(ctx,2300,.13,.045,{pan,end:3200});this.tone(ctx,3300,.26,.025,{pan,end:2200});this.noise(ctx,1.8,.007,850,pan);this.nextBird=now+5+Math.random()*5;this.played.birds++;}
  const keep=new Set();for(const actor of actors){const p=actor.player;keep.add(actor.id);const last=this.steps.get(actor.id),walking=p.health>0&&['walking','running'].includes(p.state);
   const position={x:p.x,y:p.y,distance:last?.distance||0};
   if(walking&&last){const distance=Math.hypot(p.x-last.x,p.y-last.y);if(distance<100)position.distance+=distance;const stride=p.state==='running'?42:32;
    if(position.distance>=stride){position.distance%=stride;const place=soundPlacement(p,listener);this.noise(ctx,.085,.09*place.gain,900,place.pan);this.tone(ctx,85,.06,.07*place.gain,{pan:place.pan,end:50});this.played.footsteps++;}
   }else position.distance=0;this.steps.set(actor.id,position);
  }
  for(const id of this.steps.keys())if(!keep.has(id))this.steps.delete(id);
  const arrivalKeys=new Set();for(const a of arrivals){const key=a.id+':'+a.x+':'+a.y;arrivalKeys.add(key);if(this.arrivals.has(key))continue;const place=soundPlacement(a,listener);this.tone(ctx,1300,.65,.09*place.gain,{end:180,pan:place.pan});this.tone(ctx,660,1,.045*place.gain,{pan:place.pan});this.played.arrivals++;}this.arrivals=arrivalKeys;
 }
 snapshot(){return {active:!!this.bus,voices:this.nodes.size,played:{...this.played}};}
}
