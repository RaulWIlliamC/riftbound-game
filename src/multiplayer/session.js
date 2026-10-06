const LIMIT=4;
// Manual signaling: no accounts, public room service or third-party signaling dependency.
export class PeerSession{
 constructor({onJoin,onLeave,onInput,onWorld,onStatus,onWelcome,onEnd}){
  Object.assign(this,{onJoin,onLeave,onInput,onWorld,onStatus,onWelcome,onEnd});this.role='solo';this.id='local';this.peers=new Map();this.serial=0;
 }
 async createPeer(id,config){
  if(!globalThis.RTCPeerConnection)throw Error('This browser does not support WebRTC.');
  const pc=new RTCPeerConnection(config);const entry={id,pc,channel:null,opened:false};this.peers.set(id,entry);
  pc.onconnectionstatechange=()=>{
   clearTimeout(entry.disconnectTimer);
   if(['failed','closed'].includes(pc.connectionState))this.drop(id);
   else if(pc.connectionState==='disconnected')entry.disconnectTimer=setTimeout(()=>this.drop(id),5000);
  };
  pc.ondatachannel=e=>this.bind(entry,e.channel);
  return entry;
 }
 bind(entry,channel){
  entry.channel=channel;
  channel.onopen=()=>{
   entry.opened=true;clearTimeout(entry.connectTimer);
   if(this.role==='host'){channel.send(JSON.stringify({type:'welcome',version:1,id:entry.id}));this.onJoin(entry.id,entry.progression);}
   this.onStatus(`${this.role==='host'?'Hosting':'Connected'} · ${this.role==='host'?1+[...this.peers.values()].filter(p=>p.opened).length:2} players`);
  };
  channel.onmessage=e=>{
   if(typeof e.data!=='string'||e.data.length>300000)return;
   try{const message=JSON.parse(e.data);
    if(this.role==='host'&&message.type==='input')this.onInput(entry.id,message.intent);
    if(this.role==='guest'&&message.type==='welcome'&&message.version===1){this.id=message.id;this.onWelcome(message.id);}
    if(this.role==='guest'&&message.type==='world'){this.onWorld(message);if(message.actors?.length!==this.playerCount){this.playerCount=message.actors?.length;this.onStatus(`Connected · ${this.playerCount} players`);}}
    if(this.role==='guest'&&message.type==='end')this.leave();
   }catch{this.onStatus('Ignored an invalid network message');}
  };
  channel.onclose=()=>this.drop(entry.id);
 }
 async invite(config){
  if(this.pending)throw Error('Connect the current answer first, or leave to cancel the invitation.');
  if(this.role==='guest')throw Error('Leave the current session before hosting.');
  if(this.peers.size>=LIMIT-1)throw Error('This session is full (four players).');
  this.role='host';this.id='local';const entry=await this.createPeer(`guest-${++this.serial}`,config);
  this.pending=entry.id;this.bind(entry,entry.pc.createDataChannel('riftbound',{ordered:true}));
  try{await entry.pc.setLocalDescription(await entry.pc.createOffer());await gather(entry.pc);}catch(error){this.pending=null;this.drop(entry.id);throw error;}
  this.onStatus('Hosting · waiting for a friend’s answer');return encode(entry.pc.localDescription);
 }
 async join(code,config){
  const description=decode(code,'offer');this.leave();this.role='guest';
  const entry=await this.createPeer('host',config);
  try{await entry.pc.setRemoteDescription(description);await entry.pc.setLocalDescription(await entry.pc.createAnswer());await gather(entry.pc);}catch(error){this.drop(entry.id);throw error;}
  this.onStatus('Send your answer back to the host');return encode(entry.pc.localDescription);
 }
 async accept(code){
  const answer=decode(code,'answer');const entry=this.peers.get(this.pending);
  if(this.role!=='host'||!entry)throw Error('Create an invitation first.');
  await entry.pc.setRemoteDescription(answer);this.pending=null;this.onStatus('Connecting to your friend…');entry.connectTimer=setTimeout(()=>{if(!entry.opened){this.drop(entry.id);this.onStatus('Connection failed · try a TURN relay in connection settings');}},20000);
 }
 sendInput(intent){const p=this.peers.get('host');if(p?.channel?.readyState==='open'&&p.channel.bufferedAmount<64000)p.channel.send(JSON.stringify({type:'input',intent}));}
 broadcast(message){const data=JSON.stringify(message);for(const p of this.peers.values())if(p.channel?.readyState==='open'&&p.channel.bufferedAmount<128000)p.channel.send(data);}
 drop(id){const p=this.peers.get(id);if(!p)return;this.peers.delete(id);if(this.pending===id)this.pending=null;clearTimeout(p.connectTimer);clearTimeout(p.disconnectTimer);p.channel?.close();p.pc.close();
  if(this.role==='host'){this.onLeave(id);this.onStatus(`Hosting · ${1+[...this.peers.values()].filter(p=>p.opened).length} players`);}
  else if(this.role==='guest'){this.role='solo';this.id='local';this.onEnd();this.onStatus('Host disconnected · returned to solo');}
 }
 leave(){const wasGuest=this.role==='guest';if(this.role==='host')this.broadcast({type:'end'});this.role='solo';this.id='local';this.pending=null;
  const entries=[...this.peers.values()];this.peers.clear();for(const p of entries){clearTimeout(p.connectTimer);clearTimeout(p.disconnectTimer);p.channel?.close();p.pc.close();this.onLeave(p.id);}
  if(wasGuest)this.onEnd();this.onStatus('Solo sanctuary');
 }
}
function encode(description){return btoa(JSON.stringify({version:1,type:description.type,sdp:description.sdp}));}
function decode(code,type){
 try{if(typeof code!=='string'||code.length>64000)throw Error();const value=JSON.parse(atob(code.trim()));
  if(value.version!==1||value.type!==type||typeof value.sdp!=='string')throw Error();return {type:value.type,sdp:value.sdp};
 }catch{throw Error(`Paste a valid Riftbound ${type==='offer'?'invitation':'answer'} code.`);}
}
function gather(pc){return new Promise((resolve,reject)=>{
 if(pc.iceGatheringState==='complete'){resolve();return;}
 const timeout=setTimeout(()=>{cleanup();reject(Error('Connection setup timed out. Check your network and try again.'));},15000);
 const changed=()=>{if(pc.iceGatheringState==='complete'){cleanup();resolve();}};
 const cleanup=()=>{clearTimeout(timeout);pc.removeEventListener('icegatheringstatechange',changed);};pc.addEventListener('icegatheringstatechange',changed);
});}
