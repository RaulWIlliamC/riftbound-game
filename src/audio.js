// Mirelo-generated, locally bundled effects. The game never contacts Mirelo at runtime.
export const AUDIO_ELEMENTS=['neutral','fire','earth','water','wind','lightning'];
export const AUDIO_CLIPS=[...AUDIO_ELEMENTS.flatMap(e=>[`${e}-bolt-cast`,`${e}-charge`,...(e==='neutral'?[]:['first','second'].flatMap(slot=>[`${e}-${slot}-cast`,`${e}-${slot}-impact`]))]),'neutral-bolt-impact','staff-swing'];
export function audioClipKey(element,kind='cast',spell='bolt'){
 const e=AUDIO_ELEMENTS.includes(element)?element:'neutral';
 if(kind==='swing')return 'staff-swing';
 if(kind==='charge')return `${e}-charge`;
 const slot=spell==='third'?'second':['first','second'].includes(spell)&&e!=='neutral'?spell:'bolt';
 return kind==='impact'&&slot==='bolt'&&e!=='neutral'?`${e}-first-impact`:`${e}-${slot}-${kind==='impact'?'impact':'cast'}`;
}
export function soundPlacement(point,listener){
 const dx=(point?.x??listener.x)-listener.x,dy=(point?.y??listener.y)-listener.y;
 return {pan:Math.max(-.75,Math.min(.75,dx/550)),gain:1/(1+Math.hypot(dx,dy)/850)};
}
export class SpellAudio {
 constructor({preload=true}={}){
  this.context=null;this.enabled=true;this.buffers=new Map();this.voices=new Set();this.charges=new Map();this.recent=new Map();this.played={};this.failed=[];this.listener={x:900,y:650};this.peakVoices=0;this.maxVoices=20;
  this.assetsPromise=preload?Promise.allSettled(AUDIO_CLIPS.map(async id=>{const response=await fetch(new URL(`../assets/audio/${id}.wav`,import.meta.url));if(!response.ok)throw Error(`Audio ${id}: ${response.status}`);return [id,await response.arrayBuffer()];})):Promise.resolve([]);
  this.readyPromise=Promise.resolve();
 }
 unlock(){
  if(!this.context){
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
   this.context=new Audio();const ctx=this.context;
   this.master=ctx.createGain();this.master.gain.value=this.enabled?.6:0;
   const bass=ctx.createBiquadFilter();bass.type='highpass';bass.frequency.value=35;
   const air=ctx.createBiquadFilter();air.type='lowpass';air.frequency.value=12500;
   const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.knee.value=12;limiter.ratio.value=7;limiter.attack.value=.003;limiter.release.value=.16;
   const ceiling=ctx.createWaveShaper(),curve=new Float32Array(2048);for(let i=0;i<curve.length;i++){const x=i*2/(curve.length-1)-1;curve[i]=.9*Math.tanh(x/.9);}ceiling.curve=curve;ceiling.oversample='2x';
   this.master.connect(bass);bass.connect(air);air.connect(limiter);limiter.connect(ceiling);ceiling.connect(ctx.destination);
   this.readyPromise=this.assetsPromise.then(results=>Promise.allSettled(results.map(async result=>{
    if(result.status==='rejected'){this.failed.push(String(result.reason));return;}
    const [id,bytes]=result.value;try{this.buffers.set(id,await ctx.decodeAudioData(bytes));}catch{this.failed.push(id);}
   })));
   if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stopAll();});
  }
  if(this.context.state==='suspended')this.context.resume().catch(()=>{});
 }
 toggle(){this.enabled=!this.enabled;if(this.master)this.master.gain.setTargetAtTime(this.enabled?.6:0,this.context.currentTime,.015);if(!this.enabled)this.stopAll();return this.enabled;}
 stopVoice(voice){
  if(voice.stopping)return;voice.stopping=true;
  const now=this.context.currentTime;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,.025);voice.source.stop(now+.12);
 }
 stopAll(){for(const voice of this.voices)this.stopVoice(voice);this.charges.clear();this.recent.clear();}
 startVoice(id,{volume=.6,pan=0,rate=1,loop=false,priority=1}={}){
  if(!this.enabled||!this.context||this.context.state!=='running'||!this.buffers.has(id)||(typeof document!=='undefined'&&document.hidden))return null;
  const live=[...this.voices].filter(v=>!v.stopping);
  if(live.length>=this.maxVoices){const victim=live.filter(v=>!v.loop&&v.priority<=priority).sort((a,b)=>a.priority-b.priority||a.started-b.started)[0];if(!victim)return null;this.stopVoice(victim);}
  const ctx=this.context,source=ctx.createBufferSource(),gain=ctx.createGain(),panner=ctx.createStereoPanner();
  source.buffer=this.buffers.get(id);source.loop=loop;source.playbackRate.value=rate;panner.pan.value=pan;
  gain.gain.setValueAtTime(loop?0:volume,ctx.currentTime);if(loop)gain.gain.setTargetAtTime(volume,ctx.currentTime,.06);
  source.connect(gain);gain.connect(panner);panner.connect(this.master);
  const voice={source,gain,panner,id,loop,priority,started:ctx.currentTime,stopping:false};this.voices.add(voice);this.peakVoices=Math.max(this.peakVoices,[...this.voices].filter(v=>!v.stopping).length);
  source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();panner.disconnect();};source.start();this.played[id]=(this.played[id]||0)+1;return voice;
 }
 play(element,kind='cast',details={}){
  // Held audio follows the actual replicated player/channel state, not a timer.
  if(kind==='charge')return;
  if(!this.context||!this.enabled)return;
  const id=audioClipKey(element,kind,details.spell),now=this.context.currentTime;
  const key=`${details.actorId||'local'}:${id}`;
  // Individual shards still deal damage; their closely spaced impacts share an audio accent.
  const interval=kind==='impact'?.095:.045;
  if(now-(this.recent.get(key)??-Infinity)<interval)return;
  this.recent.set(key,now);
  const power=Number.isFinite(details.power)?Math.max(0,Math.min(1,details.power)):1;
  const charged=details.spell==='bolt'||details.spell==='second'&&['fire','earth'].includes(element);
  const strength=charged?.55+power*.45:1,place=soundPlacement(details,this.listener);
  const volume=(kind==='swing'?.38:details.spell==='second'?.86:details.spell==='bolt'?.5:.66)*strength*place.gain;
  this.startVoice(id,{volume,pan:place.pan,rate:charged?1.08-power*.12:1,priority:details.spell==='second'?3:kind==='impact'?2:1});
 }
 syncCharges(actors,listener){
  this.listener={x:listener.x,y:listener.y};const keep=new Set();
  for(const actor of actors){const p=actor.player;if(!p.charging&&!actor.second.channel&&!actor.third?.channel)continue;
   const channel=actor.third?.channel||actor.second.channel,element=channel?.element||p.element,id=audioClipKey(element,'charge'),key=actor.id,power=channel?.power??p.charge??0;
   keep.add(key);let voice=this.charges.get(key);
   if(voice&&(voice.id!==id||voice.stopping)){this.stopVoice(voice);this.charges.delete(key);voice=null;}
   const place=soundPlacement(p,this.listener),volume=(.13+.24*power)*place.gain;
   if(!voice){voice=this.startVoice(id,{volume,pan:place.pan,loop:true,priority:4});if(voice)this.charges.set(key,voice);}
   if(voice){voice.gain.gain.setTargetAtTime(volume,this.context.currentTime,.06);voice.source.playbackRate.setTargetAtTime(.96+power*.12,this.context.currentTime,.08);voice.panner.pan.setTargetAtTime(place.pan,this.context.currentTime,.06);}
  }
  for(const [key,voice] of this.charges)if(!keep.has(key)){this.stopVoice(voice);this.charges.delete(key);}
 }
 snapshot(){return {enabled:this.enabled,state:this.context?.state||'locked',loaded:this.buffers.size,total:AUDIO_CLIPS.length,failed:[...this.failed],voices:this.voices.size,charges:this.charges.size,peakVoices:this.peakVoices,played:{...this.played}};}
}
