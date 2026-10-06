// The room service exchanges connection descriptions only. Simulation uses WebRTC.
export class RoomConnection{
 constructor(session,onChange){this.session=session;this.onChange=onChange;this.room=null;this.generation=0;this.links=new Map();this.waiting=[];this.errors=0;this.session.saveGuestProgression=(id,progression)=>{const peer=[...this.links].find(([,actor])=>actor===id)?.[0];return peer&&this.room?.role==='host'?this.request('progression',{peer,progression}):Promise.reject(Error('Player disconnected'));};}
 async request(action,data={},room=this.room){
  let response;
  try{response=await fetch(`/api/rooms/${action}`,{method:'POST',headers:{'Content-Type':'application/json',...(room?{Authorization:`Bearer ${room.token}`}:{})},body:JSON.stringify({profileToken:this.session.profileToken,...data,...(room?{code:room.code}:{})}),signal:AbortSignal.timeout(10000)});}
  catch{throw Error('Couldn’t reach the room service. Check your connection and try again.');}
  if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Room service unavailable. Start the game with npm start.');
  const result=await response.json();if(!response.ok)throw Error(result.error||'Couldn’t connect. Try again.');return result;
 }
 async host(){
  await this.leave();const generation=this.generation;
  this.config=await this.request('config');const room=await this.request('create');
  if(generation!==this.generation){await this.request('leave',{},room);return;}
  this.room=room;this.session.role='host';this.connected=false;this.onChange();this.schedule();
 }
 async join(code){
  code=code.trim().toUpperCase().replace(/[\s-]/g,'');if(!/^[A-Z0-9]{6}$/.test(code))throw Error('Enter the 6-character room code.');
  await this.leave();const generation=this.generation;
  this.config=await this.request('config');const room=await this.request('join',{code});
  if(generation!==this.generation){await this.request('leave',{},room);return;}
  this.room=room;this.connected=false;this.onChange();this.schedule();
 }
 schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.poll(),300);}
 async poll(){
  const room=this.room,generation=this.generation;if(!room)return;
  try{
   const result=await this.request('events');if(generation!==this.generation)return;
   for(const event of result.events){
    if(event.type==='join'&&room.role==='host')this.waiting.push({peer:event.peer,progression:event.progression});
    if(event.type==='leave'){
     this.waiting=this.waiting.filter(item=>item.peer!==event.peer);const id=this.links.get(event.peer);
     if(id)this.session.drop(id);this.links.delete(event.peer);
    }
    if(event.type==='answer'&&room.role==='host'&&this.links.get(event.peer)===this.session.pending)await this.session.accept(event.signal);
    if(event.type==='offer'&&room.role==='guest'){
     const answer=await this.session.join(event.signal,this.config);
     if(generation!==this.generation)return;
     await this.request('signal',{signal:answer});this.started=true;
    }
    if(generation!==this.generation)return;
   }
   if(room.role==='host'){
    // Remove disconnected reservations so another friend can use that slot.
    for(const [peer,id] of this.links)if(!this.session.peers.has(id)){await this.request('remove',{peer});this.links.delete(peer);}
    if(!this.session.pending&&this.waiting.length&&this.session.peers.size<3){
     const waiting=this.waiting.shift(),peer=waiting.peer,offer=await this.session.invite(this.config);
     this.session.peers.get(this.session.pending).progression=waiting.progression;
     if(generation!==this.generation)return;
     this.links.set(peer,this.session.pending);
     try{await this.request('signal',{peer,signal:offer});}catch{const id=this.links.get(peer);if(id)this.session.drop(id);this.links.delete(peer);}
    }
   }
   if(room.role==='guest'){
    this.connected=this.session.peers.get('host')?.opened||false;
    if(this.started&&this.session.role==='solo')throw Error('The host left the game. You’re back in solo.');
   }
   this.errors=0;this.onChange();
  }catch(error){
   if(generation!==this.generation)return;
   this.errors++;
   if(this.errors>=3||/Room not found|session has ended|host left|player has left/.test(error.message)){
    const message=room.role==='guest'&&/Room not found/.test(error.message)?'The host closed the room. You’re back in solo.':error.message;
    await this.leave();this.onChange(message);return;
   }
  }
  if(this.room&&generation===this.generation)this.schedule();
 }
 async leave(){
  const room=this.room;this.generation++;clearTimeout(this.timer);this.room=null;this.waiting=[];this.links.clear();this.errors=0;this.started=false;this.connected=false;
  this.session.leave();this.onChange();
  if(room)try{await this.request('leave',{},room);}catch{}
 }
}
