// PeerJS Cloud introduces browsers; the host still owns the entire simulation.
const PREFIX='riftbound-v1-';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TIMEOUT=25000;
let library;
function loadPeer(){
 if(globalThis.Peer)return Promise.resolve(globalThis.Peer);
 if(!library)library=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=new URL('../../vendor/peerjs-1.5.5.min.js',import.meta.url).href;
  const timer=setTimeout(()=>fail(),10000);
  const fail=()=>{clearTimeout(timer);script.remove();library=null;reject(Error('Couldn’t load multiplayer. Refresh and try again.'));};
  script.onerror=fail;script.onload=()=>{clearTimeout(timer);if(globalThis.Peer)resolve(globalThis.Peer);else fail();};document.head.append(script);
 });
 return library;
}
function roomCode(){return Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>ALPHABET[n%ALPHABET.length]).join('');}
function peerError(error){
 if(error.type==='peer-unavailable')return Error('Room not found. Check the code and make sure your friend is online.');
 if(error.type==='unavailable-id')return Error('That room code is already in use. Try hosting again.');
 if(error.type==='browser-incompatible')return Error('This browser does not support multiplayer. Try Chrome, Edge, Firefox or Safari.');
 return Error('Couldn’t reach multiplayer. Check your internet connection and try again.');
}
export class PeerRoomConnection{
 constructor(session,onChange,{Peer,getProgression=()=>null,iceServers}={}){
  Object.assign(this,{session,onChange,Peer,getProgression,iceServers});this.room=null;this.peer=null;this.connected=false;this.generation=0;
 }
 async start(id,generation){
  const Peer=this.Peer||await loadPeer();
  if(generation!==this.generation)throw Error('Connection cancelled.');
  const options={debug:0,secure:true};if(this.iceServers)options.config={iceServers:this.iceServers};
  const peer=new Peer(id,options);this.peer=peer;
  await new Promise((resolve,reject)=>{
   let opened=false;
   const timer=setTimeout(()=>reject(Error('Multiplayer connection timed out. Check your internet and try again.')),TIMEOUT);
   this.cancel=(error=Error('Connection cancelled.'))=>{clearTimeout(timer);reject(error);};
   peer.on('open',()=>{opened=true;clearTimeout(timer);this.cancel=null;resolve();});
   peer.on('error',error=>{if(this.peer!==peer)return;const problem=peerError(error);if(!opened){clearTimeout(timer);reject(problem);}else this.fail(problem);});
   peer.on('disconnected',()=>{if(this.peer===peer&&!peer.destroyed){this.onChange('Reconnecting to the room service…');peer.reconnect();}});
   peer.on('connection',conn=>{
    if(this.room?.role!=='host'||conn.metadata?.version!==1){conn.close();return;}
    if(this.session.peers.size>=3){conn.on('open',()=>{conn.send(JSON.stringify({type:'room-error',message:'This room is full (4 players).'}));setTimeout(()=>conn.close(),150);});return;}
    const id=`guest-${++this.session.serial}`;this.bind(conn,id,conn.metadata.progression);
   });
  });
  if(generation!==this.generation)throw Error('Connection cancelled.');
  return peer;
 }
 async host(){
  await this.leave();const generation=this.generation;
  try{const code=roomCode();await this.start(PREFIX+code,generation);this.room={role:'host',code};this.session.role='host';this.session.id='local';this.onChange();}
  catch(error){if(generation===this.generation)await this.leave();throw error;}
 }
 async join(code){
  code=code.trim().toUpperCase().replace(/[\s-]/g,'');if(!/^[A-Z0-9]{6}$/.test(code))throw Error('Enter the 6-character room code.');
  await this.leave();const generation=this.generation;
  try{
   const peer=await this.start(undefined,generation);this.room={role:'guest',code};this.session.role='guest';this.onChange();
   await new Promise((resolve,reject)=>{
    const conn=peer.connect(PREFIX+code,{reliable:true,serialization:'json',metadata:{version:1,progression:this.getProgression()}});
    const timer=setTimeout(()=>reject(Error('Couldn’t connect to your friend. These networks may need a TURN relay.')),TIMEOUT);
    const finish=error=>{clearTimeout(timer);this.cancel=null;error?reject(error):resolve();};
    this.cancel=(error=Error('Connection cancelled.'))=>finish(error);
    this.bind(conn,'host',null,finish);
   });
  }catch(error){if(generation===this.generation)await this.leave();throw error;}
 }
 bind(conn,id,progression,finish){
  const session=this.session;
  // Adapt PeerJS events to the existing PeerSession channel interface.
  const channel={
   get readyState(){return conn.open?'open':'closed';},
   get bufferedAmount(){return conn.dataChannel?.bufferedAmount||0;},
   send:value=>conn.send(value),close:()=>conn.close()
  };
  const entry={id,pc:{close:()=>conn.close()},channel:null,opened:false,progression};
  session.peers.set(id,entry);session.bind(entry,channel);
  entry.connectTimer=setTimeout(()=>{if(!entry.opened){session.drop(id);finish?.(Error('Connection timed out. Try again, or use a different network.'));this.onChange();}},TIMEOUT);
  conn.on('open',()=>{if(!session.peers.has(id))return;channel.onopen();if(this.room?.role==='host')this.onChange();});
  conn.on('data',data=>{
   if(typeof data!=='string'||data.length>300000)return;
   let message;try{message=JSON.parse(data);}catch{return;}
   if(id==='host'&&message.type==='room-error'){finish?.(Error(message.message));return;}
   channel.onmessage({data});
   if(id==='host'&&message.type==='welcome'&&message.version===1){this.connected=true;finish?.();this.onChange();}
   if(id==='host'&&message.type==='end')this.fail(Error('The host left. You’re back in solo.'));
  });
  conn.on('close',()=>{
   channel.onclose();
   if(id==='host'&&this.room){finish?.(Error('The host disconnected.'));this.fail(Error('The host disconnected. You’re back in solo.'));}
   else this.onChange();
  });
  conn.on('error',()=>{session.drop(id);if(id==='host')this.fail(Error('Connection lost. You’re back in solo.'));else this.onChange('A friend disconnected.');});
 }
 fail(error){const message=error.message;this.cancel?.(error);this.leave();this.onChange(message);}
 async leave(){
  this.generation++;this.cancel?.();this.cancel=null;const peer=this.peer;this.peer=null;this.room=null;this.connected=false;
  this.session.leave();peer?.destroy();this.onChange();
 }
}
