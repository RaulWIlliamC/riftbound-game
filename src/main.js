import {createPlacedEncounter} from './enemy-placement.js?v=enemy-editor-1';
import {RegionTitle} from './hud/region-title.js';
import {RuinsLife,createRuinsEncounter} from './ruins-life.js?v=enemy-editor-1';
import {RuinsAudio} from './ruins-audio.js';
import {WhisperingRuins} from './whispering-ruins.js?v=map-library-1';
import {hitsShrine} from './hub/shrine-interaction.js';
import {validateProgression,syncStats,rewardEncounter,CONFIG,RANK_LABELS,abilityUnlocked,spellModifiers} from './progression/progression.js';
import {ProfileStore} from './progression/storage.js';
import {ProgressionHud} from './hud/progression.js';
import {ThirdSpells,THIRD_SPELLS,THIRD_DURATIONS} from './third-spells.js?v=progression-1';
import {drawSpellGround,spellDepthItems} from './spell-rendering.js';
import {loadThunderStrikeTest} from './thunder-strike-test.js';
import {EnemyEncounter} from './enemies.js';
import {loadEnemySprites,drawEnemy,drawEnemyGround,drawEnemyProjectiles,drawEncounterHud} from './enemy-art.js?v=progression-1';
import {nearRift,hitsRift} from './hub/rift-interaction.js';
import {RiftGate} from './hud/rift-gate.js?v=progression-1';
import {PracticeArena} from './practice-arena.js?v=map-library-1';
import {createActor,queueIntent,consumeIntent,stepActor,worldSnapshot,applySnapshot} from './multiplayer/world.js?v=progression-1';
import {PeerSession} from './multiplayer/session.js';
import {multiplayerPanel} from './multiplayer/panel.js';
import {ART} from './hub/layout.js';
import {drawTrainingDummyBody} from './hub/training-art.js';
import {SanctuaryHub} from './hub/hub.js?v=map-library-1';
import {SecondSpells,SECOND_SPELLS,handleSecondSpellRequests} from './second-spells.js?v=progression-1';
import {TrainingTargets} from './combat.js?v=enemy-editor-1';
import {SpellAudio} from './audio.js?v=progression-1';
import { CombatHud } from './hud/combat-hud.js?v=progression-1';
import { createHudState } from './hud/state.js?v=progression-1';
import { attachHudDebug } from './hud/debug.js?v=progression-1';
import { DesktopInput } from './input.js?v=progression-1';
import { Player, ARENA } from './player.js?v=progression-1';
import { Magic } from './magic.js?v=progression-1';
import {FirstSpells,FIRST_SPELLS} from './first-spells.js?v=progression-1';
import { Camera } from './camera.js?v=progression-1';
import { loadSprites } from './sprites.js?v=progression-1';
import { drawWizard, setSprites, getStaffTipPosition } from './wizard.js?v=ruins-polish-3';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const regionTitle=new RegionTitle();
const hudRoot=document.querySelector('#hud-root');
let abilityRequested=false;
const secondRequests=[],thirdRequests=[];
const hud=new CombatHud(hudRoot,(key,phase)=>{if(key===1)abilityRequested=true;if(key===2)secondRequests.push(phase);if(key===3)thirdRequests.push(phase);});
const hudValues=createHudState();
attachHudDebug(hudRoot,hudValues);
const LOCAL_PLAYER_ID='local';
const stateLabel = document.querySelector('#state');
const input = new DesktopInput(canvas);
const player = new Player({noCooldowns:false});
const profileStore=new ProfileStore();let profileReady=false;const progressionRequests=[];
const progressionHud=new ProgressionHud(hudRoot,r=>progressionRequests.push(r),()=>input.reset(),element=>{selector.value=element;selector.dispatchEvent(new Event('change'));});
const sound=new SpellAudio();
window.addEventListener('pointerdown',()=>sound.unlock());
window.addEventListener('keydown',()=>sound.unlock());
const soundButton=document.querySelector('#sound-toggle');
soundButton.addEventListener('click',()=>{const enabled=sound.toggle();soundButton.textContent=enabled?'SOUND ON':'SOUND OFF';soundButton.setAttribute('aria-pressed',String(enabled));});
let audioSerial=0,lastAudioId=null;const audioEvents=[];
function emitSound(element,kind='cast',details={}){
 const data={actorId:localId,x:player.x,y:player.y,...details};sound.play(element,kind,data);
 if(kind!=='charge'){audioEvents.push({id:++audioSerial,element,kind,...data});if(audioEvents.length>48)audioEvents.shift();}
}
const magic = new Magic((element,details)=>emitSound(element,'impact',{spell:'bolt',...details}));
const training=new TrainingTargets();let sanctuaryDummies=[];
const sanctuary=new SanctuaryHub();
const arena=new PracticeArena();
const ruins=new WhisperingRuins();
const ruinsLife=new RuinsLife(),ruinsAudio=new RuinsAudio(),ruinsEncounter=createRuinsEncounter(ruins.bounds);
const activeEncounter=()=>scene==='arena'?encounter:scene==='whispering-ruins'?ruinsEncounter:scene==='sanctuary'?sanctuaryEncounter:undefined;
const hubs={sanctuary,arena,'whispering-ruins':ruins};
const sceneNames={sanctuary:'Sanctuary',arena:'Rift Arena','whispering-ruins':'Whispering Ruins'};
const encounter=createPlacedEncounter({map:{id:'arena',width:1800,height:1300,spawn:{x:900,y:650}},terrainMove:(e,p)=>arena.move(e,p),fallback:new EnemyEncounter()});
const sanctuaryEncounter=createPlacedEncounter({map:{id:'sanctuary',width:1800,height:1300,spawn:{x:908.8,y:620.8}},terrainMove:(e,p)=>sanctuary.move(e,p,e.radius)});
const requestedScene=new URLSearchParams(location.search).get('scene');
let scene=Object.hasOwn(hubs,requestedScene)?requestedScene:'sanctuary';
document.body.dataset.scene=scene;document.querySelector('.appearance').firstChild.textContent=scene==='whispering-ruins'?'Element ':'Element preview ';
let hub=hubs[scene],sceneRevision=0,travelRequested=null;
const riftGate=new RiftGate(destination=>{travelRequested=destination;input.reset();},()=>{input.reset();abilityRequested=false;secondRequests.length=0;thirdRequests.length=0;thirdSpells.cancel();secondSpells.cancel();player.charging=false;player.holdTime=0;player.charge=0;player.dashTime=0;});
hub.placePlayer(player);
hub.placeTraining(training);if(scene==='sanctuary'){sanctuaryDummies=training.targets;if(sanctuaryEncounter){sanctuaryEncounter.reset();training.targets=[...sanctuaryDummies,...sanctuaryEncounter.targets];}}if(scene==='whispering-ruins')training.targets=ruinsEncounter.targets;if(scene==='arena'){document.title='Riftbound · Rift Arena';training.targets=encounter.targets;document.querySelector('.subtitle')?.replaceChildren(document.createTextNode('RIFT ARENA · WASD MOVE · Q DASH · 1 / 2 / 3 SPELLS'));}
canvas.setAttribute('aria-label',`Riftbound ${sceneNames[scene]}. WASD moves, Shift runs, Q dashes, mouse aims, M1 attacks, and keys 1 / 2 / 3 cast spells.`);
document.title=`Riftbound · ${sceneNames[scene]}`;
document.querySelector('.subtitle')?.replaceChildren(document.createTextNode(scene==='whispering-ruins'?'WHISPERING RUINS':`${sceneNames[scene].toUpperCase()} · WASD MOVE · SHIFT RUN · Q DASH · 1 / 2 / 3 SPELLS`));
const thirdSpells=new ThirdSpells((e,k,d)=>emitSound(e,k,{spell:'third',...d}),(e,d)=>emitSound(e,'impact',{spell:'third',...d}),{noCooldowns:false});
const secondSpells=new SecondSpells((e,k,d)=>emitSound(e,k,{spell:'second',...d}),(e,d)=>emitSound(e,'impact',{spell:'second',...d}),{noCooldowns:false});
window.addEventListener('pointermove',event=>{if(secondSpells.channel||thirdSpells.channel){const rect=canvas.getBoundingClientRect();input.pointer={x:event.clientX-rect.left,y:event.clientY-rect.top,active:true};}});
const firstSpells=new FirstSpells((e,d)=>emitSound(e,'cast',{spell:'first',...d}),(e,d)=>emitSound(e,'impact',{spell:'first',...d}),{noCooldowns:false});
player.element = 'neutral';
const selector = document.querySelector('#element');
selector.addEventListener('change', () => { if(player.progression?.offer){selector.value=player.element;return;} thirdSpells.cancel();secondSpells.cancel();player.element = selector.value; });
const localActor=Object.assign(createActor('local',player),{magic,first:firstSpells,second:secondSpells,third:thirdSpells});
const actors=new Map([['local',localActor]]);
let localId='local',networkClock=0,networkTick=0,networkAccumulator=0,snapshotClock=0;
let networkStatus=()=>{},incomingWorld=null,lastWorldTick=-1;
const session=new PeerSession({
 onStatus:text=>networkStatus(text),
 onJoin:(id,progression)=>{const actor=createActor(id,undefined,emitSound);actor.player.progression=validateProgression(progression);actor.player.element=actor.player.progression.offer?.element||actor.player.progression.selectedElement;syncStats(actor.player,true);hub.placePlayer(actor.player);const spawn={x:actor.player.x,y:actor.player.y};actor.player.x+=40*actors.size;hub.move(actor.player,spawn);actor.second.serial=Number(id.split('-')[1])*100000;actors.set(id,actor);},
 onLeave:id=>{const actor=actors.get(id);actor?.third.cancel();actor?.second.cancel();actors.delete(id);},
 onInput:(id,intent)=>{const actor=actors.get(id);if(actor)queueIntent(actor,intent,networkClock);},
 onWelcome:id=>{lastAudioId=null;sound.stopAll();riftGate.close();localActor.third.cancel();localActor.second.cancel();localActor.first.pending=null;localId=id;actors.clear();localActor.id=id;actors.set(id,localActor);lastWorldTick=-1;},
 onWorld:message=>{if(message.tick>lastWorldTick){incomingWorld=message;lastWorldTick=message.tick;}},
 onEnd:()=>{lastAudioId=null;sound.stopAll();for(const actor of actors.values()){actor.third.cancel();actor.second.cancel();}actors.clear();localId='local';localActor.id='local';actors.set('local',localActor);incomingWorld=null;networkAccumulator=0;localActor.first.pending=null;for(const t of training.targets){t.capturedBy=null;t.lift=0;}input.reset();}
});
networkStatus=multiplayerPanel(session,()=>player.progression);
document.querySelector('#multiplayer').addEventListener('toggle',()=>input.reset());
const collectIntent=intent=>{
 const requests=secondRequests.splice(0),thirdIntent=thirdRequests.splice(0);
 if(intent.attackCancelled)thirdIntent.unshift('cancel');if(intent.third)thirdIntent.push('start');if(intent.thirdReleased)thirdIntent.push('release');
 if(intent.attackCancelled)requests.unshift('cancel');if(intent.second)requests.push('start');if(intent.secondReleased)requests.push('release');
 const target=intent.pointer.active?camera.screenToWorld(intent.pointer,width,height):{x:player.x+Math.cos(player.aim)*220,y:player.y+Math.sin(player.aim)*220};
 const blocked=riftGate.open||progressionHud.open||!profileReady;
 const command={...intent,progressionRequests:progressionRequests.splice(0),progressionOpen:progressionHud.open,hasAim:intent.pointer.active,target,element:selector.value,ability:intent.ability||abilityRequested,requests,thirdRequests:thirdIntent};
 abilityRequested=false;delete command.pointer;command.travel=travelRequested;travelRequested=null;if(blocked)Object.assign(command,{x:0,y:0,run:false,dash:false,ability:false,attack:false,attackHeld:false,attackReleased:false,attackCancelled:true,requests:['cancel'],thirdRequests:['cancel']});return command;
};
let ready = false;
const camera = new Camera(player);
let width = 0;
let height = 0;
function resize() {
  width = window.innerWidth; height = window.innerHeight;
  camera.setViewport(width,height,hub.bounds||{left:ART.x,top:ART.y,right:ART.x+ART.width*ART.scale,bottom:ART.y+ART.height*ART.scale});
  // Supersample ruins terrain so fractional camera positions resolve more cleanly.
  const nativeDpr = window.devicePixelRatio || 1;
  const dpr = scene==='whispering-ruins'?Math.min(3,Math.max(2,nativeDpr*1.25)):nativeDpr;
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();
function changeScene(destination,revision=sceneRevision+1){
 if(ready)regionTitle.show(sceneNames[destination]);
 sound.stopAll();ruinsAudio.stop();ruinsLife.update(0,[],false);audioEvents.length=0;document.title=`Riftbound · ${sceneNames[destination]}`;scene=destination;document.body.dataset.scene=scene;document.querySelector('.appearance').firstChild.textContent=scene==='whispering-ruins'?'Element ':'Element preview ';sceneRevision=revision;hub=hubs[scene];canvas.setAttribute('aria-label',`Riftbound ${sceneNames[scene]}. WASD moves, Shift runs, Q dashes, mouse aims, M1 attacks, and keys 1 / 2 / 3 cast spells.`);
 document.querySelector('.subtitle')?.replaceChildren(document.createTextNode(scene==='whispering-ruins'?'WHISPERING RUINS':`${sceneNames[scene].toUpperCase()} · WASD MOVE · SHIFT RUN · Q DASH · 1 / 2 / 3 SPELLS`));
 for(const actor of actors.values()){
  actor.third.clear();actor.second.cancel();actor.magic.shots=[];actor.magic.impacts=[];actor.first.pending=null;actor.first.effects=[];actor.first.impacts=[];actor.first.releases=[];actor.second.effects=[];actor.second.bursts=[];
  const element=actor.player.element,progression=actor.player.progression;Object.assign(actor.player,new Player({noCooldowns:false}));actor.player.progression=progression;syncStats(actor.player,true);actor.player.element=element;hub.placePlayer(actor.player);actor.player.x+=40*[...actors.keys()].indexOf(actor.id);hub.move(actor.player,{x:actor.player.x-40,y:actor.player.y});actor.renderPosition={x:actor.player.x,y:actor.player.y};actor.queue=[];actor.intent={x:0,y:0,requests:[],element};
 }
 if(scene==='sanctuary')training.targets=new TrainingTargets().targets;
 if(scene==='whispering-ruins'){ruinsEncounter.reset();training.targets=ruinsEncounter.targets;}
 hub.placeTraining(training);if(scene==='sanctuary'){sanctuaryDummies=training.targets;if(sanctuaryEncounter){sanctuaryEncounter.reset();training.targets=[...sanctuaryDummies,...sanctuaryEncounter.targets];}}if(scene==='whispering-ruins')training.targets=ruinsEncounter.targets;if(scene==='arena'){encounter.reset();training.targets=encounter.targets;}riftGate.close();input.reset();abilityRequested=false;secondRequests.length=0;thirdRequests.length=0;
 camera.x=player.x;camera.y=player.y;resize();
}
// Capture shrine and portal clicks before the combat input adapter sees M1.
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||scene!=='sanctuary'||riftGate.open||progressionHud.open||!profileReady)return;
 const rect=canvas.getBoundingClientRect(),point=camera.screenToWorld({x:event.clientX-rect.left,y:event.clientY-rect.top},width,height);
 const shrine=hitsShrine(sanctuary.objects,player,point);
 if(shrine){
  event.preventDefault();event.stopImmediatePropagation();
  if(!player.progression.offer){input.reset();selector.value=shrine.element;selector.dispatchEvent(new Event('change'));}
  return;
 }
 if(!nearRift(player)||!hitsRift(point))return;
 event.preventDefault();event.stopImmediatePropagation();riftGate.show();
},true);
let last = performance.now();
function frame(now) {
  const dt = Math.max(0,Math.min((now - last) / 1000, 0.033));
  last = now;
  const intent = input.read();
  const command=collectIntent(intent);
  networkClock=performance.now()/1000;
  hub.update(dt);
  if(session.role==='guest'){
    session.sendInput(command);
    if(incomingWorld){const changed=Object.hasOwn(hubs,incomingWorld.scene)&&(incomingWorld.scene!==scene||incomingWorld.sceneRevision!==sceneRevision);if(changed)changeScene(incomingWorld.scene,incomingWorld.sceneRevision);applySnapshot(incomingWorld,actors,localId,player,training,activeEncounter());
     sound.listener={x:player.x,y:player.y};const events=incomingWorld.audioEvents||[];
     if(lastAudioId!==null)for(const event of events)if(event.id>lastAudioId)sound.play(event.element,event.kind,event);
     if(events.length)lastAudioId=events.at(-1).id;else if(lastAudioId===null)lastAudioId=0;
     if(changed){for(const a of actors.values())a.renderPosition={x:a.player.x,y:a.player.y};camera.x=player.x;camera.y=player.y;camera.clampToImage();}incomingWorld=null;}
    // Smooth display between host snapshots; each browser retains its own camera/HUD.
    for(const actor of actors.values()){
      const position=actor.renderPosition||actor.player;
      const blend=1-Math.exp(-dt*22);
      position.x+=(actor.player.x-position.x)*blend;position.y+=(actor.player.y-position.y)*blend;
    }
  }else{
    if(session.role==='host')queueIntent(localActor,command,networkClock);
    const simulate=step=>{
      const previousTargets=training.targets.map(t=>({x:t.x,y:t.y,health:t.health}));
      if(scene==='sanctuary')training.update(step);
      training.targets.forEach((t,i)=>{if(!t.capturedBy&&!(previousTargets[i].health<=0&&t.health>0))hub.move(t,previousTargets[i],t.radius);});
      for(const actor of actors.values()){
       const control=session.role==='host'?consumeIntent(actor,networkClock):command;
       if(control.travel==='sanctuary'&&scene!=='sanctuary'||['arena','whispering-ruins'].includes(control.travel)&&scene==='sanctuary'&&(control.travel==='arena'||riftGate.unlocked)&&hub.nearby(actor.player).some(p=>p.action==='enter-rift')){changeScene(control.travel);command.travel=null;break;}
       stepActor(actor,step,control,hub,training.targets,emitSound);
      }
      if(scene==='whispering-ruins'){rewardEncounter(actors,training.targets,{complete:false});ruinsEncounter.update(step,[...actors.values()].map(a=>a.player));rewardEncounter(actors,training.targets,{complete:false});training.targets=ruinsEncounter.targets;}
      if(scene==='sanctuary'&&sanctuaryEncounter){sanctuaryEncounter.update(step,[...actors.values()].map(a=>a.player));training.targets=[...sanctuaryDummies,...sanctuaryEncounter.targets];}
      if(scene==='arena'){rewardEncounter(actors,training.targets,encounter);encounter.update(step,[...actors.values()].map(a=>a.player));rewardEncounter(actors,training.targets,encounter);training.targets=encounter.targets;}
      networkTick++;
    };
    if(session.role==='host'){
      networkAccumulator=Math.min(.1,networkAccumulator+dt);
      while(networkAccumulator>=1/60){simulate(1/60);networkAccumulator-=1/60;}
      snapshotClock+=dt;if(snapshotClock>=.05){snapshotClock%=.05;session.broadcast({...worldSnapshot(actors,training.targets,networkTick,activeEncounter()),scene,sceneRevision,audioEvents});}
    }else if(profileReady)simulate(dt);
  }
  sound.syncCharges(actors.values(),player);
  ruinsLife.update(dt,actors.values(),scene==='whispering-ruins'&&ready);
  ruinsAudio.update(sound,scene==='whispering-ruins'&&ready,actors.values(),player,ruinsLife.arrivals);
  if(scene==='sanctuary')sanctuary.updateRift(player,dt,!riftGate.open&&!progressionHud.open&&profileReady&&!player.progression.offer&&input.pointer.active?camera.screenToWorld(input.pointer,width,height):null);
  riftGate.update(nearRift(player),scene,scene==='arena'&&encounter.complete);
  canvas.style.cursor=scene==='sanctuary'&&!riftGate.open&&!progressionHud.open&&profileReady&&!player.progression.offer&&input.pointer.active&&(hitsShrine(sanctuary.objects,player,camera.screenToWorld(input.pointer,width,height))||nearRift(player)&&hitsRift(camera.screenToWorld(input.pointer,width,height)))?'pointer':'';
  hudValues.abilities[0]={key:1,name:FIRST_SPELLS[player.element]||"Select an element",available:!!FIRST_SPELLS[player.element],cooldown:firstSpells.cooldown,cooldownDuration:firstSpells.cooldownDuration};
  hudValues.abilities[1]={key:2,name:SECOND_SPELLS[player.element]||"Select an element",available:!!SECOND_SPELLS[player.element],cooldown:secondSpells.cooldown,cooldownDuration:secondSpells.cooldownDuration};
  hudValues.abilities[2]={key:3,name:THIRD_SPELLS[player.element]||"Select an element",available:!!THIRD_SPELLS[player.element],cooldown:thirdSpells.cooldown,cooldownDuration:thirdSpells.cooldownDuration};
  for(const ability of hudValues.abilities){const rank=player.progression.ranks[player.element]?.[ability.key-1]||0;ability.rank=RANK_LABELS[rank];if(rank)ability.name+=' '+RANK_LABELS[rank];ability.requiredLevel=ability.name==='Select an element'?null:CONFIG.unlocks[ability.key];ability.available=ability.available&&abilityUnlocked(player,ability.key);ability.manaCost=CONFIG.manaCosts[ability.key]*spellModifiers(player,player.element,ability.key).cost;ability.insufficientMana=player.mana<ability.manaCost;}
  hudValues.currentMana=player.mana;hudValues.maxMana=player.maxMana;
  hud.ascend.element.title=player.progression.ascensionUnlocked?'Ascension system unlocked; transformations coming later':'Ascension unlocks at Level 10';
  if(new URLSearchParams(location.search).get('hudDebug')!=='1'){hudValues.currentHealth=player.health;hudValues.maxHealth=player.maxHealth;}
  // Keep the guest’s selected input until the host processes it; older snapshots must not undo it.
  selector.disabled=!!player.progression.offer;if(player.progression.offer)selector.value=player.element;
  if(profileReady)profileStore.save(player.progression);
  progressionHud.update(player,profileStore.status);
  const localDisplay=session.role==='guest'&&localActor.renderPosition?{...player,...localActor.renderPosition}:player;
  camera.update(dt, localDisplay);
  ctx.fillStyle = '#0b1222'; ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(Math.round(width / 2 - camera.x), Math.round(height / 2 - camera.y));
  const view={left:camera.x-width/2,right:camera.x+width/2,top:camera.y-height/2,bottom:camera.y+height/2};
  hub.drawGround(ctx,view);
  if(scene==='whispering-ruins')ruinsLife.draw(ctx,view);
  if(activeEncounter())drawEnemyGround(ctx,activeEncounter());
  for(const actor of actors.values())drawSpellGround(ctx,actor);
  // Brief ground-level dust marks each sprint footfall, trailing actual travel.
  for(const puff of player.footfalls) {
    const age=.32-puff.life;
    ctx.save();ctx.globalAlpha=puff.life/.32*.42;ctx.fillStyle='#a39b91';
    for(let i=0;i<4;i++) {
      const spread=age*14;
      const x=puff.x+puff.dx*age*35+(i%2?1:-1)*spread;
      const y=puff.y+puff.dy*age*35-Math.floor(i/2)*spread;
      ctx.fillRect(Math.round(x),Math.round(y),i%2?2:3,2);
    }
    ctx.restore();
  }
  for(const actor of actors.values())for(const trail of actor.player.trails)drawWizard(ctx,trail,trail.life/.2*.22,true);
  hub.drawObjects(ctx,view,[
    ...[...actors.values()].map(actor=>({y:session.role==='guest'&&actor.renderPosition?actor.renderPosition.y:actor.player.y,order:1,draw:()=>{
      const p=actor.player;let display=session.role==='guest'&&actor.renderPosition?{...p,...actor.renderPosition}:p;
      const arrival=scene==='whispering-ruins'&&ruinsLife.arrivals.find(a=>a.id===actor.id);
      if(arrival&&arrival.age<.6)display={...display,y:display.y-180*Math.max(0,1-arrival.age/.6)**2};
      drawWizard(ctx,display,p.health<=0?.3:p.invulnerable>0&&Math.floor(p.time*12)%2?.55:1);
      if(p.health<=0){ctx.fillStyle='#d5bcc7';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(`RECOVERING ${Math.ceil(p.downTime)}s`,display.x,display.y-75*(p.visualScale||1));}
      if(actors.size>1){ctx.fillStyle=actor.id===localId?'#ffe1a0':'#99dddf';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText((actor.id===localId?'YOU':actor.id==='local'?'HOST':`ALLY ${actor.id.split('-')[1]}`)+(p.progression?` · LV ${p.progression.level}`:''),display.x,display.y-85*(p.visualScale||1));}
    }})),
    ...training.targets.map(t=>({y:t.y,order:1,draw:()=>scene!=='sanctuary'?drawEnemy(ctx,t):training.draw(ctx,[t],drawTrainingDummyBody)})),
    ...[...actors.values()].flatMap(actor=>spellDepthItems(ctx,actor,{lightningTest:new URLSearchParams(location.search).get('thunder')==='sheet'?true:new URLSearchParams(location.search).get('thunder')==='classic'?false:undefined}))
  ]);
  if(activeEncounter())drawEnemyProjectiles(ctx,activeEncounter());
  hub.drawAtmosphere(ctx,view);
  hud.drawLocalResources(ctx,{playerId:LOCAL_PLAYER_ID,localPlayerId:LOCAL_PLAYER_ID,x:localDisplay.x,y:localDisplay.y},hudValues);
  ctx.restore();
  hud.update(hudValues,player.element);
  hud.ascend.label.textContent=player.progression.ascensionUnlocked?'ASCENSION UNLOCKED':'ASCENSION · LV 10';hud.ascend.element.querySelector('kbd').hidden=true;
  if(scene==='arena'&&regionTitle.element.hidden)drawEncounterHud(ctx,encounter,width);
  const activeThird=thirdSpells.effects.find(e=>!e.ended);
  stateLabel.textContent = `${ready ? thirdSpells.channel ? `${THIRD_SPELLS[player.element].toUpperCase()} ${Math.min(THIRD_DURATIONS[player.element],Math.max(0,thirdSpells.channel.age-.3)).toFixed(1)} / ${THIRD_DURATIONS[player.element]}s` : secondSpells.channel ? `${SECOND_SPELLS[player.element].toUpperCase()} ${secondSpells.channel.age.toFixed(1)} / ${player.element==='earth'?2:4}s` : activeThird ? `${THIRD_SPELLS[activeThird.element].toUpperCase()} ${Math.max(0,activeThird.duration-Math.max(0,activeThird.age-.3)).toFixed(1)}s` : player.charging ? `CHARGING ${Math.round(player.charge*100)}%` : player.state.toUpperCase() : 'LOADING ART'} · ${player.dashMaxCharges>1?`DASH ${player.dashCharges}/${player.dashMaxCharges}${player.cooldown>0?` · ${player.cooldown.toFixed(1)}s`:''}`:player.cooldown>0?`DASH ${player.cooldown.toFixed(1)}s`:'DASH READY'}`;
  requestAnimationFrame(frame);
}
// Read-only debug snapshot for controller verification in the browser.
window.riftbound = { snapshot: () => ({ progression:structuredClone(player.progression),mana:player.mana,maxMana:player.maxMana,profileReady,audio:sound.snapshot(),ruinsAudio:ruinsAudio.snapshot(),ruinsLife:ruinsLife.snapshot(),scene,sceneRevision,riftGateOpen:riftGate.open, multiplayer:{role:session.role,localId,players:[...actors.values()].map(a=>({id:a.id,x:a.player.x,y:a.player.y,element:a.player.element,charging:a.player.charging,channel:a.second.channel?.element,spellEffects:a.second.effects.map(e=>e.kind)})),tick:networkTick}, health:player.health,encounter:activeEncounter()?.snapshot()||null,x: player.x, y: player.y, visualScale:player.visualScale, aim: player.aim, state: player.state, cooldown: player.cooldown, attackTime: player.attackTime, element: player.element, charging:player.charging, charge:player.charge, projectiles:magic.shots.length, thirdSpell:{channel:thirdSpells.channel?{element:thirdSpells.channel.element,age:thirdSpells.channel.age,power:thirdSpells.channel.power}:null,effects:thirdSpells.effects.map(e=>({element:e.element,x:e.x,y:e.y,age:e.age})),cooldown:thirdSpells.cooldown},firstSpellCooldown:firstSpells.cooldown, firstSpellEffects:firstSpells.effects.map(e=>({...e})), secondSpell:{channel:secondSpells.channel?{element:secondSpells.channel.element,age:secondSpells.channel.age,power:secondSpells.channel.power,captured:secondSpells.channel.captured.length}:null,effects:secondSpells.effects.map(e=>({kind:e.kind,x:e.x,y:e.y,age:e.age})),cooldown:secondSpells.cooldown},targets:training.targets.map(t=>({id:t.id,kind:t.kind,state:t.state,shielded:t.shielded,x:t.x,y:t.y,health:t.health,burn:t.burnTime||0,wet:t.wetTime||0})), camera:{x:camera.x,y:camera.y,width,height},hub:hub.snapshot(),nearby:hub.nearby(player),ready, hud:JSON.parse(JSON.stringify(hudValues)), STAFF_TIP_POSITION: getStaffTipPosition(player) }) };
async function loadProfile(){const saved=await profileStore.load();player.progression=validateProgression(saved);player.element=player.progression.offer?.element||player.progression.selectedElement;selector.value=player.element;syncStats(player,true);profileReady=true;}
loadProfile();
window.addEventListener('pagehide',()=>{if(profileReady)profileStore.flush(player.progression);});
requestAnimationFrame(frame);
Promise.all([loadSprites(),sanctuary.readyPromise,loadEnemySprites(),loadThunderStrikeTest(),ruins.readyPromise]).then(([loaded]) => {
  setSprites(loaded); ready=true;regionTitle.show(sceneNames[scene]);
}).catch(error => {
  console.error(error);
  stateLabel.textContent='ART FAILED TO LOAD';
});
