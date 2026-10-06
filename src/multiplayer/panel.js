import {PeerRoomConnection} from './peer-rooms.js';
export function multiplayerPanel(session,getProgression){
 const root=document.createElement('details');root.id='multiplayer';root.innerHTML=`<summary>PLAY WITH FRIENDS <span id="network-status">Solo adventure</span></summary>
 <div class="network-body"><p class="network-intro">Gather your party at the sanctuary.</p>
 <div id="network-start"><button id="network-host" class="network-primary">Host game</button>
 <div class="network-divider">or join a friend</div>
 <form id="network-form"><label for="network-code">Room code</label><div class="network-join-row"><input id="network-code" maxlength="8" placeholder="ABC234" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="network-message"><button id="network-join" type="submit">Join game</button></div></form></div>
 <div id="network-room" hidden><span class="network-caption">ROOM CODE</span><div class="network-code-row"><output id="network-room-code"></output><button id="network-copy">Copy code</button></div><p id="network-party"></p><button id="network-leave">Leave game</button></div>
 <p id="network-message" role="status">Up to 4 players. No account needed.</p></div>`;
 document.body.append(root);
 const get=id=>root.querySelector(`#network-${id}`);let busy=false,message='';
 const render=error=>{
  if(error)message=error;
  const room=rooms.room;
  get('start').hidden=!!room;get('room').hidden=!room;
  get('host').disabled=busy;get('join').disabled=busy;get('code').disabled=busy;
  get('leave').textContent=room?.role==='guest'&&!rooms.connected?'Cancel joining':'Leave game';
  let text=busy?'Connecting…':'Solo adventure';
  if(room){
   get('room-code').textContent=room.code;
   const count=room.role==='host'?1+[...session.peers.values()].filter(p=>p.opened).length:session.playerCount||2;
   text=room.role==='host'?`Hosting · ${count} / 4 players`:rooms.connected?`Joined · ${count} / 4 players`:'Joining your friend…';
   get('party').textContent=room.role==='host'?'Share this code with your friends.':rooms.connected?'You’re in! Your party is ready.':'Connecting to the host…';
  }
  get('status').textContent=text;
  get('message').textContent=message||(room?.role==='host'?'Keep your game open while friends play.':room?'':'Up to 4 players. No account needed.');
 };
 const rooms=new PeerRoomConnection(session,render,{getProgression});
 const action=async fn=>{busy=true;message='';render();try{await fn();}catch(error){message=error.message;}finally{busy=false;render();}};
 get('host').onclick=()=>action(()=>rooms.host());
 get('form').onsubmit=event=>{event.preventDefault();if(!busy)action(()=>rooms.join(get('code').value));};
 get('leave').onclick=()=>action(()=>rooms.leave());
 get('copy').onclick=async()=>{try{await navigator.clipboard.writeText(rooms.room.code);message='Room code copied!';}catch{message=`Your room code: ${rooms.room.code}`;}render();};
 get('code').oninput=()=>{get('code').value=get('code').value.toUpperCase().replace(/[^A-Z0-9]/g,'');message='';};
 root.addEventListener('keydown',e=>e.stopPropagation());root.addEventListener('keyup',e=>e.stopPropagation());
 window.addEventListener('pagehide',()=>rooms.leave());
 render();return ()=>render();
}
